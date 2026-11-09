import type { MessageResult, ScanResult, Verdict } from "./schemas";

/** What jumps out of the water when a result arrives. */
export type CatchKind = "phish" | "nibbler" | "boot";

export interface CatchInfo {
  kind: CatchKind;
  tag: string;
}

/** How long the catch stays on screen before the result card replaces it. */
export const CATCH_MS = 1300;

const RANK: Record<Verdict, number> = { safe: 0, suspicious: 1, dangerous: 2 };

type Scored = Pick<ScanResult, "verdict" | "risk" | "trusted">;

function effectiveVerdict(r: Scored): Verdict {
  return r.trusted ? "safe" : r.verdict;
}

export function catchFor(result: Scored): CatchInfo {
  switch (effectiveVerdict(result)) {
    case "dangerous":
      return { kind: "phish", tag: `Phish on the line · risk ${result.risk}` };
    case "suspicious":
      return { kind: "nibbler", tag: `Something’s nibbling · risk ${result.risk}` };
    default:
      return { kind: "boot", tag: "Just an old boot · nothing phishy" };
  }
}

/** The most worrying link: highest verdict first, then highest risk. */
export function worstLink<T extends Scored>(links: readonly T[]): T | undefined {
  return links.reduce<T | undefined>((worst, r) => {
    if (!worst) return r;
    const a = RANK[effectiveVerdict(r)];
    const b = RANK[effectiveVerdict(worst)];
    return a > b || (a === b && r.risk > worst.risk) ? r : worst;
  }, undefined);
}

export function catchForMessage(result: Pick<MessageResult, "links">): CatchInfo {
  const worst = worstLink(result.links);
  if (!worst) return { kind: "boot", tag: "No links in this message" };
  return catchFor(worst);
}
