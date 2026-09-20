"use client";

import { useState } from "react";
import { normaliseInstanceUrl, type NormalisedInstance } from "@/lib/instance-url";
import { probeInstance } from "@/lib/probe";
import { addInstance, type Instance, type Store } from "@/lib/instances";
import { Alert } from "./icons";

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
      <div className="bw-stack max-w-[560px]">
        <div>
          <h3 className="bw-h3">Could not check that address</h3>
          <p className="bw-help mt-2">{phase.message}</p>
        </div>
        <p className="bw-small">
          <code className="bw-code">{phase.instance.display}</code>
        </p>
        <div className="bw-btns">
          <button type="button" className="bw-btn" onClick={() => save(phase.instance, { verified: false })}>
            Add anyway
          </button>
          <button
            type="button"
            className="bw-btn bw-btn-ghost"
            onClick={() => setPhase({ kind: "editing" })}
          >
            Change the address
          </button>
        </div>
      </div>
    );
  }

  const checking = phase.kind === "checking";

  return (
    <form onSubmit={submit} className="bw-form">
      <div className="bw-form-field">
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
          aria-invalid={error ? true : undefined}
          aria-describedby="instance-url-help"
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
          disabled={checking}
        />
        <p className="bw-help" id="instance-url-help">
          {parsed.ok && `${parsed.value.origin}${parsed.value.basePath}` !== value.trim() ? (
            <>
              Will use{" "}
              <code className="bw-code">
                {parsed.value.origin}
                {parsed.value.basePath}
              </code>
            </>
          ) : (
            "Checked from this browser, straight to your server."
          )}
        </p>
      </div>

      <div className="bw-form-field">
        <label className="bw-label" htmlFor="instance-label">
          Name for it
        </label>
        <input
          id="instance-label"
          className="bw-input"
          type="text"
          autoComplete="off"
          placeholder="Work"
          value={label}
          aria-describedby="instance-label-help"
          onChange={(event) => setLabel(event.target.value)}
          disabled={checking}
        />
        <p className="bw-help" id="instance-label-help">
          Optional. Only useful once you have more than one.
        </p>
      </div>

      {insecure ? (
        <label className="bw-check">
          <input
            type="checkbox"
            checked={acceptInsecure}
            onChange={(event) => setAcceptInsecure(event.target.checked)}
          />
          <span>
            This address is unencrypted (<code className="bw-code">http</code>). That is fine on
            your own machine or network, and nowhere else.
          </span>
        </label>
      ) : null}

      {/* Errors carry an icon and words, never colour alone. */}
      {error ? (
        <p className="bw-help bw-help-error" role="alert">
          <Alert size={16} />
          {error}
        </p>
      ) : null}

      <div className="bw-btns">
        <button type="submit" className="bw-btn" disabled={checking}>
          {checking ? "Checking…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
