import { TiltIn } from "@/components/motion/Motion";
import { ResultWindow } from "@/components/scanner/ResultWindow";
import { ScanPanel } from "@/components/scanner/ScanPanel";
import { Mascot } from "@/components/ui/Brand";
import { Sky } from "@/components/visual/Sky";

export function Hero() {
  return (
    <section id="scan" aria-labelledby="hero-title" className="relative scroll-mt-0 pt-[68px]">
      <Sky variant="hero" className="h-[900px] [mask-image:linear-gradient(180deg,#000_70%,transparent)]" />
      <div className="relative">
        <div className="wrap flex flex-col items-center pt-10 text-center sm:pt-14">
          <Mascot width={88} label="Fishy, the fish mascot" className="bob" />
          <p className="mt-[18px] text-sm font-semibold text-[#134e57]">Free · Open source · A CSIT375 student project</p>
          <h1 id="hero-title" className="mt-2.5 text-[clamp(42px,6.4vw,76px)] font-extrabold leading-[1.02] tracking-[-0.04em] [text-wrap:balance]">
            How Fishy is your link?
          </h1>
          <p className="mt-[18px] max-w-[660px] text-[clamp(17px,1.8vw,20px)] leading-normal text-[#1f3340] [text-wrap:pretty]">
            Paste a link or a message to find out if it’s phishing. Fishy scores it with two machine-learning models,
            tells you why, and blocks it in your browser if the risk is high.
          </p>
          <div className="mt-8 flex w-full justify-center"><ScanPanel /></div>
          <p className="mt-3.5 text-[13px] text-[#1f3340]">Fishy never opens the links it checks.</p>
        </div>
        <TiltIn className="wrap mt-14 max-w-[1048px]"><ResultWindow /></TiltIn>
      </div>
    </section>
  );
}
