"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import { Reveal } from "@/components/motion/Motion";
import { useProtection } from "@/components/protection/ProtectionProvider";
import { useScanner } from "@/components/scanner/ScannerProvider";
import { LogoMark } from "@/components/ui/Brand";
import { Download } from "@/components/ui/icons";
import { EXAMPLE_LINKS } from "@/lib/content";
import { toCsv, toHostsFile } from "@/lib/exportBlocklist";
import { timeAgo } from "@/lib/format";
import { LIST_NAMES, type ListName } from "@/lib/protectionStore";
import { VERDICT_STYLES } from "@/lib/verdict";

const LABELS: Record<ListName, string> = { blocklist: "Blocklist", history: "History", alerts: "Alerts" };
const EMPTY: Record<ListName, { title: string; body: string }> = {
  blocklist: { title: "Nothing blocked yet", body: "Dangerous links you check land here automatically, so Fishy can warn you straight away next time. Exports turn on once something is here." },
  history: { title: "No checks yet", body: "Every link you check on this device appears here." },
  alerts: { title: "No alerts yet", body: "Dangerous and suspicious results appear here." },
};
const PHISHING_EXAMPLE = EXAMPLE_LINKS[1];

/** A composed empty list: what will appear here, and one real next step. */
function EmptyList({ list }: { list: ListName }) {
  const { checkLink, state } = useScanner();
  const tryExample = () => {
    void checkLink(PHISHING_EXAMPLE.url);
    document.getElementById("result")?.scrollIntoView({ block: "start" });
  };
  return (
    <div className="m-2 flex flex-col items-center gap-3 rounded-2xl bg-page px-6 py-12 text-center">
      <LogoMark size={30} />
      <h3 className="text-lg font-bold">{EMPTY[list].title}</h3>
      <p className="max-w-[440px] text-sm text-muted">{EMPTY[list].body}</p>
      <button type="button" onClick={tryExample} disabled={state.status === "loading"}
        className="mt-1 h-10 rounded-full bg-ink px-4 text-sm font-semibold text-white hover:bg-ink/85 disabled:bg-line disabled:text-body">
        Try a phishing example
      </button>
      <span className="text-xs text-muted">Checks {PHISHING_EXAMPLE.label}, a made-up phishing link.</span>
    </div>
  );
}
const THREAT: Record<string, string> = { phishing: "Phishing", malware: "Malware", defacement: "Defacement" };

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), intervalMs); return () => clearInterval(t); }, [intervalMs]);
  return now;
}

