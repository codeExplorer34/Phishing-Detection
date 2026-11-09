"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import { ArrowUp } from "@/components/ui/icons";
import { EXAMPLE_LINKS, SAMPLE_MESSAGE } from "@/lib/content";

import { useScanner, type Tab } from "./ScannerProvider";

const MAX_MESSAGE = 5000;
const TABS: { id: Tab; label: string }[] = [{ id: "link", label: "Link" }, { id: "message", label: "Message" }];

function SubmitButton({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button type="submit" aria-label={label} disabled={busy}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-white transition hover:bg-ink/85 disabled:cursor-wait disabled:opacity-60">
      {busy
        ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
        : <ArrowUp size={18} strokeWidth={2.4} />}
    </button>
  );
}

export function ScanPanel() {
  const { tab, setTab, link, setLink, message, setMessage, state, checkLink, checkMessage, showResult } = useScanner();
  const [fieldError, setFieldError] = useState<string | null>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ link: null, message: null });
  const ids = { tabs: useId(), error: useId(), counter: useId() };
  const busy = state.status === "loading";

  // "/" focuses the field, unless the user is already typing somewhere.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
      e.preventDefault();
      (tab === "link" ? linkRef.current : messageRef.current)?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [tab]);

  const switchTab = (next: Tab) => { setTab(next); setFieldError(null); };

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const next: Tab = tab === "link" ? "message" : "link";
    switchTab(next);
    tabRefs.current[next]?.focus();
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const value = tab === "link" ? link : message;
    if (!value.trim()) {
      setFieldError(tab === "link" ? "Paste a link to check." : "Paste a message to check.");
      (tab === "link" ? linkRef.current : messageRef.current)?.focus();
      return;
    }
    setFieldError(null);
    void (tab === "link" ? checkLink() : checkMessage());
    showResult();
  };

  const tryExample = (url: string) => { setFieldError(null); void checkLink(url); showResult(); };

  return (
    <div className="flex w-full flex-col items-center">
      <form onSubmit={submit} noValidate
        className="flex w-full max-w-[640px] flex-col gap-5 rounded-[20px] bg-white py-[18px] pl-[22px] pr-[18px] text-left shadow-[0_20px_50px_-18px_rgba(11,18,32,0.35),0_0_0_1px_rgba(11,18,32,0.06)]">
        {tab === "link" ? (
          <div id={`${ids.tabs}-link`} role="tabpanel" aria-labelledby={`${ids.tabs}-tab-link`}>
            <label htmlFor="scan-input" className="sr-only">Link to check</label>
            <input id="scan-input" ref={linkRef} type="text" inputMode="url" autoComplete="off" autoCapitalize="none"
              spellCheck={false} enterKeyHint="go" value={link} maxLength={2048}
              onChange={(e) => { setLink(e.target.value); if (fieldError) setFieldError(null); }}
              placeholder="Paste a link, like example.com/login"
              aria-invalid={Boolean(fieldError)} aria-describedby={fieldError ? ids.error : undefined}
              className="w-full bg-transparent py-1 font-mono text-[16px] text-ink outline-none placeholder:font-sans placeholder:text-muted sm:text-[17px]" />
          </div>
        ) : (
          <div id={`${ids.tabs}-message`} role="tabpanel" aria-labelledby={`${ids.tabs}-tab-message`}>
            <label htmlFor="message-input" className="sr-only">Email or text message to check</label>
            <textarea id="message-input" ref={messageRef} rows={6} value={message} maxLength={MAX_MESSAGE}
              onChange={(e) => { setMessage(e.target.value); if (fieldError) setFieldError(null); }}
              placeholder="Paste an email or text message. Fishy will check every link in it."
              aria-invalid={Boolean(fieldError)}
              aria-describedby={`${ids.counter}${fieldError ? ` ${ids.error}` : ""}`}
              className="w-full resize-y bg-transparent text-[16px] leading-relaxed text-ink outline-none placeholder:text-muted" />
          </div>
        )}
        {fieldError && <p id={ids.error} role="alert" className="-mt-2 text-sm font-semibold text-danger">{fieldError}</p>}
        <div className="flex items-center justify-between gap-3">
          <div role="tablist" aria-label="What to check" className="inline-flex gap-1 rounded-full bg-chip p-[3px]">
            {TABS.map((t) => (
              <button key={t.id} id={`${ids.tabs}-tab-${t.id}`} ref={(el) => { tabRefs.current[t.id] = el; }}
                type="button" role="tab" aria-selected={tab === t.id} aria-controls={`${ids.tabs}-${t.id}`}
                tabIndex={tab === t.id ? 0 : -1} onClick={() => switchTab(t.id)} onKeyDown={onTabKey}
                className={`h-9 rounded-full px-4 text-[13px] font-semibold transition ${tab === t.id ? "bg-white text-ink shadow-[0_1px_2px_rgba(11,18,32,0.12)]" : "text-muted hover:text-ink"}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {tab === "message" && (
              <>
                <span id={ids.counter} className="hidden font-mono text-[11px] text-muted sm:inline">
                  {message.length.toLocaleString("en-US")} / {MAX_MESSAGE.toLocaleString("en-US")}
                </span>
                <button type="button" onClick={() => { setMessage(SAMPLE_MESSAGE); setFieldError(null); }}
                  className="h-9 rounded-lg px-2.5 text-[13px] font-semibold text-teal-deep hover:bg-mint-soft">
                  Load a sample
                </button>
              </>
            )}
            <SubmitButton busy={busy} label={tab === "link" ? "Check link" : "Check message"} />
          </div>
        </div>
      </form>

      <div className="mt-4 flex max-w-[860px] flex-wrap items-center justify-center gap-2">
        <span className="text-[13px] font-semibold text-[#134e57]">Try</span>
        {EXAMPLE_LINKS.map((ex) => (
          <button key={ex.url} type="button" onClick={() => tryExample(ex.url)} disabled={busy}
            className="h-8 max-w-full truncate rounded-full bg-white/75 px-3 font-mono text-[12px] text-ink backdrop-blur-sm transition hover:bg-white disabled:opacity-60">
            {ex.label}
          </button>
        ))}
      </div>
    </div>
  );
}
