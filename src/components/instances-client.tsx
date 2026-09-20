"use client";

import Link from "next/link";
import { useState } from "react";
import { probeInstance } from "@/lib/probe";
import { removeInstance, setDefaultInstance, updateInstance, type Instance } from "@/lib/instances";
import { SiteShell } from "./site-shell";
import { useInstanceStore } from "./use-instance-store";

export function InstancesClient() {
  const { store, ready, update, clear } = useInstanceStore();
  const [checking, setChecking] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draftLabel, setDraftLabel] = useState("");

  const recheck = async (instance: Instance) => {
    setChecking(instance.id);
    const probe = await probeInstance({
      origin: instance.origin,
      basePath: instance.basePath,
      display: instance.origin,
    });
    update((current) =>
      updateInstance(current, instance.id, probe.ok
        ? {
            appName: probe.capabilities.appName,
            version: probe.capabilities.version,
            targets: probe.capabilities.targets,
            verifiedAt: new Date().toISOString(),
          }
        : { verifiedAt: null }),
    );
    setChecking(null);
  };

  const rename = (instance: Instance) => {
    update((current) =>
      updateInstance(current, instance.id, { label: draftLabel.trim() || instance.label }),
    );
    setEditing(null);
  };

  const head = (
    <>
      <h1 className="bw-h1">Your instances.</h1>
      <p className="bw-lead">
        Stored in this browser only. Another browser, or another device, has its own list.
      </p>
    </>
  );

  if (!ready) {
    return (
      <SiteShell head={head}>
        <div className="min-h-[400px]" />
      </SiteShell>
    );
  }

  return (
    <SiteShell head={head}>
      {store.instances.length === 0 ? (
        <div className="bw-stack max-w-[560px]">
          <p>Nothing stored here yet.</p>
          <div className="bw-btns">
            <Link className="bw-btn" href="/add">
              Add an instance
            </Link>
          </div>
        </div>
      ) : (
        <div className="bw-tiles bw-tiles-1">
          {store.instances.map((instance) => {
            const isDefault = store.defaultId === instance.id;
            return (
              <div key={instance.id} className="bw-tile" style={{ minHeight: 0, paddingBottom: 28 }}>
                {editing === instance.id ? (
                  <form
                    className="bw-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      rename(instance);
                    }}
                  >
                    <div className="bw-form-field">
                      <label className="bw-label" htmlFor={`name-${instance.id}`}>
                        Name
                      </label>
                      <input
                        id={`name-${instance.id}`}
                        className="bw-input"
                        value={draftLabel}
                        autoFocus
                        onChange={(event) => setDraftLabel(event.target.value)}
                      />
                    </div>
                    <div className="bw-btns">
                      <button type="submit" className="bw-btn bw-btn-sm">
                        Save
                      </button>
                      <button
                        type="button"
                        className="bw-btn bw-btn-ghost bw-btn-sm"
                        onClick={() => setEditing(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <h2 className="bw-tile-title">
                        {instance.label}
                        {isDefault ? (
                          <span className="bw-tile-text ml-3">default</span>
                        ) : null}
                      </h2>
                      <span className="bw-tile-text">
                        {instance.verifiedAt
                          ? `${instance.appName ?? "Bulwark"} ${instance.version ?? ""}`.trim()
                          : "not checked"}
                      </span>
                    </div>
                    <p className="bw-tile-text">
                      <code className="bw-code">
                        {instance.origin}
                        {instance.basePath}
                      </code>
                    </p>
                    <div className="bw-btns mt-4">
                      <a
                        className="bw-btn bw-btn-ghost bw-btn-sm"
                        href={`${instance.origin}${instance.basePath}/`}
                        rel="noreferrer"
                      >
                        Open
                      </a>
                      <button
                        type="button"
                        className="bw-btn bw-btn-ghost bw-btn-sm"
                        disabled={checking === instance.id}
                        onClick={() => recheck(instance)}
                      >
                        {checking === instance.id ? "Checking…" : "Check again"}
                      </button>
                      <button
                        type="button"
                        className="bw-btn bw-btn-ghost bw-btn-sm"
                        onClick={() => {
                          setEditing(instance.id);
                          setDraftLabel(instance.label);
                        }}
                      >
                        Rename
                      </button>
                      {store.instances.length > 1 && !isDefault ? (
                        <button
                          type="button"
                          className="bw-btn bw-btn-ghost bw-btn-sm"
                          onClick={() => update(setDefaultInstance(store, instance.id))}
                        >
                          Make default
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="bw-btn bw-btn-ghost bw-btn-sm"
                        onClick={() => update(removeInstance(store, instance.id))}
                      >
                        Remove
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {store.instances.length > 1 ? (
        <label className="bw-check mt-8">
          <input
            type="checkbox"
            checked={store.rememberChoice}
            onChange={(event) => update({ ...store, rememberChoice: event.target.checked })}
          />
          <span>Open links on the default instance without asking</span>
        </label>
      ) : null}

      <section className="bw-sec-tight">
        <h2 className="bw-h2">Forget everything</h2>
        <p className="bw-lead mt-3">
          Clears the list from this browser. There is nothing to clear anywhere else - this list is
          the only thing this site has ever known about you.
        </p>
        <div className="bw-btns mt-8">
          <button type="button" className="bw-btn bw-btn-ghost" onClick={clear}>
            Forget everything
          </button>
        </div>
      </section>
    </SiteShell>
  );
}
