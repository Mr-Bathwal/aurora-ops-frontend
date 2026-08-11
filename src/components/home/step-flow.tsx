"use client";

import { useRef } from "react";
import {
  easeOut,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { MessageSquareText, ShieldCheck, Waypoints } from "lucide-react";
import { SectionHeading } from "@/components/aurora/section-heading";
import { RemediateScene, RequestScene, RoutingScene } from "@/components/home/step-scenes";

/** "Simple 3-step flow" — the reference's `.section_home-steps`, rebuilt around our work.
 *
 * Measured off the running page rather than eyeballed, and almost all of it turned out to be
 * tokens we already hold: the card is `#0c0f14` on a `#050707` floor with a `#1f242c` border
 * at a 20px radius — which is `--bg-2` on `--bg` with `--surface`, exactly. The section
 * heading is 42px Manrope 700 under
 * `linear-gradient(80deg, #acb5c4, #fff 40%, #fff 60%, #acb5c4)`, which is `--grad-text`
 * character for character, so `SectionHeading` already renders it. Card title 22px is
 * `--text-h4`; the sub-line at 16px is `--text-body`. Nothing new had to be invented.
 *
 * Structure, in the reference's terms:
 *   .card_type3               overflow-hidden column, gap 2rem, padding-bottom 2rem
 *     .card-illustration_wrap the mockup's window — ~377×236, cropping whatever overruns it
 *       .illustration_background   a colour-dodged glow behind the art
 *       .card_illustration         the animation, inset 1rem, absolutely placed
 *       .illustration-_bottom-overlay  a 3rem fade from transparent to the card colour
 *     .card_inner-wrap        icon, title, sub — 0.5rem apart, 1rem in from the card edge
 *
 * The entrance deviates from the reference deliberately. The reference hangs a ScrollTrigger
 * on the card row with `start: "top 80%"` and **no scrub**, so all three play on a timer
 * 0.15s apart — which at reading speed is effectively all at once. Here it is scrubbed to
 * scroll instead, with a stagger wide enough that a card is nearly landed before the next
 * one starts, so the row builds left to right as you come down the page. Same tween
 * otherwise: `from {opacity: 0, y: 40}` on a `power2.out` curve.
 *
 * The scenes inside are unaffected and keep their own clock, which is the reference's
 * behaviour: its Lotties are `autoplay` + `loop` and carry `data-is-ix2-target="0"`, so
 * nothing about them is tied to the scroll position.
 */

/* Card `i` occupies [i·STAGGER, i·STAGGER + DUR] of a TOTAL-long timeline, normalised onto
   the scroll range below. At 0.8 the overlap between neighbours is about a fifth — enough to
   keep the row moving continuously, not enough to read as three cards arriving together. */
const DUR = 1;
const STAGGER = 0.8;
const TOTAL = DUR + STAGGER * 2;

/* ── The plate behind each mockup ────────────────────────────────────────────────────────
 *
 * The reference's `card decorative.avif` is not the plain glow a coarse sample makes it look
 * like. Decoded at native resolution it is a stepped grid of frosted panes under a large
 * elliptical vignette, composited `mix-blend-mode: color-dodge`. Dividing the vignette back
 * out puts the seams at:
 *
 *   vertical    7.5%- 9.0%+   22.5%- 24.0%+   36.6%- 38.0%+   52.1%-   81.6%-   93.7%-
 *   horizontal  1.1%+   24.6%- 27.3%+   65.9%- 68.2%+   91.3%-
 *
 * Every one is a dark line immediately followed by a light one, 1.5% apart — a bevelled pane
 * edge, which is why the panes read as sheets of glass rather than as a drawn grid. The pane
 * rows are not aligned: several step, so the top-right corner breaks the grid.
 *
 * Drawn rather than lifted. It is their artwork, and SVG gets it as vector — no bitmap to
 * ship, no resampling at other card widths, and the pane fills are ours to re-tint. The
 * viewBox is the plate's own 413×264, which is also what sets the illustration window's
 * aspect on the reference: the image is `width: 100%` and its intrinsic ratio decides the
 * height. */
const PLATE = { w: 413, h: 264 };

/* x, y, w, h, and fill alpha ×1000. Column edges land on the measured seams; the y bounds
   step where the reference's do. */
const PANES: readonly [number, number, number, number, number][] = [
  [0, 0, 33, 69, 9], [33, 0, 62, 69, 17], [95, 0, 58, 177, 21],
  [153, 0, 62, 47, 14], [215, 0, 66, 33, 19], [281, 0, 58, 47, 13], [339, 0, 74, 69, 16],
  [0, 69, 33, 108, 8], [33, 69, 62, 108, 15], [153, 47, 128, 130, 22],
  [281, 33, 132, 36, 16], [281, 69, 132, 108, 18],
  [0, 177, 95, 87, 11], [95, 177, 120, 87, 17], [215, 177, 66, 87, 13], [281, 177, 132, 87, 10],
];

/* Axis-aligned seam segments. Each is stroked twice — dark on the line, light 1.5 past it. */
const SEAMS: readonly [number, number, number, number][] = [
  [33, 0, 33, 264], [95, 0, 95, 264], [153, 0, 153, 177], [215, 0, 215, 33],
  [281, 0, 281, 264], [339, 0, 339, 69], [388, 0, 388, 264],
  [0, 69, 153, 69], [281, 69, 413, 69], [153, 47, 281, 47], [281, 33, 413, 33],
  [0, 177, 413, 177], [0, 241, 413, 241],
];

function GlassPlate() {
  return (
    <svg
      viewBox={`0 0 ${PLATE.w} ${PLATE.h}`}
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    >
      <defs>
        {/* The measured greys, pushed through `base / (1 - grey)` at their measured radii, so
            painting this directly lands on the same pixels the dodge produces over #0c0f14 —
            without a second compositing pass, and without depending on what sits behind. */}
        <radialGradient id="stepGlow" gradientUnits="userSpaceOnUse" cx="190" cy="111" r="200">
          <stop offset="0" stopColor="#3e4e68" stopOpacity="0.95" />
          <stop offset="0.3" stopColor="#3e4e68" stopOpacity="0.62" />
          <stop offset="0.45" stopColor="#3e4e68" stopOpacity="0.44" />
          <stop offset="0.6" stopColor="#3e4e68" stopOpacity="0.28" />
          <stop offset="0.78" stopColor="#3e4e68" stopOpacity="0.1" />
          <stop offset="1" stopColor="#3e4e68" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="stepVig" gradientUnits="userSpaceOnUse" cx="190" cy="111" r="200">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.7" />
          <stop offset="0.8" stopColor="#fff" stopOpacity="0.2" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id="stepMask">
          <rect width={PLATE.w} height={PLATE.h} fill="url(#stepVig)" />
        </mask>
      </defs>

      {/* The glow carries its own falloff, so it is not masked — masking it would square it. */}
      <rect width={PLATE.w} height={PLATE.h} fill="url(#stepGlow)" />

      <g mask="url(#stepMask)">
        {PANES.map(([x, y, w, h, a]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} fill="#fff" fillOpacity={a / 1000} />
        ))}
        {SEAMS.map(([x1, y1, x2, y2]) => {
          const vertical = x1 === x2;
          return (
            <g key={`${x1}-${y1}-${x2}-${y2}`}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000" strokeOpacity="0.5" strokeWidth="1" />
              <line
                x1={vertical ? x1 + 1.5 : x1}
                y1={vertical ? y1 : y1 + 1.5}
                x2={vertical ? x2 + 1.5 : x2}
                y2={vertical ? y2 : y2 + 1.5}
                stroke="#fff"
                strokeOpacity="0.12"
                strokeWidth="1"
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

const STEPS = [
  {
    icon: MessageSquareText,
    title: "Describe what's wrong",
    sub: "Plain language. No runbook needed.",
    Scene: RequestScene,
  },
  {
    icon: Waypoints,
    title: "The orchestrator routes it",
    sub: "The right agent, picked for you.",
    Scene: RoutingScene,
  },
  {
    icon: ShieldCheck,
    title: "It fixes, then proves it",
    sub: "Detect, fix, verify — all on the record.",
    Scene: RemediateScene,
  },
  /* Sub-lines are kept short enough to set on one line at card width, which is not a
     cosmetic preference: the reference's three all fit on one (35–37 characters), so its
     text block is a flat 98.4px and its card lands at 410.7×425.6 — an aspect of 1.036.
     Ours wrapped to two lines, which added 24px and pushed the card to 1.105. That extra
     line is the whole reason the cards read as bigger than the reference's. */
] as const;

function StepCard({
  step,
  index,
  progress,
  still,
}: {
  step: (typeof STEPS)[number];
  index: number;
  progress: MotionValue<number>;
  /** Reduced motion: show the row assembled and never read the scroll. */
  still: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // The scenes loop on a timer, so they only run while the card is on screen — three idle
  // intervals ticking through a page the reader has left behind is pure waste.
  const inView = useInView(ref, { margin: "120px" });
  const { Scene } = step;

  const from = (index * STAGGER) / TOTAL;
  const to = (index * STAGGER + DUR) / TOTAL;
  const opacity = useTransform(progress, [from, to], [0, 1], { ease: easeOut });
  const y = useTransform(progress, [from, to], [40, 0], { ease: easeOut });

  return (
    <motion.article
      ref={ref}
      className="flex flex-col gap-8 overflow-hidden rounded-[20px] border pb-8"
      style={{
        opacity: still ? 1 : opacity,
        y: still ? 0 : y,
        borderColor: "var(--surface)",
        backgroundColor: "var(--bg-2)",
        /* The reference's `Frame 57.avif`, stretched over the card at `100% 100%`. Decoded,
           it is two lobes and nothing else: mint #39edc6 peaking at 6%/53% at 5.1% alpha,
           blue #3d99ff at 89%/4% at 6.7%, with the alpha halving 24% and 25% of the box out
           from each peak — hence the doubled radii, since a CSS ramp halves at half its own.
           Both colours are ours to within a couple of steps, so they are written as tokens.

           This replaced a top-edge white sheen I had invented. There is no white in the
           reference's card at all, and that wash was most of why the card still read wrong
           after everything measurable already matched. */
        backgroundImage:
          "radial-gradient(58% 50% at 89% 4%, rgba(62,156,255,0.067), rgba(62,156,255,0) 100%), radial-gradient(48% 40% at 6% 53%, rgba(52,245,197,0.051), rgba(52,245,197,0) 100%)",
      }}
    >
      {/* The window. 413:264 is the decorative plate's own aspect, which is what sets this
          height on the reference too — its plate is `width: 100%` and the intrinsic ratio
          decides the rest. Measured on the live page at 408.7×261.2, which is that ratio. */}
      <div className="relative flex aspect-[413/264] w-full items-center justify-center overflow-hidden">
        <GlassPlate />
        <Scene active={inView} />
        {/* 3rem of the card colour, faded in from nothing — the reference's bottom overlay.
            It is what stops a cropped mockup ending on a hard horizontal cut. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-12"
          style={{ backgroundImage: "linear-gradient(180deg, transparent, var(--bg-2))" }}
        />
      </div>

      <div className="mx-4 flex flex-col items-start gap-2">
        <step.icon size={32} strokeWidth={1.6} className="text-brand" aria-hidden />
        <h3 className="font-heading text-h4 font-semibold leading-[1.2] tracking-tight text-foreground">
          {step.title}
        </h3>
        <p className="text-body leading-[1.5] text-muted-foreground">{step.sub}</p>
      </div>
    </motion.article>
  );
}

export function StepFlow() {
  const grid = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // Runs from the row's top touching the bottom of the viewport to the row centred in it, so
  // the third card lands as the section settles rather than as it leaves.
  const { scrollYProgress } = useScroll({ target: grid, offset: ["start end", "center center"] });
  // The catch-up lag that keeps a scrubbed value from snapping frame to frame.
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.45 });

  return (
    <>
      <SectionHeading eyebrow="How it works">Simple 3-step flow</SectionHeading>

      {/* 24px apart, equal widths, stretched so an extra line of sub-copy on one card cannot
          leave the row ragged along the bottom. */}
      <div ref={grid} className="mt-16 grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <StepCard key={step.title} step={step} index={i} progress={progress} still={Boolean(reduce)} />
        ))}
      </div>
    </>
  );
}
