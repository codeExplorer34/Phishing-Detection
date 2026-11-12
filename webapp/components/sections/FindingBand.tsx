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
          <span className="text-8xl font-extrabold leading-none tracking-[-0.05em] lg:text-9xl">{before}</span>
          <div className="flex flex-1 basis-[360px] flex-col gap-3">
            <h2 id="slash-title" className="text-3xl font-bold tracking-[-0.03em] lg:text-4xl">
              Why did adding a “/” change the verdict?
            </h2>
            <p className="text-lg leading-relaxed text-[#E6FFFB]">
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
