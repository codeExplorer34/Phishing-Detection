"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";

import {
  createProtectionStore, EMPTY_STATE, type Entry, type ListName, type NewEntry, type ProtectionState,
  type ProtectionStore,
} from "@/lib/protectionStore";
import type { ScanResult } from "@/lib/schemas";

import { BlockedDialog, type PendingOpen } from "./BlockedDialog";
import { Toaster, type Toast, type ToastTone } from "./Toaster";

let browserStore: ProtectionStore | null = null;
function getStore(): ProtectionStore {
  if (!browserStore) {
    let storage: Storage | null = null;
    try {
      storage = window.localStorage;
    } catch {
      storage = null; // private mode or blocked storage: work in memory
    }
    browserStore = createProtectionStore(storage);
  }
  return browserStore;
}

const subscribe = (listener: () => void) => getStore().subscribe(listener);
const getSnapshot = () => getStore().getState();
const getServerSnapshot = () => EMPTY_STATE;

export type Source = "link" | "message";

interface ProtectionApi {
  state: ProtectionState;
  record: (result: ScanResult, source: Source) => void;
  block: (result: ScanResult, source: Source) => void;
  unblock: (host: string) => void;
  remove: (list: ListName, id: string) => void;
  clear: (list: ListName) => void;
  findBlocked: (host: string) => Entry | undefined;
  setDesktopAlerts: (enabled: boolean) => Promise<"on" | "off" | "denied" | "unsupported">;
  notify: (tone: ToastTone, title: string, detail?: string) => void;
  confirmOpen: (pending: PendingOpen) => void;
}

const ProtectionContext = createContext<ProtectionApi | null>(null);

export function useProtection(): ProtectionApi {
  const api = useContext(ProtectionContext);
  if (!api) throw new Error("useProtection must be used inside <ProtectionProvider>");
  return api;
}

const toEntry = (r: ScanResult, source: Source): NewEntry => ({
  url: r.url, host: r.host, risk: r.risk, verdict: r.verdict, threatType: r.threat_type, source,
});

export function ProtectionProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pending, setPending] = useState<PendingOpen | null>(null);

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), []);

  const notify = useCallback((tone: ToastTone, title: string, detail?: string) => {
    const id = Date.now() + Math.random();
    setToasts((all) => [...all.slice(-2), { id, tone, title, detail }]);
    window.setTimeout(() => dismiss(id), 6000);
    const store = getStore();
    if (tone === "danger" && store.getState().desktopAlerts && "Notification" in window
        && Notification.permission === "granted") {
      try {
        new Notification(`Fishy: ${title}`, { body: detail, tag: `fishy-${detail ?? title}` });
      } catch {
        // Some browsers only allow notifications from a service worker; the on-page alert is enough.
      }
    }
  }, [dismiss]);

  const record = useCallback((result: ScanResult, source: Source) => {
    const store = getStore();
    const entry = toEntry(result, source);
    store.add("history", entry);
    if (result.verdict === "dangerous") {
      store.add("blocklist", entry);
      store.add("alerts", entry);
    } else if (result.verdict === "suspicious") {
      store.add("alerts", entry);
    }
  }, []);

  const api = useMemo<ProtectionApi>(() => ({
    state,
    record,
    block: (result, source) => getStore().add("blocklist", toEntry(result, source)),
    unblock: (host) => getStore().unblockHost(host),
    remove: (list, id) => getStore().remove(list, id),
    clear: (list) => getStore().clear(list),
    findBlocked: (host) => getStore().findBlocked(host),
    async setDesktopAlerts(enabled) {
      const store = getStore();
      if (!enabled) { store.setDesktopAlerts(false); return "off"; }
      if (!("Notification" in window)) return "unsupported";
      const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
      if (permission !== "granted") { store.setDesktopAlerts(false); return "denied"; }
      store.setDesktopAlerts(true);
      return "on";
    },
    notify,
    confirmOpen: setPending,
  }), [state, record, notify]);

  return (
    <ProtectionContext.Provider value={api}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
      <BlockedDialog pending={pending} onClose={() => setPending(null)} />
    </ProtectionContext.Provider>
  );
}
