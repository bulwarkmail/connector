import { describe, expect, it } from "vitest";
import { isLocalHost, normaliseInstanceUrl } from "../instance-url";

const ok = (raw: string) => {
  const result = normaliseInstanceUrl(raw);
  if (!result.ok) throw new Error(`expected ${raw} to be accepted: ${result.error}`);
  return result;
};

describe("normaliseInstanceUrl", () => {
  it("assumes https when no scheme was typed", () => {
    expect(ok("mail.example.com").value.origin).toBe("https://mail.example.com");
  });

  it("drops a trailing slash", () => {
    expect(ok("https://mail.example.com/").value).toMatchObject({
      origin: "https://mail.example.com",
      basePath: "",
    });
  });

  it("keeps a subpath mount as the base path", () => {
    expect(ok("https://example.com/webmail/").value).toMatchObject({
      origin: "https://example.com",
      basePath: "/webmail",
      display: "example.com/webmail",
    });
  });

  it("keeps a non-default port", () => {
    expect(ok("https://mail.example.com:8443").value.display).toBe("mail.example.com:8443");
  });

  it("trims what was pasted", () => {
    expect(ok("  https://mail.example.com  ").value.origin).toBe("https://mail.example.com");
  });

  it.each([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.1.10",
    "http://[::1]:3000",
  ])("allows plain http for %s, flagged as insecure", (raw) => {
    const result = ok(raw);
    expect(result.insecure).toBe(true);
  });

  it("refuses plain http for a public host", () => {
    const result = normaliseInstanceUrl("http://mail.example.com");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/https/);
  });

  it.each([
    ["", "nothing typed"],
    ["   ", "only spaces"],
    ["https://", "no host"],
    ["not a url", "a sentence"],
    ["ftp://mail.example.com", "the wrong scheme"],
    ["javascript:alert(1)", "a script URL"],
    ["https://user:pass@mail.example.com", "credentials in the address"],
    ["https://mail.example.com/?next=x", "a query string"],
    ["https://mail.example.com/#x", "a fragment"],
    ["https://mail.example.com/a path", "a space in the path"],
  ])("rejects %j (%s)", (raw) => {
    expect(normaliseInstanceUrl(raw).ok).toBe(false);
  });

  it("does not let a credential-shaped address masquerade as another host", () => {
    // Would be https://evil.example with "mail.example.com" as the username.
    expect(normaliseInstanceUrl("https://mail.example.com@evil.example").ok).toBe(false);
  });
});

describe("isLocalHost", () => {
  it.each(["localhost", "app.localhost", "127.0.0.1", "10.0.0.5", "192.168.1.1", "172.16.0.1", "::1", "fd00::1"])(
    "treats %s as local",
    (host) => {
      expect(isLocalHost(host)).toBe(true);
    },
  );

  it.each(["mail.example.com", "8.8.8.8", "172.32.0.1", "2001:db8::1", "notlocalhost.example"])(
    "treats %s as remote",
    (host) => {
      expect(isLocalHost(host)).toBe(false);
    },
  );
});
