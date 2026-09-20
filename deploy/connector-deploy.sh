#!/usr/bin/env bash
# Deploys a release of the connector to https://connector.bulwarkmail.org on
# mail.rath.li.
#
# Installed as /usr/local/bin/bulwarkmail-connector-deploy and run as the
# `ubuntu` user through a forced command on the deploy key in
# ~ubuntu/.ssh/authorized_keys:
#
#   command="/usr/local/bin/bulwarkmail-connector-deploy",restrict ssh-ed25519 AAAA... connector deploy
#
# so the key can do nothing but this. Re-install it by hand when this file
# changes. The requested action comes in SSH_ORIGINAL_COMMAND:
#
#   deploy <sha>   read a release tarball (built by .github/workflows/deploy.yml)
#                  from stdin, switch to it, check it, roll back on failure
#   rollback       switch back to the previous release
#   status         print the current release and the last few
#
# Layout under /opt/bulwarkmail-connector (owned by ubuntu):
#   releases/<time>-<sha>/  unpacked static exports, newest five kept
#   current -> releases/…   what nginx serves as its root
#
# Unlike the website, this is a static export: there is no pm2 process and no
# port. Switching a release is the symlink flip, and nginx picks it up on the
# next request because its root resolves through `current` each time.
set -euo pipefail

BASE=/opt/bulwarkmail-connector
HOST=connector.bulwarkmail.org
KEEP_RELEASES=5

log() { echo "[connector-deploy] $*"; }

# Checked through nginx, not off the disk: this is what a visitor gets, so it
# also catches a broken vhost or a bad certificate.
healthy() {
  local i code
  for i in $(seq 1 15); do
    code=$(curl -s -o /dev/null -w '%{http_code}' --resolve "$HOST:443:127.0.0.1" \
      "https://$HOST/" || true)
    if [[ "$code" == "200" ]]; then
      # A release that serves the landing page but not a target page is broken
      # in the only way that matters.
      code=$(curl -s -o /dev/null -w '%{http_code}' --resolve "$HOST:443:127.0.0.1" \
        "https://$HOST/settings?tab=filters" || true)
      [[ "$code" == "200" ]] && return 0
    fi
    sleep 2
  done
  return 1
}

# Releases newest first. Sorted by name: the directories are named after their
# UTC build time, and nothing writes into them afterwards, but sorting by name
# keeps this identical to the website's deploy script.
releases_newest_first() {
  ls -1d "$BASE"/releases/*/ 2>/dev/null | sed 's:/$::' | sort -r
}

prune_old_releases() {
  local cur old dir
  cur=$(current_release)
  old=$(releases_newest_first | grep -vxF "$cur" | tail -n +"$KEEP_RELEASES")
  [[ -n "$old" ]] || return 0
  while IFS= read -r dir; do
    [[ -n "$dir" && "$dir" == "$BASE"/releases/* ]] || continue
    rm -rf -- "$dir" || log "could not remove $dir"
  done <<< "$old"
}

switch_to() {
  ln -sfn "$1" "$BASE/current.next"
  mv -Tf "$BASE/current.next" "$BASE/current"
}

# The release `current` points at, or "" when there is none.
#
# Not a bare `readlink -f`: that happily resolves a path that does not exist,
# so on the very first deploy it returns "$BASE/current" itself. Rolling back
# to that on a failed health check pointed the symlink at itself.
#
# Always succeeds. Under `set -e`, a non-zero return here would take the whole
# script down at `cur=$(current_release)`.
current_release() {
  [[ -L "$BASE/current" ]] || return 0
  local target
  target=$(readlink -f "$BASE/current" 2>/dev/null) || return 0
  if [[ "$target" == "$BASE"/releases/* && -d "$target" ]]; then
    echo "$target"
  fi
  return 0
}

cmd=${SSH_ORIGINAL_COMMAND:-${1:-}}
mkdir -p "$BASE/releases"
exec 9>"$BASE/.deploy.lock"
flock -n 9 || { log "another deploy is running"; exit 1; }

case "$cmd" in
  deploy\ *)
    sha=${cmd#deploy }
    [[ "$sha" =~ ^[0-9a-f]{7,40}$ ]] || { log "bad revision: $sha"; exit 2; }
    rel="$BASE/releases/$(date -u +%Y%m%d%H%M%S)-${sha:0:12}"
    mkdir -p "$rel"
    log "unpacking into $rel"
    tar -xz -C "$rel" --no-same-owner
    [[ -f "$rel/index.html" && -f "$rel/404.html" && -d "$rel/settings" ]] ||
      { log "not a release tarball"; rm -rf "$rel"; exit 3; }
    echo "$sha" > "$rel/REVISION"

    previous=$(current_release)
    switch_to "$rel"
    if healthy; then
      log "live: $(basename "$rel")"
    else
      log "health check failed"
      if [[ -n "$previous" ]]; then
        switch_to "$previous"
        log "back on $(basename "$previous")"
      fi
      exit 4
    fi

    prune_old_releases
    ;;

  rollback)
    cur=$(current_release)
    prev=$(releases_newest_first | grep -vxF "$cur" | head -n 1 || true)
    [[ -n "$prev" ]] || { log "no earlier release to roll back to"; exit 5; }
    switch_to "$prev"
    healthy && log "rolled back to $(basename "$prev")" || { log "rolled back, but the health check failed"; exit 4; }
    ;;

  status)
    cur=$(current_release)
    if [[ -n "$cur" ]]; then
      echo "current: $(basename "$cur")"
    else
      echo "current: none"
    fi
    releases_newest_first | head -n "$KEEP_RELEASES" | xargs -r -n1 basename || true
    ;;

  *)
    echo "usage: deploy <sha> | rollback | status" >&2
    exit 2
    ;;
esac
