"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { useProtection } from "@/components/protection/ProtectionProvider";
import { scanLink, scanMessage, warmUp } from "@/lib/api";
import type { Entry } from "@/lib/protectionStore";
import type { MessageResult, ScanResult } from "@/lib/schemas";
import { hostOf } from "@/lib/url";

export type Tab = "link" | "message";

export type ScanState =
  | { status: "idle" }
  | { status: "loading"; tab: Tab; slow: boolean }
  | { status: "link"; result: ScanResult }
  | { status: "message"; result: MessageResult; text: string }
  | { status: "blocked-before"; entry: Entry; input: string }
  | { status: "error"; message: string; retry: () => void };

interface ScannerApi {
  tab: Tab;
  setTab: (tab: Tab) => void;
  link: string;
  setLink: (value: string) => void;
  message: string;
  setMessage: (value: string) => void;
  state: ScanState;
  checkLink: (input?: string, options?: { force?: boolean }) => Promise<void>;
  checkMessage: (input?: string) => Promise<void>;
  showResult: () => void;
}

const ScannerContext = createContext<ScannerApi | null>(null);
const SLOW_AFTER_MS = 2500;

export function useScanner(): ScannerApi {
  const api = useContext(ScannerContext);
  if (!api) throw new Error("useScanner must be used inside <ScannerProvider>");
  return api;
}

export function ScannerProvider({ children }: { children: ReactNode }) {
  const protection = useProtection();
  const [tab, setTab] = useState<Tab>("link");
  const [link, setLink] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<ScanState>({ status: "idle" });
  const requestId = useRef(0);

  useEffect(() => { void warmUp(); }, []);   // load the models early; failures are handled per check

  // Bring the result into view only when it is mostly off screen.
  const showResult = useCallback(() => {
    const el = document.getElementById("result");
    if (!el) return;
    const { top } = el.getBoundingClientRect();
    if (top < 0 || top > window.innerHeight * 0.6) el.scrollIntoView({ block: "start" });
  }, []);

  const startLoading = (nextTab: Tab) => {
    const id = ++requestId.current;
    setState({ status: "loading", tab: nextTab, slow: false });
    const timer = window.setTimeout(() => {
      setState((s) => (requestId.current === id && s.status === "loading" ? { ...s, slow: true } : s));
    }, SLOW_AFTER_MS);
    return { id, done: () => window.clearTimeout(timer) };
  };

  const checkLink = useCallback(async (input?: string, options: { force?: boolean } = {}) => {
    const value = (input ?? link).trim();
    setTab("link");
    if (input !== undefined) setLink(value);
    if (!value) {
      setState({ status: "error", message: "Paste a link to check.", retry: () => undefined });
      return;
    }
    const host = hostOf(value);
    const blocked = host && !options.force ? protection.findBlocked(host) : undefined;
    if (blocked) {
      setState({ status: "blocked-before", entry: blocked, input: value });
      protection.notify("danger", "You blocked this site before", blocked.host);
      return;
    }
    const { id, done } = startLoading("link");
    const outcome = await scanLink(value);
    done();
    if (requestId.current !== id) return;            // a newer check replaced this one
    if (!outcome.ok) {
      setState({ status: "error", message: outcome.error, retry: () => void checkLink(value, options) });
      return;
    }
    setState({ status: "link", result: outcome.data });
    protection.record(outcome.data, "link");
    if (outcome.data.verdict === "dangerous") protection.notify("danger", "Dangerous link blocked", outcome.data.host);
  }, [link, protection]);

  const checkMessage = useCallback(async (input?: string) => {
    const value = (input ?? message).trim();
    setTab("message");
    if (input !== undefined) setMessage(value);
    if (!value) {
      setState({ status: "error", message: "Paste a message to check.", retry: () => undefined });
      return;
    }
    const { id, done } = startLoading("message");
    const outcome = await scanMessage(value);
    done();
    if (requestId.current !== id) return;
    if (!outcome.ok) {
      setState({ status: "error", message: outcome.error, retry: () => void checkMessage(value) });
      return;
    }
    setState({ status: "message", result: outcome.data, text: value });
    outcome.data.links.forEach((r) => protection.record(r, "message"));
    const dangerous = outcome.data.links.filter((r) => r.verdict === "dangerous").length;
    if (dangerous > 0) {
      protection.notify("danger", `${dangerous} dangerous link${dangerous > 1 ? "s" : ""} blocked`, "From the message you checked");
    }
  }, [message, protection]);

  const api = useMemo<ScannerApi>(() => ({
    tab, setTab, link, setLink, message, setMessage, state, checkLink, checkMessage, showResult,
  }), [tab, link, message, state, checkLink, checkMessage, showResult]);

  return <ScannerContext.Provider value={api}>{children}</ScannerContext.Provider>;
}
