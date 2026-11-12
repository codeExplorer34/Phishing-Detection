import { Reveal } from "@/components/motion/Motion";
import { FAQS } from "@/lib/content";

import { OpenDetailsOnHash } from "./OpenDetailsOnHash";

/** Native <details>: works without JavaScript and with every screen reader. */
export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="wrap pt-24">
      <OpenDetailsOnHash />
      <div className="flex flex-wrap gap-12">
        <Reveal className="flex-1 basis-[260px]">
          <h2 id="faq-title" className="h-section">
            Questions people ask
          </h2>
        </Reveal>
        <Reveal className="min-w-0 flex-[2] basis-[520px] border-t border-line">
          {FAQS.map((faq, i) => (
            <details key={faq.question} id={faq.id} open={i === 0} className="group scroll-mt-24 border-b border-line py-6">
              <summary className="flex items-center justify-between gap-4 text-lg font-bold hover:text-teal-deep">
                <h3 className="text-[inherit] font-[inherit]">{faq.question}</h3>
                <span aria-hidden="true" className="faq-icon w-5 shrink-0 text-center text-2xl font-normal" />
              </summary>
              <p className="mt-3 max-w-[640px] text-base text-muted">{faq.answer}</p>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
