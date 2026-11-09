"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Grainient = dynamic(() => import("./Grainient"), { ssr: false });

type SkyVariant = "hero" | "band" | "cta";

interface SkyConfig {
  colors: string[];
  angle: number;
  fallback: string;
  interactive: boolean;
}

// The first colour blends into whatever surrounds the sky (Grainient's own advice).
const SKIES: Record<SkyVariant, SkyConfig> = {
  hero: {
    colors: ["#F5F5F7", "#a8e8e3", "#5cc6cf", "#2a9fb3"], angle: 0, interactive: true,
    fallback: "linear-gradient(180deg, #2a9fb3 0%, #5cc6cf 34%, #a8e8e3 66%, #F5F5F7 100%)",
  },
  band: {
    colors: ["#082f3a", "#0e7490", "#0f766e", "#134e4a"], angle: 110, interactive: false,
    fallback: "linear-gradient(120deg, #082f3a 0%, #0e7490 50%, #0f766e 100%)",
  },
  cta: {
    colors: ["#a8e8e3", "#5cc6cf", "#2a9fb3"], angle: 0, interactive: true,
    fallback: "linear-gradient(180deg, #2a9fb3 0%, #5cc6cf 55%, #a8e8e3 100%)",
  },
};

function supportsWebGL2(): boolean {
  try {
    return Boolean(document.createElement("canvas").getContext("webgl2"));
  } catch {
    return false;
  }
}

interface SkyProps {
  variant: SkyVariant;
  className?: string;
}

/** Animated grain gradient with a plain CSS gradient underneath (no WebGL, or before it loads). */
export function Sky({ variant, className = "" }: SkyProps) {
  const sky = SKIES[variant];
  const [webgl, setWebgl] = useState(false);

  useEffect(() => setWebgl(supportsWebGL2()), []);

  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 ${className}`} style={{ background: sky.fallback }}>
      {webgl && (
        <div className="pointer-events-auto absolute inset-0 animate-[fadeIn_0.6s_ease-out_both]">
          <Grainient
            colors={sky.colors}
            angle={sky.angle}
            flow={0.9}
            silk={0.35}
            grainAmount={0.07}
            speed={0.6}
            interactive={sky.interactive}
            stir={0.5}
            clickSwirl={false}
          />
        </div>
      )}
    </div>
  );
}
