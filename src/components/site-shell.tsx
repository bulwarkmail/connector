import Link from "next/link";

/** The Bulwark mark, inline so a page renders complete in one request. */
function Mark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a fixed-size SVG; the optimizer is off in a static export anyway
    <img
      src="/branding/logo/Bulwark Logo Color.svg"
      alt=""
      width={22}
      height={22}
      className={className}
    />
  );
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-[880px] items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-ink no-underline hover:no-underline">
            <Mark />
            <span className="text-[15px]">
              Bulwark <span className="text-muted">Connector</span>
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-[14px]">
            <Link href="/instances">Instances</Link>
            <Link href="/create-link">Make a link</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[880px] flex-1 px-4 py-10">{children}</main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-[880px] flex-wrap items-center justify-between gap-3 px-4 py-6 text-[13.5px] text-muted">
          <p>
            Your instance addresses stay in this browser. Nothing about you is stored on a
            server.
          </p>
          <p className="flex gap-4">
            <a href="https://bulwarkmail.org">bulwarkmail.org</a>
            <a href="https://github.com/bulwarkmail/connector">Source</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
