"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Check,
  CornerDownLeft,
  DatabaseBackup,
  ScrollText,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  Waypoints,
  Wrench,
} from "lucide-react";

/** The three animated mockups that sit in the tops of the step cards.
 *
 * The reference ships these as Lottie — `data-animation-type="lottie"`, `autoplay`, `loop`,
 * 5.62s / 4.92s / 3.37s, and explicitly *not* an IX2 target, so they run on their own clock
 * rather than on scroll. That is the behaviour reproduced here; what is not reproduced is the
 * delivery. A Lottie of our console would be a JSON blob that cannot be re-coloured when a
 * token moves, cannot be corrected when the product changes, and would have to be re-exported
 * from a design tool every time either happens. These are the real components' vocabulary —
 * the same chips, the same severity colours, the same pipeline stage names as /auto-remediate
 * — so they stay true for free.
 *
 * Every scene is a pure function of one integer tick. Nothing holds its own animation state,
 * which is what stops the parts of a scene drifting out of step with each other over a long
 * page session, and makes the whole loop restartable by resetting a single number.
 */

/** 60ms — about 17 updates a second. Fast enough that typing does not look mechanical, slow
 * enough that three of these looping at once is not a frame budget anyone notices. */
const TICK_MS = 60;

function useTick(total: number, active: boolean) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!active) return;
    // setState lives in the interval callback, never in the effect body — the compiler's
    // set-state-in-effect rule rejects the latter, and tick 0 is already the initial state.
    const id = setInterval(() => setT((v) => (v + 1) % total), TICK_MS);
    return () => clearInterval(id);
  }, [total, active]);
  return t;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** The mockup's own box — inset 1rem from three sides, like the reference's
 * `.card_illustration`.
 *
 * Symmetric, and not cropped. The reference does overhang its right edge, but it can afford
 * to: its art is a fixed-size bitmap whose right-hand column is filler, so the cut lands on
 * nothing. Ours is a live layout, and any overhang at all reads as a panel that is *supposed*
 * to line up with the left border and failed to — an alignment bug rather than a window onto
 * something larger. Only the bottom still runs long, which is where the fade already explains
 * the cut. */
function Frame({ children }: { children: React.ReactNode }) {
  return <div className="absolute inset-x-6 top-5">{children}</div>;
}

/** The mockup's own surface.
 *
 * This was a dark plate — `rgba(8,11,16,0.62)` — and that was the thing cancelling out the
 * pane plate behind it. Scanning the reference across its panel border settles what it should
 * be, at 2x, luminance:
 *
 *   left edge,  y=45%   outside 20 21 21 21 │ inside 25 25 26 26 27 27 28
 *   right edge, y=45%   inside 27 26 25 25 │ border 31 │ outside 22 21 20 19
 *
 * Crossing *into* the panel the backdrop gets brighter, not darker. But at the window's
 * centre, where the plate peaks at rgb(62,78,104), the same panel reads rgb(45,56,74) — so it
 * is not a plain white wash either. It lifts the dim and pulls down the lit, which is what a
 * translucent mid-tone does. Solving both readings at once:
 *
 *   25 = α·g + (1-α)·21     →   α = 0.434
 *   55 = α·g + (1-α)·74     →   g ≈ rgb(23,27,35)
 *
 * which is --surface within a couple of steps, so that is what it is written as. The effect
 * is a sheet of glass laid over the plate rather than a hole cut in it.
 *
 * No blur, and no shadow. The reference's mockup is baked Lottie art, so nothing softens the
 * seams running under it — they stay sharp edge to edge — and the scan shows no dark halo
 * outside the border either: 25 inside, 22 just out, 19 further out is the vignette falling
 * away, not a cast shadow. */
