"use client";

import { useProtection } from "@/components/protection/ProtectionProvider";
import { Alert, Refresh } from "@/components/ui/icons";
import { timeAgo } from "@/lib/format";
import type { Entry } from "@/lib/protectionStore";

import { RiskRing } from "./ResultParts";

export function LoadingView({ slow, tab }: { slow: boolean; tab: "link" | "message" }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-6">
        <div className="skeleton h-32 w-32 rounded-full" />
        <div className="flex flex-1 basis-[260px] flex-col gap-3">
          <div className="skeleton h-6 w-28" />
          <div className="skeleton h-8 w-64 max-w-full" />
          <div className="skeleton h-4 w-80 max-w-full" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
      </div>
      <p className="text-sm font-semibold">
        {tab === "link" ? "Checking the link with both models…" : "Finding the links and checking each one…"}
      </p>
      {slow && (
        <p className="-mt-3 text-sm text-muted">
          The first check after a quiet spell wakes the models up, so it can take a few seconds.
        </p>
      )}
    </div>
  );
}

export function ErrorView({ message, retry }: { message: string; retry: () => void }) {
  const canRetry = !/^Paste a/.test(message);
  return (
    <div role="alert" className="flex flex-col items-start gap-4 py-6">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warn-bg text-warn"><Alert size={24} /></span>
      <div>
        <h2 className="text-xl font-extrabold tracking-[-0.02em]">{canRetry ? "That didn’t work" : "Nothing to check yet"}</h2>
        <p className="mt-1 text-[15px] text-body">{message}</p>
      </div>
      {canRetry && (
        <button type="button" onClick={retry}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-bold text-white hover:bg-ink/85">
          <Refresh size={15} /> Try again
        </button>
      )}
    </div>
  );
}

interface BlockedBeforeProps {
  entry: Entry;
  onCheckAgain: () => void;
}

export function BlockedBeforeView({ entry, onCheckAgain }: BlockedBeforeProps) {
  const { unblock } = useProtection();
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-6">
        <RiskRing risk={entry.risk} color="#E11D48" />
        <div className="flex min-w-0 flex-1 basis-[280px] flex-col gap-2">
          <span className="inline-flex h-[26px] w-fit items-center rounded-full bg-danger-bg px-2.5 text-xs font-bold text-danger">On your blocklist</span>
          <h2 className="text-[26px] font-extrabold tracking-[-0.03em]">You blocked this site before</h2>
          <p className="break-all font-mono text-sm text-muted">{entry.host}</p>
          <p className="text-sm text-muted">Blocked {timeAgo(entry.at)}, without asking the models again.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onCheckAgain}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-bold text-white hover:bg-ink/85">
          <Refresh size={15} /> Check again anyway
        </button>
        <button type="button" onClick={() => unblock(entry.host)}
          className="h-10 rounded-full bg-white px-4 text-sm font-semibold shadow-[0_0_0_1px_rgba(11,18,32,0.12)] hover:bg-soft">
          Remove from blocklist
        </button>
      </div>
    </div>
  );
}
