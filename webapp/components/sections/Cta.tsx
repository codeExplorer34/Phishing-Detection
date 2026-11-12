"use client";

import { useState, type FormEvent } from "react";

import { Reveal } from "@/components/motion/Motion";
import { useScanner } from "@/components/scanner/ScannerProvider";
import { Mascot } from "@/components/ui/Brand";
import { ArrowUp } from "@/components/ui/icons";
import { Sky } from "@/components/visual/Sky";

/** Checks the link with the same scanner as the hero, then shows the result up there. */
export function Cta() {
  const { checkLink, state } = useScanner();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim()) { setError("Paste a link to check."); return; }
    setError(null);
    void checkLink(value);
    document.getElementById("result")?.scrollIntoView({ block: "start" });
  };

  return (
    <section aria-labelledby="cta-title" className="wrap pt-24">
      <Reveal className="relative overflow-hidden rounded-3xl px-6 pb-16 pt-16 text-center">
        <Sky variant="cta" />
        <div className="relative flex flex-col items-center gap-6">
          <Mascot width={72} className="bob" />
          <h2 id="cta-title" className="text-4xl font-extrabold leading-none tracking-[-0.04em] sm:text-5xl">
            Got a link you’re not sure about?
          </h2>
          <form onSubmit={submit} noValidate
            className="flex min-h-[104px] w-full max-w-[600px] items-end justify-between gap-3 rounded-3xl bg-white py-4 pl-6 pr-4 shadow-[0_20px_50px_-18px_rgba(11,18,32,0.35)]">
            <label htmlFor="cta-input" className="sr-only">Link to check</label>
            <input id="cta-input" type="text" inputMode="url" autoComplete="off" autoCapitalize="none" spellCheck={false}
              value={value} maxLength={2048} onChange={(e) => { setValue(e.target.value); setError(null); }}
              placeholder="Paste a link" aria-invalid={Boolean(error)} aria-describedby={error ? "cta-error" : undefined}
              className="min-w-0 flex-1 self-start bg-transparent text-left font-mono text-base text-ink outline-none placeholder:font-sans placeholder:text-muted sm:text-lg" />
            <button type="submit" aria-label="Check link" disabled={state.status === "loading"}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-white hover:bg-ink/85 disabled:opacity-60">
              <ArrowUp size={18} strokeWidth={2.4} />
            </button>
          </form>
          {error && <p id="cta-error" role="alert" className="-mt-2 text-sm font-semibold text-danger">{error}</p>}
        </div>
      </Reveal>
    </section>
  );
}
