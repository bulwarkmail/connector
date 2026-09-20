import { describe, expect, it } from "vitest";
import {
  EMPTY_STORE,
  addInstance,
  findInstance,
  parseStore,
  removeInstance,
  resolveInstance,
  setDefaultInstance,
  updateInstance,
} from "../instances";
import type { NormalisedInstance } from "../instance-url";

const work: NormalisedInstance = {
  origin: "https://mail.example.com",
  basePath: "",
  display: "mail.example.com",
};
const home: NormalisedInstance = {
  origin: "https://mail.example.net",
  basePath: "",
  display: "mail.example.net",
};

describe("parseStore", () => {
  it("returns an empty store for nothing", () => {
    expect(parseStore(null)).toEqual(EMPTY_STORE);
    expect(parseStore("")).toEqual(EMPTY_STORE);
  });

  it("returns an empty store for junk rather than throwing", () => {
    expect(parseStore("{not json")).toEqual(EMPTY_STORE);
    expect(parseStore("[]")).toEqual(EMPTY_STORE);
    expect(parseStore('{"instances":"no"}')).toEqual(EMPTY_STORE);
  });

  it("drops entries without an id or an origin", () => {
    const raw = JSON.stringify({
      version: 1,
      instances: [{ id: "a" }, { origin: "https://x.example" }, null, "nope"],
    });
    expect(parseStore(raw).instances).toHaveLength(0);
  });

  it("fills in what an older entry did not have", () => {
    const raw = JSON.stringify({
      version: 1,
      instances: [{ id: "a", origin: "https://mail.example.com" }],
    });
    expect(parseStore(raw).instances[0]).toMatchObject({
      basePath: "",
      label: "https://mail.example.com",
      appName: null,
      version: null,
      targets: null,
      verifiedAt: null,
    });
  });

  it("forgets a default that points at nothing", () => {
    const raw = JSON.stringify({ version: 1, defaultId: "gone", instances: [] });
    expect(parseStore(raw).defaultId).toBeNull();
  });

  it("defaults rememberChoice to true", () => {
    expect(parseStore('{"instances":[]}').rememberChoice).toBe(true);
    expect(parseStore('{"instances":[],"rememberChoice":false}').rememberChoice).toBe(false);
  });
});

describe("addInstance", () => {
  it("adds the first instance without making it the default", () => {
    // Being first is not a choice. If it were recorded as the default, adding
    // a second instance later would silently keep opening the first one.
    const { store } = addInstance(EMPTY_STORE, work);
    expect(store.instances).toHaveLength(1);
    expect(store.defaultId).toBeNull();
  });

  it("still asks once a second instance has been added", () => {
    const first = addInstance(EMPTY_STORE, work).store;
    const second = addInstance(first, home).store;
    expect(second.instances).toHaveLength(2);
    expect(resolveInstance(second)).toBeNull();
  });

  it("updates in place instead of adding a duplicate", () => {
    const first = addInstance(EMPTY_STORE, work, { label: "Work" }).store;
    const again = addInstance(first, work, { version: "1.12.0", verified: true });
    expect(again.store.instances).toHaveLength(1);
    expect(again.instance).toMatchObject({ label: "Work", version: "1.12.0" });
    expect(again.instance.verifiedAt).not.toBeNull();
  });

  it("treats a different mount point on the same host as a different instance", () => {
    const first = addInstance(EMPTY_STORE, work).store;
    const second = addInstance(first, { ...work, basePath: "/webmail" }).store;
    expect(second.instances).toHaveLength(2);
  });

  it("labels an instance after its address when no label was given", () => {
    const { instance } = addInstance(EMPTY_STORE, work);
    expect(instance.label).toBe("mail.example.com");
  });

  it("leaves verifiedAt null when the probe did not succeed", () => {
    const { instance } = addInstance(EMPTY_STORE, work, { verified: false });
    expect(instance.verifiedAt).toBeNull();
  });
});

describe("updateInstance, removeInstance, setDefaultInstance", () => {
  it("renames without changing the id", () => {
    const { store, instance } = addInstance(EMPTY_STORE, work);
    const renamed = updateInstance(store, instance.id, { label: "Work mail", id: "hijacked" });
    expect(findInstance(renamed, instance.id)?.label).toBe("Work mail");
  });

  it("clears the default when the default instance is removed", () => {
    const { store, instance } = addInstance(EMPTY_STORE, work);
    const without = removeInstance(store, instance.id);
    expect(without.instances).toHaveLength(0);
    expect(without.defaultId).toBeNull();
  });

  it("refuses to make an unknown instance the default", () => {
    const { store } = addInstance(EMPTY_STORE, work);
    expect(setDefaultInstance(store, "nope").defaultId).toBeNull();
  });
});

describe("resolveInstance", () => {
  it("has nothing to resolve when the list is empty", () => {
    expect(resolveInstance(EMPTY_STORE)).toBeNull();
  });

  it("does not ask when there is only one instance", () => {
    const { store, instance } = addInstance(EMPTY_STORE, work);
    expect(resolveInstance(store)?.id).toBe(instance.id);
  });

  it("uses the remembered default when there are several", () => {
    const first = addInstance(EMPTY_STORE, work);
    const second = addInstance(first.store, home);
    const withDefault = setDefaultInstance(second.store, second.instance.id);
    expect(resolveInstance(withDefault)?.id).toBe(second.instance.id);
  });

  it("asks again when the visitor turned remembering off", () => {
    const first = addInstance(EMPTY_STORE, work);
    const second = addInstance(first.store, home);
    const withDefault = setDefaultInstance(second.store, second.instance.id);
    expect(resolveInstance({ ...withDefault, rememberChoice: false })).toBeNull();
  });

  it("asks when several are stored and none is the default", () => {
    const first = addInstance(EMPTY_STORE, work);
    const second = addInstance(first.store, home);
    expect(resolveInstance(setDefaultInstance(second.store, null))).toBeNull();
  });
});
