import type { Metadata } from "next";
import { TARGETS } from "@/lib/registry";
import { CreateLinkClient } from "@/components/create-link-client";

export const metadata: Metadata = { title: "Make a link" };

export default function CreateLinkPage() {
  return (
    <>
      <header className="mb-8">
        <h1 className="text-[34px]">Make a link</h1>
        <p className="mt-2 max-w-[65ch] text-muted">
          For documentation, release notes, READMEs and support replies. The link opens on
          whichever Bulwark the reader has told this site about - you never need to know where
          that is.
        </p>
      </header>
      <CreateLinkClient targets={TARGETS} />
    </>
  );
}
