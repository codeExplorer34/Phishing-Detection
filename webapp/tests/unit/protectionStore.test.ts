import { describe, expect, it, vi } from "vitest";

import { createProtectionStore, EMPTY_STATE, MAX_ENTRIES, type NewEntry, type StorageLike } from "@/lib/protectionStore";

function memoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } };
}

const entry = (host: string, risk = 93): NewEntry => ({
  url: `http://${host}/x`, host, risk, verdict: "dangerous", threatType: "phishing", source: "link",
});

describe("protection store", () => {
  it("starts empty and persists additions", () => {
    const storage = memoryStorage();
    const store = createProtectionStore(storage, () => 1000);
    expect(store.getState()).toEqual(EMPTY_STATE);
    store.add("blocklist", entry("evil.com"));
    const reloaded = createProtectionStore(storage);
    expect(reloaded.getState().blocklist.map((e) => e.host)).toEqual(["evil.com"]);
  });

  it("never mutates the previous state", () => {
    const store = createProtectionStore(memoryStorage());
    const before = store.getState();
    store.add("history", entry("a.com"));
    expect(before.history).toHaveLength(0);
    expect(store.getState()).not.toBe(before);
  });

  it("keeps one blocklist entry per host, newest first", () => {
    const store = createProtectionStore(memoryStorage());
    store.add("blocklist", entry("a.com", 80));
    store.add("blocklist", entry("b.com"));
    store.add("blocklist", entry("a.com", 95));
    expect(store.getState().blocklist.map((e) => [e.host, e.risk])).toEqual([["a.com", 95], ["b.com", 93]]);
    expect(store.findBlocked("a.com")?.risk).toBe(95);
  });

  it("caps each list", () => {
    const store = createProtectionStore(memoryStorage());
    for (let i = 0; i < MAX_ENTRIES + 5; i++) store.add("history", entry(`s${i}.com`));
    expect(store.getState().history).toHaveLength(MAX_ENTRIES);
    expect(store.getState().history[0].host).toBe(`s${MAX_ENTRIES + 4}.com`);
  });

  it("removes, unblocks, clears and toggles alerts", () => {
    const store = createProtectionStore(memoryStorage());
    const a = store.add("alerts", entry("a.com"));
    store.add("blocklist", entry("b.com"));
    store.remove("alerts", a.id);
    store.unblockHost("b.com");
    store.add("history", entry("c.com"));
    store.clear("history");
    store.setDesktopAlerts(true);
    expect(store.getState()).toEqual({ blocklist: [], history: [], alerts: [], desktopAlerts: true });
  });

  it("notifies and unsubscribes listeners", () => {
    const store = createProtectionStore(memoryStorage());
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.add("history", entry("a.com"));
    unsubscribe();
    store.add("history", entry("b.com"));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("ignores corrupted or tampered storage", () => {
    expect(createProtectionStore(memoryStorage({ "fishy.protection.v1": "{not json" })).getState()).toEqual(EMPTY_STATE);
    const tampered = JSON.stringify({ blocklist: [{ host: 5 }], history: [], alerts: [], desktopAlerts: true });
    expect(createProtectionStore(memoryStorage({ "fishy.protection.v1": tampered })).getState()).toEqual(EMPTY_STATE);
  });

  it("keeps working when storage throws or is missing", () => {
    const broken: StorageLike = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("full"); } };
    const store = createProtectionStore(broken);
    store.add("blocklist", entry("a.com"));
    expect(store.getState().blocklist).toHaveLength(1);
    expect(createProtectionStore(null).getState()).toEqual(EMPTY_STATE);
  });
});
