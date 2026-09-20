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

// Theme before first paint, so there is no flash: the stored choice if there
// is one, otherwise whatever the operating system asks for. Inline because it
// has to run before the first paint, and wrapped in try because blocked
// storage must not stop the page. The toggle is in the nav, as on the other
// Bulwark sites; the choice stays in this browser like everything else here.
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";if(t==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

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
