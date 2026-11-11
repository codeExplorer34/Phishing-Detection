"use client";

import { useProtection } from "@/components/protection/ProtectionProvider";
import { Ban, External, Undo } from "@/components/ui/icons";
import type { ScanResult } from "@/lib/schemas";
import { safeHref } from "@/lib/url";
import { headlineFor, percent, threatLabel, trustedOverrideNote, VERDICT_STYLES } from "@/lib/verdict";

import { Chip, FlagList, ModelVotes, Note, RiskRing, TrustedRing, UrlLine } from "./ResultParts";

const btn = "inline-flex h-10 items-center gap-1.5 rounded-[10px] px-3.5 text-[13px] font-semibold transition";
const btnLight = `${btn} bg-white text-ink shadow-[0_0_0_1px_rgba(11,18,32,0.1),0_1px_2px_rgba(11,18,32,0.06)] hover:bg-soft`;

function Actions({ result }: { result: ScanResult }) {
  const { state, unblock, block, confirmOpen } = useProtection();
  const blocked = state.blocklist.some((e) => e.host === result.host);
  const href = safeHref(result.url);
  const openLink = href && (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow" className={`${btn} bg-ink text-white hover:bg-ink/85`}>
      Open link <External size={14} />
    </a>
  );

  if (blocked) {
    return (
      <div className="flex flex-wrap items-center gap-3.5 rounded-[14px] border border-danger-line bg-danger-soft px-4 py-3.5">
        <Ban size={22} className="shrink-0 text-danger" />
        <div className="min-w-[200px] flex-1">
          <div className="text-sm font-bold">{result.verdict === "dangerous" ? "Added to your blocklist" : "On your blocklist"}</div>
          <div className="text-[13px] text-muted">If this link shows up again, Fishy warns you straight away.</div>
        </div>
        <button type="button" onClick={() => unblock(result.host)} className={btnLight}><Undo size={14} /> Undo</button>
        <button type="button" className={`${btn} text-danger underline underline-offset-2 hover:bg-danger-bg`}
          onClick={() => confirmOpen({ url: result.url, host: result.host, risk: result.risk, reason: result.flags[0]?.detail ?? null })}>
          Open anyway
        </button>
      </div>
    );
  }
  if (result.verdict === "safe") {
    return (
      <div className="flex flex-wrap items-center gap-3">
        {openLink}
        <span className="text-[13px] text-muted">Still check the address bar before typing a password.</span>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[14px] border border-warn-line bg-warn-soft px-4 py-3.5">
      <span className="min-w-[200px] flex-1 text-sm text-[#78350F]">
        {result.verdict === "dangerous" ? "Removed from your blocklist." : "Not blocked, but don’t enter passwords or card details here."}
      </span>
      <button type="button" onClick={() => block(result, "link")} className={btnLight}><Ban size={14} /> Block it</button>
      {openLink}
    </div>
  );
}

function Explanation({ result }: { result: ScanResult }) {
  const { a, b } = result.models;
  const override = trustedOverrideNote(result);
  if (override) {
    return (
      <Note>
        {override}
        {result.models_disagree && (
          <> <b className="font-bold text-ink">The models disagree here.</b> Model B is wary of bare homepages because of how its training data was labelled.</>
        )}
      </Note>
    );
  }
  if (result.models_disagree) {
    return (
      <Note tone="warn">
        <b className="font-bold">The two models disagree</b> ({percent(a)} and {percent(b)}). Fishy uses their average, so treat this result with extra care.
      </Note>
    );
  }
  return null;
}

interface LinkResultProps {
  result: ScanResult;
  example?: boolean;
}

export function LinkResult({ result, example = false }: LinkResultProps) {
  const style = VERDICT_STYLES[result.verdict];
  const threat = threatLabel(result.threat_type);
  const flagTitle = result.verdict === "safe" ? "Small things to notice" : "Why Fishy flagged it";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-6">
        {result.trusted ? <TrustedRing /> : <RiskRing risk={result.risk} color={style.ring} countUp={!example} />}
        <div className="flex min-w-0 flex-1 basis-[300px] flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Chip className={result.trusted ? "bg-safe-bg text-safe" : style.chip}>{result.trusted ? "Safe · trusted" : style.label}</Chip>
            {threat && <Chip className="bg-chip font-semibold text-ink">{threat}</Chip>}
            {example && <Chip className="bg-mint font-semibold text-teal-deep">Example</Chip>}
          </div>
          <h2 className="text-[26px] font-extrabold tracking-[-0.03em] sm:text-[28px]">{headlineFor(result)}</h2>
          <UrlLine result={result} />
        </div>
      </div>
      <ModelVotes result={result} />
      <Explanation result={result} />
      <FlagList flags={result.flags} title={flagTitle} />
      {!result.trusted && result.flags.length === 0 && (
        <p className="text-sm text-muted">No warning signs in the address itself.</p>
      )}
      {example
        ? <Note>This is a real result for a made-up phishing link. Check a link above to see your own.</Note>
        : <Actions result={result} />}
    </div>
  );
}
