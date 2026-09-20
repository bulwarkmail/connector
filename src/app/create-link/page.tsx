import type { Metadata } from "next";
import { TARGETS } from "@/lib/registry";
import { CreateLinkClient } from "@/components/create-link-client";

export const metadata: Metadata = { title: "Make a link" };

export default function CreateLinkPage() {
  return <CreateLinkClient targets={TARGETS} />;
}
