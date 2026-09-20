import type { Metadata } from "next";
import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SiteShell } from "@/components/site-shell";

// next/font downloads these at build time and serves them from this origin.
// Nothing on these pages loads from anywhere else, and scripts/check-privacy.mjs
// fails the build if that changes.
const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400"],
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
    "Opens a link on your own Bulwark instance. Your instance addresses stay in this browser and are never sent anywhere.",
  applicationName: "Bulwark Connector",
  icons: { icon: "/branding/favicon/Bulwark Favicon.svg" },
  // A redirector has nothing to index, and a search result for someone else's
  // instance link would only confuse.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${hanken.variable} ${jetbrainsMono.variable}`}>
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
