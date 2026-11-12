import { TiltIn } from "@/components/motion/Motion";
import { ResultWindow } from "@/components/scanner/ResultWindow";
import { ScanPanel } from "@/components/scanner/ScanPanel";
import { Mascot } from "@/components/ui/Brand";
import { Sky } from "@/components/visual/Sky";

export function Hero() {
  return (
    <section id="scan" aria-labelledby="hero-title" className="relative scroll-mt-0 pt-16">
      <Sky variant="hero" className="h-[900px] [mask-image:linear-gradient(180deg,#000_70%,transparent)]" />
      <div className="relative">
        <div className="wrap flex flex-col items-center pt-10 text-center sm:pt-16">
          <Mascot width={88} label="Fishy, the fish mascot" className="bob" />
          <p className="mt-4 text-sm font-medium text-[#134e57]">Free · Open source · A CSIT375 student project</p>
          <h1 id="hero-title" className="mt-3 text-5xl leading-none font-extrabold tracking-[-0.045em] sm:text-6xl lg:text-7xl lg:leading-none">
            How Fishy is your link?
          </h1>
          <p className="mt-6 max-w-[680px] text-lg text-[#1f3340] sm:text-xl">
            Paste a link or a message to find out if it’s phishing. Fishy scores it with two machine learning models,
            tells you why, and blocks it in your browser if the risk is high.
          </p>
          <div className="mt-8 flex w-full justify-center"><ScanPanel /></div>
          <p className="mt-3 text-sm text-[#1f3340]">Fishy never opens the links it checks.</p>
        </div>
        <TiltIn className="wrap mt-16 max-w-[1048px]"><ResultWindow /></TiltIn>
      </div>
    </section>
  );
}
