"use client";

import { useEffect, useRef, useState } from "react";
import { SectionHeading } from "@/components/aurora/section-heading";

/** "Designed for" — the audience diagram, with a satellite that tracks the scroll.
 *
 * Built natively rather than as a baked animation. The reference does this with two Lottie
 * files whose playhead Webflow scrubs on scroll; a Lottie would have been faster to drop in
 * but it cannot be re-coloured to our tokens, cannot be re-timed, and ships a JSON blob to
 * do what a sine and a cosine already do.
 *
 * Everything derives from one `progress` value, 0 when the section's top reaches the bottom
 * of the viewport and 1 when its bottom leaves the top. The satellite's angle, the trail
 * behind it, and its glow all read from that single number, so they cannot drift apart.
 *
 * Two coordinate spaces, deliberately:
 *   - The BRANCH diagram lives in a 1280×524 box. It is shown from lg only; below that the
 *     four corner labels close in until they touch the core.
 *   - The ORBIT (halo, core, arc, satellite) lives in its own centred square stage with its
 *     own viewBox, so it is sized independently. Sharing the one wide viewBox meant the orbit
 *     shrank with the container's *width*, which on a phone left a 35px sphere.
 */

/* The branch diagram, in its own 1280×524 space. Laid out symmetrically about x=640 — the
   values were measured off the reference, then paired so the two halves mirror exactly. */
const VB = { w: 1280, h: 524 };
const CY = 246;
const ROW_TOP = 51;
const ROW_BOTTOM = 441;
const STUB_L = 246; // where a label's horizontal run begins
const STUB_R = VB.w - STUB_L;
const ELBOW_L = 408; // where it turns and dives toward the centre
const ELBOW_R = VB.w - ELBOW_L;
const VERT_L = 478; // the junction either side of the core
const VERT_R = VB.w - VERT_L;

/* The orbit stage — a square, in its own units. */
const S = 360;
const SC = S / 2;
const SPHERE_R = 58;
const ORBIT_R = 118;
const HALO_R = 162;

/* Angles measured from twelve o'clock, positive clockwise. The decorative arc is fixed; the
   satellite travels a shorter span inside it so it never reaches either faded end. */
const ARC_FROM = -40;
const ARC_TO = 120;
const DOT_FROM = -20;
const DOT_TO = 100;

const ptOn = (r: number, deg: number) => ({
  x: SC + r * Math.sin((deg * Math.PI) / 180),
  y: SC - r * Math.cos((deg * Math.PI) / 180),
});

function arcPath(r: number, from: number, to: number) {
  const a = ptOn(r, from);
  const b = ptOn(r, to);
  const large = Math.abs(to - from) > 180 ? 1 : 0;
  return `M${a.x.toFixed(2)},${a.y.toFixed(2)} A${r},${r} 0 ${large} 1 ${b.x.toFixed(2)},${b.y.toFixed(2)}`;
}

const AUDIENCES = [
  { label: "Small IT teams", side: "left", row: "top" },
  { label: "On-call engineers", side: "right", row: "top" },
  { label: "Managed IT providers", side: "left", row: "bottom" },
  { label: "Internal support desks", side: "right", row: "bottom" },
] as const;

/** The speckled halo. Canvas, not SVG — the grain needs a few thousand marks, and that many
 * DOM nodes would cost more than the whole rest of the page. Seeded, so the sky is the same
 * every render and does not shimmer when React re-runs. */
