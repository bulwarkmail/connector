"use client";

import Link from "next/link";
import { useState } from "react";
import { InstanceForm } from "./instance-form";
import { useInstanceStore } from "./use-instance-store";

export function LandingClient() {
  const { store, ready, update } = useInstanceStore();
  const [adding, setAdding] = useState(false);

  if (!ready) {
    // Prerendered HTML has nothing to show yet; a spinner here would flash on
    // every load, so the section simply starts empty.
    return <div className="min-h-[180px]" />;
  }

  if (store.instances.length === 0 || adding) {
    return (
      <section>
        <h2 className="mb-4 text-[24px]">
          {store.instances.length === 0 ? "Add your Bulwark" : "Add another"}
        </h2>
        <InstanceForm store={store} onStoreChange={update} onAdded={() => setAdding(false)} />
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-4 text-[24px]">
        {store.instances.length === 1 ? "Your Bulwark" : "Your Bulwark instances"}
      </h2>
      <ul className="space-y-3">
        {store.instances.map((instance) => (
          <li key={instance.id} className="bw-tile flex flex-wrap items-baseline justify-between gap-3">
            <span>
              <span className="text-[19px]">{instance.label}</span>
              <span className="ml-3 bw-code">
                {instance.origin}
                {instance.basePath}
              </span>
            </span>
            <a className="text-[15px]" href={`${instance.origin}${instance.basePath}/`} rel="noreferrer">
              Open
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-5 flex gap-4 text-[15px]">
        <button type="button" className="bw-button" onClick={() => setAdding(true)}>
          Add another
        </button>
        <Link className="bw-button" href="/instances">
          Manage
        </Link>
      </p>
    </section>
  );
}
