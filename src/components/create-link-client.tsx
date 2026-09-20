"use client";

import { useMemo, useState } from "react";
import { buildConnectorUrl, validateParams, type ParamSpec, type Target } from "@/lib/registry";

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

  const groups = ["App", "Admin"] as const;

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="bw-tile self-start">
        <div>
          <label className="bw-label" htmlFor="target">
            What should the link open?
          </label>
          <select
            id="target"
            className="bw-select"
            value={target?.name ?? ""}
            onChange={(event) => {
              setName(event.target.value);
              setValues({});
            }}
          >
            {groups.map((group) => (
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
          {target ? <p className="mt-2 text-[13.5px] text-muted">{target.description}</p> : null}
        </div>

        {specs.map(([key, spec]) => (
          <ParamField
            key={key}
            name={key}
            spec={spec}
            value={values[key] ?? ""}
            onChange={(next) => setValues((current) => ({ ...current, [key]: next }))}
          />
        ))}

        <div className="mt-4">
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
          <p className="mt-4 text-[15px] text-error" role="alert">
            <span className="bw-code">{validation.param}</span> {validation.reason}.
          </p>
        ) : null}

        {target ? (
          <p className="mt-4 text-[13.5px] text-muted">
            Needs Bulwark {target.minVersion} or later. Older instances show a note instead of
            failing.
          </p>
        ) : null}
      </div>

      <div className="space-y-4">
        <Snippet title="Link" value={valid ? url : ""} />
        <Snippet title="Markdown" value={valid ? `[${label}](${url})` : ""} />
        <Snippet
          title="Docs shorthand"
          value={
            valid && target
              ? `[${label}](connector:${target.name}${
                  Object.keys(filled).length ? `?${new URLSearchParams(filled)}` : ""
                })`
              : ""
          }
          note="Inside the bulwarkmail.org docs, remark-connector-link expands this."
        />
        <Snippet
          title="HTML"
          value={valid ? `<a href="${url}" rel="noreferrer">${label}</a>` : ""}
        />
      </div>
    </div>
  );
}

function ParamField({
  name,
  spec,
  value,
  onChange,
}: {
  name: string;
  spec: ParamSpec;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = `param-${name}`;
  const required = "required" in spec && spec.required;

  return (
    <div className="mt-4">
      <label className="bw-label" htmlFor={id}>
        {name}
        {required ? "" : " (optional)"}
      </label>
      {spec.type === "enum" ? (
        <select id={id} className="bw-select" value={value} onChange={(e) => onChange(e.target.value)}>
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
    <div className="bw-tile">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] text-muted">{title}</h2>
        <button type="button" className="bw-button" onClick={copy} disabled={!value}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mt-3 bw-code block break-all">{value || "—"}</p>
      {note ? <p className="mt-2 text-[13.5px] text-muted">{note}</p> : null}
    </div>
  );
}
