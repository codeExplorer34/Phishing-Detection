"use client";

import { useEffect } from "react";

import { LogoMark } from "@/components/ui/Brand";

import { LakeScene, SceneCaption } from "./LakeScene";

function dismiss(): void {
  document.documentElement.dataset.intro = "seen";
}

/**
 * First-visit intro. The page is fully rendered underneath (search engines and screen readers get it at once);
 * this cover lifts away by itself after ~2.4 s via CSS, or straight away on any click or key press.
 */
export function IntroSplash() {
  useEffect(() => {
    if (document.documentElement.dataset.intro === "seen") return;
    const options = { once: true, capture: true } as const;
    window.addEventListener("keydown", dismiss, options);
    window.addEventListener("pointerdown", dismiss, options);
    const timer = window.setTimeout(dismiss, 3400);   // after the CSS lift has finished
    return () => {
      window.removeEventListener("keydown", dismiss, options);
      window.removeEventListener("pointerdown", dismiss, options);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="lk-intro" aria-hidden="true" data-testid="intro">
      <LakeScene className="h-full w-full">
        <span className="lk-intro-brand"><LogoMark size={34} /> Fishy</span>
        <span className="lk-intro-sub">How Fishy is your link?</span>
        <SceneCaption>Waking up the models</SceneCaption>
        <button type="button" className="lk-skip" tabIndex={-1} onClick={dismiss}>Skip</button>
      </LakeScene>
    </div>
  );
}
