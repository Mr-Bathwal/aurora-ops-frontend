"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { DatabaseBackup, FileSearch, HardDrive, Network, ShieldCheck, Waypoints } from "lucide-react";

/** The auto-remediation graph, told as a light travelling through it.
 *
 * Drawn rather than rendered: one fixed viewBox scales cleanly at every width, the labels
 * stay real text, and nothing has to be re-exported when a stage is renamed.
 *
 * The story runs on beats. A node is lit on its beat, an edge carries a packet of light on
 * the beat before the node it feeds — so the eye is pulled left to right and the graph reads
 * as a sequence rather than as a diagram that happens to be animated. Peak halo is 0.34
 * opacity: bright enough to read as light in the room, dim enough that seven of them lit at
 * once is still a dark page.
 *
 * `replayToken` re-keys the animated layer, which remounts it and replays the story. That is
 * how a live run re-lights the graph: bump the token when the request goes out.
 */

const VB = { w: 1600, h: 880 };
const NODE = 128;
const STEP = 0.58; // seconds per beat
const GLOW = 0.34; // peak halo opacity — mild, per the brief
const REST = 0.17; // what the halo settles back to once the beat has passed

type Status = "live" | "standby";

type GraphNode = {
  id: string;
  x: number;
  y: number;
  beat: number;
  label: string;
  sub: string;
  status: Status;
  icon: typeof FileSearch;
};

/* Everything here is a stage that exists in `auto_ops.py`, plus the two lanes the router is
 * built to fan out to but which are not wired to endpoints yet. Those carry a STANDBY chip
 * rather than a green pip — a diagram that shows an agent running when it cannot run is
 * worse than one that admits the lane is empty. */
const NODES: GraphNode[] = [
  {
    id: "ingest",
    x: 148, y: 430, beat: 0,
    label: "Log Analyzer",
    sub: "diagnostic intake",
    status: "live",
    icon: FileSearch,
  },
  {
    id: "router",
    x: 475, y: 430, beat: 2,
    label: "Decision Router",
    sub: "supervisor · if / then",
    status: "live",
    icon: Waypoints,
  },
  {
    id: "backup",
    x: 900, y: 148, beat: 4,
    label: "Backup & DR",
    sub: "create_backup · check_dr",
    status: "live",
    icon: DatabaseBackup,
  },
  {
    id: "sentinel",
    x: 900, y: 430, beat: 4.14,
    label: "Network Sentinel",
    sub: "ports · egress",
    status: "standby",
    icon: Network,
  },
  {
    id: "disk",
    x: 900, y: 712, beat: 4.28,
    label: "Disk Auditor",
    sub: "capacity · SMART",
    status: "standby",
    icon: HardDrive,
  },
  {
    id: "chain",
    x: 1245, y: 430, beat: 6,
    label: "Chain Supervisor",
    sub: "reads the whole chain",
    status: "live",
    icon: ShieldCheck,
  },
];

const EDGES: { id: string; d: string; beat: number; dashed?: boolean }[] = [
  { id: "in-rt", d: "M 208 430 L 330 430", beat: 1, dashed: true },
  { id: "rt-bk", d: "M 620 345 C 706 345, 748 148, 836 148", beat: 3 },
  { id: "rt-sn", d: "M 620 430 L 836 430", beat: 3.14 },
  { id: "rt-dk", d: "M 620 515 C 706 515, 748 712, 836 712", beat: 3.28 },
  { id: "bk-ch", d: "M 964 148 C 1062 148, 1092 352, 1181 402", beat: 5 },
  { id: "sn-ch", d: "M 964 430 L 1181 430", beat: 5.14 },
  { id: "dk-ch", d: "M 964 712 C 1062 712, 1092 508, 1181 458", beat: 5.28 },
  { id: "ch-vd", d: "M 1309 430 L 1436 430", beat: 7 },
];

const VERDICT_BEAT = 8;

const ACCENT: Record<Status, string> = { live: "#34f5c5", standby: "#5f7d9c" };

/** Three port pins down a node's left edge and one on its right, as on the reference art.
 * Purely decorative, but it is the detail that makes a rounded square read as hardware. */
function Ports({ x, y }: { x: number; y: number }) {
  const half = NODE / 2;
  return (
    <g aria-hidden>
      {[-34, 0, 34].map((dy) => (
        <rect key={dy} x={x - half - 3} y={y + dy - 7} width={4} height={14} rx={2} fill="#3d4c5e" />
      ))}
      <rect x={x + half - 1} y={y - 7} width={4} height={14} rx={2} fill="#3d4c5e" />
    </g>
  );
}

