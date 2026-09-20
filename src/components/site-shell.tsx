import Link from "next/link";
import { BulwarkMark } from "./bulwark-mark";
import { MadeInEuBadge } from "./eu-badge";

/**
 * Nav and footer, per the design system's component rules.
 *
 * The nav sits on the field, which is this site's one flat raspberry area.
 * A page passes its heading through `head`, so the heading shares that field
 * with the nav instead of opening a second coloured band under it.
 */
export function SiteShell({
  head,
  children,
}: {
  head?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="bw-field">
        <div className="bw-w">
          <nav className="bw-nav-in">
            <Link href="/" className="bw-brandmark">
              {/* currentColor, so the mark is white on the field. */}
              <BulwarkMark size={26} color="currentColor" />
              Bulwark <span>Connector</span>
            </Link>
            <div className="bw-nav-links">
              <Link href="/instances">Your servers</Link>
              <Link href="/create-link">Make a link</Link>
            </div>
          </nav>
        </div>
        {head ? (
          <div className="bw-w">
            <header className="bw-head">{head}</header>
          </div>
        ) : null}
      </div>

      <main className="bw-w bw-main flex-1">{children}</main>

      <footer className="bw-foot">
        <div className="bw-w">
          <div className="bw-foot-in">
            <div className="bw-foot-brand">
              <Link href="/" className="bw-brandmark">
                <BulwarkMark size={26} />
                Bulwark <span>Connector</span>
              </Link>
              <p>
                Opens Bulwark links on your own server. Your server addresses stay in this
                browser.
              </p>
            </div>
            <div>
              <h3>This site</h3>
              <ul>
                <li>
                  <Link href="/instances">Your servers</Link>
                </li>
                <li>
                  <Link href="/add">Add your Bulwark</Link>
                </li>
                <li>
                  <Link href="/create-link">Make a link</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3>Bulwark</h3>
              <ul>
                <li>
                  <a href="https://bulwarkmail.org">Website</a>
                </li>
                <li>
                  <a href="https://bulwarkmail.org/docs">Documentation</a>
                </li>
                <li>
                  <a href="https://github.com/bulwarkmail/connector">Source</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="bw-foot-legal">
            <span>Open source under AGPL-3.0.</span>
            <MadeInEuBadge />
          </div>
        </div>
      </footer>
    </div>
  );
}
