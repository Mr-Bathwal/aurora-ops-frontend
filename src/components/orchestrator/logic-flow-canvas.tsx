"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { AgentIcon, type AgentIconName } from "@/components/agents/agent-icon";
import { cn } from "@/lib/utils";

/** Nodes and edges are laid out in this fixed coordinate space; the container carries the
 * matching aspect ratio so percentage-positioned tiles line up with the SVG edge layer. */
const W = 1000;
const H = 560;

export type NodeId = "health" | "log" | "logic" | "backup" | "disk";

type FlowNode = {
  id: NodeId;
  icon: AgentIconName;
  label: string;
  sub: string;
  x: number;
  y: number;
};

const NODES: FlowNode[] = [
  { id: "health", icon: "health", label: "System Health Agent", sub: "cpu · memory · disk", x: 168, y: 132 },
  { id: "log", icon: "log", label: "Log Analyzer Agent", sub: "read_log_file", x: 168, y: 424 },
  { id: "logic", icon: "logic", label: "Logic: IF > 3 Errors", sub: "router · supervisor", x: 500, y: 278 },
  { id: "backup", icon: "backup", label: "Backup & DR", sub: "create_backup · check_dr", x: 832, y: 132 },
  { id: "disk", icon: "disk", label: "Disk Auditor", sub: "verify · report", x: 832, y: 424 },
];

type FlowEdge = {
  from: NodeId;
  to: NodeId;
  d: string;
  color: string;
  label: string;
  /** Where the label sits, in canvas coordinates. */
  lx: number;
  ly: number;
};

const EDGES: FlowEdge[] = [
  {
    from: "health",
    to: "logic",
    d: "M255 158 C 340 190, 372 232, 424 262",
    color: "#34f5c5",
    label: "IF",
    lx: 300,
    ly: 205,
  },
  {
    from: "log",
    to: "logic",
    d: "M255 400 C 340 372, 372 328, 424 296",
    color: "#5ac8ff",
    label: "IF",
    lx: 300,
    ly: 358,
  },
  {
    from: "logic",
    to: "backup",
    d: "M576 262 C 640 230, 690 190, 748 158",
    color: "#2f7fe0",
    label: "IF",
    lx: 690,
    ly: 205,
  },
  {
    from: "logic",
    to: "disk",
    d: "M576 296 C 640 328, 690 372, 748 400",
    color: "#7bd9ff",
    label: "THEN",
    lx: 690,
    ly: 358,
  },
];

function Node({
  node,
  dimmed,
  active,
  onHover,
}: {
  node: FlowNode;
  dimmed: boolean;
  active: boolean;
  onHover: (id: NodeId | null) => void;
}) {
  const isHub = node.id === "logic";
  return (
    <motion.div
      className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
      style={{ left: `${(node.x / W) * 100}%`, top: `${(node.y / H) * 100}%` }}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: dimmed ? 0.35 : 1, scale: active ? 1.06 : 1 }}
      transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 5 + node.x / 400, repeat: Infinity, ease: "easeInOut" }}
      >
        <AgentIcon name={node.icon} size={isHub ? 112 : 100} live={active} />
      </motion.div>
      <div className="mt-2 max-w-[170px] text-center">
        <div className="font-heading text-[13px] font-semibold leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
          {node.label}
        </div>
        <div className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-faint">{node.sub}</div>
      </div>
    </motion.div>
  );
}

/** The orchestration graph: illustrated agent tiles wired through a central logic node,
 * over a circuit-board plate. Hovering a node isolates the paths it participates in;
 * `routedTo` lights up the branch the live orchestrator actually picked. */
