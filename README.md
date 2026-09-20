# Bulwark Connector

The site behind [connector.bulwarkmail.org](https://connector.bulwarkmail.org).

Documentation, the extension directory, release notes and support replies can
only link to *a* Bulwark — they have no idea where yours is. A connector link
names a destination instead of a host:

```
https://connector.bulwarkmail.org/settings?tab=filters
https://connector.bulwarkmail.org/admin_extension?slug=quick-reply
```

Opened in a browser that knows where your Bulwark is, those become

```
https://mail.example.com/connector/settings?tab=filters
https://mail.example.com/connector/admin_extension?slug=quick-reply
```

and the instance resolves the rest.

## What is stored

The list of your instances, in this browser's `localStorage`, on this site's
origin. That is all of it.

Not a cookie: a cookie is sent to the server on every request, which would put
the list of someone's mail servers into an access log. There is no account, no
database, no session, no analytics script, and no record of which links are
opened — the site cannot keep one, because every page is a static file and the
link's destination is worked out in your browser after the page has loaded.

The check that runs when you add an instance is a request from your browser
straight to your own server, without credentials. It does not pass through us.

Three things enforce that rather than promising it:

| Guard | Where |
|---|---|
| Fails the build if a page loads anything off-origin, touches `document.cookie`, or stops being prerendered | `scripts/check-privacy.mjs`, run in CI and before every deploy |
| Blocks `document.cookie` in source | `eslint.config.mjs` |
| Drops the access log, so the server never writes a target or a parameter to disk | `deploy/nginx.conf.example` |

The dependency list is deliberately three packages: Next, React and ReactDOM.
Nothing that runs in a visitor's browser comes from anywhere else.

## The registry

`src/lib/registry.ts` lists every destination a link can name, and the shape of
each one's parameters. It is one half of a contract; the other half lives in
the webmail (`lib/connector/registry.ts`), which owns the path templates — how
a target becomes a route inside the app.

The connector deliberately does not know those paths. It validates parameters
and forwards `<instance>/connector/<target>?<params>`; the instance resolves
it. That split is what lets an instance be older than this site: a target it
does not know yet produces its own "this version doesn't support that link"
card instead of a 404.

Adding a target means editing both files. `minVersion` is the first webmail
release that resolves it, and an instance that has been checked reports which
targets it knows, so a link can warn before opening one that will not work.

Target names share the root namespace with the site's own pages, so none of
them may be called `add`, `instances`, `create-link` or `badges`. A test
enforces it.

## Development

```sh
npm install
npm run dev            # http://localhost:3013
npm test               # registry, URL validation, storage
npm run lint
npm run typecheck
npm run build          # static export into out/, plus out/badges
npm run check:privacy  # inspects out/
```

`npm run build` produces a plain directory of files. There is no server to run.

## Deployment

Every push to `main` goes live, via `.github/workflows/deploy.yml`: the runner
lints, tests, builds, runs the privacy check, starts the exact bundle and
checks the real pages, then streams it over SSH to a forced command on the
server (`deploy/connector-deploy.sh`), which unpacks it beside the previous
releases, flips a symlink, health-checks through nginx and rolls back if the
check fails.

"Run workflow" in the Actions tab redeploys `main` or rolls back.
`deploy/nginx.conf.example` is the vhost.

## Licence

AGPL-3.0-only, the same as the rest of Bulwark.
