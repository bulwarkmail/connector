"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { normaliseInstanceUrl } from "@/lib/instance-url";
import type { Instance } from "@/lib/instances";
import { InstanceForm } from "./instance-form";
import { useInstanceStore } from "./use-instance-store";
import { useLocationSearch } from "./use-location-search";

/**
 * Adding an instance, optionally pre-filled by `?url=`.
 *
 * Bulwark itself links here from its settings and admin pages so nobody has
 * to retype their own address. The parameter only fills the field: the form
 * still has to be submitted, and this page never navigates anywhere on its
 * own. A link that pre-fills somebody else's address is therefore a form a
 * visitor can read and decline, not an instance they have silently acquired.
 */
export function AddClient() {
  const { store, ready, update } = useInstanceStore();
  const search = useLocationSearch();
  const [added, setAdded] = useState<Instance | null>(null);

  const suggested = useMemo(() => {
    const raw = search.get("url");
    if (!raw) return "";
    const parsed = normaliseInstanceUrl(raw);
    return parsed.ok ? `${parsed.value.origin}${parsed.value.basePath}` : "";
  }, [search]);

  if (added) {
    return (
      <div className="bw-tile max-w-[620px]">
        <h1 className="text-[24px]">Added</h1>
        <p className="mt-3 text-[15px]">
          <strong>{added.label}</strong>{" "}
          <span className="bw-code">
            {added.origin}
            {added.basePath}
          </span>{" "}
          is now the instance this browser will use for Bulwark links.
        </p>
        <p className="mt-5 flex gap-4 text-[15px]">
          <a className="bw-button" href={`${added.origin}${added.basePath}/`} rel="noreferrer">
            Open it
          </a>
          <Link className="bw-button" href="/instances">
            Manage instances
          </Link>
        </p>
      </div>
    );
  }

  return (
    <>
      <header className="mb-6">
        <h1 className="text-[34px]">Add an instance</h1>
        <p className="mt-2 max-w-[60ch] text-muted">
          {suggested
            ? "Bulwark sent you here with this address filled in. Check it, then add it."
            : "The address you use to open Bulwark, including a subpath if it runs under one."}
        </p>
      </header>

      {/* The form reads `initialUrl` once, so it must not mount before the
          address bar has been read. */}
      {ready ? (
        <InstanceForm
          store={store}
          onStoreChange={update}
          onAdded={setAdded}
          initialUrl={suggested}
        />
      ) : (
        <div className="min-h-[220px]" />
      )}
    </>
  );
}
