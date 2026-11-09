import type { ScanResult, Verdict } from "./schemas";

export interface VerdictStyle {
  label: string;
  headline: string;
  ring: string;      // stroke colour
  text: string;      // tailwind text class
  chip: string;      // tailwind classes for the chip
  border: string;
}

export const VERDICT_STYLES: Record<Verdict, VerdictStyle> = {
  safe: { label: "Safe", headline: "Looks safe", ring: "#059669", text: "text-safe", chip: "bg-safe-bg text-safe", border: "ring-safe/25" },
  suspicious: { label: "Suspicious", headline: "Be careful with this one", ring: "#D97706", text: "text-warn", chip: "bg-warn-bg text-warn", border: "ring-warn/30" },
  dangerous: { label: "Dangerous", headline: "Blocked automatically", ring: "#E11D48", text: "text-danger", chip: "bg-danger-bg text-danger", border: "ring-danger/25" },
};

const THREAT_LABELS: Record<string, string> = {
  phishing: "Looks like phishing",
  malware: "Looks like malware",
  defacement: "Hacked website (defacement)",
};

export function threatLabel(type: string | null): string | null {
  return type ? (THREAT_LABELS[type] ?? null) : null;
}

/** Colour for a single model's probability bar, using the same thresholds as the verdict. */
export function barColor(probability: number): string {
  if (probability >= 0.7) return "#E11D48";
  if (probability >= 0.4) return "#D97706";
  return "#059669";
}

export function percent(probability: number): string {
  return `${(probability * 100).toFixed(1)}%`;
}

export function headlineFor(result: Pick<ScanResult, "verdict" | "trusted">): string {
  return result.trusted ? "Looks safe" : VERDICT_STYLES[result.verdict].headline;
}
