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
          <h1 className="bw-h1">No such link.</h1>
          <p className="bw-lead">
            This address does not name anything Bulwark can open. Nothing was opened and nothing
            was sent anywhere.
          </p>
        </>
      }
    >
      <div className="bw-tiles bw-tiles-2">
        <Link className="bw-tile" href="/">
          <span className="bw-tile-title">Start over</span>
          <span className="bw-tile-text">
            Add your Bulwark, or see which instances this browser already knows.
          </span>
          <ArrowRight size={20} className="bw-tile-arrow" />
        </Link>
        <Link className="bw-tile" href="/create-link">
          <span className="bw-tile-title">Make a working link</span>
          <span className="bw-tile-text">
            Pick a destination and get the link, the markdown and the docs shorthand.
          </span>
          <ArrowRight size={20} className="bw-tile-arrow" />
        </Link>
      </div>
    </SiteShell>
  );
}
