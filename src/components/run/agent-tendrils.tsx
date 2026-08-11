"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { DatabaseBackup, FileSearch, HeartPulse, Sparkles } from "lucide-react";
import type { RunTabValue } from "@/components/run/agent-tabs";
import type { IconType } from "@/lib/icon-type";

/** The mascot, with the fleet hanging off it on living threads.
 *
 * The whole trick is that the curve is computed in JavaScript rather than authored as a
 * keyframed path. Because we solve for the tip every frame, we already know exactly where it
 * is — so the clickable node is placed *there*, and attachment is exact and free. A generated
 * video could look like this but could never be clicked: the tips move, so any hotspot laid
 * over them drifts off within a frame.
 *
 * Three layers, back to front:
 *   1. the mascot        — a still, screen-blended so its black ground vanishes
 *   2. the tendrils      — SVG cubic beziers, redrawn each frame
 *   3. the agent nodes   — real <a> elements, positioned from the same solve as layer 2
 *
 * Nothing here is React state. Sixty frames a second times five moving things would be three
 * hundred re-renders a second; instead one rAF loop writes straight to the DOM through refs,
 * and React renders this component exactly once.
 */

type Tendril = {
  key: RunTabValue;
  name: string;
  tag: string;
  icon: IconType;
  accent: string;
  /** Where the tip settles, in viewBox units. */
  tip: [number, number];
  /** Radians per second, and a starting offset. Deliberately unrelated to its neighbours —
   *  shared frequencies make four threads sway in unison, which reads as a windscreen wiper
   *  rather than as something alive. */
  freq: number;
  phase: number;
  /** How far the thread bows off the straight line, in viewBox units. */
  sway: number;
};

const VB = { w: 1440, h: 820 };
/** Behind and slightly below the mascot's centre — the threads read as spine, not as arms. */
const ORIGIN: [number, number] = [720, 452];

const TENDRILS: Tendril[] = [
  {
    key: "health", name: "System Health", tag: "cpu · memory · disk",
    icon: HeartPulse, accent: "#34f5c5",
    tip: [246, 190], freq: 0.24, phase: 0.0, sway: 96,
  },
  {
    key: "log", name: "Log Analyzer", tag: "errors · warnings",
    icon: FileSearch, accent: "#5ac8ff",
    tip: [224, 606], freq: 0.19, phase: 1.9, sway: 112,
  },
  {
    key: "backup", name: "Backup & DR", tag: "snapshots · restore",
    icon: DatabaseBackup, accent: "#3e9cff",
    tip: [1200, 188], freq: 0.27, phase: 3.4, sway: 88,
  },
  {
    key: "orchestrator", name: "Orchestrator", tag: "routes your request",
    icon: Sparkles, accent: "#8fe9d0",
    tip: [1222, 602], freq: 0.16, phase: 5.1, sway: 104,
  },
];

/** Each thread finishes unfurling before the next is much past halfway. */
const STAGGER = 0.16;
const GROW_SPAN = 0.52;

