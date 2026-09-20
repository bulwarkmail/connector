#!/usr/bin/env node
// Checks the built site against the one promise this project makes: nothing
// about a visitor is stored on a server we run.
//
// Run against out/ after `npm run build`. These are the failure modes that
// would break the promise quietly, by someone adding a reasonable-looking
// thing without connecting it to the guarantee:
//
//   1. an analytics or CDN script (someone else's server, told every visit)
//   2. a cookie (this server, told every visit, in its access log)
//   3. a page that stopped being static (this server, told every target)
//
// The third is enforced by next.config.ts (`output: "export"` fails the build
// on a dynamic page), so what is left to check here is what the output says.

import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

const OUT = join(import.meta.dirname, "..", "out");

async function walk(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await walk(path)));
    else found.push(path);
  }
  return found;
}

try {
  await stat(OUT);
} catch {
  console.error("out/ is missing - run `npm run build` first.");
  process.exit(1);
}

const files = await walk(OUT);
const html = files.filter((f) => f.endsWith(".html"));
const scripts = files.filter((f) => f.endsWith(".js"));
const problems = [];

if (html.length === 0) problems.push("out/ has no HTML - the export produced nothing.");

// 1. Every *subresource* must come from this origin - something the browser
//    fetches on its own, which is what would report a visit to a third party.
//    An <a href> to bulwarkmail.org is a link someone chooses to follow, not a
//    beacon, so it is not what this is looking for. Next emits absolute paths
//    ("/_next/..."), so anything with a scheme or a protocol-relative prefix
//    is off-origin.
const SUBRESOURCE =
  /<(?:script|img|iframe|source|embed|video|audio|object|link)\b[^>]*?\b(?:src|href|data)\s*=\s*["'](?:[a-z][a-z0-9+.-]*:)?\/\/[^"']+/gi;
for (const file of html) {
  const body = await readFile(file, "utf8");
  for (const match of body.matchAll(SUBRESOURCE)) {
    problems.push(`${rel(file)} loads something off-origin: ${match[0].slice(0, 120)}`);
  }
}

// 2. No cookies, anywhere. eslint blocks `document.cookie` in source; this
//    catches it arriving through a dependency's bundled code.
for (const file of [...html, ...scripts]) {
  const body = await readFile(file, "utf8");
  if (/document\s*\.\s*cookie/.test(body)) {
    problems.push(`${rel(file)} touches document.cookie`);
  }
}

// 3. The pages that matter must actually exist as files, which is what proves
//    they were prerendered rather than left to a server.
for (const path of ["index.html", "add/index.html", "instances/index.html", "404.html"]) {
  if (!files.some((f) => rel(f) === path)) problems.push(`out/${path} is missing`);
}

function rel(file) {
  return file.slice(OUT.length + 1).split("\\").join("/");
}

if (problems.length > 0) {
  console.error("Privacy check failed:\n");
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error("\nSee README.md, \"What is stored\".");
  process.exit(1);
}

console.log(`privacy check: ${html.length} pages, ${scripts.length} scripts, all self-contained`);
