/** Fishy's mascot is also its logo. One drawing, two treatments:
 *  - Mascot: white fish with a soft shadow, for colourful backgrounds (hero, call to action).
 *  - LogoMark: the same fish with a dark outline, readable on white or on colour (header, footer). */

const BODY = "M14 33c9-16 25-22 41-16 9 3.3 16 10 20 16-4 6-11 12.7-20 16-16 6-32 0-41-16z";
const TAIL = "M15 33 3 21v24z";
const FIN = "M40 18c4-6 10-9 16-8-2 3-4 6-5 9";

function Face({ cheeks = true }: { cheeks?: boolean }) {
  return (
    <>
      <path d="M52 29q3-3 6 0" stroke="#0B1220" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M62 29q3-3 6 0" stroke="#0B1220" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M57 38q3 2.6 6 0" stroke="#0B1220" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {cheeks && <circle cx="50" cy="36" r="2.6" fill="#99f6e4" />}
      {cheeks && <circle cx="70" cy="36" r="2.6" fill="#99f6e4" />}
    </>
  );
}

interface LogoProps {
  size?: number;   // height in px
}

export function LogoMark({ size = 30 }: LogoProps) {
  return (
    <svg height={size} width={(size * 80) / 46} viewBox="0 9 80 46" aria-hidden="true">
      <path d={TAIL} fill="#fff" stroke="#0B1220" strokeWidth="3.2" strokeLinejoin="round" />
      <path d={FIN} fill="#ccfbf1" stroke="#0B1220" strokeWidth="3.2" strokeLinejoin="round" />
      <path d={BODY} fill="#fff" stroke="#0B1220" strokeWidth="3.2" strokeLinejoin="round" />
      <Face cheeks={false} />
    </svg>
  );
}

export function Logo({ size = 30 }: LogoProps) {
  return (
    <span className="flex items-center gap-2">
      <LogoMark size={size} />
      <span className="text-[22px] font-extrabold tracking-[-0.04em]">Fishy</span>
    </span>
  );
}

interface MascotProps {
  width?: number;
  className?: string;
  label?: string;
}

/** Decorative unless a label is given. */
export function Mascot({ width = 88, className = "", label }: MascotProps) {
  const a11y = label ? { role: "img" as const, "aria-label": label } : { "aria-hidden": true as const };
  return (
    <svg width={width} height={(width * 70) / 92} viewBox="0 0 92 70" className={className} {...a11y}>
      <ellipse cx="48" cy="64" rx="24" ry="3.5" fill="rgba(11,18,32,0.10)" />
      <path d={BODY} fill="#fff" />
      <path d={TAIL} fill="#fff" />
      <path d={FIN} fill="#ccfbf1" />
      <Face />
    </svg>
  );
}
