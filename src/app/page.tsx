import Link from "next/link";
import { LandingClient } from "@/components/landing-client";

export default function HomePage() {
  return (
    <>
      <header className="mb-8">
        <h1 className="text-[40px]">One link, your Bulwark</h1>
        <p className="mt-3 max-w-[60ch] text-[19px] text-muted">
          Documentation, the extension directory and release notes can only link to{" "}
          <em>a</em> Bulwark - they have no idea where yours is. This page does: it keeps your
          instance addresses in this browser and sends you on to the right one.
        </p>
      </header>

      <LandingClient />

      <section className="mt-12 border-t pt-8">
        <h2 className="text-[24px]">What is stored</h2>
        <p className="mt-3 max-w-[70ch]">
          The addresses you add live in this browser&apos;s local storage, on this site&apos;s
          origin. That is the whole list. There is no account, no database, no cookie, no
          analytics script, and this server keeps no log of which links are opened - it cannot,
          because every page here is a static file and your link&apos;s destination is worked out
          after the page has loaded, in your browser.
        </p>
        <p className="mt-3 max-w-[70ch]">
          The check that runs when you add an instance is a request from your browser straight to
          your own server, with no credentials attached. It never touches us. You can{" "}
          <Link href="/instances">remove everything</Link> at any time; nothing survives it
          anywhere else.
        </p>
        <p className="mt-3 max-w-[70ch] text-muted">
          The code is{" "}
          <a href="https://github.com/bulwarkmail/connector">on GitHub</a>, and this is all of it.
        </p>
      </section>
    </>
  );
}
