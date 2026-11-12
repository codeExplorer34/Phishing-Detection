import type { Metadata } from "next";
import Link from "next/link";

import { Logo, Mascot } from "@/components/ui/Brand";
import { Sky } from "@/components/visual/Sky";
import { REPO_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Page not found · Fishy",
  robots: { index: false, follow: true },
};

const button = "press inline-flex h-12 items-center rounded-full px-6 text-base font-semibold";

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <Sky variant="hero" className="[mask-image:linear-gradient(180deg,#000_70%,transparent)]" />
      <header className="wrap relative flex h-16 items-center justify-between">
        <Link href="/" aria-label="Fishy home"><Logo /></Link>
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="text-base font-medium hover:text-teal-deep">GitHub</a>
      </header>
      <main id="main" className="wrap relative flex flex-1 flex-col items-center justify-center gap-6 pb-24 text-center">
        <Mascot width={128} className="bob" />
        <p className="font-mono text-sm text-[#134e57]">Error 404</p>
        <h1 className="max-w-[680px] text-5xl leading-none font-extrabold tracking-[-0.045em] sm:text-6xl">This page isn’t here</h1>
        <p className="max-w-[520px] text-lg text-[#1f3340]">
          The address may be mistyped, or the page was moved. If someone sent you this link and asked you to log in,
          treat that as a warning sign.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/#scan" className={`${button} bg-ink text-white hover:bg-ink/85`}>Check a link</Link>
          <Link href="/" className={`${button} bg-white text-ink shadow-[0_0_0_1px_rgba(11,18,32,0.1)] hover:bg-soft`}>Go to the home page</Link>
        </div>
      </main>
    </div>
  );
}
