"use client";

import { animate, motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";

import { FillBar } from "@/components/motion/Motion";
import { ShieldCheck } from "@/components/ui/icons";
import type { Flag, ScanResult } from "@/lib/schemas";
import { barColor, percent, scoredAsNote, VERDICT_STYLES } from "@/lib/verdict";

const CIRCUMFERENCE = 2 * Math.PI * 56;

interface RiskRingProps {
  risk: number;
  color: string;
  size?: number;
  countUp?: boolean;   // false for content rendered on the server (the example), so its HTML shows the real score
}

/** Risk score ring. New results count up from 0 unless the visitor prefers reduced motion. */
export function RiskRing({ risk, color, size = 128, countUp = true }: RiskRingProps) {
  const reduce = useReducedMotion();
  // Start from the final value so server HTML and the first browser render always agree.
  const [shown, setShown] = useState(risk);
  const animateIn = countUp && !reduce;

  useEffect(() => {
    if (!animateIn) { setShown(risk); return; }
    const controls = animate(0, risk, { duration: 0.9, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setShown(Math.round(v)) });
    return () => controls.stop();
  }, [risk, animateIn]);

  const length = (risk / 100) * CIRCUMFERENCE;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 132 132" role="img" aria-label={`Risk score ${risk} out of 100`}>
        <circle cx="66" cy="66" r="56" fill="none" stroke="#F1F2F5" strokeWidth="11" />
        <motion.circle cx="66" cy="66" r="56" fill="none" stroke={color} strokeWidth="11" strokeLinecap="round"
          transform="rotate(-90 66 66)"
          initial={countUp ? { strokeDasharray: `0 ${CIRCUMFERENCE}` } : false}
          animate={{ strokeDasharray: `${length} ${CIRCUMFERENCE}` }}
          transition={{ duration: animateIn ? 0.9 : 0, ease: [0.22, 1, 0.36, 1] }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
        <span className="text-4xl font-extrabold leading-none tracking-[-0.04em]" style={{ color }}>{shown}</span>
        <span className="mt-1 text-xs text-muted">risk out of 100</span>
      </div>
    </div>
  );
}

export function TrustedRing({ size = 128 }: { size?: number }) {
  return (
    <div className="flex shrink-0 items-center justify-center rounded-full bg-safe-soft text-safe shadow-[inset_0_0_0_11px_#A7F3D0]"
      style={{ width: size, height: size }} role="img" aria-label="Trusted site">
      <ShieldCheck size={44} />
    </div>
  );
}

export function Chip({ children, className }: { children: ReactNode; className: string }) {
  return <span className={`inline-flex h-6 items-center rounded-full px-3 text-xs font-bold ${className}`}>{children}</span>;
}

/** What the user typed, with its host highlighted, plus a note when Fishy added http://. Text only, never HTML. */
export function UrlLine({ result }: { result: ScanResult }) {
  const shown = result.input;
  const at = shown.toLowerCase().indexOf(result.host);
  const tone = result.trusted || result.verdict === "safe" ? "bg-safe-bg" : VERDICT_STYLES[result.verdict].chip.split(" ")[0];
  const note = scoredAsNote(result);
  return (
    <div className="flex flex-col gap-1">
      {at < 0
        ? <p className="break-all font-mono text-sm text-muted">{shown}</p>
        : (
          <p className="break-all font-mono text-sm text-muted">
            {shown.slice(0, at)}
            <span className={`rounded px-1 py-px text-ink ${tone}`}>{shown.slice(at, at + result.host.length)}</span>
            {shown.slice(at + result.host.length)}
          </p>
        )}
      {note && <p className="break-words text-xs leading-snug text-muted">{note}</p>}
    </div>
  );
}

const MODELS = [
  { key: "a" as const, name: "Model A", detail: "Looks at 30 features of the address, like its length and symbols" },
  { key: "b" as const, name: "Model B", detail: "Looks at short letter patterns that often appear in phishing links" },
];

export function ModelVotes({ result }: { result: ScanResult }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {MODELS.map((m) => {
        const p = result.models[m.key];
        return (
          <div key={m.key} className="flex flex-col gap-3 rounded-2xl bg-soft p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-bold">{m.name} says</span>
              <span className="font-mono text-sm">{percent(p)}</span>
            </div>
            <FillBar value={p} color={barColor(p)} />
            <span className="text-xs leading-snug text-muted">{m.detail}</span>
          </div>
        );
      })}
    </div>
  );
}

export function FlagList({ flags, title }: { flags: Flag[]; title: string }) {
  if (flags.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-base font-bold">{title}</h3>
      <ul className="grid gap-2 text-sm leading-snug sm:grid-cols-2">
        {flags.map((f) => (
          <li key={f.id} className="rounded-xl border border-hair px-3 py-3">
            <b className="font-bold">{f.label}</b> <span className="text-muted">{f.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Note({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warn" }) {
  const styles = tone === "warn" ? "border-warn-line bg-warn-soft text-[#78350F]" : "border-mint bg-mint-soft text-body";
  return <div className={`rounded-2xl border px-4 py-4 text-sm leading-relaxed ${styles}`}>{children}</div>;
}