export function AgentTendrils({
  active,
  onSelect,
}: {
  /** The tab currently showing below — its node is lit so the scene and the tab strip never
   *  disagree about what you are looking at. */
  active: RunTabValue;
  onSelect: (key: RunTabValue) => void;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const glowRefs = useRef<(SVGPathElement | null)[]>([]);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start 85%", "center 55%"] });
  const grow = useSpring(scrollYProgress, { stiffness: 80, damping: 24, mass: 0.5 });

  useEffect(() => {
    let raf = 0;
    const started = performance.now();

    function frame(now: number) {
      // Read the spring rather than subscribing to it: this loop is already running, and a
      // subscription would only re-enter React to say what we can just ask for.
      const p = reduced ? 1 : grow.get();
      const t = (now - started) / 1000;

      TENDRILS.forEach((d, i) => {
        const local = Math.min(1, Math.max(0, (p - i * STAGGER) / GROW_SPAN));
        // easeOutCubic — the thread shoots out then settles, rather than arriving at a crawl.
        const g = 1 - Math.pow(1 - local, 3);

        const [ox, oy] = ORIGIN;
        const [tx, ty] = d.tip;
        const dx = tx - ox;
        const dy = ty - oy;
        const len = Math.hypot(dx, dy) || 1;
        // Unit normal to the origin→tip line: the axis every wobble happens on.
        const nx = -dy / len;
        const ny = dx / len;

        const wobble = reduced ? 0 : Math.sin(t * d.freq * Math.PI * 2 + d.phase);
        const wobble2 = reduced ? 0 : Math.sin(t * d.freq * Math.PI * 2 * 1.7 + d.phase + 1.1);

        // The tip drifts a little too, so the node breathes with its thread instead of
        // hanging off the end of a moving line like a pinned label.
        const tipX = ox + dx * g + nx * wobble * d.sway * 0.42 * g;
        const tipY = oy + dy * g + ny * wobble * d.sway * 0.42 * g;

        // Two control points, each swinging on its own harmonic and each carrying a fixed
        // bow on top of the wobble. Without the constant term the curve collapses to the
        // straight line between origin and tip every time the sines cross zero — which is
        // most of the time, and made four roots read as four lasers.
        const bow = d.sway * 1.35;
        const c1x = ox + dx * 0.26 * g + nx * (bow + wobble * d.sway * 0.9) * g;
        const c1y = oy + dy * 0.26 * g + ny * (bow + wobble * d.sway * 0.9) * g;
        const c2x = ox + dx * 0.72 * g - nx * (bow * 0.55 - wobble2 * d.sway * 0.8) * g;
        const c2y = oy + dy * 0.72 * g - ny * (bow * 0.55 - wobble2 * d.sway * 0.8) * g;

        const path = `M ${ox} ${oy} C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${tipX.toFixed(1)} ${tipY.toFixed(1)}`;
        pathRefs.current[i]?.setAttribute("d", path);
        glowRefs.current[i]?.setAttribute("d", path);

        const node = nodeRefs.current[i];
        if (node) {
          node.style.left = `${(tipX / VB.w) * 100}%`;
          node.style.top = `${(tipY / VB.h) * 100}%`;
          node.style.opacity = String(Math.min(1, Math.max(0, (g - 0.55) / 0.45)));
        }
      });

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [grow, reduced]);

  return (
    <div>
      {/* ── The scene. Below md it collapses to a plain list: the composition needs width to
             read, and a 1440×820 stage on a phone is a smear. ─────────────────────────────── */}
      <div
        ref={wrap}
        className="relative mx-auto hidden w-full max-w-[1020px] md:block"
        style={{ aspectRatio: `${VB.w} / ${VB.h}` }}
      >
        {/* Threads first, mascot second, nodes last — paint order comes from DOM order here,
            and deliberately not from z-index.

            `mix-blend-mode` blends an element with its backdrop *within its own stacking
            context*. Putting `z-10` on the mascot's wrapper created one, which isolated the
            blend: the mascot then had nothing behind it to screen against and its black frame
            painted as a visible square on the band. Removing the z-index removes the context,
            and the blend reaches the section behind it again.

            `preserveAspectRatio="none"` is safe because the wrapper is locked to the viewBox's
            own ratio — and it makes the node maths a plain percentage. */}
        <svg
          viewBox={`0 0 ${VB.w} ${VB.h}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <defs>
            <filter id="tendril-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="7" />
            </filter>
          </defs>
          {TENDRILS.map((d, i) => (
            <g key={d.key}>
              <path
                ref={(el) => { glowRefs.current[i] = el; }}
                fill="none" stroke={d.accent} strokeWidth={5} strokeLinecap="round"
                opacity={0.22} filter="url(#tendril-glow)" vectorEffect="non-scaling-stroke"
              />
              <path
                ref={(el) => { pathRefs.current[i] = el; }}
                fill="none" stroke={d.accent} strokeWidth={1.6} strokeLinecap="round"
                opacity={0.85} vectorEffect="non-scaling-stroke"
              />
            </g>
          ))}
        </svg>

        {/* Mascot. `screen` drops its black ground, so no cut-out edge exists to look wrong.
            `relative` on the image puts it over the glow without opening a stacking context —
            `position` alone does not, only a real z-index would. */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 w-[27%] -translate-x-1/2 -translate-y-[54%]">
          <div
            aria-hidden
            className="absolute -inset-[22%] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(52,245,197,0.10), transparent 68%)" }}
          />
          <Image
            src="/media/images/hero/mascot.webp"
            alt="The Aurora Ops mascot"
            width={556}
            height={598}
            priority
            /* Served as-is. `scripts/extract-robot.mjs` already produces exactly what the page
               needs — cropped, graded, alpha-matted WebP at the size it renders — and putting
               that through the optimizer returned a 600×602 three-channel image with the alpha
               stripped, which painted the mascot's frame as a black square on the band. A
               second lossy pass over a hand-tuned asset had nothing to win either way. */
            unoptimized
            className="relative h-auto w-full"
          />
        </div>

        {/* Nodes — real buttons, placed by the same solve that drew the threads above.
            Buttons and not links: this sits on /run, so picking an agent is a tab change, and
            a link back to the page you are already on would remount everything to move a
            pill. */}
        {TENDRILS.map((d, i) => {
          const Icon = d.icon;
          const on = active === d.key;
          return (
            <div
              key={d.key}
              ref={(el) => { nodeRefs.current[i] = el; }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: "50%", top: "50%", opacity: 0 }}
            >
              <button
                type="button"
                onClick={() => onSelect(d.key)}
                aria-pressed={on}
                className="group/node flex items-center gap-2.5 rounded-[14px] border bg-[rgba(8,12,18,0.72)] px-3.5 py-2.5 text-left backdrop-blur-xl transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-0.5"
                style={{
                  borderColor: on ? `${d.accent}88` : "rgba(255,255,255,0.10)",
                  boxShadow: on
                    ? `0 18px 40px -26px rgba(0,0,0,0.9), 0 0 26px -10px ${d.accent}`
                    : "0 18px 40px -26px rgba(0,0,0,0.9)",
                }}
              >
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-[9px] transition-transform duration-300 group-hover/node:scale-110"
                  style={{ background: `${d.accent}1a`, border: `1px solid ${d.accent}55`, color: d.accent }}
                >
                  <Icon size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block whitespace-nowrap font-heading text-[13.5px] font-semibold leading-tight text-foreground">
                    {d.name}
                  </span>
                  <span className="block whitespace-nowrap font-mono text-[10px] leading-tight text-faint">
                    {d.tag}
                  </span>
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Mobile ─────────────────────────────────────────────────────────────────────── */}
      <div className="md:hidden">
        <div className="mx-auto w-[52%] max-w-[220px]">
          <Image
            src="/media/images/hero/mascot.webp"
            alt="The Aurora Ops mascot"
            width={556}
            height={598}
            unoptimized
            className="h-auto w-full"
          />
        </div>
        <div className="mt-4 grid gap-2.5">
          {TENDRILS.map((d, i) => {
            const Icon = d.icon;
            return (
              <motion.div
                key={d.key}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
              >
                <button
                  type="button"
                  onClick={() => onSelect(d.key)}
                  aria-pressed={active === d.key}
                  className="flex w-full items-center gap-3 rounded-[14px] border bg-[rgba(8,12,18,0.6)] px-4 py-3 text-left"
                  style={{ borderColor: active === d.key ? `${d.accent}88` : "rgba(255,255,255,0.10)" }}
                >
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-[10px]"
                    style={{ background: `${d.accent}1a`, border: `1px solid ${d.accent}55`, color: d.accent }}
                  >
                    <Icon size={17} />
                  </span>
                  <span>
                    <span className="block font-heading text-[14px] font-semibold leading-tight">{d.name}</span>
                    <span className="block font-mono text-[10.5px] text-faint">{d.tag}</span>
                  </span>
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
