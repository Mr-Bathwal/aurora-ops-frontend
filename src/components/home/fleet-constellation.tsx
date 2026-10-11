"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  easeOut,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { Activity, DatabaseBackup, ScrollText } from "lucide-react";
import { AGENT_CATALOG, type CatalogAgent } from "@/components/agents/agent-catalog";

/** The fleet, as a scattered constellation that assembles itself on scroll.
 *
 * The motion is the reference's, read off the running page rather than guessed at. It hangs
 * one GSAP timeline on the card wrapper — `start: "30% bottom"`, `end: "bottom top"`,
 * `scrub: 0.8` — and inside it every card tweens from `{opacity: 0, x: 1rem, y: 1rem}` to
 * rest over a duration of 1, `power1.out`, staggered 0.25 apart. Scrubbed rather than
 * played, which is the part that matters: a card sits wherever the scroll position puts it,
 * so scrolling back up takes the constellation apart again.
 *
 * Rebuilt on framer-motion, which is already a dependency — `useScroll` is the trigger's
 * start/end pair, `useSpring` is the 0.8 scrub lag, and each card's `useTransform` window is
 * its slot in the stagger. Driving it through motion values instead of React state is not a
 * detail: they write to the DOM directly, so a scroll frame never re-renders the tree.
 *
 * The scatter is measured too — ±30% of the wrapper's width either side of centre, with the
 * right-hand card dropped 10% of the wrapper's height. Percentages, so the spread tracks the
 * container.
 */

/** Line art at 32px, in the reference's slot. Deliberately not `SentinelGlyph`: that one is
 * a 96-unit glass tile with its own bevel and bloom, which is the right object on a card
 * that has material of its own. This card has almost nothing on it, so a second piece of
 * material would be the loudest thing in the section. */
const ICONS: Record<string, typeof Activity> = {
  health: Activity,
  log: ScrollText,
  backup: DatabaseBackup,
};

/** Card positions, as offsets from the centred column. The wrapper is the containing block,
 * so `dx` resolves against its width and `dy` against its height. */
const SCATTER = [
  { dx: "-30%", dy: "0%" },
  { dx: "30%", dy: "10%" },
  { dx: "0%", dy: "0%" },
] as const;

const FLEET = AGENT_CATALOG.slice(0, SCATTER.length);

/* The timeline, in the reference's own units. Card `i` occupies [i·STAGGER, i·STAGGER + DUR]
   of a TOTAL-long timeline, which is then normalised onto the scroll range. */
const DUR = 1;
const STAGGER = 0.25;
const TOTAL = DUR + STAGGER * (FLEET.length - 1);

function FleetTile({
  agent,
  index,
  progress,
  still,
}: {
  agent: CatalogAgent;
  index: number;
  progress: MotionValue<number>;
  /** Reduced motion: park every card at rest and never read the scroll. */
  still: boolean;
}) {
  const from = (index * STAGGER) / TOTAL;
  const to = (index * STAGGER + DUR) / TOTAL;

  const opacity = useTransform(progress, [from, to], [0, 1], { ease: easeOut });
  // x and y travel together — the reference moves each card in from a shared 1rem down-right,
  // so one value drives both axes.
  const shift = useTransform(progress, [from, to], [16, 0], { ease: easeOut });

  const Icon = ICONS[agent.key] ?? Activity;
  const { dx, dy } = SCATTER[index];

  return (
    <motion.div
      /* Below md the offsets collapse: at phone widths 30% of the container is wider than
         the room beside a card, so the outer two would hang off the screen. */
      className="relative left-0 top-0 md:left-[var(--dx)] md:top-[var(--dy)]"
      style={
        {
          "--dx": dx,
          "--dy": dy,
          opacity: still ? 1 : opacity,
          x: still ? 0 : shift,
          y: still ? 0 : shift,
        } as React.CSSProperties
      }
    >
      <Link
        href={`/run?tab=${agent.runnable}&autorun=1`}
        className="group relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-[20px] p-10"
        style={{ backgroundImage: "linear-gradient(69deg, var(--surface), transparent 63%)" }}
      >
        {/* The same gradient one step brighter, faded in under the cursor. Two layers rather
            than a transition on background-image, which browsers cannot interpolate. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ backgroundImage: "linear-gradient(69deg, var(--surface-2), transparent 63%)" }}
        />
        <Icon
          size={32}
          strokeWidth={1.75}
          className="relative shrink-0 transition-transform duration-300 group-hover:scale-110"
          style={{ color: agent.color, filter: `drop-shadow(0 0 10px ${agent.color}55)` }}
          aria-hidden
        />
        {/* `self-stretch` with the row left-aligned: the label sets the card's width and the
            icon centres over it, which is what gives the three cards their uneven widths. */}
        <span className="relative flex w-full items-center gap-2">
          <span className="size-2 shrink-0 rounded-full bg-brand-2" />
          <span className="whitespace-nowrap text-lead text-muted-foreground transition-colors group-hover:text-foreground">
            {agent.name}
          </span>
        </span>
      </Link>
    </motion.div>
  );
}

export function FleetConstellation() {
  const wrap = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // The reference's start, verbatim — nothing moves until the wrapper is 30% of the way into
  // view. Its end is not: it runs to `bottom top`, so the last card only reaches full opacity
  // as the section leaves the screen, and you never see the constellation assembled. Measured
  // on the reference itself the point is moot, because its computed start is far enough
  // negative that the cards are already at 86% before you have scrolled at all. Ending on
  // `center center` lands the last card exactly as the section centres in the viewport, which
  // is the moment the composition is meant to be read.
  const { scrollYProgress } = useScroll({ target: wrap, offset: ["30% end", "center center"] });
  // GSAP's `scrub: 0.8` is a catch-up lag, not an ease — the timeline chases the scroll
  // position rather than snapping to it. A spring is the same behaviour.
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.45 });

  return (
    <div ref={wrap} className="relative mx-auto flex max-w-[1185px] flex-col items-center gap-4 text-center">
      {FLEET.map((agent, i) => (
        <FleetTile key={agent.key} agent={agent} index={i} progress={progress} still={Boolean(reduce)} />
      ))}
    </div>
  );
}
