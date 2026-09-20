"use client";

import Link from "next/link";
import { useState } from "react";
import { probeInstance } from "@/lib/probe";
import {
  removeInstance,
  setDefaultInstance,
  updateInstance,
  type Instance,
} from "@/lib/instances";
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
    update((current) => updateInstance(current, instance.id, { label: draftLabel.trim() || instance.label }));
    setEditing(null);
  };

  if (!ready) return <div className="min-h-[320px]" />;

  return (
    <>
      <header className="mb-6">
        <h1 className="text-[34px]">Your instances</h1>
        <p className="mt-2 max-w-[60ch] text-muted">
          Stored in this browser only. Another browser, or another device, has its own list.
        </p>
      </header>

      {store.instances.length === 0 ? (
        <div className="bw-tile max-w-[620px]">
          <p>Nothing stored here yet.</p>
          <p className="mt-4">
            <Link className="bw-button" href="/add">
              Add an instance
            </Link>
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {store.instances.map((instance) => {
            const isDefault = store.defaultId === instance.id;
            return (
              <li key={instance.id} className="bw-tile">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  {editing === instance.id ? (
                    <form
                      className="flex flex-1 gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        rename(instance);
                      }}
                    >
                      <input
                        className="bw-input max-w-[260px]"
                        value={draftLabel}
                        autoFocus
                        onChange={(event) => setDraftLabel(event.target.value)}
                        aria-label="Name"
                      />
                      <button type="submit" className="bw-button">
                        Save
                      </button>
                      <button type="button" className="bw-button" onClick={() => setEditing(null)}>
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <span>
                      <span className="text-[19px]">{instance.label}</span>
                      {isDefault ? (
                        <span className="ml-3 text-[13.5px] text-muted">default</span>
                      ) : null}
                      <br />
                      <span className="bw-code">
                        {instance.origin}
                        {instance.basePath}
                      </span>
                    </span>
                  )}

                  <span className="text-[13.5px] text-muted">
                    {instance.verifiedAt
                      ? `${instance.appName ?? "Bulwark"} ${instance.version ?? ""}`.trim()
                      : "not checked"}
                  </span>
                </div>

                {editing === instance.id ? null : (
                  <div className="mt-4 flex flex-wrap gap-2 text-[15px]">
                    <a className="bw-button" href={`${instance.origin}${instance.basePath}/`} rel="noreferrer">
                      Open
                    </a>
                    <button
                      type="button"
                      className="bw-button"
                      disabled={checking === instance.id}
                      onClick={() => recheck(instance)}
                    >
                      {checking === instance.id ? "Checking…" : "Check again"}
                    </button>
                    <button
                      type="button"
                      className="bw-button"
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
                        className="bw-button"
                        onClick={() => update(setDefaultInstance(store, instance.id))}
                      >
                        Make default
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="bw-button bw-button-danger"
                      onClick={() => update(removeInstance(store, instance.id))}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {store.instances.length > 1 ? (
        <label className="mt-6 flex items-center gap-2 text-[15px]">
          <input
            type="checkbox"
            checked={store.rememberChoice}
            onChange={(event) => update({ ...store, rememberChoice: event.target.checked })}
          />
          Open links on the default instance without asking
        </label>
      ) : null}

      <section className="mt-12 border-t pt-8">
        <h2 className="text-[21px]">Forget everything</h2>
        <p className="mt-2 max-w-[60ch] text-[15px] text-muted">
          Clears the list from this browser. There is nothing to clear anywhere else - this list
          is the only thing this site has ever known about you.
        </p>
        <p className="mt-4">
          <button
            type="button"
            className="bw-button bw-button-danger"
            onClick={clear}
          >
            Forget everything
          </button>
        </p>
      </section>
    </>
  );
}
