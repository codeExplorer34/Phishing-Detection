"use client";

import { Alert, Bell, Close, ShieldCheck } from "@/components/ui/icons";

export type ToastTone = "danger" | "warn" | "info";

export interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  detail?: string;
}

const TONES: Record<ToastTone, { ring: string; badge: string; Icon: typeof Bell }> = {
  danger: { ring: "ring-danger-bar/30", badge: "bg-danger-bg text-danger", Icon: Bell },
  warn: { ring: "ring-warn-bar/30", badge: "bg-warn-bg text-warn", Icon: Alert },
  info: { ring: "ring-teal-deep/20", badge: "bg-mint text-teal-deep", Icon: ShieldCheck },
};

interface ToasterProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

export function Toaster({ toasts, onDismiss }: ToasterProps) {
  return (
    <div
      aria-live="polite"
      aria-relevant="additions"
      className="pointer-events-none fixed inset-x-4 top-20 z-[60] flex flex-col items-end gap-2 sm:left-auto sm:right-6"
    >
      {toasts.map((t) => {
        const { ring, badge, Icon } = TONES[t.tone];
        return (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-sm animate-[toastIn_0.25s_ease-out] items-center gap-3 rounded-2xl bg-white py-3 pl-3 pr-2 shadow-[0_12px_30px_-12px_rgba(11,18,32,0.35)] ring-1 ${ring}`}
          >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${badge}`}><Icon size={16} /></span>
            <span className="flex min-w-0 flex-1 flex-col">
              <b className="text-sm font-bold">{t.title}</b>
              {t.detail && <span className="truncate font-mono text-xs text-muted">{t.detail}</span>}
            </span>
            <button type="button" onClick={() => onDismiss(t.id)} aria-label="Dismiss"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-chip hover:text-ink">
              <Close size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
