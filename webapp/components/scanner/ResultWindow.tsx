"use client";

import { EXAMPLE_RESULT } from "@/lib/content";

import { LinkResult } from "./LinkResult";
import { MessageResultView } from "./MessageResultView";
import { useScanner } from "./ScannerProvider";
import { BlockedBeforeView, ErrorView, LoadingView } from "./StatusViews";
import { useCatch } from "./useCatch";

function Body({ caught, tab, skip }: ReturnType<typeof useCatch>) {
  const { state, checkLink } = useScanner();
  if (caught) return <LoadingView slow={false} tab={tab} caught={caught} onSkip={skip} />;
  switch (state.status) {
    case "idle":
      return <LinkResult result={EXAMPLE_RESULT} example />;
    case "loading":
      return <LoadingView slow={state.slow} tab={state.tab} />;
    case "link":
      return <LinkResult key={state.result.url} result={state.result} />;
    case "message":
      return <MessageResultView result={state.result} text={state.text} />;
    case "blocked-before":
      return <BlockedBeforeView entry={state.entry} onCheckAgain={() => void checkLink(state.input, { force: true })} />;
    case "error":
      return <ErrorView message={state.message} retry={state.retry} />;
  }
}

/** The "browser window" under the hero. Shows an example until the visitor checks something. */
export function ResultWindow() {
  const { state } = useScanner();
  const sequence = useCatch(state);
  const busy = state.status === "loading" || sequence.caught !== null;
  const label = state.status === "idle" ? "Example result" : busy ? "Checking…" : "Your result";

  return (
    <div id="result" className="scroll-mt-24 rounded-3xl bg-white/55 p-2 shadow-[0_40px_80px_-30px_rgba(11,18,32,0.35),0_0_0_1px_rgba(255,255,255,0.7)]">
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_0_0_1px_rgba(11,18,32,0.06)]">
        <div className="flex h-10 items-center gap-2 border-b border-hair bg-[#FAFAFB] px-4">
          <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
          <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
          <span className="h-3 w-3 rounded-full bg-[#28C840]" />
          <span className="mx-auto rounded-lg bg-chip px-4 py-1 text-xs font-semibold text-muted">{label}</span>
          <span className="w-[49px]" aria-hidden="true" />
        </div>
        <div aria-live="polite" aria-busy={busy} className="p-6 sm:p-8">
          <Body {...sequence} />
        </div>
      </div>
    </div>
  );
}
