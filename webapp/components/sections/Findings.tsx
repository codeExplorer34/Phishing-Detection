import { Reveal } from "@/components/motion/Motion";
import { FINDINGS } from "@/lib/content";

export function Findings() {
  return (
    <section id="findings" aria-labelledby="findings-title" className="wrap flex flex-col gap-8 pt-24">
      <Reveal className="flex max-w-[720px] flex-col gap-3">
        <h2 id="findings-title" className="h-section">What did we find that we didn’t expect?</h2>
        <p className="lede">Three results from testing our own models. Each one changed how Fishy works.</p>
      </Reveal>
      <div className="grid gap-4 lg:grid-cols-3">
        {FINDINGS.map((f, i) => {
          const external = f.link.href.startsWith("http");
          return (
            <Reveal key={f.title} as="article" delay={i * 0.08} className="card flex flex-col gap-3 p-8">
              <span className="text-5xl font-extrabold leading-tight tracking-[-0.05em]">{f.figure}</span>
              <h3 className="text-lg font-bold tracking-[-0.02em]">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{f.body}</p>
              <a href={f.link.href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="mt-auto pt-1 text-sm font-bold text-teal-deep hover:underline">{f.link.label}</a>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
