"use client";

import { useState } from "react";
import { normaliseInstanceUrl, type NormalisedInstance } from "@/lib/instance-url";
import { probeInstance } from "@/lib/probe";
import { addInstance, type Instance, type Store } from "@/lib/instances";

interface InstanceFormProps {
  store: Store;
  onStoreChange: (store: Store) => void;
  /** Called once an instance has been saved. */
  onAdded: (instance: Instance) => void;
  /**
   * Pre-fills the address field on first render. Only ever a suggestion: the
   * form never saves or navigates on its own, so a link that pre-fills
   * someone else's address cannot add it behind the visitor's back.
   *
   * Read once, so a caller that gets it asynchronously must hold the form
   * back until it has it (see add-client.tsx).
   */
  initialUrl?: string;
  submitLabel?: string;
}

type Phase =
  | { kind: "editing" }
  | { kind: "checking"; instance: NormalisedInstance }
  | { kind: "unreachable"; instance: NormalisedInstance; message: string };

export function InstanceForm({
  store,
  onStoreChange,
  onAdded,
  initialUrl,
  submitLabel = "Add",
}: InstanceFormProps) {
  const [value, setValue] = useState(initialUrl ?? "");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [acceptInsecure, setAcceptInsecure] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: "editing" });

  const parsed = normaliseInstanceUrl(value);
  const insecure = parsed.ok && parsed.insecure;

  const save = (instance: NormalisedInstance, options: Parameters<typeof addInstance>[2]) => {
    const { store: next, instance: saved } = addInstance(store, instance, {
      ...options,
      label: label.trim() || options?.label,
    });
    onStoreChange(next);
    onAdded(saved);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const result = normaliseInstanceUrl(value);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.insecure && !acceptInsecure) {
      setError("Tick the box below to use an unencrypted address.");
      return;
    }

    setPhase({ kind: "checking", instance: result.value });
    const probe = await probeInstance(result.value);

    if (probe.ok) {
      save(result.value, {
        appName: probe.capabilities.appName,
        version: probe.capabilities.version,
        targets: probe.capabilities.targets,
        verified: true,
        label: probe.capabilities.appName ?? undefined,
      });
      return;
    }

    setPhase({ kind: "unreachable", instance: result.value, message: probe.error });
  };

  if (phase.kind === "unreachable") {
    return (
      <div className="bw-tile">
        <h2 className="text-[21px]">Could not check that address</h2>
        <p className="mt-2 text-[15px] text-muted">{phase.message}</p>
        <p className="mt-3 text-[15px]">
          <span className="bw-code">{phase.instance.display}</span>
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            className="bw-button"
            onClick={() => save(phase.instance, { verified: false })}
          >
            Add anyway
          </button>
          <button type="button" className="bw-button" onClick={() => setPhase({ kind: "editing" })}>
            Change the address
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bw-tile">
      <div>
        <label className="bw-label" htmlFor="instance-url">
          Address of your Bulwark
        </label>
        <input
          id="instance-url"
          className="bw-input"
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="mail.example.com"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
          disabled={phase.kind === "checking"}
        />
        {parsed.ok && parsed.value.display !== value.trim() ? (
          <p className="mt-2 text-[13.5px] text-muted">
            Will use <span className="bw-code">{parsed.value.origin}{parsed.value.basePath}</span>
          </p>
        ) : null}
      </div>

      <div className="mt-4">
        <label className="bw-label" htmlFor="instance-label">
          Name for it (optional)
        </label>
        <input
          id="instance-label"
          className="bw-input"
          type="text"
          autoComplete="off"
          placeholder="Work"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          disabled={phase.kind === "checking"}
        />
      </div>

      {insecure ? (
        <label className="mt-4 flex items-start gap-2 text-[15px]">
          <input
            type="checkbox"
            className="mt-1"
            checked={acceptInsecure}
            onChange={(event) => setAcceptInsecure(event.target.checked)}
          />
          <span>
            This address is unencrypted (<span className="bw-code">http</span>). That is fine on
            your own machine or network, and nowhere else.
          </span>
        </label>
      ) : null}

      {error ? (
        <p className="mt-4 text-[15px] text-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex items-center gap-3">
        <button type="submit" className="bw-button bw-button-primary" disabled={phase.kind === "checking"}>
          {phase.kind === "checking" ? "Checking…" : submitLabel}
        </button>
        <p className="text-[13.5px] text-muted">
          Checked from this browser, straight to your server.
        </p>
      </div>
    </form>
  );
}
