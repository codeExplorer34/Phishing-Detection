import { FillBar, Reveal, ScrollLine } from "@/components/motion/Motion";
import { EXAMPLE_RESULT } from "@/lib/content";
import { percent } from "@/lib/verdict";

const STEPS = [
  { title: "1. You paste a link or a message.", body: "For a message, Fishy finds every link inside it." },
  { title: "2. Two models score it.", body: "Model A (Random Forest) checks 30 features of the address. Model B (TF‑IDF with Logistic Regression) checks letter patterns." },
  { title: "3. The scores are averaged.", body: "Well-known sites like google.com are checked against a short trusted list first." },
  { title: "4. Fishy acts on the result.", body: "70 or more is blocked and you are alerted. 40 to 69 gets a warning." },
];

export function HowItWorks() {
  const { models, risk } = EXAMPLE_RESULT;
  const a = Math.round(models.a * 1000) / 10;
  const b = Math.round(models.b * 1000) / 10;

  return (
    <section id="how" aria-labelledby="how-title" className="wrap flex flex-col gap-11 pt-32">
      <Reveal className="flex max-w-[720px] flex-col gap-3">
        <h2 id="how-title" className="h-section">How does Fishy decide?</h2>
        <p className="lede">Two models score the link separately. Fishy averages the two scores and turns the result into one of three answers.</p>
      </Reveal>
      <div className="flex flex-wrap items-start gap-10">
        <div className="flex flex-1 basis-[320px] gap-[18px]">
          <ScrollLine className="self-stretch" />
          <ol className="flex flex-1 flex-col gap-[26px]">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} as="li" delay={i * 0.06} className="list-none">
                <b className="block text-[17px] font-extrabold">{s.title}</b>
                <span className="text-[15px] leading-relaxed text-muted">{s.body}</span>
              </Reveal>
            ))}
          </ol>
        </div>
        <Reveal className="min-w-0 flex-[1.4] basis-[440px] rounded-[22px] bg-gradient-to-b from-[#5cc6cf] to-[#a8e8e3] p-2">
          <div className="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-[0_0_0_1px_rgba(11,18,32,0.06)] sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[13px] font-bold text-muted">Example</span>
              <span className="break-all font-mono text-xs text-muted">{EXAMPLE_RESULT.host}/signin</span>
            </div>
            {[["Model A", models.a], ["Model B", models.b]].map(([name, p]) => (
              <div key={name as string} className="flex flex-col gap-2">
                <div className="flex justify-between text-[15px]"><b className="font-bold">{name}</b><span className="font-mono">{percent(p as number)}</span></div>
                <FillBar value={p as number} color="#0B1220" track="#F1F2F5" height={10} />
              </div>
            ))}
            <div className="flex items-center justify-between gap-3 border-t border-hair pt-4">
              <span className="text-[15px] text-muted">({a} + {b}) ÷ 2 =</span>
              <span className="flex items-center gap-2.5">
                <span className="text-[34px] font-extrabold tracking-[-0.04em]">{risk}</span>
                <span className="inline-flex h-7 items-center rounded-full bg-danger-bg px-3 text-[13px] font-bold text-danger">Dangerous</span>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
              <span className="rounded-[10px] bg-safe-soft p-2 text-safe">0 to 39: Safe</span>
              <span className="rounded-[10px] bg-warn-soft p-2 text-warn">40 to 69: Warning</span>
              <span className="rounded-[10px] bg-danger-soft p-2 text-danger">70+: Blocked</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
