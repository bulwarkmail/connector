"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { normaliseInstanceUrl } from "@/lib/instance-url";
import type { Instance } from "@/lib/instances";
import { SiteShell } from "./site-shell";
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
      <SiteShell
        head={
          <>
            <h1 className="bw-h1">Saved.</h1>
            <p className="bw-lead">
              Bulwark links in this browser now open on {added.label}.
            </p>
          </>
        }
      >
        <p className="bw-small">
          <code className="bw-code">
            {added.origin}
            {added.basePath}
          </code>
        </p>
        <div className="bw-btns mt-8">
          <a className="bw-btn" href={`${added.origin}${added.basePath}/`} rel="noreferrer">
            Open it
          </a>
          <Link className="bw-btn bw-btn-ghost" href="/instances">
            Manage servers
          </Link>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell
      head={
        <>
          <h1 className="bw-h1">Add your Bulwark.</h1>
          <p className="bw-lead">
            {suggested
              ? "Bulwark filled in this address for you. Check it, then add it."
              : "Enter the address you use to open Bulwark."}
          </p>
        </>
      }
    >
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
        <div className="min-h-[320px]" />
      )}
    </SiteShell>
  );
}
