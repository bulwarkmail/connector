import type { Metadata } from "next";
import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// One family for everything and a mono for code, as the design system's font
// plan specifies. next/font downloads both at build time and serves them from
// this origin; nothing on these pages loads from anywhere else, and
// scripts/check-privacy.mjs fails the build if that changes.
const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const SITE_URL = "https://connector.bulwarkmail.org";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Bulwark Connector",
    template: "%s - Bulwark Connector",
  },
  description:
    "Opens Bulwark links on your own server. Your server addresses stay in this browser.",
  applicationName: "Bulwark Connector",
  icons: { icon: "/branding/favicon/Bulwark Favicon.svg" },
  // A redirector has nothing to index, and a search result for someone else's
  // instance link would only confuse.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

// The system themes with `.dark` on <html>, set before first paint. Here it
// follows the operating system and is never stored: this site remembers one
// thing about a visitor (their instance list), and a theme preference is not
// worth becoming the second. Inline because it has to run before the first
// paint; `try` because a blocked matchMedia must not stop the page.
const THEME_SCRIPT = `try{if(matchMedia("(prefers-color-scheme: dark)").matches)document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${hanken.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
