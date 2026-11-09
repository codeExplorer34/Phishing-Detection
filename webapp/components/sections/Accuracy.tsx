import { FillBar, Reveal } from "@/components/motion/Motion";
import { ACCURACY_ROWS, LAST_UPDATED, METRICS, WORST } from "@/lib/content";
import { f3, longDate, thousands } from "@/lib/format";
import { REPO_URL } from "@/lib/site";

function Score({ value, best, ours }: { value: number; best: boolean; ours?: boolean }) {
  return (
    <>
      <span className={`font-mono ${best ? "font-semibold" : ""}`}>{f3(value)}</span>
      <FillBar value={value} height={6} className="mt-2 w-[140px] max-w-full"
        color={ours ? "#0f766e" : best ? "#0B1220" : "#9CA3AF"} track={ours ? "#CCFBF1" : "#F1F2F5"} />
    </>
  );
}

export function Accuracy() {
  return (
    <section id="accuracy" aria-labelledby="accuracy-title" className="wrap flex flex-col gap-8 pt-32">
      <Reveal className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex max-w-[720px] flex-col gap-3">
          <h2 id="accuracy-title" className="h-section">How accurate is Fishy?</h2>
          <p className="lede">
            Each model is strong on the kind of data it learned from and weak on the other. Averaging them is never the top
            score, but its worst result is far better than either model’s worst.
          </p>
        </div>
        <p className="text-[13px] text-muted">Last updated <time dateTime={LAST_UPDATED}>{longDate(LAST_UPDATED)}</time></p>
      </Reveal>

      {/* Phones: one card per dataset, so no sideways scrolling is needed. */}
      <div className="grid gap-3 sm:hidden">
        {[...ACCURACY_ROWS.map((r) => ({ ...r, worst: false })), { name: "Worst of the two", links: 0, ...WORST, worst: true }].map((row) => (
          <Reveal key={row.name} className="card p-5">
            <h3 className="font-bold">{row.name}</h3>
            {row.links > 0 && <p className="text-[13px] text-muted">{thousands(row.links)} links, F1 score</p>}
            <dl className="mt-4 flex flex-col gap-3">
              {([["Model A", row.a, false], ["Model B", row.b, false], ["Both averaged (Fishy)", row.both, true]] as const).map(([label, value, ours]) => (
                <div key={label} className={ours ? "-mx-2 rounded-xl bg-mint-soft px-2 py-2" : ""}>
                  <div className="flex justify-between text-sm">
                    <dt className={ours ? "font-bold" : "text-body"}>{label}</dt>
                    <dd className={`font-mono ${ours ? "font-semibold text-teal-deep" : ""}`}>{f3(value)}</dd>
                  </div>
                  {!row.worst && <FillBar value={value} height={6} className="mt-1.5" color={ours ? "#0f766e" : "#0B1220"} track={ours ? "#CCFBF1" : "#F1F2F5"} />}
                </div>
              ))}
            </dl>
          </Reveal>
        ))}
      </div>

      <Reveal className="card hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[720px] border-collapse text-[15px]">
          <caption className="sr-only">F1 score of each model on links it never saw during training</caption>
          <thead>
            <tr className="text-left text-[13px] text-muted">
              <th scope="col" className="px-5 py-[18px] font-semibold">F1 score on links the models never saw</th>
              <th scope="col" className="px-5 py-[18px] font-semibold">Model A</th>
              <th scope="col" className="px-5 py-[18px] font-semibold">Model B</th>
              <th scope="col" className="px-5 py-[18px] font-bold text-ink">Both averaged (Fishy)</th>
            </tr>
          </thead>
          <tbody>
            {ACCURACY_ROWS.map((row) => (
              <tr key={row.name} className="border-t border-hair">
                <th scope="row" className="px-5 py-[18px] text-left font-semibold">
                  {row.name}<br /><span className="text-[13px] font-normal text-muted">{thousands(row.links)} links</span>
                </th>
                <td className="px-5 py-[18px]"><Score value={row.a} best={row.a >= row.b} /></td>
                <td className="px-5 py-[18px]"><Score value={row.b} best={row.b > row.a} /></td>
                <td className="bg-mint-soft px-5 py-[18px]"><Score value={row.both} best={false} ours /></td>
              </tr>
            ))}
            <tr className="border-t-2 border-line">
              <th scope="row" className="px-5 py-[18px] text-left font-extrabold">Worst of the two</th>
              <td className="px-5 py-[18px] font-mono text-danger">{f3(WORST.a)}</td>
              <td className="px-5 py-[18px] font-mono">{f3(WORST.b)}</td>
              <td className="bg-mint-soft px-5 py-[18px] font-mono font-semibold text-teal-deep">{f3(WORST.both)}</td>
            </tr>
          </tbody>
        </table>
      </Reveal>

      <Reveal className="flex flex-wrap gap-6 text-sm leading-relaxed text-muted">
        <p className="flex-[2] basis-[480px]">
          F1 combines how many phishing links were caught with how many safe links were wrongly flagged. 1.0 is perfect.
          Threshold {METRICS.threshold}. Any link that either model saw during training was removed first. On their own
          test sets the scores are higher: Model A {f3(METRICS.in_domain.model_a_url_only_f1)}, Model B{" "}
          {f3(METRICS.in_domain.model_b_binary_f1)}.
        </p>
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="flex-1 basis-[200px] font-bold text-teal-deep hover:underline">
          See the code and raw results on GitHub
        </a>
      </Reveal>
    </section>
  );
}
