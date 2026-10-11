"use client";

import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { HeroBackdrop } from "@/components/home/hero-backdrop";
import { OrchestrationScene } from "@/components/home/orchestration-scene";
import { FleetOverviewPanel } from "@/components/home/fleet-overview-panel";

/** The hero, built to the reference's measured geometry.
 *
 * Every number below was read off the live reference at a 1440x900 viewport rather than
 * estimated from a screenshot, because at this size estimation is what produces a page that
 * is *nearly* right in a way nobody can name:
 *
 *   h1     64/700, line-height 76.8px, letter-spacing -1px, 960 wide, top at y=128
 *   para   24/400, line-height 36px, 960 wide           — 24px below the headline
 *   CTAs   16/600, padding 12px 28px, radius 90px, 50 tall — 40px below the copy
 *   shot   1344 wide (48px gutters), radius 16px         — 64px below the buttons
 *
 * The nav is 77px including its border and sits in flow, and the shell adds 32px of its own
 * top padding — so the section cancels that padding and applies 51px, which lands the
 * headline on 128 exactly.
 */

/** Authored line breaks, not reflow. The break after "3am." is the joke — the setup lands,
 * then the turn. Left to wrap on its own the beat falls mid-setup at most widths. */
const HEADLINE = ["Infrastructure fails at 3am.", "Your team shouldn't have to."];

/** Navbar height including its 1px bottom border — the sky is pulled up by exactly this to
 * reach the top of the window. */
const NAV_H = 77;

const rise: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: 0.08 * i, ease: [0.2, 0.7, 0.2, 1] },
  }),
};

