import Link from "next/link";
import { BulwarkMark } from "./bulwark-mark";
import { MadeInEuBadge } from "./eu-badge";
import { SiteNav } from "./site-nav";

/**
 * The chrome, matching bulwarkmail.org and extensions.bulwarkmail.org.
 *
 * The nav sits on the field, which is this site's one flat raspberry area. A
 * page passes its heading through `head` so the heading shares that field
 * rather than opening a second coloured band under it.
 */

const COLUMNS: { h: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    h: "This site",
    links: [
      { label: "Your servers", href: "/instances" },
      { label: "Add your Bulwark", href: "/add" },
      { label: "Make a link", href: "/create-link" },
    ],
  },
  {
    h: "Bulwark",
    links: [
      { label: "Website", href: "https://bulwarkmail.org", external: true },
      { label: "Documentation", href: "https://bulwarkmail.org/docs", external: true },
      { label: "Extensions", href: "https://extensions.bulwarkmail.org", external: true },
      { label: "Which edition?", href: "https://bulwarkmail.org/choose", external: true },
    ],
  },
  {
    h: "Project",
    links: [
      { label: "GitHub", href: "https://github.com/bulwarkmail/connector", external: true },
      { label: "Discord", href: "https://discord.com/invite/tYCujymGrT", external: true },
      { label: "Stalwart", href: "https://stalw.art", external: true },
    ],
  },
];

export function SiteShell({
  head,
  children,
}: {
  head?: React.ReactNode;
  children: React.ReactNode;
}) {
  const year = new Date().getFullYear();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bw-field">
        <SiteNav />
        {head ? (
          <div className="bw-w">
            <div className="bw-head">{head}</div>
          </div>
        ) : null}
      </header>

      <main className="bw-w bw-main flex-1">{children}</main>

      <footer className="bw-foot">
        <div className="bw-w">
          <div className="bw-foot-in">
            <div className="bw-foot-brand">
              <Link href="/" className="bw-brandmark">
                <BulwarkMark size={24} />
                <span>
                  Bulwark <span className="bw-wordmark-sub">Connector</span>
                </span>
              </Link>
              <p>
                Opens Bulwark links on your own server. Your server addresses stay in this browser.
                Open source under AGPL-3.0.
              </p>
            </div>

            {COLUMNS.map((column) => (
              <div key={column.h}>
                <h3>{column.h}</h3>
                <ul>
                  {column.links.map((link) => (
                    <li key={link.label}>
                      {link.external ? (
                        <a href={link.href} target="_blank" rel="noopener noreferrer">
                          {link.label}
                        </a>
                      ) : (
                        <Link href={link.href}>{link.label}</Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="bw-foot-legal">
            <span>© {year} Bulwark Mail</span>
            <span>AGPL-3.0</span>
            <a href="https://bulwarkmail.org" target="_blank" rel="noopener noreferrer">
              bulwarkmail.org
            </a>
            <MadeInEuBadge />
          </div>
        </div>
      </footer>
    </div>
  );
}
