"use client";

import { motion, MotionConfig, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * True only when the visitor asked for reduced motion AND the page has hydrated.
 * The server can't know the preference, so the first browser render must match the server
 * (motion on); switching earlier causes a hydration mismatch and React rebuilds the page.
 */
export function useStillMotion(): boolean {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && Boolean(reduce);
}

export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  style?: CSSProperties;
  as?: "div" | "li" | "article";
}

/** Fades and lifts content in as it scrolls into view. */
export function Reveal({ children, delay = 0, className, style, as = "div" }: RevealProps) {
  const Tag = motion[as];
  return (
    <Tag
      data-reveal=""
      className={className}
      style={style}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </Tag>
  );
}

interface FillBarProps {
  value: number;          // 0..1
  color: string;
  track?: string;
  height?: number;
  className?: string;
}

/** A bar that fills from zero when it comes into view. */
export function FillBar({ value, color, track = "#E6E8EC", height = 8, className = "" }: FillBarProps) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={`overflow-hidden rounded-full ${className}`} style={{ height, background: track }}>
      <motion.div
        className="h-full origin-left rounded-full"
        style={{ width: `${pct}%`, background: color }}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.9, ease: EASE }}
      />
    </div>
  );
}

/** The product window tilts back and settles flat as you scroll to it. */
export function TiltIn({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const still = useStillMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.35"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [12, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.93, 1]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0.7, 1]);
  return (
    <div ref={ref} className={className} style={{ perspective: 1400 }}>
      <motion.div style={still ? undefined : { rotateX, scale, opacity, transformOrigin: "50% 0%" }}>
        {children}
      </motion.div>
    </div>
  );
}

/** A vertical line that fills as the reader moves through a list of steps. */
export function ScrollLine({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.8", "end 0.55"] });
  return (
    <div ref={ref} aria-hidden="true" className={`w-[3px] overflow-hidden rounded-full bg-line ${className}`}>
      <motion.div className="h-full w-full origin-top bg-ink" style={{ scaleY: scrollYProgress }} />
    </div>
  );
}

/** Moves its content slightly slower than the page. */
export function Parallax({ children, distance = 40, className }: { children: ReactNode; distance?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const still = useStillMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  return (
    <div ref={ref} className={className}>
      <motion.div style={still ? undefined : { y }}>{children}</motion.div>
    </div>
  );
}
