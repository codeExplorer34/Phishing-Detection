import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MotionProvider } from "@/components/motion/Motion";
import { ProtectionProvider } from "@/components/protection/ProtectionProvider";
import { ScannerProvider } from "@/components/scanner/ScannerProvider";
import { About } from "@/components/sections/About";
import { Accuracy } from "@/components/sections/Accuracy";
import { Cta } from "@/components/sections/Cta";
import { Faq } from "@/components/sections/Faq";
import { FindingBand } from "@/components/sections/FindingBand";
import { Findings } from "@/components/sections/Findings";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { ProtectionCenter } from "@/components/sections/ProtectionCenter";
import { WhatHappens } from "@/components/sections/WhatHappens";

export default function Home() {
  return (
    <MotionProvider>
      <ProtectionProvider>
        <ScannerProvider>
          <Header />
          <main id="main" className="overflow-x-clip">
            <Hero />
            <HowItWorks />
            <Accuracy />
            <FindingBand />
            <WhatHappens />
            <ProtectionCenter />
            <Findings />
            <Faq />
            <About />
            <Cta />
          </main>
          <Footer />
        </ScannerProvider>
      </ProtectionProvider>
    </MotionProvider>
  );
}
