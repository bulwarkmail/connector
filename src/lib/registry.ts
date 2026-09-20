/**
 * The target registry: every destination a connector link can name.
 *
 * This file is one half of a contract. The other half lives in the webmail
 * (`lib/connector/registry.ts`), which owns the *path templates* - how a
 * target turns into a route inside the app. The connector deliberately does
 * not know those paths: it validates the parameters and forwards
 * `<instance>/connector/<target>?<params>`, and the instance resolves it.
 *
 * That split is what lets an instance be older than the connector. A target
 * added here reaches every instance immediately, and the ones that do not
 * know it yet render their own "this version does not support that link"
 * card instead of a 404.
 *
 * Both halves must agree on names and parameter schemas. `registry.test.ts`
 * checks the invariants that can be checked from this side; the webmail's
 * parity test diffs the two files.
 */

export type ParamSpec =
  /** One of a fixed list. The list is a copy of the app's own enum. */
  | { readonly type: "enum"; readonly values: readonly string[]; readonly required?: boolean }
  /** Lowercase kebab identifier - extension and plugin slugs. */
  | { readonly type: "slug"; readonly required?: boolean }
  /** `YYYY-MM-DD`, local time, as the calendar deep links use. */
  | { readonly type: "date"; readonly required?: boolean }
  /**
   * An opaque server-side id, or one of `suggest` when the app has a readable
   * alias for it. Length-capped and otherwise unconstrained, because JMAP ids
   * are the server's business, not ours.
   */
  | {
      readonly type: "id";
      readonly required?: boolean;
      readonly suggest?: readonly string[];
    }
  /** A `/`-separated path inside the drive. Segments are validated one by one. */
  | { readonly type: "path"; readonly required?: boolean };

export interface Target {
  readonly name: string;
  readonly label: string;
  readonly description: string;
  /** First webmail release that resolves this target. */
  readonly minVersion: string;
  /** Grouping for the link generator only. */
  readonly group: "App" | "Admin";
  readonly params?: Readonly<Record<string, ParamSpec>>;
}

/** Settings tabs - mirrors `SettingsSearchTab` in the webmail. */
const SETTINGS_TABS = [
  "account",
  "language",
  "notifications",
  "appearance",
  "layout",
  "reading",
  "composing",
  "downloads",
  "identities",
  "vacation",
  "filters",
  "templates",
  "folders",
  "keywords",
  "security",
  "content_senders",
  "calendar",
  "contacts",
  "files",
  "protocol_handlers",
  "sidebar_apps",
  "about_data",
  "themes",
  "plugins",
  "debug",
] as const;

/** Admin tabs - mirrors `ADMIN_TABS` in the webmail. */
const ADMIN_TABS = [
  "dashboard",
  "settings",
  "branding",
  "auth",
  "policy",
  "plugins",
  "themes",
  "marketplace",
  "version",
  "telemetry",
  "logs",
] as const;

/** Calendar views - mirrors `CalendarViewMode` in the webmail. */
const CALENDAR_VIEWS = ["month", "week", "day", "agenda", "tasks"] as const;

/**
 * Readable mailbox references. Anything else is treated as an opaque JMAP
 * mailbox id, which is the only stable handle a custom folder has.
 */
const FOLDER_REFS = [
  "inbox",
  "sent",
  "drafts",
  "trash",
  "archive",
  "junk",
  "scheduled",
  "unified-inbox",
  "unified-sent",
  "unified-drafts",
  "unified-trash",
  "unified-archive",
  "unified-junk",
  "cross-unread",
  "cross-starred",
  "cross-all",
] as const;

/** The release that first shipped `/connector/<target>` in the webmail. */
const V1 = "1.12.0";

export const TARGETS: readonly Target[] = [
  {
    name: "app",
    label: "Bulwark",
    description: "Just open the app.",
    minVersion: V1,
    group: "App",
  },
  {
    name: "settings",
    label: "Settings",
    description: "Open a settings tab.",
    minVersion: V1,
    group: "App",
    params: { tab: { type: "enum", values: SETTINGS_TABS } },
  },
  {
    name: "mail_folder",
    label: "Mail folder",
    description: "Open a folder in the mail list.",
    minVersion: V1,
    group: "App",
    params: { ref: { type: "id", suggest: FOLDER_REFS } },
  },
  {
    name: "calendar",
    label: "Calendar",
    description: "Open the calendar on a view and date.",
    minVersion: V1,
    group: "App",
    params: {
      view: { type: "enum", values: CALENDAR_VIEWS },
      date: { type: "date" },
    },
  },
  {
    name: "contacts",
    label: "Contacts",
    description: "Open the address book.",
    minVersion: V1,
    group: "App",
  },
  {
    name: "files",
    label: "Files",
    description: "Open a folder in the drive.",
    minVersion: V1,
    group: "App",
    params: { path: { type: "path" } },
  },
  {
    name: "admin",
    label: "Admin",
    description: "Open an admin panel.",
    minVersion: V1,
    group: "Admin",
    params: { tab: { type: "enum", values: ADMIN_TABS } },
  },
  {
    name: "admin_extension",
    label: "Install an extension",
    description:
      "Open the marketplace page for one extension, where an admin can review its manifest and permissions before installing.",
    minVersion: V1,
    group: "Admin",
    params: { slug: { type: "slug", required: true } },
  },
  {
    name: "admin_plugin",
    label: "Plugin settings",
    description: "Open an installed plugin's configuration panel.",
    minVersion: V1,
    group: "Admin",
    params: { id: { type: "slug", required: true } },
  },
  {
    name: "admin_auth",
    label: "Authentication",
    description: "Open the admin authentication panel (OAuth setup).",
    minVersion: V1,
    group: "Admin",
  },
  {
    name: "setup",
    label: "Setup wizard",
    description: "Open the first-run setup wizard.",
    minVersion: V1,
    group: "Admin",
  },
] as const;