export function Hero() {
  const router = useRouter();

  // -mt-8 cancels the shell's own py-8 so this section's geometry is measured from the
  // navbar, not from an inherited gutter.
  return (
    <section className="relative isolate -mt-8 pt-[51px]">
      {/* Full-bleed sky, pulled up behind the navbar so the plate runs to the top of the
          window the way it does on the reference — a sky that starts below the chrome reads
          as a panel rather than as the room the page is in.
          Width is 100vw minus the scrollbar (see SmoothScroll): plain 100vw is a scrollbar
          too wide and gives the whole page a horizontal scroll. */}
      <div
        className="absolute left-1/2 -z-10 -translate-x-1/2"
        style={{
          top: -NAV_H,
          width: "calc(100vw - var(--sbw, 0px))",
          // Height derived from width against the plate's own 2400x1394 ratio, not fixed.
          // A fixed height makes `cover` flip between scaling by width and by height as the
          // window changes, so the same CSS frames a different part of the sky at 1440 than
          // at 1920 — which is how the light shaft and the beaded arc kept sliding out of
          // shot. Tied to the ratio, the same portion of the plate is on screen at every
          // width. The floor keeps the sky from collapsing to a strip on phones, where the
          // crop goes horizontal instead.
          height: "max(720px, calc((100vw - var(--sbw, 0px)) / 1.722))",
        }}
      >
        <HeroBackdrop />
      </div>

      {/* Copy sits in a centred, narrow measure inside the shell's normal content width.
          Only the product frame below breaks out to full width. */}
      <div className="mx-auto max-w-[960px] px-6 text-center">
          <motion.h1
            initial="hidden"
            animate="show"
            custom={0}
            variants={rise}
            /* The one clamp on the page, interpolating up to the h1 token so the scale still
               owns the top end. -0.0156em is the reference's -1px expressed relatively, so
               the tracking holds as the size comes down. */
            style={{
              fontSize: "clamp(2.125rem, 5.4vw, var(--text-h1))",
              lineHeight: 1.2,
              letterSpacing: "-0.0156em",
              backgroundImage: "var(--grad-h1)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
            className="font-heading font-bold"
          >
            {HEADLINE.map((line) => (
              <span key={line} className="block">{line}</span>
            ))}
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="show"
            custom={1}
            variants={rise}
            /* 24px, and full-strength text rather than the muted grey. The reference sets
               its sub-headline at the same colour as the headline and lets size and weight
               do the demoting — dimming it as well is what makes a hero feel timid. */
            className="mt-6 text-[1.5rem] font-normal leading-[1.5] text-foreground"
          >
            Aurora Ops watches every box, reads every log, and fixes what it can reach —
            long before the page ever gets to your phone.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="show"
            custom={2}
            variants={rise}
            className="mt-10 flex flex-wrap items-center justify-center gap-3.5"
          >
            <button
              type="button"
              onClick={() => router.push("/run")}
              className="group inline-flex h-[50px] items-center gap-2.5 rounded-[var(--radius-pill)] px-7 text-body font-semibold text-[#0c0f14] transition-shadow duration-200 hover:shadow-[0_0_36px_-6px_rgba(62,156,255,0.7)]"
              style={{ backgroundImage: "var(--grad)" }}
            >
              Run your first agent
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>

            <button
              type="button"
              onClick={() => router.push("/run?tab=orchestrator")}
              /* Blue label, not white — the reference's secondary CTA carries the accent in
                 its text instead of in a fill. */
              className="group inline-flex h-[50px] items-center gap-2.5 rounded-[var(--radius-pill)] border border-white/12 bg-[#12161d] px-7 text-body font-semibold text-brand transition-colors duration-200 hover:border-white/22 hover:bg-[#161b24]"
            >
              <span className="grid size-6 place-items-center rounded-full border border-brand/60">
                <Play className="size-2.5 fill-brand text-brand" />
              </span>
              Watch it work
            </button>
          </motion.div>
        </div>

        {/* The main card. The reference pairs its dashboard with a right-hand insights
            column; ours pairs the interactive orchestration scene with a live fleet-overview
            panel. Full-bleed so it can be sized against the *viewport*, then held to 84% of
            it — the reference's measured width — so the sky reads on both sides. */}
        <motion.div
          initial={{ opacity: 0, y: 46 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.34, ease: [0.2, 0.7, 0.2, 1] }}
          className="relative"
          /* The gap scales: the plate behind it is sized from the viewport width while this
             gap is not, so a fixed value lets the beaded arc clear the card at one window
             size and hide behind it at another. */
          style={{
            marginTop: "clamp(3.5rem, 9vw, 11rem)",
            marginLeft: "calc(50% - 50vw + var(--sbw, 0px) / 2)",
            marginRight: "calc(50% - 50vw + var(--sbw, 0px) / 2)",
          }}
        >
          {/* 84vw, capped, centred — the reference's proportions. */}
          <div className="relative mx-auto w-[84%] max-w-[1600px]">
            {/* Ambient pool behind the card — visible only in the margins around it, since
                the card itself is opaque. Left of centre, under where the beam lands. */}
            <div
              aria-hidden
              className="absolute inset-x-0 -top-20 bottom-0 -z-10 blur-[80px]"
              style={{
                background: "radial-gradient(60% 55% at 26% 20%, rgba(62,156,255,0.4), transparent 70%)",
                mixBlendMode: "screen",
              }}
            />

            {/* The scatter where the beam meets the card's top-left corner.
                Deliberately diffuse: an earlier version drew a hard 3px rim along the top
                edge, which read as a white line someone had stroked on rather than light
                falling across a surface. Light dispersing over an edge has no edge of its
                own — so this is a wide, low-peak radial with a heavy blur, straddling the
                corner so it fades out in every direction. */}
            <div
              aria-hidden
              className="pointer-events-none absolute -left-[4%] -top-[130px] z-30 h-[210px] w-[56%]"
              style={{
                background:
                  "radial-gradient(48% 62% at 22% 76%, rgba(198,242,255,0.62), rgba(110,205,255,0.3) 42%, rgba(62,156,255,0.1) 66%, transparent 80%)",
                filter: "blur(34px)",
                mixBlendMode: "screen",
              }}
            />

            {/* Two nested frames, which is how the reference is actually built: an outer box
                with a hairline edge, then a wide dark margin, and only then the console
                itself — lit by a soft glow around its own border. Measured off the
                reference at 1440: the outer box is 1344 wide and the dashboard inside it is
                1250, inset 47px a side, so the margin is ~3.5% of the card's width and
                scales with it rather than sitting at a fixed pixel value. */}
            {/* The bezel. One rounded frame with a cool-tinted edge and only a thin dark
                gutter inside it — the earlier version put a 47px margin here, which read as
                a picture mounted in a mat rather than as a console bezel.
                Inside, the two halves are *separate panels with a gap*, each carrying its
                own border, exactly as the reference splits its dashboard from its insights
                column. Fusing them into one frame with a divider line was the difference
                that made ours read as one screen instead of two. */}
            {/* Sampled off the reference at 1440, scanning across the edge at y=740:
                  x=79      rgb(25,50,73)   the bezel's own edge — faint
                  x=82..94  rgb(9,29,50) -> rgb(21,54,88)  the gutter, glowing blue
                  x=110-11  rgb(69,123,177) the panel border — crisp, ~2px, and bright
                An earlier pass had this inverted: the blue on the bezel and a washed
                white hairline on the panels. The lit edge belongs to the *panels*. */}
            <div className="relative rounded-[16px] border border-white/8 bg-[#080b12] p-2.5 shadow-[0_28px_100px_-34px_rgba(0,0,0,0.95),0_0_60px_-18px_rgba(62,156,255,0.45)] sm:p-3">
              {/* The gutter is not flat black on the reference — it carries the glow the
                  panels sit in. Screen-blended so it only ever adds light. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[16px]"
                style={{
                  background:
                    "radial-gradient(120% 90% at 24% 0%, rgba(62,156,255,0.4), rgba(52,245,197,0.14) 45%, transparent 72%)",
                  mixBlendMode: "screen",
                }}
              />

              <div className="relative flex flex-col gap-2.5 lg:flex-row lg:gap-3">
                {/* left: the interactive scene — hover an agent to dim the rest and light
                    its route to the router. Keeps its own aspect so the hotspots stay
                    pinned to the art. */}
                <div className="min-w-0 overflow-hidden rounded-[12px] border border-[rgba(92,172,224,0.72)] shadow-[0_0_26px_-6px_rgba(92,172,224,0.55)] lg:flex-1">
                  <OrchestrationScene bare />
                </div>
                {/* right: the live overview — the reference's insights column. It brings its
                    own border and background, so it *is* the second panel rather than
                    sitting inside another wrapper. */}
                <div className="lg:w-[320px] xl:w-[350px]">
                  <FleetOverviewPanel />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
    </section>
  );
}