function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[12px] border border-white/10 bg-surface/45 ${className}`}>{children}</div>
  );
}

/* ─────────────────────────── 1. Describe what's wrong ─────────────────────────── */

const PROMPT = "Disk on prod-db-01 at 94%";
/* 100 ticks = 6.0s. Beats: idle → type → armed → dispatched → hold. */
const S1 = { total: 100, typeFrom: 8, ticksPerChar: 2, armed: 66, sent: 78 };

export function RequestScene({ active }: { active: boolean }) {
  const t = useTick(S1.total, active);
  const shown = PROMPT.slice(0, clamp(Math.floor((t - S1.typeFrom) / S1.ticksPerChar), 0, PROMPT.length));
  const armed = t >= S1.armed;
  const sent = t >= S1.sent;
  // The caret keeps blinking after the text lands, then goes out once the request is away.
  const caret = !sent && t % 10 < 6;

  return (
    <Frame>
      <Panel className="p-3.5">
        <div className="flex items-start gap-2.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-[8px] border border-white/10 bg-white/[0.04]">
            <Terminal size={13} className="text-brand" />
          </span>
          <p className="min-h-[86px] flex-1 text-[13px] leading-[1.6] text-foreground">
            {shown || <span className="text-faint">Describe the symptom…</span>}
            <span
              aria-hidden
              className="ml-px inline-block h-[13px] w-[1.5px] translate-y-[2px] bg-brand-2"
              style={{ opacity: caret ? 1 : 0 }}
            />
          </p>
        </div>

        <div className="mt-3 flex items-center gap-1.5 border-t border-white/8 pt-2.5 font-mono text-[10px] text-faint">
          <Sparkles size={11} className="shrink-0" />
          Plain language
          <span className="ml-auto flex shrink-0 items-center gap-1">
            <CornerDownLeft size={11} /> dispatch
          </span>
        </div>

        <div
          className="mt-2.5 flex items-center justify-center gap-1.5 rounded-[8px] py-2 text-[12px] font-medium transition-[background,color,box-shadow] duration-300"
          style={
            armed
              ? {
                  backgroundImage: "var(--grad)",
                  color: "#0c0f14",
                  boxShadow: "0 0 26px -8px rgba(52,245,197,0.75)",
                }
              : { background: "rgba(255,255,255,0.05)", color: "var(--faint)" }
          }
        >
          {sent ? <Check size={13} /> : <Waypoints size={13} />}
          {sent ? "Dispatched to the fleet" : "Dispatch to fleet"}
        </div>
      </Panel>
    </Frame>
  );
}

/* ─────────────────────────── 2. The orchestrator routes it ─────────────────────────── */

const ROUTES = [
  { name: "System Health", icon: Activity, color: "#34f5c5" },
  { name: "Log Analyzer", icon: ScrollText, color: "#5ac8ff" },
  { name: "Backup & DR", icon: DatabaseBackup, color: "#2f7fe0" },
] as const;

/* Row geometry, shared by the chip stack and the connector SVG so the two cannot disagree. */
const ROW_H = 44;
const ROW_GAP = 8;
const STACK_H = ROW_H * 3 + ROW_GAP * 2;
const ROW_CY = (i: number) => ROW_H / 2 + i * (ROW_H + ROW_GAP);
const LINK_W = 44;
const MATCH = 0; // the agent this symptom routes to

/* 84 ticks = 5.0s. */
const S2 = { total: 84, travelFrom: 12, travelTo: 40 };

/** Cubic Bézier evaluated at u, for the dot that runs down the matched connector. The path
 * and this share one control-point set, so the dot is on the line by construction rather
 * than by two definitions that have to be kept in sync. */
function bezier(p0: number, p1: number, p2: number, p3: number, u: number) {
  const v = 1 - u;
  return v * v * v * p0 + 3 * v * v * u * p1 + 3 * v * u * u * p2 + u * u * u * p3;
}

const linkPath = (i: number) =>
  `M0,${ROW_CY(1)} C${LINK_W * 0.5},${ROW_CY(1)} ${LINK_W * 0.5},${ROW_CY(i)} ${LINK_W},${ROW_CY(i)}`;

export function RoutingScene({ active }: { active: boolean }) {
  const t = useTick(S2.total, active);
  const travel = clamp((t - S2.travelFrom) / (S2.travelTo - S2.travelFrom), 0, 1);
  const routing = t >= S2.travelFrom && t < S2.travelTo;
  const matched = t >= S2.travelTo;

  const dotX = bezier(0, LINK_W * 0.5, LINK_W * 0.5, LINK_W, travel);
  const dotY = bezier(ROW_CY(1), ROW_CY(1), ROW_CY(MATCH), ROW_CY(MATCH), travel);

  return (
    <Frame>
      <Panel className="flex items-center gap-0 p-3.5">
        {/* The hub. Pulses only while it is actually deciding. */}
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <span
            className="grid size-11 place-items-center rounded-[12px] border transition-[box-shadow,border-color] duration-500"
            style={{
              borderColor: routing || matched ? "rgba(62,156,255,0.55)" : "rgba(255,255,255,0.12)",
              background: "rgba(62,156,255,0.10)",
              boxShadow: routing ? "0 0 24px -4px rgba(62,156,255,0.8)" : "none",
            }}
          >
            <Waypoints size={17} className="text-brand" />
          </span>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-faint">Router</span>
        </div>

        <svg
          width={LINK_W}
          height={STACK_H}
          viewBox={`0 0 ${LINK_W} ${STACK_H}`}
          className="shrink-0"
          fill="none"
          aria-hidden
        >
          {ROUTES.map((_, i) => (
            <path
              key={i}
              d={linkPath(i)}
              stroke={matched && i === MATCH ? "#34f5c5" : "rgba(255,255,255,0.13)"}
              strokeWidth="1.25"
              className="transition-[stroke] duration-500"
            />
          ))}
          {routing && <circle cx={dotX} cy={dotY} r="3" fill="#34f5c5" style={{ filter: "drop-shadow(0 0 5px #34f5c5)" }} />}
        </svg>

        <div className="flex min-w-0 flex-1 flex-col" style={{ gap: ROW_GAP }}>
          {ROUTES.map((r, i) => {
            const lit = matched && i === MATCH;
            return (
              <div
                key={r.name}
                className="flex items-center gap-2 rounded-[8px] border px-2.5 transition-[border-color,background] duration-500"
                style={{
                  height: ROW_H,
                  borderColor: lit ? "rgba(52,245,197,0.5)" : "rgba(255,255,255,0.09)",
                  background: lit ? "rgba(52,245,197,0.09)" : "rgba(255,255,255,0.02)",
                  opacity: matched && !lit ? 0.45 : 1,
                }}
              >
                <r.icon size={13} className="shrink-0" style={{ color: r.color }} />
                <span className="truncate text-[12px] text-muted-foreground">{r.name}</span>
                {lit && (
                  <span className="ml-auto shrink-0 rounded-[90px] bg-ok-soft px-1.5 py-[2px] font-mono text-[9.5px] text-ok">
                    matched
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Panel>
    </Frame>
  );
}

/* ─────────────────────────── 3. It fixes, then proves it ─────────────────────────── */

/* The real pipeline off /auto-remediate, so the mockup is not telling a different story from
   the page it is advertising. */
const STAGES = [
  { name: "Detect", who: "System Health", icon: Activity },
  { name: "Diagnose", who: "Log Analyzer", icon: Search },
  { name: "Remediate", who: "Backup & DR", icon: Wrench },
  { name: "Verify", who: "Supervisor", icon: ShieldCheck },
] as const;

/* 88 ticks = 5.3s. A stage lands every 12 ticks, then the log row drops in. */
const S3 = { total: 88, first: 10, every: 12, logged: 62 };

export function RemediateScene({ active }: { active: boolean }) {
  const t = useTick(S3.total, active);
  const logged = t >= S3.logged;

  return (
    <Frame>
      {/* No panel header. Four stages plus the audit row already overrun the window, and the
          card's own title says what this is — a caption inside a caption only pushed the one
          line that matters, the logged outcome, down under the bottom fade. */}
      <Panel className="p-3">
        <div className="flex flex-col gap-1.5">
          {STAGES.map((s, i) => {
            const at = S3.first + i * S3.every;
            const done = t >= at;
            const running = t >= at - S3.every && t < at;
            return (
              <div
                key={s.name}
                className="flex items-center gap-2 rounded-[8px] border px-2.5 py-1.5 transition-[border-color,background,opacity] duration-500"
                style={{
                  borderColor: done ? "rgba(52,245,197,0.34)" : "rgba(255,255,255,0.08)",
                  background: done ? "rgba(52,245,197,0.06)" : "rgba(255,255,255,0.02)",
                  opacity: done || running ? 1 : 0.4,
                }}
              >
                <s.icon size={13} className={"shrink-0 " + (done ? "text-ok" : "text-faint")} />
                <span className="text-[12px] text-foreground">{s.name}</span>
                <span className="truncate font-mono text-[10px] text-faint">{s.who}</span>
                <span className="ml-auto shrink-0">
                  {done ? (
                    <Check size={13} className="text-ok" />
                  ) : (
                    <span
                      className="block size-1.5 rounded-[90px]"
                      style={{
                        background: running ? "#3e9cff" : "rgba(255,255,255,0.18)",
                        boxShadow: running ? "0 0 8px #3e9cff" : "none",
                      }}
                    />
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {/* The audit row. Slides up from under the stack the moment Verify passes — the whole
            claim of the page is that a run ends on the record, so the record is the payoff. */}
        <div
          className="mt-2 flex items-center gap-2 rounded-[8px] border border-white/10 bg-white/[0.03] px-2.5 py-2 transition-[opacity,transform] duration-500"
          style={{ opacity: logged ? 1 : 0, transform: `translateY(${logged ? 0 : 8}px)` }}
        >
          <span className="font-mono text-[10px] text-faint">14:22:07</span>
          <span className="truncate text-[12px] text-muted-foreground">Disk reclaimed — 41% free</span>
          <span className="ml-auto shrink-0 rounded-[90px] bg-ok-soft px-1.5 py-[2px] font-mono text-[9.5px] text-ok">
            healthy
          </span>
        </div>
      </Panel>
    </Frame>
  );
}
