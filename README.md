# Bulwark Connector

The site behind [connector.bulwarkmail.org](https://connector.bulwarkmail.org).

Guides, release notes and the extension directory cannot know where your
Bulwark runs. A connector link names a page instead of a server:

```
https://connector.bulwarkmail.org/settings?tab=filters
https://connector.bulwarkmail.org/admin_extension?slug=quick-reply
```

In a browser that knows your Bulwark, those open as

```
https://mail.example.com/connector/settings?tab=filters
https://mail.example.com/connector/admin_extension?slug=quick-reply
```

Your Bulwark takes it from there.

## What is stored

Your list of servers, in this browser's `localStorage`. Nothing else.

There is no account, no database, no cookie and no analytics. The site cannot
log which links are opened: every page is a static file, and the redirect
happens in the browser after the page has loaded.

When you add a server, your browser checks it directly. That request does not
go through this site.

Three checks enforce this:

| Check | Where |
|---|---|
| The build fails if a page loads anything from another origin, touches `document.cookie`, or is not prerendered | `scripts/check-privacy.mjs`, run in CI and before every deploy |
| `document.cookie` is banned in source | `eslint.config.mjs` |
| The web server keeps no access log | `deploy/nginx.conf.example` |

The only dependencies are Next, React and ReactDOM.

One caveat: the CSP allows `'unsafe-inline'` scripts, because Next hydrates
with inline `<script>` blocks and a static export has no per-request nonce.
This is acceptable only because no page renders untrusted content into markup.
Error pages name a bad parameter but never echo its value. If that changes,
generate sha256 hashes of the inline scripts at build time and list those
instead.

## The registry

`src/lib/registry.ts` lists every page a link can open and the shape of its
parameters. The webmail has a matching file (`lib/connector/registry.ts`)
that owns the actual routes.

The connector does not know those routes. It validates the parameters and
forwards `<server>/connector/<target>?<params>`. This lets a server be older
than this site: a page it does not know yet shows its own "update Bulwark"
message instead of a 404.

To add a target, edit both files. `minVersion` is the first webmail release
that supports it. A checked server reports which targets it knows, so a link
can warn before opening one that will not work.

Target names may not be `add`, `instances`, `create-link` or `badges`. Those
are the site's own pages. A test enforces this.

## Development

```sh
npm install
npm run dev            # http://localhost:3013
npm test
npm run lint
npm run typecheck
npm run build          # static export into out/, plus out/badges
npm run check:privacy  # inspects out/
```

The build is a plain directory of files. There is no server to run.

## Deployment

Every push to `main` goes live via `.github/workflows/deploy.yml`. The runner
lints, tests, builds, runs the privacy check, serves the bundle and checks the
real pages. It then sends the bundle over SSH to `deploy/connector-deploy.sh`
on the server, which unpacks it next to the previous releases, switches a
symlink, health-checks through nginx and rolls back on failure.

"Run workflow" in the Actions tab redeploys `main` or rolls back.
`deploy/nginx.conf.example` is the vhost.

## Licence

AGPL-3.0-only, like the rest of Bulwark.
