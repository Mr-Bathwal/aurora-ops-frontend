import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Hero } from "@/components/home/hero";
import { FleetConstellation } from "@/components/home/fleet-constellation";
import { OutcomeRing } from "@/components/home/outcome-ring";
import { DesignedFor } from "@/components/home/designed-for";
import { StepFlow } from "@/components/home/step-flow";
import { FinalCta } from "@/components/home/final-cta";
import { SectionHeading } from "@/components/aurora/section-heading";
import { SectionBand } from "@/components/aurora/section-band";

/** The landing page, built to the reference's section storyboard.
 *
 * Every block below the hero is a full-bleed band that announces itself with the same
 * centred, shimmer heading, and the bands alternate between the near-black floor and the
 * raised surface so the page reads as chapters rather than one scroll. The old page stacked
 * differently-styled sections with tiny left-aligned labels; the whole point of this pass is
 * that the sections now share a single grammar with the hero and with each other.
 *
 * The left-aligned SectionLabels and the vertical "anchor" threads are gone: the reference's
 * cohesion comes from that shared heading grammar and the consistent rhythm, not from drawn
 * connectors between blocks.
 */
export default function DashboardPage() {
  return (
    <>
      <Hero />

      {/* Who it's for. Floor tone: the diagram is a dark space scene and wants the page's own
          near-black behind it, not a raised plate. */}
      <SectionBand tone="floor">
        <DesignedFor />
      </SectionBand>

      {/* The fleet — the reference's feature grid. */}
      <SectionBand tone="raised">
        <SectionHeading
          eyebrow="Deployed sentinels"
          sub="Each one owns a corner of the stack — watching, reading, and acting the moment its patch of the world goes wrong."
        >
          Meet the fleet that never sleeps.
        </SectionHeading>

        <div className="mt-16">
          <FleetConstellation />
        </div>

        {/* The reference closes this composition with a 3rem spacer before its last line;
            here that gap sits between the constellation and the way through to the roster. */}
        <div className="mt-12 flex justify-center">
          <Link
            href="/agents"
            className="group inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            View the whole fleet
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </SectionBand>

      {/* How it works. Floor tone is not a choice — the step card *is* `--bg-2`, so on a
          raised band it would be the same colour as the band it sits on and survive only as
          an outline. The reference does the same thing: its card is #0c0f14 on a #050707
          body. Everything below shifts a tone to keep the alternation going. */}
      <SectionBand tone="floor" className="steps-glass">
        <StepFlow />
      </SectionBand>

      {/* The outcome. Pure black rather than a tone from the ramp: both pieces of art here
          composite with `mix-blend-mode: screen` and were floored to true black on export, so
          on #000 they leave the band untouched and read as light with no plate under them. */}
      <SectionBand tone="floor" className="bg-black">
        <OutcomeRing />
      </SectionBand>

      {/* The close. `-mb-36` cancels the shell's `pb-36`: main pads its bottom for the ordinary
          content pages, but a full-bleed band has already carried its own `py-24`, so that
          padding would land as a strip of page floor between the last band and the footer. */}
      <SectionBand tone="raised" className="-mb-36">
        <FinalCta />
      </SectionBand>
    </>
  );
}
