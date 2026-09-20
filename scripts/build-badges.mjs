#!/usr/bin/env node
// Generates out/badges/<target>.svg (and -dark.svg) from the registry.
//
// README badges are fetched through GitHub's image proxy, which strips
// prefers-color-scheme out of an SVG, so each badge ships as two files and
// the snippet picks one with <picture media>. Shields.io is deliberately not
// used: a badge served from someone else's host would report every README
// view to them.

import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";

const OUT = join(import.meta.dirname, "..", "out", "badges");

// The registry is TypeScript; read the names out of it rather than adding a
// build step just for this.
const source = await readFile(
  join(import.meta.dirname, "..", "src", "lib", "registry.ts"),
  "utf8",
);
const names = [...source.matchAll(/^\s{4}name: "([a-z0-9_]+)",$/gm)].map((m) => m[1]);
if (names.length === 0) throw new Error("no targets found in src/lib/registry.ts");

const THEMES = {
  light: { bg: "#ffffff", border: "#dddde1", text: "#18181b", brand: "#db2d54" },
  dark: { bg: "#1f1f22", border: "#2e2e33", text: "#f2f2f3", brand: "#ec4467" },
};

// Hanken Grotesk is not on the reader's machine, so the badge measures against
// the system sans it will actually fall back to. 6.6px per character at 12px
// is a close enough average for the short label used here.
const LABEL = "Open in Bulwark";
const WIDTH = Math.round(38 + LABEL.length * 6.6);
const HEIGHT = 24;

function badge({ bg, border, text, brand }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="${LABEL}">
  <rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${HEIGHT - 1}" rx="2" fill="${bg}" stroke="${border}"/>
  <circle cx="14" cy="12" r="5" fill="${brand}"/>
  <text x="26" y="16" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="12" fill="${text}">${LABEL}</text>
</svg>
`;
}

await mkdir(OUT, { recursive: true });
for (const name of names) {
  await writeFile(join(OUT, `${name}.svg`), badge(THEMES.light));
  await writeFile(join(OUT, `${name}-dark.svg`), badge(THEMES.dark));
}

console.log(`badges: ${names.length} targets, ${names.length * 2} files in out/badges`);
