import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TARGETS, getTarget } from "@/lib/registry";
import { RedirectClient } from "@/components/redirect-client";

// One page per known target. A static export has no server to resolve an
// unknown one, which is the right shape anyway: the registry is closed, so
// an unknown target is a broken link and 404.html says so.
export function generateStaticParams() {
  return TARGETS.map((target) => ({ target: target.name }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ target: string }>;
}): Promise<Metadata> {
  const { target } = await params;
  const entry = getTarget(target);
  return { title: entry ? `Open ${entry.label}` : "Open" };
}

export default async function TargetPage({ params }: { params: Promise<{ target: string }> }) {
  const { target } = await params;
  const entry = getTarget(target);
  if (!entry) notFound();

  // Only the target name crosses into the client component. The parameters
  // are read from window.location there, so they are never part of a request
  // to this origin - see README.md, "What is stored".
  return <RedirectClient target={entry} />;
}
