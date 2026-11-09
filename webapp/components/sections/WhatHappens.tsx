import { Reveal } from "@/components/motion/Motion";
import { EXAMPLE_RESULT } from "@/lib/content";
import { toHostsFile } from "@/lib/exportBlocklist";

const STEPS = [
  { title: "1. You get an alert right away.", body: "A notice on the page, plus a desktop notification if you turn them on." },
  { title: "2. It goes on your blocklist.", body: "If you check it again later, Fishy warns you without asking the models." },
  { title: "3. Opening it needs a second click.", body: "A warning explains the risk before you can continue." },
  { title: "4. You can take the list with you.", body: "Export it as a hosts file to block the sites on your whole computer." },
];

// A real export of example entries, produced by the same function the Protection Center uses.
const SAMPLE_EXPORT = toHostsFile(
  ["paypa1-secure-update.com", "free-gift-card.xyz", "192.168.4.2"].map((host, i) => ({
    id: String(i), url: `http://${host}/`, host, risk: 90, verdict: "dangerous" as const, threatType: "phishing",
    source: "link" as const, at: 0,
  })),
  new Date("2026-11-09T00:00:00Z"),
).trim();

export function WhatHappens() {
  return (
    <section aria-labelledby="next-title" className="wrap pt-32">
      <Reveal className="relative overflow-hidden rounded-[28px] bg-[#0E1117] p-7 text-white sm:p-14">
        <div className="relative grid grid-cols-1 items-start gap-12 lg:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-3.5">
            <h2 id="next-title" className="text-[clamp(30px,3.6vw,42px)] font-extrabold leading-[1.08] tracking-[-0.04em] [text-wrap:balance]">
              What happens when Fishy finds a dangerous link?
            </h2>
            <ol className="mt-4 flex flex-col">
              {STEPS.map((s, i) => (
                <li key={s.title} className={`border-t border-white/[0.12] py-[18px] ${i === STEPS.length - 1 ? "border-b" : ""}`}>
                  <b className="text-base font-bold">{s.title}</b>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#A3ACBA]">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex min-w-0 flex-col gap-3.5">
            <figure className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#161A22]">
              <figcaption className="flex h-[38px] items-center justify-between border-b border-white/[0.08] px-3.5 font-mono text-xs text-[#A3ACBA]">
                <span>fishy-blocklist.hosts</span><span>Example export</span>
              </figcaption>
              <pre className="whitespace-pre-wrap break-words p-[18px] font-mono text-[13px] leading-[1.8] text-[#D1D5DB]">
                {SAMPLE_EXPORT.split("\n").map((line, i) => (
                  <span key={i} className={line.startsWith("#") ? "text-[#8B95A5]" : undefined}>{line}{"\n"}</span>
                ))}
              </pre>
            </figure>
            <div className="flex flex-col gap-2.5 rounded-2xl border border-white/[0.08] bg-[#161A22] p-[18px]">
              <span className="text-xs text-[#A3ACBA]">Warning before opening</span>
              <b className="text-base font-bold">This link is blocked.</b>
              <span className="text-sm leading-normal text-[#A3ACBA]">
                Risk {EXAMPLE_RESULT.risk} out of 100. {EXAMPLE_RESULT.flags[0]?.detail}
              </span>
              <div className="flex flex-wrap gap-2.5" aria-hidden="true">
                <span className="inline-flex h-9 items-center rounded-full bg-white px-3.5 text-[13px] font-bold text-ink">Keep me safe</span>
                <span className="inline-flex h-9 items-center px-2.5 text-[13px] text-[#FDA4AF] underline">Open anyway</span>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
