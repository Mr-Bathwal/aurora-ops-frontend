"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { CornerDownLeft, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActivityStore, AGENT_LABELS, AGENT_COLOR } from "@/lib/activity-store";
import { timeAgo } from "@/lib/format";

/** The pre-run state of the console: a chat rail on the left, the robot on the right.
 *
 * The robot's half has a hairline and no fill. That is the point of it — the constellation
 * backdrop reads straight through, so the figure stands in the page's own sky rather than on
 * a plate cut out of it. Everything that has to stay legible (the thread, the input, the
 * history) lives in the left rail, which is opaque enough to carry small text; the right half
 * carries nothing but the figure and the things it says, both of which survive a starfield.
 *
 * The rail is modelled on the editor chat panels — VS Code, Cursor: a titled panel, a thread,
 * a composer boxed at the bottom with its context chips beside the send button, and history
 * under a rule. It reads as somewhere you talk to a machine, which is what it is.
 */
export function MascotConsole({
  agentName,
  color,
  greeting,
  plan,
  suggestions,
  acceptsQuery,
  requireQuery = false,
  onRun,
  loading,
}: {
  agentName: string;
  color: string;
  /** Overrides the opening line. The default reads "assist with <agent>", which is right for a
   *  named specialist and wrong for the orchestrator — you do not want help *with* it. */
  greeting?: string;
  plan: string;
  suggestions: string[];
  acceptsQuery: boolean;
  /** The three specialists run their playbook with or without a query, so an empty command bar
   *  is a valid way to start them. The orchestrator has nothing to route without one. */
  requireQuery?: boolean;
  onRun: (query?: string) => void;
  loading?: boolean;
}) {
  const [command, setCommand] = useState("");
  const entries = useActivityStore((s) => s.entries).slice(0, 3);

  function submit(text?: string) {
    if (loading) return;
    const query = acceptsQuery ? (text ?? command).trim() : "";
    if (requireQuery && !query) return;
    onRun(query || undefined);
    setCommand("");
  }

  const chip =
    "rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint";

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,380px)_1fr] lg:items-stretch">
      {/* ── Left: the chat rail ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col overflow-hidden rounded-[18px] border border-white/[0.05] bg-[rgba(6,9,14,0.86)] backdrop-blur-xl">
        <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-3">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ background: color, boxShadow: `0 0 9px ${color}` }}
          />
          <span className="font-heading text-[13.5px] font-semibold leading-none">{agentName}</span>
          <span className="ml-auto font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint">
            {loading ? "Running" : "Ready"}
          </span>
        </div>

        {/* Thread */}
        <div className="flex-1 space-y-3 px-4 py-4">
          <div className="rounded-[14px] rounded-tl-sm border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5">
            <p className="text-[13px] leading-relaxed">
              {greeting ?? (
                <>
                  How can I assist with{" "}
                  <span className="font-semibold" style={{ color }}>
                    {agentName}
                  </span>{" "}
                  today?
                </>
              )}
            </p>
          </div>

          {/* The agent's standing plan, as the system line an editor panel would print before
              it does anything. It is the same string the reasoning trace opens with, so what
              you are told here and what you watch happen are not two separate claims. */}
          <p className="border-l border-white/10 pl-3 font-mono text-[10.5px] leading-relaxed text-faint">
            {plan}
          </p>
        </div>

        {/* Composer */}
        <div className="px-4 pb-4">
          <div
            className="rounded-[14px] border bg-[rgba(3,5,10,0.92)] p-2.5"
            style={{ borderColor: `${color}33`, boxShadow: `0 0 26px -16px ${color}` }}
          >
            <input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              disabled={!acceptsQuery || loading}
              placeholder={acceptsQuery ? `Ask ${agentName} anything…` : "Fixed playbook — no query needed"}
              aria-label="Command"
              className="h-9 w-full min-w-0 bg-transparent px-1 font-mono text-[12.5px] text-foreground placeholder:text-faint focus:outline-none disabled:cursor-not-allowed"
            />

            <div className="mt-1.5 flex items-center gap-1.5">
              <span className={chip}>{agentName}</span>
              <span className={chip}>{acceptsQuery ? "free query" : "fixed"}</span>

              <Button
                type="button"
                onClick={() => submit()}
                disabled={loading || (requireQuery && !command.trim())}
                size="sm"
                className="ml-auto h-7 shrink-0 gap-1.5 px-2.5 text-[12px] text-[#0c0f14]"
                style={{ background: `linear-gradient(135deg, ${color}, #ffffff40)`, boxShadow: `0 10px 24px -12px ${color}` }}
              >
                {loading ? <RefreshCw className="animate-spin" size={13} /> : <Send size={13} />}
                Run
              </Button>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-1.5 pl-1 font-mono text-[9.5px] text-faint">
            <CornerDownLeft size={11} />
            to run
          </div>
        </div>

        {/* History, the way an editor panel keeps its past sessions under a rule. */}
        <div className="border-t border-white/[0.06] px-4 py-3">
          <div className="mb-2 font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint">Recent</div>
          {entries.length === 0 ? (
            <p className="text-[11.5px] leading-relaxed text-muted-foreground">
              Nothing yet. Run an agent and its result lands here.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {entries.map((e) => (
                <li key={e.id} className="flex items-center gap-2.5 rounded-lg px-1 py-1.5 transition-colors hover:bg-white/5">
                  <span
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ background: AGENT_COLOR[e.agentKey], boxShadow: `0 0 7px ${AGENT_COLOR[e.agentKey]}` }}
                  />
                  <span className="min-w-0 flex-1 truncate text-[11.5px]">{AGENT_LABELS[e.agentKey]}</span>
                  <span className="shrink-0 font-mono text-[10px] text-faint">{timeAgo(e.timestamp)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Right: the robot, standing in the page's own sky ─────────────────────────────── */}
      {/* Deliberately no background fill and no blur: the constellation behind the page is the
          fill. A `bg-*` here, however faint, would cut a rectangle out of the sky and put the
          figure back on a plate.
          `overflow-hidden` is what lets the thread halo work — the web is drawn far wider than
          the card and the rounded rect crops it, so the threads read as running on past the
          edge rather than as a diagram that happens to fit. */}
      <div className="group/robot relative flex min-h-[400px] items-center justify-center overflow-hidden rounded-[24px] border border-white/[0.045] px-6 py-8 sm:px-8">
        {/* The pair is capped and centred rather than spread across the whole card. Left to
            fill, the bubbles drift to the far edge and stop reading as something the figure
            beside them is saying. */}
        <div className="flex w-full max-w-[660px] flex-col items-center gap-6 lg:flex-row lg:items-center lg:gap-5">
          <RobotStage color={color} thinking={loading} />

          {/* What the agent offers to do. Only actionable for the one that takes a query;
              elsewhere they narrate the fixed playbook it will run regardless. */}
          <div className="flex w-full min-w-0 flex-col items-center gap-2.5 lg:max-w-[336px] lg:items-end">
          {suggestions.map((s, i) => {
            const bubble =
              "max-w-full rounded-[16px] rounded-br-md border border-white/[0.10] bg-[rgba(8,12,18,0.72)] px-4 py-2.5 text-left text-[13px] text-foreground/90 backdrop-blur-md";
            return (
              <motion.div
                key={s}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
                style={{ boxShadow: `0 14px 30px -20px ${color}` }}
                className="max-w-full rounded-[16px] rounded-br-md"
              >
                {acceptsQuery ? (
                  <button
                    type="button"
                    onClick={() => submit(s)}
                    disabled={loading}
                    className={`${bubble} block transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-[rgba(12,18,26,0.85)] disabled:opacity-50`}
                  >
                    {s}
                  </button>
                ) : (
                  <div className={bubble}>{s}</div>
                )}
              </motion.div>
            );
          })}
          </div>
        </div>
      </div>
    </div>
  );
}

/** The web of threads the robot stands in front of.
 *
 * The page's constellation runs behind this card for real, but a fixed backdrop cannot be
 * aimed: its sphere sits wherever the viewport happens to be, and the robot moves with the
 * scroll, so the two only ever line up at one scroll offset. Drawing a local web instead means
 * the convergence point is *defined* as the robot's back and stays there — the threads read as
 * coming out of the figure at every size and every scroll position, which is the whole effect.
 *
 * It is a deliberate echo of the backdrop rather than a copy: same long sagging curves, same
 * faint wireframe sphere, so the card looks like a close-up of the sky behind it and not like a
 * second graphic that happens to share a page.
 */
const HALO_R = 380;

/** Precomputed once at module load, not per render. `Math.random()` here would be a purity
 *  violation and would also redraw a different web on every state change. */
const THREADS = Array.from({ length: 14 }, (_, i) => {
  // The angular jitter matters: on an even division the threads leave the body at identical
  // intervals and the whole thing reads as a starburst rather than as cabling.
  const a = (i / 14) * Math.PI * 2 + 0.19 + 0.17 * Math.sin(i * 4.1);
  const bowK = Math.sin(i * 12.9898);
  // Started well out from the middle so there is no pinpoint every line converges on.
  const start = 66 + 92 * Math.abs(Math.cos(i * 7.233));
  const end = 430 + 240 * Math.abs(Math.sin(i * 2.37));
  const x0 = Math.cos(a) * start;
  const y0 = Math.sin(a) * start;
  const x1 = Math.cos(a) * end;
  const y1 = Math.sin(a) * end;
  // Bowed along the normal so the threads sag like cabling instead of firing out as a starburst.
  const nx = -Math.sin(a) * 215 * bowK;
  const ny = Math.cos(a) * 215 * bowK;
  return `M ${x0.toFixed(1)} ${y0.toFixed(1)} Q ${((x0 + x1) / 2 + nx).toFixed(1)} ${((y0 + y1) / 2 + ny).toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}`;
});

/** Nested ellipses at a shared width — a wireframe globe seen edge-on, the way the backdrop's
 *  sphere reads. */
const RINGS = [0.3, 0.58, 0.84, 1];

function ThreadHalo({ color }: { color: string }) {
  return (
    <svg
      aria-hidden
      viewBox="-620 -620 1240 1240"
      className="pointer-events-none absolute left-1/2 top-[52%] aspect-square w-[420%] -translate-x-1/2 -translate-y-1/2"
    >
      <defs>
        <filter id="halo-bloom" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      {/* The glow, off until you hover the card. Same geometry, blurred and thickened. */}
      <g
        filter="url(#halo-bloom)"
        stroke={color}
        fill="none"
        strokeWidth={2}
        className="opacity-0 transition-opacity duration-700 group-hover/robot:opacity-[0.26]"
      >
        {THREADS.map((d) => (
          <path key={d} d={d} vectorEffect="non-scaling-stroke" />
        ))}
        {RINGS.map((k) => (
          <ellipse key={k} cx={0} cy={0} rx={HALO_R} ry={HALO_R * k} vectorEffect="non-scaling-stroke" />
        ))}
      </g>

      {/* The threads themselves — barely there at rest, so the card still reads as open sky. */}
      <g
        stroke={color}
        fill="none"
        strokeWidth={0.8}
        strokeLinecap="round"
        className="opacity-[0.16] transition-opacity duration-700 group-hover/robot:opacity-[0.36]"
      >
        {THREADS.map((d) => (
          <path key={d} d={d} vectorEffect="non-scaling-stroke" />
        ))}
      </g>

      <g
        stroke={color}
        fill="none"
        strokeWidth={0.7}
        className="opacity-[0.11] transition-opacity duration-700 group-hover/robot:opacity-[0.24]"
      >
        {RINGS.map((k) => (
          <ellipse key={k} cx={0} cy={0} rx={HALO_R} ry={HALO_R * k} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
    </svg>
  );
}

/** The robot on its stage: an agent-tinted bloom behind it, a pool of light under it, and a
 * slow idle float between the two.
 *
 * The figure itself is a fixed teal render, so the specialist you have loaded is carried by
 * the light around it rather than by recolouring the art — hue-rotating a hand-graded asset
 * per tab would drag it off the palette four different ways.
 *
 * The float moves only the image. The bloom and the floor pool stay put, which is what sells
 * the height: a shadow that rises with the thing casting it reads as a sticker sliding around.
 */
function RobotStage({ color, thinking }: { color: string; thinking?: boolean }) {
  return (
    <div className="relative w-[230px] shrink-0 sm:w-[268px] lg:w-[300px]">
      <motion.div
        aria-hidden
        className="absolute left-1/2 top-[46%] aspect-square w-[155%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
        style={{ background: `radial-gradient(circle, ${color}2b, transparent 62%)` }}
        animate={thinking ? { opacity: [0.75, 1, 0.75], scale: [1, 1.05, 1] } : { opacity: 1, scale: 1 }}
        transition={thinking ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" } : { duration: 0.4 }}
      />

      <ThreadHalo color={color} />

      {/* Pool of light on the floor. The asset already fades out at its bottom edge, so this
          reads as the figure standing in it rather than as a disc pasted behind its feet. */}
      <div
        aria-hidden
        className="absolute inset-x-[16%] bottom-[4%] h-6 rounded-[50%] blur-lg"
        style={{ background: `radial-gradient(ellipse at center, ${color}66, transparent 72%)` }}
      />

      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: thinking ? 2.8 : 5.4, repeat: Infinity, ease: "easeInOut" }}
        className="relative"
      >
        <Image
          src="/media/images/hero/mascot.webp"
          /* Decorative: the chat rail beside this already names the agent you are talking to,
             so announcing the figure again only adds noise to a screen reader. */
          alt=""
          width={556}
          height={598}
          priority
          /* Served as-is: `scripts/extract-robot.mjs` already emits exactly what the page needs
             — cropped, graded, alpha-matted WebP — and the optimizer returned it three-channel
             with the alpha stripped, which painted the robot's frame as a black square. */
          unoptimized
          className="h-auto w-full"
        />
      </motion.div>
    </div>
  );
}
