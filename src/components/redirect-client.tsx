"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { buildInstanceUrl, validateParams, type Target } from "@/lib/registry";
import { supportsTarget } from "@/lib/probe";
import { resolveInstance, setDefaultInstance, type Instance, type Store } from "@/lib/instances";
import { SiteShell } from "./site-shell";
import { useInstanceStore } from "./use-instance-store";
import { useLocationSearch } from "./use-location-search";
import { InstanceForm } from "./instance-form";
import { ArrowRight } from "./icons";

/** Long enough to read the destination, short enough not to feel like a wait. */
const INTERSTITIAL_MS = 900;

type Step =
  | { kind: "loading" }
  | { kind: "bad-params"; param: string; reason: string }
  | { kind: "no-instances" }
  | { kind: "choose" }
  | { kind: "too-old"; instance: Instance }
  | { kind: "opening"; instance: Instance; url: string };

export function RedirectClient({ target }: { target: Target }) {
  const { store, ready, update } = useInstanceStore();
  // The parameters never travel to this origin: they are read out of the
  // address bar in the browser, after the static page has already loaded.
  const search = useLocationSearch();
  const [chosen, setChosen] = useState<Instance | null>(null);
  const [remember, setRemember] = useState(false);
  const [overrideAge, setOverrideAge] = useState(false);

  const validation = useMemo(() => validateParams(target, search), [search, target]);
  const instance = chosen ?? (ready ? resolveInstance(store) : null);

  const step: Step = useMemo(() => {
    if (!ready) return { kind: "loading" };
    if (!validation.ok) return { kind: "bad-params", param: validation.param, reason: validation.reason };
    if (store.instances.length === 0) return { kind: "no-instances" };
    if (!instance) return { kind: "choose" };
    if (!overrideAge && supportsTarget(instance.targets, target.name) === "no") {
      return { kind: "too-old", instance };
    }
    return {
      kind: "opening",
      instance,
      url: buildInstanceUrl(instance.origin, instance.basePath, target.name, validation.params),
    };
  }, [ready, validation, store.instances.length, instance, overrideAge, target]);

  // The only navigation this site performs.
  useEffect(() => {
    if (step.kind !== "opening") return;
    const url = step.url;
    const timer = window.setTimeout(() => window.location.replace(url), INTERSTITIAL_MS);
    return () => window.clearTimeout(timer);
  }, [step]);

  const pick = (picked: Instance, nextStore?: Store) => {
    if (remember) update(setDefaultInstance(nextStore ?? store, picked.id));
    else if (nextStore) update(nextStore);
    setChosen(picked);
  };

  switch (step.kind) {
    case "loading":
      return (
        <SiteShell>
          <p className="bw-muted">Loading…</p>
        </SiteShell>
      );

    case "bad-params":
      return (
        <SiteShell
          head={
            <>
              <h1 className="bw-h1">This link is broken.</h1>
              <p className="bw-lead">
                Part of the link is missing or wrong. Nothing was opened.
              </p>
            </>
          }
        >
          {/* The parameter is named, never echoed: its value is attacker-controlled. */}
          <p className="bw-note bw-note-warning bw-body">
            <b>Warning.</b> The <code className="bw-code">{step.param}</code> value{" "}
            {step.reason}. Ask whoever sent you this link to make a new one.
          </p>
          <div className="bw-btns mt-8">
            <Link className="bw-btn" href="/create-link">
              Make a new link
            </Link>
            <Link className="bw-btn bw-btn-ghost" href="/">
              Go to the start
            </Link>
          </div>
        </SiteShell>
      );

    case "no-instances":
      return (
        <SiteShell
          head={
            <>
              <h1 className="bw-h1">Where is your Bulwark?</h1>
              <p className="bw-lead">
                This link opens {target.label.toLowerCase()}. Enter the address of your Bulwark
                first. It is saved in this browser only.
              </p>
            </>
          }
        >
          <InstanceForm
            store={store}
            onStoreChange={update}
            onAdded={setChosen}
            submitLabel="Add and continue"
          />
        </SiteShell>
      );

    case "choose":
      return (
        <SiteShell
          head={
            <>
              <h1 className="bw-h1">Which server?</h1>
              <p className="bw-lead">This link opens {target.label.toLowerCase()}.</p>
            </>
          }
        >
          <div className="bw-tiles bw-tiles-1">
            {store.instances.map((candidate) => (
              <button
                key={candidate.id}
                type="button"
                className="bw-tile bw-tile-compact"
                onClick={() => pick(candidate)}
              >
                <span className="bw-tile-title">{candidate.label}</span>
                <span className="bw-tile-text">
                  {candidate.origin}
                  {candidate.basePath}
                </span>
                <span className="bw-tile-meta">
                  {candidate.verifiedAt ? (candidate.version ?? "checked") : "not checked"}
                </span>
              </button>
            ))}
          </div>
          <label className="bw-check mt-8">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />
            <span>Always use this server</span>
          </label>
          <p className="mt-8">
            <Link className="bw-tlink" href="/add">
              Add another server
              <ArrowRight size={16} />
            </Link>
          </p>
        </SiteShell>
      );

    case "too-old":
      return (
        <SiteShell
          head={
            <>
              <h1 className="bw-h1">Your Bulwark is too old for this link.</h1>
              <p className="bw-lead">
                {step.instance.origin.replace(/^https?:\/\//, "")}
                {step.instance.basePath} runs Bulwark {step.instance.version ?? "an older version"}.
                This link needs Bulwark {target.minVersion} or newer.
              </p>
            </>
          }
        >
          <div className="bw-btns">
            <button type="button" className="bw-btn" onClick={() => setOverrideAge(true)}>
              Try anyway
            </button>
            <a
              className="bw-btn bw-btn-ghost"
              href={`${step.instance.origin}${step.instance.basePath}/`}
              rel="noreferrer"
            >
              Open Bulwark instead
            </a>
            {store.instances.length > 1 ? (
              <button type="button" className="bw-btn bw-btn-ghost" onClick={() => setChosen(null)}>
                Use another server
              </button>
            ) : null}
          </div>
        </SiteShell>
      );

    case "opening":
      return (
        <SiteShell
          head={
            <>
              <h1 className="bw-h1">
                Opening {target.label.toLowerCase()} on{" "}
                {step.instance.origin.replace(/^https?:\/\//, "")}
                {step.instance.basePath}.
              </h1>
              <p className="bw-lead">
                <a className="bw-link" href={step.url} rel="noreferrer">
                  Continue now
                </a>
                {store.instances.length > 1 ? (
                  <>
                    {" · "}
                    <button
                      type="button"
                      className="bw-tlink"
                      onClick={() => {
                        setChosen(null);
                        update(setDefaultInstance(store, null));
                      }}
                    >
                      Not this server?
                    </button>
                  </>
                ) : null}
              </p>
            </>
          }
        >
          <p className="bw-muted bw-small">
            This happens in your browser. We never see where you go.
          </p>
        </SiteShell>
      );
  }
}
