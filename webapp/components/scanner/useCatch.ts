"use client";

import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { CATCH_MS, catchFor, catchForMessage, type CatchInfo } from "@/lib/catchSequence";

import type { ScanState } from "./ScannerProvider";

interface CatchState {
  caught: CatchInfo | null;
  /** The tab that was being checked, so the scene keeps its caption. */
  tab: "link" | "message";
  skip: () => void;
}

function catchOf(state: ScanState): CatchInfo | null {
  if (state.status === "link") return catchFor(state.result);
  if (state.status === "message") return catchForMessage(state.result);
  return null;
}

/**
 * When a check finishes, keep the fishing scene up for a moment so the catch can leap out, then show the result.
 * Skipped for errors, for reduced motion, and on click or Escape. The data itself is never delayed.
 */
export function useCatch(state: ScanState): CatchState {
  const reduce = useReducedMotion();
  const previous = useRef<ScanState>(state);
  const [caught, setCaught] = useState<CatchInfo | null>(null);
  const [tab, setTab] = useState<"link" | "message">("link");

  // Layout effect: decide before the browser paints, so the result never flashes ahead of the catch.
  useLayoutEffect(() => {
    const before = previous.current;
    previous.current = state;
    const info = before.status === "loading" && !reduce ? catchOf(state) : null;
    if (before.status === "loading") setTab(before.tab);
    setCaught(info);
    if (!info) return;
    const timer = window.setTimeout(() => setCaught(null), CATCH_MS);
    return () => window.clearTimeout(timer);
  }, [state, reduce]);

  const skip = useCallback(() => setCaught(null), []);

  useEffect(() => {
    if (!caught) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") skip(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [caught, skip]);

  return { caught, tab, skip };
}
