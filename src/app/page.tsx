import { SiteShell } from "@/components/site-shell";
import { LandingClient } from "@/components/landing-client";
import { ArrowRight, Link as LinkIcon, Server, Shield } from "@/components/icons";

const FACTS = [
  {
    icon: LinkIcon,
    title: "One link for everyone",
    text: "The same link works no matter where your Bulwark runs.",
  },
  {
    icon: Server,
    title: "More than one Bulwark",
    text: "Add them all. You pick which one to open.",
  },
  {
    icon: Shield,
    title: "Private",
    text: "Your addresses stay in this browser. We never see them.",
  },
];

export default function HomePage() {
  return (
    <SiteShell
      head={
        <>
          <h1 className="bw-h1">Links that open your Bulwark.</h1>
          <p className="bw-lead">
            Guides and release notes cannot know where your Bulwark is. Tell this site once, and
            every Bulwark link opens on your own server.
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
        <h2 className="bw-h2">What we store</h2>
        <div className="bw-body mt-4 grid gap-4">
          <p>
            Only the addresses you add, saved in this browser. No account, no cookies, no tracking,
            no logs. Every page here is a plain file, and the redirect happens in your browser. Our
            server never sees where a link goes.
          </p>
          <p>
            When you add a server, your browser checks it directly. That request does not go
            through us. You can remove your servers at any time, and nothing is left anywhere else.
          </p>
        </div>
        <p className="bw-note bw-note-brand bw-body mt-6">
          <b>Note.</b> The code is open source. The build fails if any page loads something from
          another site or uses a cookie, and the web server keeps no access log.
        </p>
        <p className="mt-6">
          {/* Standalone link: weight 500, underlined, with a 16px arrow. */}
          <a className="bw-tlink" href="https://github.com/bulwarkmail/connector">
            View the source
            <ArrowRight size={16} />
          </a>
        </p>
      </section>
    </SiteShell>
  );
}
