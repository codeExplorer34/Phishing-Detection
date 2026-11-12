import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";

import { IntroSplash } from "@/components/loader/IntroSplash";
import { LAST_UPDATED, TEAM } from "@/lib/content";
import { INTRO_SCRIPT } from "@/lib/headScripts";
import { REPO_URL, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

import "./globals.css";
import "./loader.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Fishy: is this link phishing?",
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: { type: "website", url: "/", siteName: SITE_NAME, title: "Fishy: is this link phishing?", description: SITE_DESCRIPTION },
  twitter: { card: "summary_large_image", title: "Fishy: is this link phishing?", description: SITE_DESCRIPTION },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#2a9fb3", width: "device-width", initialScale: 1 };

// Plain facts for search engines and AI assistants. Nothing here is a claim we can't back up.
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: "SecurityApplication",
  operatingSystem: "Any (web browser)",
  isAccessibleForFree: true,
  dateModified: LAST_UPDATED,
  codeRepository: REPO_URL,
  creator: TEAM.filter((m) => m.photo).map((m) => ({ "@type": "Person", name: m.name })),
  educationalUse: "University coursework: CSIT375 AI for Cybersecurity",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // data-intro is set by INTRO_SCRIPT before React loads, so the attribute is expected to differ.
    <html lang="en" className={`${jakarta.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      </head>
      <body id="top" className="font-sans">
        <IntroSplash />
        <noscript>
          <style>{"[data-reveal]{opacity:1!important;transform:none!important}"}</style>
        </noscript>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
        {children}
      </body>
    </html>
  );
}
