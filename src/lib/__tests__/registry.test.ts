import { describe, expect, it } from "vitest";
import {
  RESERVED_PATHS,
  TARGETS,
  buildConnectorUrl,
  buildInstanceUrl,
  getTarget,
  validateParams,
} from "../registry";

const target = (name: string) => {
  const found = getTarget(name);
  if (!found) throw new Error(`no such target: ${name}`);
  return found;
};

describe("the registry itself", () => {
  it("has unique names", () => {
    const names = TARGETS.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("never names a target after a path the site owns", () => {
    for (const t of TARGETS) {
      expect(RESERVED_PATHS as readonly string[]).not.toContain(t.name);
    }
  });

  it("uses names that are safe as a single path segment", () => {
    for (const t of TARGETS) {
      expect(t.name).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });

  it("describes every target, for the link generator", () => {
    for (const t of TARGETS) {
      expect(t.label.length).toBeGreaterThan(0);
      expect(t.description.length).toBeGreaterThan(0);
      expect(t.minVersion).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });
});

describe("getTarget", () => {
  it("returns null for anything it does not know", () => {
    expect(getTarget("nope")).toBeNull();
    expect(getTarget("")).toBeNull();
    expect(getTarget(null)).toBeNull();
    expect(getTarget(undefined)).toBeNull();
  });

  it("does not inherit from Object.prototype", () => {
    expect(getTarget("constructor")).toBeNull();
    expect(getTarget("__proto__")).toBeNull();
    expect(getTarget("toString")).toBeNull();
  });
});

describe("validateParams", () => {
  it("accepts a known enum value", () => {
    const result = validateParams(target("settings"), new URLSearchParams("tab=filters"));
    expect(result).toEqual({ ok: true, params: { tab: "filters" } });
  });

  it("rejects an enum value that is not in the list", () => {
    const result = validateParams(target("settings"), new URLSearchParams("tab=root"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.param).toBe("tab");
  });

  it("treats a missing optional parameter as absent, not as an error", () => {
    expect(validateParams(target("settings"), new URLSearchParams(""))).toEqual({
      ok: true,
      params: {},
    });
  });

  it("requires a required parameter", () => {
    const result = validateParams(target("admin_extension"), new URLSearchParams(""));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.param).toBe("slug");
      expect(result.reason).toBe("is required");
    }
  });

  it("treats an empty value as missing", () => {
    const result = validateParams(target("admin_extension"), new URLSearchParams("slug="));
    expect(result.ok).toBe(false);
  });

  it("drops parameters the target does not declare", () => {
    const result = validateParams(
      target("settings"),
      new URLSearchParams("tab=filters&redirect=https://evil.example"),
    );
    expect(result).toEqual({ ok: true, params: { tab: "filters" } });
  });

  it("accepts a well-formed slug", () => {
    const result = validateParams(target("admin_extension"), new URLSearchParams("slug=quick-reply"));
    expect(result).toEqual({ ok: true, params: { slug: "quick-reply" } });
  });

  it.each([
    "../../etc/passwd",
    "//evil.example",
    "Quick-Reply",
    "quick reply",
    "-leading-dash",
    "a".repeat(65),
    "javascript:alert(1)",
    "quick%2Freply",
  ])("rejects the slug %j", (slug) => {
    const result = validateParams(target("admin_extension"), { slug });
    expect(result.ok).toBe(false);
  });

  it.each(["2026-09-20", "2024-02-29"])("accepts the date %s", (date) => {
    const result = validateParams(target("calendar"), { date });
    expect(result.ok).toBe(true);
  });

  it.each(["2026-02-31", "2026-13-01", "20260920", "2026-9-20", "tomorrow"])(
    "rejects the date %j",
    (date) => {
      const result = validateParams(target("calendar"), { date });
      expect(result.ok).toBe(false);
    },
  );

  it("accepts an opaque mailbox id", () => {
    const result = validateParams(target("mail_folder"), { ref: "a1b2c3d4" });
    expect(result).toEqual({ ok: true, params: { ref: "a1b2c3d4" } });
  });

  it.each(["../admin", "a/b", "a\\b", "a?b", "a#b", ".", ".."])(
    "rejects the mailbox ref %j",
    (ref) => {
      expect(validateParams(target("mail_folder"), { ref }).ok).toBe(false);
    },
  );

  it("accepts a multi-segment drive path", () => {
    const result = validateParams(target("files"), { path: "Documents/Invoices" });
    expect(result).toEqual({ ok: true, params: { path: "Documents/Invoices" } });
  });

  it.each(["../secrets", "Documents/../../etc", "Documents/a?b", "/"])(
    "rejects the drive path %j",
    (path) => {
      expect(validateParams(target("files"), { path }).ok).toBe(false);
    },
  );

  it("reads an empty optional path as the drive root, not as an error", () => {
    expect(validateParams(target("files"), { path: "" })).toEqual({ ok: true, params: {} });
  });

  it("rejects an over-long value whatever its shape", () => {
    const result = validateParams(target("mail_folder"), { ref: "a".repeat(513) });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("is too long");
  });
});

describe("link assembly", () => {
  it("builds the public URL a doc links to", () => {
    expect(buildConnectorUrl("https://connector.bulwarkmail.org", "settings", { tab: "filters" })).toBe(
      "https://connector.bulwarkmail.org/settings?tab=filters",
    );
  });

  it("omits an empty query string", () => {
    expect(buildConnectorUrl("https://connector.bulwarkmail.org/", "app")).toBe(
      "https://connector.bulwarkmail.org/app",
    );
  });

  it("builds the instance URL the visitor is sent to", () => {
    expect(buildInstanceUrl("https://mail.example.com", "", "settings", { tab: "filters" })).toBe(
      "https://mail.example.com/connector/settings?tab=filters",
    );
  });

  it("keeps a subpath mount", () => {
    expect(buildInstanceUrl("https://example.com", "/webmail", "admin", { tab: "policy" })).toBe(
      "https://example.com/webmail/connector/admin?tab=policy",
    );
  });

  it("encodes parameter values rather than pasting them in", () => {
    expect(buildInstanceUrl("https://mail.example.com", "", "files", { path: "My Files/a b" })).toBe(
      "https://mail.example.com/connector/files?path=My+Files%2Fa+b",
    );
  });
});