function Halo() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) / 2;
      const inner = R * 0.4;
      const outer = R * 0.99;

      let s = 20260801;
      const rnd = () => {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        return s / 0x7fffffff;
      };

      for (let i = 0; i < 5200; i++) {
        const a = rnd() * Math.PI * 2;
        // Three samples averaged ≈ a bell around the middle of the annulus, so the density
        // peaks in a band rather than spreading evenly to both edges.
        const t = (rnd() + rnd() + rnd()) / 3;
        const r = inner + (outer - inner) * t;
        const falloff = 1 - Math.abs(t - 0.5) * 2;
        ctx.globalAlpha = 0.08 + falloff * 0.8 * rnd();
        ctx.fillStyle = rnd() > 0.4 ? "#34f5c5" : "#1c8f7c";
        ctx.fillRect(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1.25, 1.25);
      }
      ctx.globalAlpha = 1;
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  return <canvas ref={ref} aria-hidden className="absolute inset-0 h-full w-full" />;
}

function Bullet({ label }: { label: string }) {
  return (
    <>
      <span className="size-2 shrink-0 rounded-full bg-brand-2 shadow-[0_0_8px_var(--brand-2)]" />
      <span className="whitespace-nowrap text-body text-muted-foreground">{label}</span>
    </>
  );
}

