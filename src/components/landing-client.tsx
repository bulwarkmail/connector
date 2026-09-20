"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "./icons";
import { InstanceForm } from "./instance-form";
import { useInstanceStore } from "./use-instance-store";

export function LandingClient() {
  const { store, ready, update } = useInstanceStore();
  const [adding, setAdding] = useState(false);

  // Prerendered HTML has nothing to show yet; a spinner here would flash on
  // every load, so the section holds its height and starts empty.
  if (!ready) return <section className="bw-sec-tight min-h-[320px]" />;

  if (store.instances.length === 0 || adding) {
    return (
      <section className="bw-sec-tight">
        <h2 className="bw-h2">
          {store.instances.length === 0 ? "Add your Bulwark" : "Add another"}
        </h2>
        <p className="bw-lead mt-3">
          The address you use to open Bulwark, including a subpath if it runs under one.
        </p>
        <div className="mt-8">
          <InstanceForm store={store} onStoreChange={update} onAdded={() => setAdding(false)} />
        </div>
      </section>
    );
  }

  return (
    <section className="bw-sec-tight">
      <h2 className="bw-h2">
        {store.instances.length === 1 ? "Your Bulwark" : "Your Bulwark instances"}
      </h2>
      <div className="bw-tiles bw-tiles-1 mt-8">
        {store.instances.map((instance) => (
          <a
            key={instance.id}
            className="bw-tile bw-tile-compact"
            href={`${instance.origin}${instance.basePath}/`}
            rel="noreferrer"
          >
            <span className="bw-tile-title">{instance.label}</span>
            <span className="bw-tile-text">
              {instance.origin}
              {instance.basePath}
            </span>
            <ArrowRight size={20} className="bw-tile-arrow" />
          </a>
        ))}
      </div>
      <div className="bw-btns mt-8">
        <button type="button" className="bw-btn bw-btn-ghost" onClick={() => setAdding(true)}>
          Add another
        </button>
        <Link className="bw-btn bw-btn-ghost" href="/instances">
          Manage instances
        </Link>
      </div>
    </section>
  );
}
