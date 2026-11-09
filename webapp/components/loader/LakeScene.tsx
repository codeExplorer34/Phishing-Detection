import type { ReactNode } from "react";

/** Fishy's body and tail, used for the shadows swimming under the water. */
const FISH_BODY = "M14 33c9-16 25-22 41-16 9 3.3 16 10 20 16-4 6-11 12.7-20 16-16 6-32 0-41-16z";
const FISH_TAIL = "M15 33 3 21v24z";

const GLINTS = [
  { left: "8%", top: "10%", width: "9%", delay: "0s" },
  { left: "44%", top: "6%", width: "6%", delay: "-3s" },
  { left: "70%", top: "18%", width: "12%", delay: "-6s" },
  { left: "22%", top: "34%", width: "14%", delay: "-2s" },
  { left: "58%", top: "48%", width: "10%", delay: "-5s" },
  { left: "84%", top: "62%", width: "8%", delay: "-1s" },
];

const SWIMMERS = [
  { top: "30%", width: undefined, duration: "19s", delay: "0s", shade: "rgba(6,52,64,0.32)" },
  { top: "58%", width: "3.6cqw", duration: "24s", delay: "-9s", shade: "rgba(6,52,64,0.26)" },
];

interface LakeSceneProps {
  className: string;
  /** Show the still drawing instead of the animation (reduced motion). */
  still?: boolean;
  /** Something leaping out at the float. */
  catchSlot?: ReactNode;
  children?: ReactNode;
  onClick?: () => void;
}

/** The angler on a jetty over a teal lake. Decorative: the words around it carry the meaning. */
export function LakeScene({ className, still = false, catchSlot, children, onClick }: LakeSceneProps) {
  return (
    <div className={`lk-scene ${className}`} onClick={onClick}>
      <div aria-hidden="true">
        <div className="lk-sun" />
        <div className="lk-hills lk-hills-far" />
        <div className="lk-hills lk-hills-near" />
        <div className="lk-water">
          {GLINTS.map((g) => (
            <span key={g.left} className="lk-glint" style={{ left: g.left, top: g.top, width: g.width, animationDelay: g.delay }} />
          ))}
          {SWIMMERS.map((s) => (
            <span key={s.top} className="lk-swimmer" style={{ top: s.top, width: s.width, animationDuration: s.duration, animationDelay: s.delay }}>
              <svg viewBox="0 9 80 46"><path d={FISH_TAIL} fill={s.shade} /><path d={FISH_BODY} fill={s.shade} /></svg>
            </span>
          ))}
        </div>
        <div className="lk-stage">
          <div className="lk-dock" />
          <span className="lk-post" style={{ left: "53%" }} />
          <span className="lk-post" style={{ left: "78%" }} />
          <span className="lk-post" style={{ left: "98%" }} />
          {/* eslint-disable-next-line @next/next/no-img-element -- an animated SVG; next/image would not animate it */}
          <img className="lk-angler" src={still ? "/loader/angler-still.svg" : "/loader/angler.svg"} alt="" width={600} height={400} />
          {catchSlot}
        </div>
        <div className="lk-grain" />
      </div>
      {children && <div className="lk-hud">{children}</div>}
    </div>
  );
}

export function SceneCaption({ children }: { children: ReactNode }) {
  return (
    <span className="lk-caption">
      <span className="lk-line" aria-hidden="true" />
      {children}
    </span>
  );
}
