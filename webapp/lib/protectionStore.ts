import { z } from "zod";

/** Blocklist, history and alerts, kept only in this browser (localStorage). Immutable updates. */

export const MAX_ENTRIES = 200;
export const LIST_NAMES = ["blocklist", "history", "alerts"] as const;
export type ListName = (typeof LIST_NAMES)[number];

const entrySchema = z.object({
  id: z.string(),
  url: z.string(),
  host: z.string(),
  risk: z.number().int().min(0).max(100),
  verdict: z.enum(["safe", "suspicious", "dangerous"]),
  threatType: z.string().nullable(),
  source: z.enum(["link", "message"]),
  at: z.number(),
});
export type Entry = z.infer<typeof entrySchema>;
export type NewEntry = Omit<Entry, "id" | "at">;

export interface ProtectionState {
  readonly blocklist: readonly Entry[];
  readonly history: readonly Entry[];
  readonly alerts: readonly Entry[];
  readonly desktopAlerts: boolean;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const EMPTY_STATE: ProtectionState = Object.freeze({
  blocklist: Object.freeze([]),
  history: Object.freeze([]),
  alerts: Object.freeze([]),
  desktopAlerts: false,
});

const KEY = "fishy.protection.v1";
const persistedSchema = z.object({
  blocklist: z.array(entrySchema),
  history: z.array(entrySchema),
  alerts: z.array(entrySchema),
  desktopAlerts: z.boolean(),
});

function readState(storage: StorageLike | null): ProtectionState {
  if (!storage) return EMPTY_STATE;
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = persistedSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : EMPTY_STATE;
  } catch {
    return EMPTY_STATE;
  }
}

export function createProtectionStore(storage: StorageLike | null, now: () => number = Date.now) {
  let state = readState(storage);
  const listeners = new Set<() => void>();
  let counter = 0;

  const commit = (next: ProtectionState) => {
    state = next;
    try {
      storage?.setItem(KEY, JSON.stringify(next));
    } catch {
      // Storage full or blocked: keep working in memory for this visit.
    }
    listeners.forEach((listener) => listener());
  };

  const makeEntry = (entry: NewEntry): Entry => ({ ...entry, id: `${now()}-${counter++}`, at: now() });

  return {
    getState: (): ProtectionState => state,
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    add(list: ListName, entry: NewEntry): Entry {
      const created = makeEntry(entry);
      const others = list === "blocklist" ? state[list].filter((e) => e.host !== entry.host) : state[list];
      commit({ ...state, [list]: [created, ...others].slice(0, MAX_ENTRIES) });
      return created;
    },
    remove(list: ListName, id: string): void {
      commit({ ...state, [list]: state[list].filter((e) => e.id !== id) });
    },
    unblockHost(host: string): void {
      commit({ ...state, blocklist: state.blocklist.filter((e) => e.host !== host) });
    },
    clear(list: ListName): void {
      commit({ ...state, [list]: [] });
    },
    setDesktopAlerts(enabled: boolean): void {
      commit({ ...state, desktopAlerts: enabled });
    },
    findBlocked(host: string): Entry | undefined {
      return state.blocklist.find((e) => e.host === host);
    },
  };
}

export type ProtectionStore = ReturnType<typeof createProtectionStore>;
