"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { BulwarkMark } from "./bulwark-mark";
import { ThemeToggle } from "./theme-toggle";
import { ArrowRight, ArrowUpRight, Close, Menu } from "./icons";

/**
 * The same header as bulwarkmail.org and extensions.bulwarkmail.org: on the
 * field, 64px, not sticky, no scroll state. Mark and wordmark, then the links
 * beside them, then the right cluster of 36px controls ending in one small
 * primary button. Below 900px the links and the button move into the menu.
 */

const LINKS: { label: string; href: string; external?: boolean }[] = [
  { label: "Your servers", href: "/instances" },
  { label: "Make a link", href: "/create-link" },
  { label: "bulwarkmail.org", href: "https://bulwarkmail.org", external: true },
];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the phone menu when the route changes.
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  const current = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined;

  const renderLink = (link: (typeof LINKS)[number], onClick?: () => void) =>
    link.external ? (
      <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" onClick={onClick}>
        {link.label}
        <ArrowUpRight size={16} />
      </a>
    ) : (
      <Link key={link.href} href={link.href} aria-current={current(link.href)} onClick={onClick}>
        {link.label}
      </Link>
    );

  return (
    <div className="bw-w">
      <div className="bw-nav-in">
        <Link href="/" className="bw-brandmark">
          {/* currentColor, so one asset is white on the field. */}
          <BulwarkMark size={24} color="currentColor" />
          <span>
            Bulwark <span className="bw-wordmark-sub">Connector</span>
          </span>
        </Link>

        <nav className="bw-nav-links" aria-label="Main">
          {LINKS.map((l) => renderLink(l))}
        </nav>

        <div className="bw-nav-r">
          <ThemeToggle />
          <Link href="/add" className="bw-btn bw-btn-sm">
            Add your Bulwark
            <ArrowRight size={16} />
          </Link>
          <button
            type="button"
            className="bw-iconbtn bw-nav-phone"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close the menu" : "Open the menu"}
            aria-expanded={open}
          >
            {open ? <Close size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open ? (
        <nav className="bw-nav-menu bw-nav-phone" aria-label="Main">
          {LINKS.map((l) => renderLink(l, () => setOpen(false)))}
          <Link href="/add" className="bw-btn" onClick={() => setOpen(false)}>
            Add your Bulwark
            <ArrowRight size={16} />
          </Link>
        </nav>
      ) : null}
    </div>
  );
}
