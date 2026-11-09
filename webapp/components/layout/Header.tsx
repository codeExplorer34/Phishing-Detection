"use client";

import { useEffect, useRef, useState } from "react";

import { Logo } from "@/components/ui/Brand";
import { Close, Menu } from "@/components/ui/icons";
import { REPO_URL } from "@/lib/site";

const NAV = [
  { href: "#how", label: "How it works" },
  { href: "#accuracy", label: "Accuracy" },
  { href: "#findings", label: "Findings" },
  { href: "#faq", label: "FAQ" },
  { href: "#about", label: "About" },
];
const MOBILE_NAV = [{ href: "#scan", label: "Check a link" }, { href: "#protection", label: "Your blocklist" }, ...NAV];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    <header className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300 ${
      scrolled ? "bg-white/75 shadow-[0_1px_0_rgba(11,18,32,0.08)] backdrop-blur-xl" : "bg-transparent"}`}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <div className="wrap flex h-[68px] items-center justify-between gap-6">
        <div className="flex items-center gap-10">
          <a href="#top" aria-label="Fishy home"><Logo /></a>
          <nav aria-label="Main" className="hidden gap-7 text-[15px] font-medium md:flex">
            {NAV.map((item) => <a key={item.href} href={item.href} className="hover:text-teal-deep">{item.label}</a>)}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="hidden text-[15px] font-medium hover:text-teal-deep md:inline">GitHub</a>
          <a href="#scan" className="hidden h-10 items-center rounded-full bg-ink px-[18px] text-[15px] font-bold text-white hover:bg-ink/85 md:inline-flex">
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
        <div className="fixed inset-0 z-[55] md:hidden">
          <button type="button" aria-label="Close menu" tabIndex={-1} onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]" />
          <div id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu"
            className="relative m-2 flex flex-col rounded-[22px] bg-white pb-5 shadow-[0_30px_60px_-20px_rgba(11,18,32,0.45)]">
            <div className="flex h-[60px] items-center justify-between pl-4 pr-2">
              <Logo size={26} />
              <button type="button" aria-label="Close menu" onClick={() => { setOpen(false); menuButton.current?.focus(); }}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-chip"><Close size={20} /></button>
            </div>
            <nav aria-label="Mobile" className="flex flex-col px-2 pt-2">
              {MOBILE_NAV.map((item, i) => (
                <a key={item.href} ref={i === 0 ? firstLink : undefined} href={item.href} onClick={() => setOpen(false)}
                  className="flex h-[54px] items-center rounded-xl px-3 text-xl font-bold tracking-[-0.02em] hover:bg-chip">
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mx-4 mt-4 flex border-t border-hair pt-4">
              <a href={REPO_URL} target="_blank" rel="noopener noreferrer"
                className="flex h-12 flex-1 items-center justify-center rounded-full font-bold shadow-[0_0_0_1px_rgba(11,18,32,0.12)]">
                GitHub
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
