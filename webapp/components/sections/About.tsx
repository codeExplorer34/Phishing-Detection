import Image from "next/image";

import { Reveal } from "@/components/motion/Motion";
import { LAST_UPDATED, SOURCES, TEAM } from "@/lib/content";
import { longDate } from "@/lib/format";
import { REPO_URL } from "@/lib/site";

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="wrap flex flex-col gap-8 pt-32">
      <Reveal className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
        <h2 id="about-title" className="text-[clamp(30px,3.8vw,44px)] font-extrabold leading-[1.05] tracking-[-0.04em]">Who built Fishy?</h2>
        <dl className="grid grid-cols-[96px_minmax(0,1fr)] gap-x-5 gap-y-3 text-[15px] leading-normal">
          <dt className="font-bold">What</dt>
          <dd className="text-body">A phishing-link checker built for CSIT375 AI for Cybersecurity at the University of Wollongong.</dd>
          <dt className="font-bold">When</dt><dd className="text-body">November 2026</dd>
          <dt className="font-bold">Code</dt>
          <dd><a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-deep hover:underline">Open source on GitHub</a></dd>
          <dt className="font-bold">AI use</dt><dd className="text-body">We used Claude to help write code and text. Details are in our report.</dd>
          <dt className="font-bold">Updated</dt><dd className="text-body"><time dateTime={LAST_UPDATED}>{longDate(LAST_UPDATED)}</time></dd>
        </dl>
      </Reveal>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TEAM.map((m, i) => (
          <Reveal key={m.name} as="li" delay={i * 0.06} className="card flex list-none flex-col overflow-hidden">
            <div className="relative aspect-[4/5] bg-mint-soft">
              {m.photo ? (
                <Image src={m.photo} alt={`Photo of ${m.name}`} fill sizes="(min-width: 1024px) 260px, (min-width: 640px) 45vw, 90vw"
                  className="object-cover" />
              ) : (
                <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-4xl font-extrabold text-teal-deep/60">
                  {m.initials}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5 p-5">
              <b className="text-base font-bold">{m.name}</b>
              <span className="text-[13px] font-semibold text-teal-deep">{m.role}</span>
              <p className="text-sm leading-normal text-muted">{m.contribution}</p>
            </div>
          </Reveal>
        ))}
      </ul>

      <Reveal className="mt-16 flex flex-wrap gap-12 border-t border-line pt-7">
        <h2 id="sources" className="flex-1 basis-[200px] text-xl font-extrabold tracking-[-0.02em]">Sources</h2>
        <ol className="flex flex-[3] basis-[560px] list-decimal flex-col gap-2.5 pl-5 text-sm leading-relaxed text-body">
          {SOURCES.map((s) => (
            <li key={s.href}>
              {s.text}{s.emphasis && <> <i>{s.emphasis}</i></>}{s.tail} {" "}
              <a href={s.href} target="_blank" rel="noopener noreferrer" className="break-all font-semibold text-teal-deep hover:underline">{s.linkLabel}</a>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  );
}