export function ProtectionCenter() {
  const { state, remove, clear, setDesktopAlerts } = useProtection();
  const [tab, setTab] = useState<ListName>("blocklist");
  const [confirmClear, setConfirmClear] = useState(false);
  const [alertNote, setAlertNote] = useState<string | null>(null);
  const tabRefs = useRef<Record<ListName, HTMLButtonElement | null>>({ blocklist: null, history: null, alerts: null });
  const now = useNow();
  const rows = state[tab];

  useEffect(() => {
    if (!confirmClear) return;
    const t = setTimeout(() => setConfirmClear(false), 4000);
    return () => clearTimeout(t);
  }, [confirmClear]);

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = LIST_NAMES[(LIST_NAMES.indexOf(tab) + step + LIST_NAMES.length) % LIST_NAMES.length];
    setTab(next);
    setConfirmClear(false);
    tabRefs.current[next]?.focus();
  };

  const toggleAlerts = async (enabled: boolean) => {
    const outcome = await setDesktopAlerts(enabled);
    setAlertNote(outcome === "denied" ? "Your browser blocked notifications. You can allow them in its site settings."
      : outcome === "unsupported" ? "This browser doesn’t support desktop notifications." : null);
  };

  return (
    <section id="protection" aria-labelledby="pc-title" className="wrap flex flex-col gap-8 pt-24">
      <Reveal className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex max-w-[640px] flex-col gap-3">
          <h2 id="pc-title" className="h-section">
            What has Fishy blocked on this device?
          </h2>
          <p className="lede">Your blocklist, history and alerts. They are saved only in this browser and never sent anywhere.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-white px-4 text-sm font-medium shadow-[0_0_0_1px_rgba(11,18,32,0.1)]">
            <input type="checkbox" checked={state.desktopAlerts} onChange={(e) => void toggleAlerts(e.target.checked)}
              className="h-4 w-4 accent-ink" />
            Desktop alerts
          </label>
          <button type="button" disabled={state.blocklist.length === 0}
            onClick={() => download("fishy-blocklist.hosts", toHostsFile(state.blocklist), "text/plain")}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-white hover:bg-ink/85 disabled:bg-line disabled:text-body">
            <Download size={14} /> Export hosts file
          </button>
          <button type="button" disabled={state.history.length === 0}
            onClick={() => download("fishy-history.csv", toCsv(state.history), "text/csv")}
            className="h-10 rounded-xl bg-white px-4 text-sm font-semibold shadow-[0_0_0_1px_rgba(11,18,32,0.1)] disabled:bg-line disabled:text-body disabled:shadow-none">
            Export CSV
          </button>
        </div>
        {alertNote && <p role="status" className="w-full text-sm text-warn">{alertNote}</p>}
      </Reveal>

      <Reveal className="card px-2 pb-1 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3 p-2">
          <div role="tablist" aria-label="Protection lists" className="flex gap-1">
            {LIST_NAMES.map((name) => (
              <button key={name} ref={(el) => { tabRefs.current[name] = el; }} id={`pc-tab-${name}`} type="button"
                role="tab" aria-selected={tab === name} aria-controls="pc-panel" tabIndex={tab === name ? 0 : -1}
                onKeyDown={onTabKey} onClick={() => { setTab(name); setConfirmClear(false); }}
                className={`h-10 rounded-full px-4 text-sm font-semibold transition ${tab === name ? "bg-ink text-white" : "text-muted hover:text-ink"}`}>
                {LABELS[name]} ({state[name].length})
              </button>
            ))}
          </div>
          {rows.length > 0 && (
            <button type="button" onClick={() => (confirmClear ? (clear(tab), setConfirmClear(false)) : setConfirmClear(true))}
              className={`h-10 rounded-lg px-3 text-sm font-semibold ${confirmClear ? "bg-danger-bg text-danger" : "text-muted hover:text-ink"}`}>
              {confirmClear ? `Click again to clear ${LABELS[tab].toLowerCase()}` : "Clear"}
            </button>
          )}
        </div>
        <div id="pc-panel" role="tabpanel" aria-labelledby={`pc-tab-${tab}`} className="overflow-x-auto">
          {rows.length === 0 ? (
            <EmptyList list={tab} />
          ) : (
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th scope="col" className="px-4 py-3 font-semibold">Site</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Risk</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Kind</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Found in</th>
                  <th scope="col" className="px-4 py-3 font-semibold">When</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id} className="border-t border-hair">
                    <td className="max-w-[260px] truncate px-4 py-4 font-mono" title={e.url}>{e.host}</td>
                    <td className="px-4 py-4">
                      <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${VERDICT_STYLES[e.verdict].chip}`}>
                        {e.risk} · {VERDICT_STYLES[e.verdict].label}
                      </span>
                    </td>
                    <td className="px-4 py-4">{e.threatType ? THREAT[e.threatType] ?? "Unknown" : "None"}</td>
                    <td className="px-4 py-4 text-muted">{e.source === "link" ? "Link check" : "Message check"}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-muted"><time dateTime={new Date(e.at).toISOString()}>{timeAgo(e.at, now)}</time></td>
                    <td className="px-4 py-4 text-right">
                      <button type="button" onClick={() => remove(tab, e.id)} aria-label={`Remove ${e.host} from ${LABELS[tab].toLowerCase()}`}
                        className="h-8 rounded-lg px-3 text-xs font-semibold text-muted hover:bg-chip hover:text-ink">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Reveal>
    </section>
  );
}
