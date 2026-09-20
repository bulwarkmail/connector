"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { buildInstanceUrl, validateParams, type Target } from "@/lib/registry";
import { supportsTarget } from "@/lib/probe";
import {
  resolveInstance,
  setDefaultInstance,
  type Instance,
  type Store,
} from "@/lib/instances";
import { useInstanceStore } from "./use-instance-store";
import { useLocationSearch } from "./use-location-search";
import { InstanceForm } from "./instance-form";

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
      return <p className="text-muted">Working out where to send you…</p>;

    case "bad-params":
      return (
        <Card title="That link is not quite right">
          <p>
            It asks for <strong>{target.label}</strong>, but its{" "}
            <span className="bw-code">{step.param}</span> {step.reason}.
          </p>
          <p className="mt-3 text-muted">
            Nothing was opened. If you were sent this link, whoever wrote it can rebuild it with
            the <Link href="/create-link">link maker</Link>.
          </p>
        </Card>
      );

    case "no-instances":
      return (
        <>
          <header className="mb-6">
            <h1 className="text-[34px]">Open {target.label} on your Bulwark</h1>
            <p className="mt-2 text-muted">
              {target.description} First, tell this browser where your Bulwark is. It is stored
              here and sent nowhere.
            </p>
          </header>
          <InstanceForm
            store={store}
            onStoreChange={update}
            onAdded={setChosen}
            submitLabel="Add and continue"
          />
        </>
      );

    case "choose":
      return (
        <>
          <header className="mb-6">
            <h1 className="text-[34px]">Which Bulwark?</h1>
            <p className="mt-2 text-muted">
              Opening <strong>{target.label}</strong>.
            </p>
          </header>
          <ul className="space-y-3">
            {store.instances.map((candidate) => (
              <li key={candidate.id}>
                <button
                  type="button"
                  className="bw-tile flex w-full items-baseline justify-between gap-4 text-left hover:bg-surface"
                  onClick={() => pick(candidate)}
                >
                  <span>
                    <span className="text-[19px]">{candidate.label}</span>
                    <span className="ml-3 bw-code">{candidate.origin}{candidate.basePath}</span>
                  </span>
                  <span className="shrink-0 text-[13.5px] text-muted">
                    {candidate.verifiedAt ? (candidate.version ?? "checked") : "not checked"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <label className="mt-5 flex items-center gap-2 text-[15px]">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />
            Remember my choice in this browser
          </label>
          <p className="mt-6 text-[15px] text-muted">
            <Link href="/add">Add another instance</Link>
          </p>
        </>
      );

    case "too-old":
      return (
        <Card title="That instance is too old for this link">
          <p>
            <span className="bw-code">{step.instance.origin}{step.instance.basePath}</span> runs{" "}
            {step.instance.version ?? "an older version"}, which does not know the{" "}
            <strong>{target.label}</strong> link. Bulwark {target.minVersion} or later does.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" className="bw-button" onClick={() => setOverrideAge(true)}>
              Try it anyway
            </button>
            <a
              className="bw-button"
              href={`${step.instance.origin}${step.instance.basePath}/`}
              rel="noreferrer"
            >
              Just open Bulwark
            </a>
            {store.instances.length > 1 ? (
              <button type="button" className="bw-button" onClick={() => setChosen(null)}>
                Use a different instance
              </button>
            ) : null}
          </div>
        </Card>
      );

    case "opening":
      return (
        <div className="py-10">
          <h1 className="text-[28px]">
            Opening {target.label} on{" "}
            <span className="bw-code text-[21px]">{step.instance.origin.replace(/^https?:\/\//, "")}{step.instance.basePath}</span>
          </h1>
          <p className="mt-4 text-muted">
            <a href={step.url} rel="noreferrer">
              Continue now
            </a>
            {store.instances.length > 1 ? (
              <>
                {" · "}
                <button
                  type="button"
                  className="underline text-link"
                  onClick={() => {
                    setChosen(null);
                    update(setDefaultInstance(store, null));
                  }}
                >
                  Not this one?
                </button>
              </>
            ) : null}
          </p>
        </div>
      );
  }
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bw-tile max-w-[620px]">
      <h1 className="text-[24px]">{title}</h1>
      <div className="mt-3 text-[15px]">{children}</div>
    </div>
  );
}
