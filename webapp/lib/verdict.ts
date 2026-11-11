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

type OverrideFields = Pick<ScanResult, "trusted" | "risk" | "model_verdict" | "registered_domain">;

/**
 * Plain-English note for a trusted result: what the two scores alone would say, and whether the
 * trusted list changed the answer. Null for results that are not on the trusted list.
 */
export function trustedOverrideNote(result: OverrideFields): string | null {
  if (!result.trusted) return null;
  const average = `The two models average ${result.risk} out of 100`;
  if (result.model_verdict === "safe") {
    return `${average}, which is Safe anyway. ${result.registered_domain} is also on Fishy’s trusted list.`;
  }
  return `${average} (${VERDICT_STYLES[result.model_verdict].label}). Fishy shows it as safe because ${result.registered_domain} is on its trusted list of well-known sites.`;
}

/** Explains the http:// Fishy adds when the user typed a bare address. Null when nothing was added. */
export function scoredAsNote(result: Pick<ScanResult, "input" | "url">): string | null {
  if (result.input === result.url) return null;
  return `Scored as ${result.url}. Fishy adds http:// when no scheme is given, because the models learned from full links.`;
}

export function headlineFor(result: Pick<ScanResult, "verdict" | "trusted">): string {
  return result.trusted ? "Looks safe" : VERDICT_STYLES[result.verdict].headline;
}
