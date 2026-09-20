/**
 * Turning something a person typed into an instance origin we are willing to
 * navigate to.
 *
 * The only URL this site ever sends anyone to comes from here, so the rules
 * are strict and the failures are specific enough to show in the form.
 */

export interface NormalisedInstance {
  /** Scheme + host + port, no trailing slash. */
  readonly origin: string;
  /** Mount prefix for subpath deploys (`/webmail`), or `""`. */
  readonly basePath: string;
  /** What to show in a picker: host plus base path. */
  readonly display: string;
}

export type NormaliseResult =
  | { readonly ok: true; readonly value: NormalisedInstance; readonly insecure: boolean }
  | { readonly ok: false; readonly error: string };

const PRIVATE_V4 =
  /^(10\.|127\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/;

/**
 * Plaintext HTTP is only ever offered for something on the same machine or
 * the same LAN, where there is no network to intercept. Everything else must
 * be HTTPS - a connector link is, by design, followed by someone who has just
 * been told to trust it.
 */
export function isLocalHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host === "::1") return true;
  if (PRIVATE_V4.test(host)) return true;
  // Unique local addresses (fc00::/7).
  return /^f[cd][0-9a-f]{2}:/.test(host);
}

export function normaliseInstanceUrl(raw: string): NormaliseResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: "Enter the address of your Bulwark." };

  // People type "mail.example.com". Assume the safe scheme, not the other one.
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return { ok: false, error: "That does not look like a web address." };
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, error: "Only http and https addresses work here." };
  }
  if (url.username || url.password) {
    return { ok: false, error: "Remove the username and password from the address." };
  }
  if (url.search || url.hash) {
    return { ok: false, error: "Remove the query string and the # part of the address." };
  }
  if (!url.hostname) {
    return { ok: false, error: "That address has no host name." };
  }

  const insecure = url.protocol === "http:";
  if (insecure && !isLocalHost(url.hostname)) {
    return {
      ok: false,
      error: "Use https. Plain http is only offered for an instance on this machine or your own network.",
    };
  }

  const basePath = url.pathname.replace(/\/+$/, "");
  if (basePath && !/^(\/[A-Za-z0-9._~-]+)+$/.test(basePath)) {
    return { ok: false, error: "That path does not look like a mount point." };
  }

  return {
    ok: true,
    insecure,
    value: {
      origin: url.origin,
      basePath,
      display: `${url.host}${basePath}`,
    },
  };
}
