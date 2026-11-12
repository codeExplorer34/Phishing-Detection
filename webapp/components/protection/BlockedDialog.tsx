"use client";

import { useEffect, useRef } from "react";

import { Ban } from "@/components/ui/icons";
import { safeHref } from "@/lib/url";

export interface PendingOpen {
  url: string;
  host: string;
  risk: number;
  reason: string | null;
}

interface BlockedDialogProps {
  pending: PendingOpen | null;
  onClose: () => void;
}

/** Second click needed before opening a dangerous link. Native <dialog>: focus trap and Esc built in. */
export function BlockedDialog({ pending, onClose }: BlockedDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const safeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (pending && !dialog.open) {
      dialog.showModal();
      safeButton.current?.focus();   // the safe choice must be the default, never "open it"
    }
    if (!pending && dialog.open) dialog.close();
  }, [pending]);

  const openAnyway = () => {
    const href = pending ? safeHref(pending.url) : null;
    if (href) window.open(href, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      aria-labelledby="blocked-title"
      aria-describedby="blocked-desc"
      className="m-auto w-[min(520px,calc(100%-32px))] rounded-3xl bg-white p-0 text-ink shadow-[0_40px_100px_-30px_rgba(11,18,32,0.55)]"
    >
      {pending && (
        <div className="flex flex-col gap-6 p-8 sm:p-8">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-bg text-danger"><Ban size={28} /></span>
          <div className="flex flex-col gap-3">
            <h2 id="blocked-title" className="text-3xl font-bold tracking-[-0.03em]">This link is blocked.</h2>
            <p id="blocked-desc" className="text-base leading-relaxed text-body">
              Fishy rated <span className="font-mono text-ink break-all">{pending.host}</span>{" "}
              <b className="font-bold text-danger">{pending.risk} out of 100</b>.
              {pending.reason ? ` ${pending.reason}` : ""}
            </p>
          </div>
          <ul className="flex flex-col gap-2 rounded-2xl bg-soft px-4 py-4 text-sm text-body">
            <li>• Never type a password on a page you reached from an email or text.</li>
            <li>• If you need the real site, type its address yourself.</li>
          </ul>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button type="button" onClick={openAnyway}
              className="h-11 rounded-xl px-3 text-sm font-semibold text-danger underline underline-offset-2 hover:bg-danger-soft">
              I understand the risk, open it
            </button>
            <button ref={safeButton} type="button" onClick={onClose}
              className="h-11 rounded-full bg-ink px-6 text-sm font-bold text-white hover:bg-ink/90">
              Keep me safe
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
