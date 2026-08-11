"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

/** The orchestration scene: a rendered isometric plate of the fleet wired into the central
 * router, made interactive.
 *
 * The image is the art; everything on top is a thin overlay pinned to it in the image's own
 * coordinate space (a 2000x1242 box that matches the render's 1.61 ratio), so a hotspot and
 * a connection line stay locked to the agent they belong to at every width. Hovering an
 * agent does two things at once: the three others fall into shadow, and the cable from the
 * hovered agent to the router lights up and surges inward. Nothing here is a real control —
 * it is a diagram you can point at — so the whole layer is inert to the keyboard and only
 * listens for hover and tap.
 *
 * "Fiery" is read as *energised*, not orange: a white-hot core over a blue→mint glow, which
 * is what surging power looks like without dragging a third hue onto a two-accent page.
 */

export type SceneAgentId = "health" | "log" | "backup" | "disk";
type AgentId = SceneAgentId;

/** Geometry in the image's 2000x1242 space. `spot` is the hover target (icon + its baked
 * label); `mask` is the shadow that falls over the agent when another is hovered; `path` is
 * the connection to the hub, drawn agent -> hub so the flow animation runs inward. */
const HUB = { x: 1010, y: 590 };

const AGENTS: {
  id: AgentId;
  spot: { x: number; y: number; w: number; h: number };
  mask: { cx: number; cy: number; rx: number; ry: number };
  path: string;
}[] = [
  {
    id: "health",
    spot: { x: 250, y: 210, w: 380, h: 400 },
    mask: { cx: 435, cy: 400, rx: 250, ry: 300 },
    path: "M 520 470 C 660 545, 760 555, 862 582",
  },
  {
    id: "log",
    spot: { x: 250, y: 760, w: 380, h: 400 },
    mask: { cx: 430, cy: 930, rx: 250, ry: 300 },
    path: "M 545 895 C 700 895, 800 745, 885 695",
  },
  {
    id: "backup",
    spot: { x: 1480, y: 230, w: 420, h: 380 },
    mask: { cx: 1615, cy: 400, rx: 270, ry: 300 },
    path: "M 1178 566 C 1300 520, 1370 490, 1470 476",
  },
  {
    id: "disk",
    spot: { x: 1480, y: 760, w: 420, h: 400 },
    mask: { cx: 1620, cy: 930, rx: 260, ry: 300 },
    path: "M 1198 690 C 1315 745, 1375 800, 1470 848",
  },
];

/** `highlight` lets a parent light a branch programmatically — the orchestrator page passes
 * the agent a request just routed to, so the same lit-branch state that hover produces also
 * fires when the router picks a specialist. A live hover always wins over it, so pointing at
 * one agent while another is "routed" shows the one under the cursor. */
export function OrchestrationScene({
  highlight = null,
  bare = false,
}: {
  highlight?: AgentId | null;
  /** Drop the component's own rounding/border when it sits inside another frame (the hero
   * card), so there is no border-inside-a-border. Clipping is still needed for the shadows
   * and paths, so overflow-hidden stays. */
  bare?: boolean;
}) {
  const [hovered, setHovered] = useState<AgentId | null>(null);
  const active = hovered ?? highlight;
  const setActive = setHovered;

  return (
    <figure
      className={
        "orchestration-scene relative mx-auto aspect-[2000/1242] w-full overflow-hidden bg-[#05070a] " +
        (bare ? "" : "rounded-[20px] border border-white/10")
      }
      onMouseLeave={() => setActive(null)}
    >
      <Image
        src="/media/images/hero/orchestration-scene.webp"
        alt="The Aurora Ops fleet — System Health, Log Analyzer, Backup & DR and Disk Auditor — wired into the central logic router."
        fill
        sizes="(max-width: 1280px) 100vw, 1200px"
        className="object-cover"
        priority={false}
      />

      {/* A faint global cool-down when anything is active, so the lit branch reads as the
          one warm thing in the room. */}
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-[#04070a]"
        initial={false}
        animate={{ opacity: active ? 0.32 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Shadow over every agent that is not the active one. */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 2000 1242" preserveAspectRatio="none" aria-hidden>
        <AnimatePresence>
          {active &&
            AGENTS.filter((a) => a.id !== active).map((a) => (
              <motion.ellipse
                key={a.id}
                cx={a.mask.cx}
                cy={a.mask.cy}
                rx={a.mask.rx}
                ry={a.mask.ry}
                fill="#04070a"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.64 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ filter: "blur(26px)" }}
              />
            ))}
        </AnimatePresence>
      </svg>

      {/* The lit connection. Two strokes: a wide soft glow, and a bright dashed core that
          surges toward the hub. Drawn above the shadows so the branch stays hot. */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 2000 1242" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="orch-flow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#34f5c5" />
            <stop offset="55%" stopColor="#8fe6ff" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
        </defs>
        <AnimatePresence>
          {active && (
            <motion.g
              key={active}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* wide soft halo */}
              <path
                d={AGENTS.find((a) => a.id === active)!.path}
                fill="none"
                stroke="#5ec8ff"
                strokeWidth={22}
                strokeLinecap="round"
                opacity={0.55}
                style={{ filter: "blur(9px)" }}
              />
              {/* steady bright underlay, so the branch reads as lit even between dashes */}
              <path
                d={AGENTS.find((a) => a.id === active)!.path}
                fill="none"
                stroke="#8fe6ff"
                strokeWidth={6}
                strokeLinecap="round"
                opacity={0.4}
              />
              {/* hot core, flowing inward */}
              <path
                d={AGENTS.find((a) => a.id === active)!.path}
                fill="none"
                stroke="url(#orch-flow)"
                strokeWidth={6}
                strokeLinecap="round"
                strokeDasharray="30 26"
                style={{ animation: "orchestration-flow 0.9s linear infinite", filter: "drop-shadow(0 0 6px rgba(180,240,255,0.9))" }}
              />
              {/* a bright pulse landing at the hub */}
              <circle cx={HUB.x} cy={HUB.y} r={16} fill="#eafaff">
                <animate attributeName="r" values="10;20;10" dur="1.1s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.9;0.35;0.9" dur="1.1s" repeatCount="indefinite" />
              </circle>
            </motion.g>
          )}
        </AnimatePresence>
      </svg>

      {/* Hover / tap targets. Transparent, sized to the agent and its label. Percentages of
          the 2000x1242 box so they track the art. */}
      {AGENTS.map((a) => (
        <button
          key={a.id}
          type="button"
          data-agent={a.id}
          aria-label={`Highlight the ${a.id} agent's route to the orchestrator`}
          className="absolute cursor-default"
          style={{
            left: `${(a.spot.x / 2000) * 100}%`,
            top: `${(a.spot.y / 1242) * 100}%`,
            width: `${(a.spot.w / 2000) * 100}%`,
            height: `${(a.spot.h / 1242) * 100}%`,
          }}
          onMouseEnter={() => setActive(a.id)}
          onFocus={() => setActive(a.id)}
          onBlur={() => setActive(null)}
          onClick={() => setActive((cur) => (cur === a.id ? null : a.id))}
        />
      ))}
    </figure>
  );
}
