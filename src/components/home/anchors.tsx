"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** The connective tissue the reference marks as "ANCHOR 1".
 *
 * The note in the design is a single arrow with the word *storytelling* on it, which is the
 * whole idea: the page makes one argument — infrastructure breaks, here is what watches it,
 * here is the proof — and the eye should be able to follow that argument without reading a
 * word first. So the blocks are physically joined. A rail down the left of the hero copy
 * with a node at each beat, a thread from the hero into the fleet, and short links between
 * the cards.
 *
 * Two rules keep it from becoming decoration. It is drawn at the opacity of a hairline, so
 * it reads as structure rather than as a graphic; and the travelling pulse always moves in
 * the direction the argument does — down the hero, down into the fleet, left to right across
 * the cards — so it is telling you where to look next rather than just twinkling.
 *
 * Nothing here measures the DOM. The rails are ordinary positioned elements that inherit
 * their length from the content they sit beside, which means they survive a reflow, a font
 * swap and a translated string without a resize observer anywhere.
 */

const RAIL_V = "bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.13)_14%,rgba(255,255,255,0.13)_86%,transparent)]";
const RAIL_H = "bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.13)_14%,rgba(255,255,255,0.13)_86%,transparent)]";

/** A vertical rail with a bright segment falling down it. Absolutely positioned — give it
 * `left`/`top`/`bottom` through `className`. */
export function AnchorRailV({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <span aria-hidden className={cn("pointer-events-none absolute w-px overflow-hidden", RAIL_V, className)}>
      <span
        className="anchor-fall absolute inset-x-0 top-0 h-[24%] bg-[linear-gradient(180deg,transparent,var(--brand),transparent)]"
        style={{ animationDelay: `${delay}s` }}
      />
    </span>
  );
}

/** The horizontal twin, for the gaps between cards. */
export function AnchorRailH({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <span aria-hidden className={cn("pointer-events-none absolute h-px overflow-hidden", RAIL_H, className)}>
      <span
        className="anchor-slide absolute inset-y-0 left-0 w-[38%] bg-[linear-gradient(90deg,transparent,var(--brand),transparent)]"
        style={{ animationDelay: `${delay}s` }}
      />
    </span>
  );
}

/** One beat of the argument.
 *
 * The dot is centred on the block rather than pinned to its first line. Pinning looks more
 * correct in the abstract and is wrong in practice: the four blocks here run from an 11px
 * eyebrow to a 49px headline, so "half a line down" lands in a different place in each one
 * and the column of dots comes out ragged. Centring needs no measurement and stays true
 * through a reflow, a font swap or a longer translation. */
export function AnchorBeat({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <span
        aria-hidden
        className="anchor-node absolute -left-[27px] top-1/2 size-[7px] -translate-y-1/2 rounded-full border border-brand/70 bg-[#050505]"
      />
      {children}
    </div>
  );
}

/** The links that sit in the gutters of the three-card row.
 *
 * Placed by the grid's own arithmetic rather than by measuring anything: with three equal
 * columns and a gap of `g`, a column is `(W - 2g)/3` wide, so the first gutter starts at
 * `W/3 - 2g/3` and the second at `2W/3 - g/3`. That is exact at every width, which a
 * percentage guess is not.
 *
 * Hidden below `lg`, where the grid drops to two columns and one column and the gutters are
 * no longer where this maths says they are.
 */
export function CardLinks({ gap = 20, top = 56 }: { gap?: number; top?: number }) {
  const g = gap;
  const gutters = [
    { left: `calc(33.3333% - ${(2 * g) / 3}px)`, delay: 0 },
    { left: `calc(66.6667% - ${g / 3}px)`, delay: 0.5 },
  ];

  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
      {gutters.map((gutter) => (
        <span key={gutter.left} className="absolute" style={{ left: gutter.left, width: `${g}px`, top: `${top}px` }}>
          <AnchorRailH className="inset-x-0 top-0" delay={gutter.delay} />
        </span>
      ))}
    </span>
  );
}
