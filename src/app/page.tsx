import { SiteShell } from "@/components/site-shell";
import { LandingClient } from "@/components/landing-client";
import { ArrowRight, Link as LinkIcon, Server, Shield } from "@/components/icons";

const FACTS = [
  {
    icon: LinkIcon,
    title: "One link, every instance",
    text: "A link names a destination, not a host.",
  },
  {
    icon: Server,
    title: "Several instances",
    text: "Work, personal, a staging box. It asks which one, once.",
  },
  {
    icon: Shield,
    title: "Nothing on a server",
    text: "Your addresses live in this browser and nowhere else.",
  },
];

export default function HomePage() {
  return (
    <SiteShell
      head={
        <>
          <h1 className="bw-h1">One link, your Bulwark.</h1>
          <p className="bw-lead">
            Documentation, the extension directory and release notes can only link to a Bulwark -
            they have no idea where yours is. This page does: it keeps your instance addresses in
            this browser and sends you on to the right one.
          </p>
        </>
      }
    >
      <section className="grid gap-8 md:grid-cols-3">
        {FACTS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="grid content-start gap-2">
            <Icon size={24} className="text-[var(--bw-brand)]" />
            <h2 className="bw-h3">{title}</h2>
            <p className="bw-tile-text">{text}</p>
          </div>
        ))}
      </section>

      <LandingClient />

      <section className="bw-sec-tight">
        <h2 className="bw-h2">What is stored</h2>
        <div className="bw-body mt-4 grid gap-4">
          <p>
            The addresses you add live in this browser&apos;s local storage, on this site&apos;s
            origin. That is the whole list. There is no account, no database, no cookie, no
            analytics script, and this server keeps no log of which links are opened - it cannot,
            because every page here is a static file and your link&apos;s destination is worked out
            after the page has loaded, in your browser.
          </p>
          <p>
            The check that runs when you add an instance is a request from your browser straight to
            your own server, with no credentials attached. It never touches us. You can remove
            everything at any time, and nothing survives it anywhere else.
          </p>
        </div>
        <p className="bw-note bw-note-brand bw-body mt-6">
          <b>Note.</b> The code is on GitHub, and this is all of it. Three build rules keep the
          promise above honest rather than stated: the build fails if a page loads anything
          off-origin or touches a cookie, and the web server is configured not to log a request
          line.
        </p>
        <p className="mt-6">
          {/* Standalone link: weight 500, underlined, with a 16px arrow. */}
          <a className="bw-tlink" href="https://github.com/bulwarkmail/connector">
            Read the source
            <ArrowRight size={16} />
          </a>
        </p>
      </section>
    </SiteShell>
  );
}
