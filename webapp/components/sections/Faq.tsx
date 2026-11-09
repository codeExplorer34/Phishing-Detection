import { Reveal } from "@/components/motion/Motion";
import { FAQS } from "@/lib/content";

/** Native <details>: works without JavaScript and with every screen reader. */
export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="wrap pt-32">
      <div className="flex flex-wrap gap-12">
        <Reveal className="flex-1 basis-[260px]">
          <h2 id="faq-title" className="text-[clamp(30px,3.8vw,44px)] font-extrabold leading-[1.05] tracking-[-0.04em]">
            Questions people ask
          </h2>
        </Reveal>
        <Reveal className="min-w-0 flex-[2] basis-[520px] border-t border-line">
          {FAQS.map((faq, i) => (
            <details key={faq.question} open={i === 0} className="group border-b border-line py-[22px]">
              <summary className="flex items-center justify-between gap-4 text-[18px] font-bold hover:text-teal-deep">
                <h3 className="text-[inherit] font-[inherit]">{faq.question}</h3>
                <span aria-hidden="true" className="faq-icon w-5 shrink-0 text-center text-[22px] font-normal" />
              </summary>
              <p className="mt-3 max-w-[640px] text-base leading-[1.65] text-muted">{faq.answer}</p>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
