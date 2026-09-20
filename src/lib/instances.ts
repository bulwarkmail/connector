/**
 * The instance list.
 *
 * This is the only thing the connector remembers about anyone, and it lives
 * in `localStorage` on this origin. Not a cookie: a cookie travels to the
 * server on every request, which would put the list of someone's mail servers
 * into an access log. Nothing here is ever sent anywhere.
 *
 * Every read and write is wrapped, because storage throws in a private window
 * and returns nothing when site data has been cleared. A browser that refuses
 * to store anything still gets a working site - it just asks for the address
 * each time.
 */

import type { NormalisedInstance } from "./instance-url";

export const STORAGE_KEY = "bulwark.connector.instances";
const SCHEMA_VERSION = 1;

export interface Instance {
  readonly id: string;
  readonly origin: string;
  readonly basePath: string;
  readonly label: string;
  /** From the capability probe; display only. */
  readonly appName: string | null;
  readonly version: string | null;
  /** Targets the instance said it knows, used to warn before navigating. */
  readonly targets: readonly string[] | null;
  /** ISO timestamp of the last successful probe, or null if never verified. */
  readonly verifiedAt: string | null;
  readonly addedAt: string;
}

export interface Store {
  readonly version: number;
  readonly defaultId: string | null;
  readonly instances: readonly Instance[];
  /** Whether a single choice should be reused without asking again. */
  readonly rememberChoice: boolean;
}

export const EMPTY_STORE: Store = {
  version: SCHEMA_VERSION,
  defaultId: null,
  instances: [],
  rememberChoice: true,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Parses whatever is in storage into a store we can use. Anything that does
 * not fit the shape is dropped rather than repaired: this data is small and
 * re-enterable, so a clean empty list beats a half-understood one.
 */
export function parseStore(raw: string | null): Store {
  if (!raw) return EMPTY_STORE;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return EMPTY_STORE;
  }
  if (!isRecord(parsed) || !Array.isArray(parsed.instances)) return EMPTY_STORE;

  const instances: Instance[] = [];
  for (const entry of parsed.instances) {
    if (!isRecord(entry)) continue;
    const { id, origin, label } = entry;
    if (typeof id !== "string" || typeof origin !== "string" || !id || !origin) continue;
    instances.push({
      id,
      origin,
      basePath: typeof entry.basePath === "string" ? entry.basePath : "",
      label: typeof label === "string" && label ? label : origin,
      appName: typeof entry.appName === "string" ? entry.appName : null,
      version: typeof entry.version === "string" ? entry.version : null,
      targets: Array.isArray(entry.targets)
        ? entry.targets.filter((t): t is string => typeof t === "string")
        : null,
      verifiedAt: typeof entry.verifiedAt === "string" ? entry.verifiedAt : null,
      addedAt: typeof entry.addedAt === "string" ? entry.addedAt : new Date(0).toISOString(),
    });
  }

  const defaultId =
    typeof parsed.defaultId === "string" && instances.some((i) => i.id === parsed.defaultId)
      ? parsed.defaultId
      : null;

  return {
    version: SCHEMA_VERSION,
    defaultId,
    instances,
    rememberChoice: parsed.rememberChoice !== false,
  };
}

export function loadStore(): Store {
  if (typeof window === "undefined") return EMPTY_STORE;
  try {
    return parseStore(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return EMPTY_STORE;
  }
}

export function saveStore(store: Store): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage full, blocked, or a private window. The session still works.
  }
}

export function forgetEverything(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to undo */
  }
}

/** Local-only identifier. Never leaves the browser, so randomness is plenty. */
export function newInstanceId(): string {
  const bytes = new Uint8Array(8);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function findInstance(store: Store, id: string | null): Instance | null {
  if (!id) return null;
  return store.instances.find((i) => i.id === id) ?? null;
}

/** Same origin and mount point means the same instance, whatever it is called. */
export function sameInstance(a: Pick<Instance, "origin" | "basePath">, b: NormalisedInstance): boolean {
  return a.origin === b.origin && a.basePath === b.basePath;
}

export interface AddOptions {
  readonly label?: string;
  readonly appName?: string | null;
  readonly version?: string | null;
  readonly targets?: readonly string[] | null;
  readonly verified?: boolean;
}

/**
 * Adds an instance, or updates the matching one in place. Re-adding an
 * address someone already has should refresh what we know about it, not
 * leave them with two rows that look identical.
 */
export function addInstance(
  store: Store,
  normalised: NormalisedInstance,
  options: AddOptions = {},
): { store: Store; instance: Instance } {
  const now = new Date().toISOString();
  const existing = store.instances.find((i) => sameInstance(i, normalised));

  const instance: Instance = {
    id: existing?.id ?? newInstanceId(),
    origin: normalised.origin,
    basePath: normalised.basePath,
    label: options.label?.trim() || existing?.label || normalised.display,
    appName: options.appName ?? existing?.appName ?? null,
    version: options.version ?? existing?.version ?? null,
    targets: options.targets ?? existing?.targets ?? null,
    verifiedAt: options.verified ? now : (existing?.verifiedAt ?? null),
    addedAt: existing?.addedAt ?? now,
  };

  const instances = existing
    ? store.instances.map((i) => (i.id === instance.id ? instance : i))
    : [...store.instances, instance];

  // Deliberately does not touch `defaultId`. Being the first one added is not
  // a choice - `resolveInstance` already opens a sole instance without asking.
  // Recording it as the default would mean that adding a second instance
  // later silently kept sending links to the first, with no picker in sight.
  return { store: { ...store, instances }, instance };
}

export function updateInstance(store: Store, id: string, patch: Partial<Instance>): Store {
  return {
    ...store,
    instances: store.instances.map((i) => (i.id === id ? { ...i, ...patch, id: i.id } : i)),
  };
}

export function removeInstance(store: Store, id: string): Store {
  const instances = store.instances.filter((i) => i.id !== id);
  return {
    ...store,
    instances,
    defaultId: store.defaultId === id ? null : store.defaultId,
  };
}

export function setDefaultInstance(store: Store, id: string | null): Store {
  return { ...store, defaultId: id && store.instances.some((i) => i.id === id) ? id : null };
}

/**
 * Which instance a link should open without asking.
 *
 * One instance is not a choice, so it never asks. More than one asks unless
 * the visitor has said to remember a default. A remembered default that has
 * since been removed falls back to asking.
 */
export function resolveInstance(store: Store): Instance | null {
  if (store.instances.length === 1) return store.instances[0];
  if (!store.rememberChoice) return null;
  return findInstance(store, store.defaultId);
}
