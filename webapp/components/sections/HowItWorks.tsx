import { FillBar, Reveal, ScrollLine } from "@/components/motion/Motion";
import { EXAMPLE_RESULT } from "@/lib/content";
import { percent } from "@/lib/verdict";

// Label and range on their own lines, so the chips never wrap mid label on a phone.
const THRESHOLDS = [
  { label: "Safe", range: "0 to 39", tone: "bg-safe-soft text-safe" },
  { label: "Warning", range: "40 to 69", tone: "bg-warn-soft text-warn" },
  { label: "Blocked", range: "70 and over", tone: "bg-danger-soft text-danger" },
];

const STEPS = [
  { title: "1. You paste a link or a message.", body: "For a message, Fishy finds every link inside it." },
  { title: "2. Two models score it.", body: "Model A (Random Forest) checks 30 features of the address. Model B (TF‑IDF with Logistic Regression) checks letter patterns." },
  { title: "3. The scores are averaged.", body: "The average becomes a risk score out of 100." },
  { title: "4. Then Fishy checks a short trusted list.", body: "If the site is a well known one like google.com, Fishy shows it as safe whatever the average, and still shows you both scores." },
  { title: "5. Fishy acts on the result.", body: "70 or more is blocked and you are alerted. 40 to 69 gets a warning." },
];

export function HowItWorks() {
  const { models, risk } = EXAMPLE_RESULT;
  const a = Math.round(models.a * 1000) / 10;
  const b = Math.round(models.b * 1000) / 10;

  return (
    <section id="how" aria-labelledby="how-title" className="wrap flex flex-col gap-12 pt-24">
      <Reveal className="flex max-w-[720px] flex-col gap-3">
        <h2 id="how-title" className="h-section">How does Fishy decide?</h2>
        <p className="lede">Two models score the link separately. Fishy averages the two scores, checks a short trusted list, and turns the result into one of three answers.</p>
      </Reveal>
      <div className="flex flex-wrap items-start gap-12">
        <div className="flex flex-1 basis-[320px] gap-4">
          <ScrollLine className="self-stretch" />
          <ol className="flex flex-1 flex-col gap-6">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} as="li" delay={i * 0.06} className="list-none">
                <b className="block text-lg font-bold">{s.title}</b>
                <span className="text-base text-muted">{s.body}</span>
              </Reveal>
            ))}
          </ol>
        </div>
        <Reveal className="min-w-0 flex-[1.4] basis-[440px] rounded-3xl bg-mint p-2">
          <div className="flex flex-col gap-6 rounded-2xl bg-white p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-semibold text-muted">Example</span>
              <span className="break-all font-mono text-xs text-muted">{EXAMPLE_RESULT.host}/signin</span>
            </div>
            {[["Model A", models.a], ["Model B", models.b]].map(([name, p]) => (
              <div key={name as string} className="flex flex-col gap-2">
                <div className="flex justify-between text-base"><b className="font-semibold">{name}</b><span className="font-mono">{percent(p as number)}</span></div>
                <FillBar value={p as number} color="#0B1220" track="#F1F2F5" height={10} />
              </div>
            ))}
            <div className="flex items-center justify-between gap-3 border-t border-hair pt-4">
              <span className="text-base text-muted">({a} + {b}) ÷ 2 =</span>
              <span className="flex items-center gap-3">
                <span className="text-4xl font-extrabold tracking-[-0.04em]">{risk}</span>
                <span className="inline-flex h-7 items-center rounded-full bg-danger-bg px-3 text-sm font-semibold text-danger">Dangerous</span>
              </span>
            </div>
            <ul className="grid grid-cols-3 gap-2 text-center">
              {THRESHOLDS.map((t) => (
                <li key={t.label} className={`rounded-lg p-2 ${t.tone}`}>
                  <b className="block text-sm font-semibold">{t.label}</b>
                  <span className="text-xs">{t.range}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
