"use client";

import { EXAMPLE_RESULT } from "@/lib/content";

import { LinkResult } from "./LinkResult";
import { MessageResultView } from "./MessageResultView";
import { useScanner } from "./ScannerProvider";
import { BlockedBeforeView, ErrorView, LoadingView } from "./StatusViews";

function Body() {
  const { state, checkLink } = useScanner();
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
  const label = state.status === "idle" ? "Example result" : state.status === "loading" ? "Checking…" : "Your result";

  return (
    <div id="result" className="scroll-mt-24 rounded-[22px] bg-white/55 p-2 shadow-[0_40px_80px_-30px_rgba(11,18,32,0.35),0_0_0_1px_rgba(255,255,255,0.7)]">
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_0_0_1px_rgba(11,18,32,0.06)]">
        <div className="flex h-[42px] items-center gap-2 border-b border-hair bg-[#FAFAFB] px-4">
          <span className="h-[11px] w-[11px] rounded-full bg-[#FF5F57]" />
          <span className="h-[11px] w-[11px] rounded-full bg-[#FEBC2E]" />
          <span className="h-[11px] w-[11px] rounded-full bg-[#28C840]" />
          <span className="mx-auto rounded-lg bg-chip px-3.5 py-1 text-xs font-semibold text-muted">{label}</span>
          <span className="w-[49px]" aria-hidden="true" />
        </div>
        <div aria-live="polite" aria-busy={state.status === "loading"} className="p-5 sm:p-7">
          <Body />
        </div>
      </div>
    </div>
  );
}