export function RemediationGraph({ replayToken = 0 }: { replayToken?: number }) {
  const wrap = useRef<HTMLDivElement>(null);
  const inView = useInView(wrap, { once: true, margin: "-120px" });
  const reduced = useReducedMotion();

  // With reduced motion the story is not told — the graph simply arrives lit, which is the
  // information without the choreography.
  const lit = reduced || inView;
  const delayFor = (beat: number) => (reduced ? 0 : beat * STEP);

  return (
    <div ref={wrap} className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${VB.w} ${VB.h}`}
        className="h-auto w-full min-w-[860px]"
        role="img"
        aria-label="The auto-remediation chain: the Log Analyzer feeds a decision router, which fans out to Backup & DR and two standby lanes, and every lane returns to a chain supervisor that issues the verdict."
      >
        <defs>
          <filter id="ar-halo" x="-70%" y="-70%" width="240%" height="240%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
          <filter id="ar-halo-sm" x="-90%" y="-90%" width="280%" height="280%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
          <linearGradient id="ar-face" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#111823" />
            <stop offset="100%" stopColor="#0a0f16" />
          </linearGradient>
          <radialGradient id="ar-orb">
            <stop offset="0%" stopColor="#8ffbe2" />
            <stop offset="55%" stopColor="#1d6f68" />
            <stop offset="100%" stopColor="#0b1a1e" />
          </radialGradient>
        </defs>

        {/* Re-keying on the token remounts every animated child, which replays the story. */}
        <g key={replayToken}>
          {/* ── Wires ─────────────────────────────────────────────────────────────────── */}
          {EDGES.map((e) => {
            const delay = delayFor(e.beat);
            return (
              <g key={e.id}>
                {/* The wire at rest — always visible, so the graph is legible before the
                    story runs and after it has passed. */}
                <path
                  d={e.d}
                  fill="none"
                  stroke="#243040"
                  strokeWidth={2}
                  strokeDasharray={e.dashed ? "7 9" : undefined}
                  strokeLinecap="round"
                />
                {/* The wire once the current has reached it. */}
                <motion.path
                  d={e.d}
                  fill="none"
                  stroke="#34f5c5"
                  strokeWidth={2}
                  strokeDasharray={e.dashed ? "7 9" : undefined}
                  strokeLinecap="round"
                  initial={{ opacity: 0 }}
                  animate={lit ? { opacity: [0, 0.85, 0.4] } : { opacity: 0 }}
                  transition={{ delay, duration: 1.1, times: [0, 0.45, 1], ease: "easeOut" }}
                />
                {/* The packet. `pathLength={1}` normalises every wire to the same clock, so
                    a long curve and a short straight take the same time to traverse — the
                    beat stays even whatever the geometry. */}
                {!reduced && (
                  <motion.path
                    d={e.d}
                    fill="none"
                    pathLength={1}
                    stroke="#c8fff2"
                    strokeWidth={3.5}
                    strokeLinecap="round"
                    strokeDasharray="0.13 0.87"
                    initial={{ strokeDashoffset: 0.13, opacity: 0 }}
                    animate={lit ? { strokeDashoffset: -0.87, opacity: [0, 1, 1, 0] } : { opacity: 0 }}
                    transition={{
                      delay,
                      duration: 0.95,
                      ease: "easeInOut",
                      opacity: { delay, duration: 0.95, times: [0, 0.1, 0.75, 1] },
                    }}
                  />
                )}
              </g>
            );
          })}

          {/* ── The intake orb ────────────────────────────────────────────────────────── */}
          <motion.circle
            cx={148} cy={430} r={62} fill="#34f5c5" filter="url(#ar-halo)"
            initial={{ opacity: 0 }}
            animate={lit ? { opacity: [0, GLOW, REST] } : { opacity: 0 }}
            transition={{ delay: delayFor(0), duration: 1.3, times: [0, 0.4, 1] }}
          />
          <circle cx={148} cy={430} r={54} fill="url(#ar-orb)" stroke="#2b4a52" strokeWidth={1.5} />
          <circle cx={148} cy={430} r={54} fill="none" stroke="#5ffbdf" strokeWidth={1} opacity={0.25} />

          {/* ── Router shell ──────────────────────────────────────────────────────────── */}
          <motion.rect
            x={330} y={250} width={290} height={360} rx={26} fill="#34f5c5" filter="url(#ar-halo)"
            initial={{ opacity: 0 }}
            animate={lit ? { opacity: [0, GLOW, REST] } : { opacity: 0 }}
            transition={{ delay: delayFor(2), duration: 1.3, times: [0, 0.4, 1] }}
          />
          <rect x={330} y={250} width={290} height={360} rx={26} fill="url(#ar-face)" stroke="#2f6f74" strokeWidth={1.5} />

          {/* The router's own branch glyph: one input fanning into three guarded outputs. */}
          <g stroke="#7f8ca0" strokeWidth={2} fill="none" strokeLinecap="round">
            <path d="M 452 430 L 470 430" />
            <path d="M 470 430 C 500 430, 505 345, 536 345" />
            <path d="M 470 430 L 536 430" />
            <path d="M 470 430 C 500 430, 505 515, 536 515" />
          </g>
          {[345, 430, 515].map((y) => (
            <text key={y} x={556} y={y + 4} className="font-mono" fontSize={17} fill="#8d9bb0">
              IF
            </text>
          ))}
          <g transform="translate(388 406)">
            <Waypoints width={44} height={44} stroke="#98a6ba" strokeWidth={1.6} />
          </g>

          {/* ── Agent + supervisor nodes ──────────────────────────────────────────────── */}
          {NODES.filter((n) => n.id !== "ingest" && n.id !== "router").map((n) => {
            const half = NODE / 2;
            const delay = delayFor(n.beat);
            const accent = ACCENT[n.status];
            const Icon = n.icon;
            return (
              <g key={n.id}>
                <motion.rect
                  x={n.x - half} y={n.y - half} width={NODE} height={NODE} rx={24}
                  fill={accent} filter="url(#ar-halo)"
                  initial={{ opacity: 0 }}
                  animate={lit ? { opacity: [0, n.status === "live" ? GLOW : GLOW * 0.5, n.status === "live" ? REST : REST * 0.5] } : { opacity: 0 }}
                  transition={{ delay, duration: 1.3, times: [0, 0.4, 1] }}
                />
                <rect
                  x={n.x - half} y={n.y - half} width={NODE} height={NODE} rx={24}
                  fill="url(#ar-face)" stroke={n.status === "live" ? "#2f6f74" : "#2a3646"} strokeWidth={1.5}
                />
                <Ports x={n.x} y={n.y} />
                <g transform={`translate(${n.x - 26} ${n.y - 26})`}>
                  <Icon width={52} height={52} stroke={n.status === "live" ? "#b9f6e8" : "#8fa4bd"} strokeWidth={1.4} />
                </g>

                {/* Status pip — green only where the lane actually reaches an endpoint. */}
                {n.status === "live" ? (
                  <>
                    <motion.circle
                      cx={n.x + half - 20} cy={n.y - half + 20} r={11} fill="#4ade80" filter="url(#ar-halo-sm)"
                      initial={{ opacity: 0 }}
                      animate={lit ? { opacity: [0, 0.8, 0.45] } : { opacity: 0 }}
                      transition={{ delay, duration: 1.3, times: [0, 0.4, 1] }}
                    />
                    <circle cx={n.x + half - 20} cy={n.y - half + 20} r={6} fill="#4ade80" />
                  </>
                ) : (
                  <circle cx={n.x + half - 20} cy={n.y - half + 20} r={6} fill="none" stroke="#5f7d9c" strokeWidth={1.5} />
                )}

                <text x={n.x} y={n.y + half + 40} textAnchor="middle" className="font-heading" fontSize={26} fontWeight={600} fill="#e7edf5">
                  {n.label}
                </text>
                <text x={n.x} y={n.y + half + 68} textAnchor="middle" className="font-mono" fontSize={17} fill={n.status === "live" ? "#7d8ea4" : "#5f7d9c"}>
                  {n.status === "live" ? n.sub : `standby · ${n.sub}`}
                </text>
              </g>
            );
          })}

          {/* ── Verdict ───────────────────────────────────────────────────────────────── */}
          <motion.circle
            cx={1470} cy={430} r={44} fill="#3e9cff" filter="url(#ar-halo)"
            initial={{ opacity: 0 }}
            animate={lit ? { opacity: [0, GLOW + 0.08, REST + 0.06] } : { opacity: 0 }}
            transition={{ delay: delayFor(VERDICT_BEAT), duration: 1.4, times: [0, 0.4, 1] }}
          />
          <circle cx={1470} cy={430} r={34} fill="#0f1b2b" stroke="#3e9cff" strokeWidth={2} />
          <motion.path
            d="M 1454 430 L 1465 441 L 1487 419"
            fill="none" stroke="#6fc0ff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={lit ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
            transition={{ delay: delayFor(VERDICT_BEAT) + 0.15, duration: 0.5, ease: "easeOut" }}
          />

          {/* ── Labels for the two hand-drawn nodes ───────────────────────────────────── */}
          <text x={148} y={534} textAnchor="middle" className="font-heading" fontSize={26} fontWeight={600} fill="#e7edf5">
            Log Analyzer
          </text>
          <text x={148} y={562} textAnchor="middle" className="font-mono" fontSize={17} fill="#7d8ea4">
            diagnostic intake
          </text>

          <text x={475} y={664} textAnchor="middle" className="font-heading" fontSize={26} fontWeight={600} fill="#e7edf5">
            Decision Router
          </text>
          <text x={475} y={692} textAnchor="middle" className="font-mono" fontSize={17} fill="#7d8ea4">
            supervisor · if / then
          </text>

          <text x={1470} y={512} textAnchor="middle" className="font-heading" fontSize={26} fontWeight={600} fill="#e7edf5">
            Verdict
          </text>
        </g>
      </svg>
    </div>
  );
}
