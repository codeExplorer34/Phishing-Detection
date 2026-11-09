import { Parallax } from "@/components/motion/Motion";
import { Sky } from "@/components/visual/Sky";
import { METRICS } from "@/lib/content";
import { thousands } from "@/lib/format";

export function FindingBand() {
  const { domains, flip_rate_before, flip_rate_after } = METRICS.slash_bug;
  const before = `${(flip_rate_before * 100).toFixed(1)}%`;
  const after = `${Math.round(flip_rate_after * 100)}%`;

  return (
    <section aria-labelledby="slash-title" className="relative mt-32 overflow-hidden">
      <Sky variant="band" />
      <Parallax distance={30} className="wrap relative">
        <div className="flex flex-wrap items-center gap-x-12 gap-y-4 py-24 text-white">
          <span className="text-[clamp(80px,12vw,160px)] font-extrabold leading-[0.9] tracking-[-0.06em]">{before}</span>
          <div className="flex flex-1 basis-[360px] flex-col gap-3">
            <h2 id="slash-title" className="text-[clamp(24px,2.6vw,32px)] font-extrabold leading-tight tracking-[-0.03em]">
              Why did adding a “/” change the verdict?
            </h2>
            <p className="text-[17px] leading-relaxed text-[#E6FFFB]">
              In the first version of Model B, adding a slash to the end of a bare domain flipped the verdict {before} of
              the time, across {thousands(domains)} test domains. In the training data, bare domains were mostly phishing.
              We removed trailing slashes before training. Now it flips {after} of the time.
            </p>
          </div>
        </div>
      </Parallax>
    </section>
  );
}
