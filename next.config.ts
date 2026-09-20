import type { NextConfig } from "next";

// A static export, always. The connector must not have a server that sees a
// link's target or its parameters - see the privacy note in README.md and
// scripts/check-privacy.mjs, which fails the build if a page stops being
// static or starts loading something off-origin.
const nextConfig: NextConfig = {
  output: "export",
  // Directory-style pages (out/settings/index.html) so a plain file server
  // can serve them. nginx resolves them without a redirect, which keeps the
  // query string intact on the first hit (deploy/nginx.conf.example).
  trailingSlash: true,
  reactCompiler: true,
  images: { unoptimized: true },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
