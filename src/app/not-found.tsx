import Link from "next/link";

// Also what a static host serves as 404.html. A visitor reaching this
// followed a connector link naming a target this site does not have - an old
// link, or a typo - so it should read as a broken link, not as a dead end.
export default function NotFound() {
  return (
    <div className="bw-tile max-w-[620px]">
      <h1 className="text-[24px]">No such link</h1>
      <p className="mt-3 text-[15px]">
        This address does not name anything Bulwark can open. Nothing was opened and nothing was
        sent anywhere.
      </p>
      <p className="mt-5 flex gap-4 text-[15px]">
        <Link className="bw-button" href="/">
          Start over
        </Link>
        <Link className="bw-button" href="/create-link">
          Make a working link
        </Link>
      </p>
    </div>
  );
}
