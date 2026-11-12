"use client";

import type { Cue, MessageResult, ScanResult } from "@/lib/schemas";
import { VERDICT_STYLES } from "@/lib/verdict";

import { Chip, Note } from "./ResultParts";

/** Split text into plain and highlighted pieces. Rendered as text nodes, never as HTML. */
function segments(text: string, cues: Cue[]): { text: string; cue: boolean }[] {
  const out: { text: string; cue: boolean }[] = [];
  let at = 0;
  for (const cue of cues) {
    if (cue.start < at || cue.end > text.length) continue;
    if (cue.start > at) out.push({ text: text.slice(at, cue.start), cue: false });
    out.push({ text: text.slice(cue.start, cue.end), cue: true });
    at = cue.end;
  }
  if (at < text.length) out.push({ text: text.slice(at), cue: false });
  return out;
}

function reasonFor(link: ScanResult): string {
  if (link.trusted) return "A well-known site on Fishy’s trusted list";
  if (link.flags.length === 0) return "No warning signs in the address";
  return link.flags.slice(0, 2).map((f) => f.label.replace(/\.$/, "")).join(" · ");
}

function pill(link: ScanResult): { text: string; className: string } {
  if (link.trusted) return { text: "Safe · trusted", className: "bg-safe-bg text-safe" };
  const style = VERDICT_STYLES[link.verdict];
  const suffix = link.verdict === "dangerous" ? "Blocked" : style.label;
  return { text: `${link.risk} · ${suffix}`, className: style.chip };
}

export function MessageResultView({ result, text }: { result: MessageResult; text: string }) {
  const dangerous = result.links.filter((l) => l.verdict === "dangerous").length;
  const total = result.links.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <span className={`text-5xl font-extrabold leading-none tracking-[-0.05em] ${dangerous ? "text-danger" : "text-safe"}`}>
          {dangerous}<span className="text-[#9CA3AF]">/{total}</span>
        </span>
        <div className="flex flex-col">
          <h2 className="text-lg font-bold tracking-[-0.02em]">
            {total === 0 ? "No links found in this message" : dangerous === 1 ? "link is dangerous" : "links are dangerous"}
          </h2>
          <span className="text-sm text-muted">
            {total === 0 ? "Fishy only scores links. The warning signs in the text are below."
              : dangerous ? "They were blocked and added to your blocklist." : "None of the links looked dangerous."}
          </span>
        </div>
      </div>

      {total > 0 && (
        <ul className="divide-y divide-hair rounded-2xl bg-white ring-1 ring-black/[0.08]">
          {result.links.map((link) => {
            const p = pill(link);
            return (
              <li key={link.url} className="flex items-center gap-4 px-4 py-4">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate font-mono text-sm">{link.input}</span>
                  <span className="text-xs text-muted">{reasonFor(link)}</span>
                </div>
                <span className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${p.className}`}>{p.text}</span>
              </li>
            );
          })}
        </ul>
      )}
      {result.truncated && <p className="text-xs text-muted">Only the first 10 links were checked.</p>}

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-bold">Warning signs in the text</h3>
          <span className="rounded-full bg-chip px-3 py-1 text-xs font-semibold text-muted">Rule-based cues, not machine learning</span>
        </div>
        {result.cue_summary.length + result.brands.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {result.cue_summary.map((c) => (
              <Chip key={c.category} className="bg-warn-bg font-semibold text-[#78350F]">{c.label} · {c.count}</Chip>
            ))}
            {result.brands.map((b) => <Chip key={b} className="bg-chip font-semibold text-ink">Mentions {b}</Chip>)}
          </div>
        ) : (
          <p className="text-sm text-muted">No common pressure phrases found.</p>
        )}
        <div className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-soft p-4 text-base leading-7 text-body">
          {segments(text, result.cues).map((s, i) => s.cue
            ? <mark key={i} className="rounded bg-warn-bg px-0.5 text-[#78350F] shadow-[inset_0_-2px_0_#F59E0B]">{s.text}</mark>
            : <span key={i}>{s.text}</span>)}
        </div>
        {result.cue_summary.length > 0 && (
          <Note>Real companies rarely ask you to confirm a password by email, or threaten to close your account within hours.</Note>
        )}
      </div>
    </div>
  );
}
