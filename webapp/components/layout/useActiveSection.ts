"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * The id of the section crossing the middle of the screen, or null above the first one.
 * Uses IntersectionObserver, so nothing runs on every scroll frame.
 */
export function useActiveSection(ids: readonly string[]): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const sections = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).map((e) => e.target.id);
        if (hit.length > 0) setActive(hit[hit.length - 1]);
      },
      { rootMargin: "-45% 0px -50% 0px" },   // a thin band across the middle of the screen
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);

  return active;
}

/** True once the page has scrolled away from the very top. */
export function useScrolled(sentinel: RefObject<HTMLElement | null>): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, [sentinel]);

  return scrolled;
}