/**
 * Paths the site itself owns. Targets live at the root of the connector
 * hostname, so a target may never be named one of these.
 */
export const RESERVED_PATHS = ["add", "instances", "create-link", "badges"] as const;

const BY_NAME = new Map(TARGETS.map((t) => [t.name, t]));

export function getTarget(name: string | undefined | null): Target | null {
  if (!name) return null;
  return BY_NAME.get(name) ?? null;
}

// ---------------------------------------------------------------------------
// Parameter validation
// ---------------------------------------------------------------------------

/** Generous, but bounded: nothing here is ever interpolated into markup. */
const MAX_PARAM_LENGTH = 512;

const SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export type ValidationResult =
  | { readonly ok: true; readonly params: Readonly<Record<string, string>> }
  | { readonly ok: false; readonly param: string; readonly reason: string };

function isRealDate(value: string): boolean {
  const match = DATE.exec(value);
  if (!match) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  // Rejects the impossible dates Date silently rolls over (2026-02-31).
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

function validateOne(spec: ParamSpec, value: string): string | null {
  if (value.length > MAX_PARAM_LENGTH) return "is too long";

  switch (spec.type) {
    case "enum":
      return spec.values.includes(value) ? null : "is not one of the allowed values";
    case "slug":
      return SLUG.test(value) ? null : "is not a valid slug";
    case "date":
      return isRealDate(value) ? null : "is not a YYYY-MM-DD date";
    case "id":
      // Opaque, but it becomes one path segment on the instance, so it may not
      // contain anything that could climb out of it. `%` is refused along with
      // the separators because the instance decodes the value twice on the way
      // in, so `..%2Fadmin` would arrive there as `../admin`. Real JMAP ids
      // have no percent signs in them.
      return /[/\\?#%]/.test(value) || value === "." || value === ".."
        ? "is not a valid id"
        : null;
    case "path": {
      const segments = value.split("/").filter(Boolean);
      if (segments.length === 0) return "is empty";
      if (segments.length > 32) return "has too many segments";
      return segments.some((s) => s === "." || s === ".." || /[\\?#]/.test(s))
        ? "is not a valid path"
        : null;
    }
  }
}

/**
 * Checks the parameters of a link against a target's schema.
 *
 * Unknown parameters are dropped rather than rejected: a newer connector may
 * hand an older reader a link carrying something extra, and dropping it
 * degrades the link instead of breaking it. Malformed *known* parameters do
 * fail, because silently ignoring one would open a page other than the one
 * the link named.
 */
export function validateParams(
  target: Target,
  input: URLSearchParams | Readonly<Record<string, string>>,
): ValidationResult {
  const read = (key: string): string | null =>
    input instanceof URLSearchParams ? input.get(key) : (input[key] ?? null);

  const params: Record<string, string> = {};
  for (const [key, spec] of Object.entries(target.params ?? {})) {
    const value = read(key);
    if (value === null || value === "") {
      if (spec.required) return { ok: false, param: key, reason: "is required" };
      continue;
    }
    const problem = validateOne(spec, value);
    if (problem) return { ok: false, param: key, reason: problem };
    params[key] = value;
  }
  return { ok: true, params };
}

// ---------------------------------------------------------------------------
// Link assembly
// ---------------------------------------------------------------------------

/** The public URL for a target, as it goes into docs and READMEs. */
export function buildConnectorUrl(
  origin: string,
  targetName: string,
  params: Readonly<Record<string, string>> = {},
): string {
  const query = new URLSearchParams(params).toString();
  return `${origin.replace(/\/+$/, "")}/${targetName}${query ? `?${query}` : ""}`;
}

/**
 * Where the visitor is actually sent: the same target and parameters, on
 * their own instance. The instance owns everything after this point.
 */
export function buildInstanceUrl(
  origin: string,
  basePath: string,
  targetName: string,
  params: Readonly<Record<string, string>> = {},
): string {
  const query = new URLSearchParams(params).toString();
  const mount = basePath.replace(/\/+$/, "");
  return `${origin}${mount}/connector/${targetName}${query ? `?${query}` : ""}`;
}
