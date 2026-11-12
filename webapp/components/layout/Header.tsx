"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import { Logo } from "@/components/ui/Brand";
import { Close, Menu } from "@/components/ui/icons";
import { REPO_URL } from "@/lib/site";

import { useActiveSection, useScrolled } from "./useActiveSection";

const NAV = [
  { href: "#how", label: "How it works" },
  { href: "#accuracy", label: "Accuracy" },
  { href: "#findings", label: "Findings" },
  { href: "#faq", label: "FAQ" },
  { href: "#about", label: "About" },
];
const MOBILE_NAV = [{ href: "#scan", label: "Check a link" }, { href: "#protection", label: "Your blocklist" }, ...NAV];
const SECTION_IDS = MOBILE_NAV.map((item) => item.href.slice(1));

export function Header() {
  const [open, setOpen] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);
  const scrolled = useScrolled(sentinel);
  const active = useActiveSection(SECTION_IDS);
  const isActive = (href: string) => active === href.slice(1);

  useEffect(() => {
    if (!open) return;
    firstLink.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); menuButton.current?.focus(); } };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", onKey); };
  }, [open]);

  // The menu sits outside <header>: a backdrop-filter parent would trap its fixed positioning.
  return (
    <>
    <div ref={sentinel} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-2 w-px" />
    <header className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300 ${
      scrolled ? "bg-white/75 shadow-[0_1px_0_rgba(11,18,32,0.08)] backdrop-blur-xl" : "bg-transparent"}`}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <div className="wrap flex h-16 items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <a href="#top" aria-label="Fishy home"><Logo /></a>
          <nav aria-label="Main" className="hidden gap-1 text-base font-medium md:flex">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} aria-current={isActive(item.href) ? "location" : undefined}
                className={`rounded-full px-3 py-2 transition-colors duration-300 ${isActive(item.href)
                  ? "bg-white/80 font-semibold shadow-[0_0_0_1px_rgba(11,18,32,0.06)]" : "hover:bg-ink/5"}`}>
                {item.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="hidden text-base font-medium hover:text-teal-deep md:inline">GitHub</a>
          <a href="#scan" className="press hidden h-10 items-center rounded-full bg-ink px-4 text-sm font-semibold text-white hover:bg-ink/85 md:inline-flex">
            Check a link
          </a>
          <button ref={menuButton} type="button" aria-label="Open menu" aria-expanded={open} aria-controls="mobile-menu"
            onClick={() => setOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/70 md:hidden">
            <Menu size={20} />
          </button>
        </div>
      </div>
    </header>

      {open && (
        <div id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu"
          className="fixed inset-0 z-[55] flex flex-col bg-page/95 backdrop-blur-xl md:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <Logo size={26} />
            <button type="button" aria-label="Close menu" onClick={() => { setOpen(false); menuButton.current?.focus(); }}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-line"><Close size={20} /></button>
          </div>
          <nav aria-label="Mobile" className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 pt-6">
            {MOBILE_NAV.map((item, i) => (
              <a key={item.href} ref={i === 0 ? firstLink : undefined} href={item.href} onClick={() => setOpen(false)}
                aria-current={isActive(item.href) ? "location" : undefined}
                style={{ "--i": i } as CSSProperties}
                className={`menu-item flex h-14 items-center justify-between rounded-2xl px-4 text-3xl font-bold tracking-[-0.03em] ${
                  isActive(item.href) ? "bg-white shadow-[0_0_0_1px_rgba(11,18,32,0.06)]" : "hover:bg-white/60"}`}>
                {item.label}
                {isActive(item.href) && <span className="text-xs font-semibold tracking-normal text-teal-deep">You’re here</span>}
              </a>
            ))}
          </nav>
          <div className="menu-item flex flex-col gap-3 px-4 pb-8 pt-4" style={{ "--i": MOBILE_NAV.length } as CSSProperties}>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer"
              className="press flex h-12 items-center justify-center rounded-full bg-white font-semibold shadow-[0_0_0_1px_rgba(11,18,32,0.12)]">
              GitHub
            </a>
            <p className="text-center text-xs text-muted">A CSIT375 student project at the University of Wollongong</p>
          </div>
        </div>
      )}
    </>
  );
}