export function DesignedFor() {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0.5);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced motion: leave the satellite parked at its initial mid-arc value and never
    // subscribe. The section still reads correctly; it just does not answer the scroll.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const measure = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      setProgress(Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height))));
    };
    // Coalesce to one measurement per frame — scroll fires far faster than we can paint,
    // and getBoundingClientRect forces layout every time it is called.
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const dotDeg = DOT_FROM + (DOT_TO - DOT_FROM) * progress;
  const dot = ptOn(ORBIT_R, dotDeg);
  // A short bright run behind the satellite, clamped so it never spills past the arc's start.
  const trailFrom = Math.max(ARC_FROM, dotDeg - 38);
  const arcA = ptOn(ORBIT_R, ARC_FROM);
  const arcB = ptOn(ORBIT_R, ARC_TO);

  return (
    <div ref={ref}>
      <SectionHeading eyebrow="Who it's for">Designed for</SectionHeading>

      <div className="relative mx-auto mt-16 w-full max-w-[1280px]">
        {/* Square below lg, letterbox above. The orbit stage is a square that would otherwise
            overflow the 1280×524 box top and bottom once it grows to fill a narrow screen. */}
        <div className="relative w-full aspect-square lg:aspect-[1280/524]">
          {/* Branch lines. Painted first so the core occludes the run that passes behind it —
              a line drawn straight across the sphere reads as a seam through it. Absolutely
              positioned siblings paint in DOM order, so that ordering is the mechanism. */}
          <svg
            viewBox={`0 0 ${VB.w} ${VB.h}`}
            className="absolute inset-0 hidden h-full w-full lg:block"
            fill="none"
            aria-hidden
          >
            <defs>
              <linearGradient id="dfLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3e9cff" stopOpacity="0.05" />
                <stop offset="45%" stopColor="#3e9cff" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#3e9cff" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="dfLineFlip" x1="1" y1="0" x2="0" y2="0">
                <stop offset="0%" stopColor="#3e9cff" stopOpacity="0.05" />
                <stop offset="45%" stopColor="#3e9cff" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#3e9cff" stopOpacity="0.7" />
              </linearGradient>
            </defs>
            <g strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
              <path d={`M${STUB_L},${ROW_TOP} H${ELBOW_L} L${VERT_L},${CY}`} stroke="url(#dfLine)" />
              <path d={`M${STUB_L},${ROW_BOTTOM} H${ELBOW_L} L${VERT_L},${CY}`} stroke="url(#dfLine)" />
              <path d={`M${STUB_R},${ROW_TOP} H${ELBOW_R} L${VERT_R},${CY}`} stroke="url(#dfLineFlip)" />
              <path d={`M${STUB_R},${ROW_BOTTOM} H${ELBOW_R} L${VERT_R},${CY}`} stroke="url(#dfLineFlip)" />
              <path d={`M${VERT_L},${CY} H${VERT_R}`} stroke="#3e9cff" strokeOpacity="0.7" />
            </g>
          </svg>

          {/* The orbit stage: one centred square holding halo, core and arc, so all three
              scale together and stay circular whatever the outer box is doing. */}
          <div
            className="absolute left-1/2 aspect-square w-[80%] max-w-[360px] -translate-x-1/2 -translate-y-1/2 lg:w-[28.125%]"
            style={{ top: `${(CY / VB.h) * 100}%` }}
          >
            <div
              aria-hidden
              className="absolute left-1/2 top-1/2 aspect-square -translate-x-1/2 -translate-y-1/2"
              style={{ width: `${((HALO_R * 2) / S) * 100}%` }}
            >
              <Halo />
            </div>

            <div
              aria-hidden
              className="absolute left-1/2 top-1/2 aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: `${((SPHERE_R * 2) / S) * 100}%`,
                // Dark in the middle, bright at the limb — the core is lit from behind, which
                // is what stops it reading as a flat filled disc.
                background:
                  "radial-gradient(circle at 44% 54%, #2c7c8e 0%, #33a2ba 42%, #4fd0e6 76%, #6ce6f7 100%)",
                boxShadow: "0 0 60px -10px rgba(79,208,230,0.5)",
              }}
            />

            <svg viewBox={`0 0 ${S} ${S}`} className="absolute inset-0 h-full w-full" fill="none" aria-hidden>
              <defs>
                {/* Faded at both ends so the arc has no visible start or stop. */}
                <linearGradient
                  id="dfArc"
                  gradientUnits="userSpaceOnUse"
                  x1={arcA.x}
                  y1={arcA.y}
                  x2={arcB.x}
                  y2={arcB.y}
                >
                  <stop offset="0%" stopColor="#34f5c5" stopOpacity="0" />
                  <stop offset="22%" stopColor="#34f5c5" stopOpacity="0.75" />
                  <stop offset="70%" stopColor="#34f5c5" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#34f5c5" stopOpacity="0" />
                </linearGradient>
                <radialGradient id="dfDot" cx="36%" cy="30%">
                  <stop offset="0%" stopColor="#43597a" />
                  <stop offset="60%" stopColor="#1e2c40" />
                  <stop offset="100%" stopColor="#0d1520" />
                </radialGradient>
              </defs>

              <g style={{ filter: "drop-shadow(0 0 7px rgba(52,245,197,0.55))" }}>
                <path d={arcPath(ORBIT_R, ARC_FROM, ARC_TO)} stroke="url(#dfArc)" strokeWidth="5" strokeLinecap="round" />
                <path
                  d={arcPath(ORBIT_R, trailFrom, dotDeg)}
                  stroke="#8bffe4"
                  strokeOpacity="0.9"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </g>

              <circle cx={dot.x} cy={dot.y} r="14" fill="url(#dfDot)" stroke="rgba(255,255,255,0.28)" strokeWidth="1" />
            </svg>
          </div>

          {/* Corner labels, pinned to the rows their lines run along. Desktop only. */}
          {AUDIENCES.map((a) => (
            <div
              key={a.label}
              className={`absolute hidden -translate-y-1/2 items-center gap-2.5 lg:flex ${
                a.side === "left" ? "left-0" : "right-0 flex-row-reverse"
              }`}
              style={{ top: `${((a.row === "top" ? ROW_TOP : ROW_BOTTOM) / VB.h) * 100}%` }}
            >
              <Bullet label={a.label} />
            </div>
          ))}
        </div>

        {/* The same four, as a plain list where the diagram cannot carry them. */}
        <ul className="mx-auto mt-8 grid max-w-[420px] grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-6 lg:hidden">
          {AUDIENCES.map((a) => (
            <li key={a.label} className="flex items-center gap-2.5">
              <Bullet label={a.label} />
            </li>
          ))}
        </ul>

        <p className="mt-10 text-center text-body font-semibold text-muted-foreground">
          And anyone who has ever been paged at 3 a.m.
        </p>
      </div>
    </div>
  );
}
