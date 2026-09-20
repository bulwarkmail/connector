import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { ArrowRight } from "@/components/icons";

// Also what a static host serves as 404.html. A visitor reaching this followed
// a connector link naming a target this site does not have - an old link, or a
// typo - so it should read as a broken link, not as a dead end.
export default function NotFound() {
  return (
    <SiteShell
      head={
        <>
          <h1 className="bw-h1">This link does not exist.</h1>
          <p className="bw-lead">
            Bulwark has no page at this address. Nothing was opened.
          </p>
        </>
      }
    >
      <div className="bw-tiles bw-tiles-2">
        <Link className="bw-tile" href="/">
          <span className="bw-tile-title">Go to the start</span>
          <span className="bw-tile-text">
            Add your Bulwark or see your saved servers.
          </span>
          <ArrowRight size={20} className="bw-tile-arrow" />
        </Link>
        <Link className="bw-tile" href="/create-link">
          <span className="bw-tile-title">Make a link</span>
          <span className="bw-tile-text">
            Pick a page and get a link you can share.
          </span>
          <ArrowRight size={20} className="bw-tile-arrow" />
        </Link>
      </div>
    </SiteShell>
  );
}
