import type { CatchInfo, CatchKind } from "@/lib/catchSequence";

const BODY = "M14 33c9-16 25-22 41-16 9 3.3 16 10 20 16-4 6-11 12.7-20 16-16 6-32 0-41-16z";
const TAIL = "M15 33 3 21v24z";
const INK = "#0B1220";
const LINE = "#EFEFEF";

function Phish() {
  return (
    <svg viewBox="0 -14 80 69">
      <path d="M58 -14v24" stroke={LINE} strokeWidth="1.6" />
      <path d="M58 10q0 6 -4 7" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d={TAIL} fill="#FDA4AF" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d={BODY} fill="#FDA4AF" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M52 27l5 4M57 27l-5 4M63 27l5 4M68 27l-5 4" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <path d="M56 40q4-3 8 0" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Nibbler() {
  return (
    <svg viewBox="0 -14 80 69">
      <path d="M58 -14v24" stroke={LINE} strokeWidth="1.6" />
      <path d={TAIL} fill="#FDE68A" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d={BODY} fill="#FDE68A" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="55" cy="29" r="2.4" fill={INK} />
      <circle cx="66" cy="29" r="2.4" fill={INK} />
      <path d="M56 40h8" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <path d="M71 -4q0-5 5-5t4 4q0 3-4 4v3M76 7.5v.5" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Boot() {
  return (
    <svg viewBox="0 -14 80 69">
      <path d="M44 -14v20" stroke={LINE} strokeWidth="1.6" />
      <path d="M26 6h22v24l16 7c6 3 5 11-1 11H26z" fill="#8A6A4F" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M26 42h37" stroke={INK} strokeWidth="3" />
      <path d="M30 14h14M30 21h14" stroke="#C9A98C" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M66 30q4-2 6 1" stroke="#63C3CB" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const DRAWINGS: Record<CatchKind, () => React.JSX.Element> = { phish: Phish, nibbler: Nibbler, boot: Boot };
const DOTS: Record<CatchKind, string> = { phish: "#E11D48", nibbler: "#D97706", boot: "#059669" };

/** What leaps out of the water at the float when a result arrives. */
export function Catch({ info }: { info: CatchInfo }) {
  const Drawing = DRAWINGS[info.kind];
  return (
    <div className="lk-catch" data-catch={info.kind}>
      <span className="lk-splash" />
      <span className="lk-leaper"><Drawing /></span>
      <span className="lk-tag">
        <span className="lk-tag-dot" style={{ background: DOTS[info.kind] }} />
        {info.tag}
      </span>
    </div>
  );
}
