"use client";

import { useMemo, useState } from "react";
import { buildConnectorUrl, validateParams, type ParamSpec, type Target } from "@/lib/registry";
import { SiteShell } from "./site-shell";
import { Alert, Check } from "./icons";

const SITE = "https://connector.bulwarkmail.org";

export function CreateLinkClient({ targets }: { targets: readonly Target[] }) {
  const [name, setName] = useState(targets[0]?.name ?? "");
  const [values, setValues] = useState<Record<string, string>>({});
  const [label, setLabel] = useState("Open in Bulwark");

  const target = targets.find((t) => t.name === name) ?? targets[0];
  const specs = Object.entries(target?.params ?? {});

  const filled = useMemo(() => {
    const out: Record<string, string> = {};
    for (const [key] of specs) {
      const value = values[key]?.trim();
      if (value) out[key] = value;
    }
    return out;
  }, [specs, values]);

  const validation = target ? validateParams(target, filled) : null;
  const valid = validation?.ok ?? false;
  const url = target ? buildConnectorUrl(SITE, target.name, filled) : "";
  const query = Object.keys(filled).length ? `?${new URLSearchParams(filled)}` : "";

  return (
    <SiteShell
      head={
        <>
          <h1 className="bw-h1">Make a link.</h1>
          <p className="bw-lead">
            The link opens on the reader&apos;s own Bulwark, wherever that is. Use it in guides,
            release notes and support replies.
          </p>
        </>
      }
    >
      <div className="grid gap-12 lg:grid-cols-2">
        <form className="bw-form" onSubmit={(event) => event.preventDefault()}>
          <div className="bw-form-field">
            <label className="bw-label" htmlFor="target">
              What the link opens
            </label>
            <select
              id="target"
              className="bw-input"
              value={target?.name ?? ""}
              onChange={(event) => {
                setName(event.target.value);
                setValues({});
              }}
            >
              {(["App", "Admin"] as const).map((group) => (
                <optgroup key={group} label={group}>
                  {targets
                    .filter((t) => t.group === group)
                    .map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.label}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
            {target ? <p className="bw-help">{target.description}</p> : null}
          </div>

          {specs.map(([key, spec]) => (
            <ParamField
              key={key}
              name={key}
              spec={spec}
              value={values[key] ?? ""}
              invalid={validation && !validation.ok && validation.param === key}
              onChange={(next) => setValues((current) => ({ ...current, [key]: next }))}
            />
          ))}

          <div className="bw-form-field">
            <label className="bw-label" htmlFor="link-text">
              Link text
            </label>
            <input
              id="link-text"
              className="bw-input"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
            />
          </div>

          {validation && !validation.ok ? (
            <p className="bw-help bw-help-error" role="alert">
              <Alert size={16} />
              <span>
                <code className="bw-code">{validation.param}</code> {validation.reason}.
              </span>
            </p>
          ) : null}

          {target ? (
            <p className="bw-note">
              <b>Note.</b> Needs Bulwark {target.minVersion} or newer. Older versions show a
              message instead.
            </p>
          ) : null}
        </form>

        <div className="bw-stack">
          <Snippet title="Link" value={valid ? url : ""} />
          <Snippet title="Markdown" value={valid ? `[${label}](${url})` : ""} />
          <Snippet
            title="Docs shorthand"
            value={valid && target ? `[${label}](connector:${target.name}${query})` : ""}
            note="Only works inside the bulwarkmail.org docs."
          />
          <Snippet title="HTML" value={valid ? `<a href="${url}" rel="noreferrer">${label}</a>` : ""} />
        </div>
      </div>
    </SiteShell>
  );
}

function ParamField({
  name,
  spec,
  value,
  invalid,
  onChange,
}: {
  name: string;
  spec: ParamSpec;
  value: string;
  invalid: boolean | null;
  onChange: (value: string) => void;
}) {
  const id = `param-${name}`;
  const required = "required" in spec && spec.required;

  return (
    <div className="bw-form-field">
      <label className="bw-label" htmlFor={id}>
        {name}
      </label>
      {spec.type === "enum" ? (
        <select
          id={id}
          className="bw-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{required ? "Choose one" : "Not set"}</option>
          {spec.values.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <>
          <input
            id={id}
            className="bw-input"
            value={value}
            placeholder={placeholderFor(spec)}
            aria-invalid={invalid ? true : undefined}
            list={spec.type === "id" && spec.suggest ? `${id}-suggest` : undefined}
            onChange={(e) => onChange(e.target.value)}
          />
          {spec.type === "id" && spec.suggest ? (
            <datalist id={`${id}-suggest`}>
              {spec.suggest.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          ) : null}
        </>
      )}
      <p className="bw-help">{required ? "Required." : "Optional."}</p>
    </div>
  );
}

function placeholderFor(spec: ParamSpec): string {
  switch (spec.type) {
    case "slug":
      return "quick-reply";
    case "date":
      return "2026-09-20";
    case "path":
      return "Documents/Invoices";
    case "id":
      return "inbox";
    default:
      return "";
  }
}

function Snippet({ title, value, note }: { title: string; value: string; note?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be refused; the text is selectable either way.
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="bw-label">{title}</h2>
        <button type="button" className="bw-btn bw-btn-ghost bw-btn-sm" onClick={copy} disabled={!value}>
          {copied ? (
            <>
              <Check size={16} />
              Copied
            </>
          ) : (
            "Copy"
          )}
        </button>
      </div>
      <pre className="bw-codeblock">{value || "—"}</pre>
      {note ? <p className="bw-help mt-2">{note}</p> : null}
    </div>
  );
}
