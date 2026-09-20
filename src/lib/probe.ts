/**
 * The capability probe.
 *
 * Asks an instance what it is and which targets it knows, so the form can
 * confirm "that really is a Bulwark" and a link can warn before opening a
 * target the instance is too old to resolve.
 *
 * The request is made by the visitor's own browser, straight to their own
 * server, with no credentials. Nothing about it reaches us. It is allowed to
 * fail: an instance behind a VPN the visitor is not on, or one older than the
 * endpoint, is added unverified instead.
 */

import type { NormalisedInstance } from "./instance-url";

export interface Capabilities {
  readonly appName: string | null;
  readonly version: string | null;
  readonly targets: readonly string[] | null;
}

export type ProbeResult =
  | { readonly ok: true; readonly capabilities: Capabilities }
  | { readonly ok: false; readonly error: string };

const TIMEOUT_MS = 5000;

/**
 * Bulwark Lite is a static export with no route handlers, so it ships the
 * same document as a file. Try the API first, fall back to the file.
 */
function probeUrls(instance: NormalisedInstance): string[] {
  const base = `${instance.origin}${instance.basePath}`;
  return [`${base}/api/connector/capabilities`, `${base}/connector.json`];
}

function readCapabilities(body: unknown): Capabilities | null {
  if (typeof body !== "object" || body === null) return null;
  const record = body as Record<string, unknown>;
  if (record.product !== "bulwark-webmail") return null;
  return {
    appName: typeof record.appName === "string" ? record.appName : null,
    version: typeof record.version === "string" ? record.version : null,
    targets: Array.isArray(record.targets)
      ? record.targets.filter((t): t is string => typeof t === "string")
      : null,
  };
}

export async function probeInstance(instance: NormalisedInstance): Promise<ProbeResult> {
  let reachedSomething = false;

  for (const url of probeUrls(instance)) {
    let response: Response;
    try {
      response = await fetch(url, {
        method: "GET",
        mode: "cors",
        credentials: "omit",
        redirect: "follow",
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      // Unreachable, blocked by CORS, wrong certificate, or timed out. The
      // browser does not tell us which, and we should not guess out loud.
      continue;
    }

    reachedSomething = true;
    if (!response.ok) continue;

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      continue;
    }

    const capabilities = readCapabilities(body);
    if (capabilities) return { ok: true, capabilities };
  }

  return {
    ok: false,
    error: reachedSomething
      ? "Something answered at that address, but it does not look like Bulwark. Check the address, or add it anyway."
      : "Could not reach that address. If your Bulwark is only reachable from another network, add it anyway.",
  };
}

/**
 * Whether an instance is known to be too old for a target.
 *
 * Only a probed instance can answer this. An unverified one returns
 * `"unknown"`, and the link opens without a warning - guessing would train
 * people to click through a warning that is usually wrong.
 */
export function supportsTarget(
  targets: readonly string[] | null,
  targetName: string,
): "yes" | "no" | "unknown" {
  if (!targets) return "unknown";
  return targets.includes(targetName) ? "yes" : "no";
}