export function LogicFlowCanvas({ routedTo }: { routedTo?: NodeId | null }) {
  const [hover, setHover] = useState<NodeId | null>(null);
  const focus = hover ?? routedTo ?? null;

  function edgeLit(e: FlowEdge) {
    return !focus || e.from === focus || e.to === focus;
  }
  function nodeLit(id: NodeId) {
    if (!focus) return true;
    if (id === focus) return true;
    return EDGES.some((e) => (e.from === focus && e.to === id) || (e.to === focus && e.from === id));
  }

  return (
    <div className="relative overflow-hidden rounded-[20px] border border-white/10 bg-[#04050c]">
      {/* Circuit plate */}
      <Image
        src="/media/images/hero/circuit-macro.jpg"
        alt=""
        fill
        sizes="(min-width: 1024px) 70vw, 100vw"
        className="object-cover opacity-40"
        priority
      />
      <div className="absolute inset-0 bg-[radial-gradient(65%_60%_at_50%_45%,rgba(62,156,255,0.22),transparent_70%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#04050c]/70 via-[#04050c]/40 to-[#04050c]/90" />

      {/* Graph — fixed aspect ratio keeps tiles aligned to the SVG coordinate space */}
      <div className="relative hidden md:block" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full" fill="none" aria-hidden>
          <defs>
            {EDGES.map((e) => (
              <filter key={e.from + e.to} id={`glow-${e.from}-${e.to}`} x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            ))}
          </defs>

          {EDGES.map((e) => {
            const lit = edgeLit(e);
            return (
              <g key={`${e.from}-${e.to}`} opacity={lit ? 1 : 0.16} style={{ transition: "opacity 0.3s" }}>
                <path d={e.d} stroke={e.color} strokeWidth="9" opacity="0.14" strokeLinecap="round" />
                <path
                  id={`path-${e.from}-${e.to}`}
                  d={e.d}
                  stroke={e.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="10 8"
                  filter={`url(#glow-${e.from}-${e.to})`}
                >
                  <animate attributeName="stroke-dashoffset" from="36" to="0" dur="1.4s" repeatCount="indefinite" />
                </path>
                {lit && (
                  <circle r="4" fill="#fff">
                    <animateMotion dur="2.6s" repeatCount="indefinite" path={e.d} />
                    <animate attributeName="opacity" values="0;1;1;0" dur="2.6s" repeatCount="indefinite" />
                  </circle>
                )}
                {/* Edge label chip */}
                <rect
                  x={e.lx - (e.label.length * 5 + 12)}
                  y={e.ly - 13}
                  width={e.label.length * 10 + 24}
                  height="26"
                  rx="8"
                  fill="#05060f"
                  stroke={e.color}
                  strokeOpacity="0.5"
                />
                <text
                  x={e.lx}
                  y={e.ly + 5}
                  textAnchor="middle"
                  fill={e.color}
                  fontSize="13"
                  fontWeight="700"
                  fontFamily="var(--font-mono)"
                  letterSpacing="1"
                >
                  {e.label}
                </text>
              </g>
            );
          })}
        </svg>

        {NODES.map((n) => (
          <Node key={n.id} node={n} dimmed={!nodeLit(n.id)} active={focus === n.id} onHover={setHover} />
        ))}
      </div>

      {/* Stacked fallback for narrow screens — the curved edge layer doesn't survive a
          phone-width canvas, so the same chain reads top-to-bottom instead. */}
      <div className="relative flex flex-col items-center gap-3 px-4 py-8 md:hidden">
        {NODES.map((n, i) => (
          <div key={n.id} className="flex w-full max-w-xs flex-col items-center">
            <div className="flex w-full items-center gap-3 rounded-[20px] border border-white/10 bg-black/50 p-3 backdrop-blur-md">
              <AgentIcon name={n.icon} size={54} />
              <div className="min-w-0">
                <div className="truncate font-heading text-[13px] font-semibold">{n.label}</div>
                <div className="truncate font-mono text-[9.5px] uppercase tracking-[0.12em] text-faint">{n.sub}</div>
              </div>
            </div>
            {i < NODES.length - 1 && <div className="h-5 w-px bg-gradient-to-b from-brand to-cyan" />}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className={cn("absolute bottom-3 left-4 hidden gap-4 font-mono text-[10px] uppercase tracking-[0.14em] text-faint md:flex")}>
        <span>Hover a tile to isolate its branch</span>
      </div>
    </div>
  );
}
