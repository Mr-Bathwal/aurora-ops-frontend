"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useActivityStore, type AgentKey } from "@/lib/activity-store";

type HoverNode = "health" | "log" | "backup";

/* Backup & DR at cy=300, generous gap from Orchestrator (bottom at 196) */
const EDGE_D = {
  health: "M360 150 C 270 150 220 86 168 86",
  log:    "M360 150 C 470 150 510 86 560 86",
  backup: "M360 150 C 360 210 360 268 360 300",
} as const;

const EDGE_ID = { health: "#e1", log: "#e2", backup: "#e3" } as const;
const SEVERITY_COLOR: Record<string, string> = { ok: "#34f5c5", warn: "#FFC56B", crit: "#FF6B81" };
const IDLE_COLOR = "#34F5C5";

function eColor(key: HoverNode, entries: ReturnType<typeof useActivityStore.getState>["entries"]) {
  const last = entries.find((e) => e.agentKey === key);
  return last ? (SEVERITY_COLOR[last.severity] ?? IDLE_COLOR) : IDLE_COLOR;
}
function ringClass(key: AgentKey, entries: ReturnType<typeof useActivityStore.getState>["entries"]) {
  const last = entries.find((e) => e.agentKey === key);
  if (!last) return "ring-idle";
  return last.severity === "crit" ? "ring-crit" : last.severity === "warn" ? "ring-warn" : "ring-ok";
}
function subLabel(key: AgentKey, fallback: string, entries: ReturnType<typeof useActivityStore.getState>["entries"]) {
  return entries.find((e) => e.agentKey === key)?.outcomeLabel ?? fallback;
}

/* Linear spark — line segment that zips along edge path tangentially */
function Spark({ pathId, dur, begin, color }: { pathId: string; dur: number; begin: number; color: string }) {
  return (
    <line x1="-7" y1="0" x2="7" y2="0" stroke={color} strokeWidth="2" strokeLinecap="round"
      style={{ filter: `drop-shadow(0 0 5px ${color}) drop-shadow(0 0 2px #fff)` }}>
      <animateMotion dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" rotate="auto">
        <mpath href={pathId} />
      </animateMotion>
    </line>
  );
}

/* Burst particles from node centre on hover/click */
function Sparks({ cx, cy, color }: { cx: number; cy: number; color: string }) {
  return <>
    {Array.from({ length: 8 }).map((_, i) => {
      const angle = (i * 45 * Math.PI) / 180;
      const tx = cx + Math.cos(angle) * 56, ty = cy + Math.sin(angle) * 56;
      const d = i * 0.07;
      return (
        <line key={i} style={{ filter: `drop-shadow(0 0 4px ${color})` }}>
          <animate attributeName="x1" from={cx} to={tx} dur="0.68s" begin={`${d}s`} repeatCount="indefinite" />
          <animate attributeName="y1" from={cy} to={ty} dur="0.68s" begin={`${d}s`} repeatCount="indefinite" />
          <animate attributeName="x2" from={cx + Math.cos(angle) * 10} to={tx} dur="0.68s" begin={`${d}s`} repeatCount="indefinite" />
          <animate attributeName="y2" from={cy + Math.sin(angle) * 10} to={ty} dur="0.68s" begin={`${d}s`} repeatCount="indefinite" />
          <animate attributeName="stroke" values={`${color};transparent`} dur="0.68s" begin={`${d}s`} repeatCount="indefinite" />
          <animate attributeName="stroke-width" values="2;0" dur="0.68s" begin={`${d}s`} repeatCount="indefinite" />
        </line>
      );
    })}
  </>;
}

/* Active edge: glowing dashes + dense linear sparks */
function ElectricEdge({ nodeKey, color }: { nodeKey: HoverNode; color: string }) {
  const DUR = 0.34, COUNT = 10;
  return <>
    <path d={EDGE_D[nodeKey]} fill="none" stroke={color} strokeWidth="2" strokeDasharray="5 4"
      strokeLinecap="round"
      style={{ filter: `drop-shadow(0 0 5px ${color})`, animation: "electric-dash 0.10s linear infinite" }} />
    {Array.from({ length: COUNT }).map((_, i) => (
      <Spark key={i} pathId={EDGE_ID[nodeKey]} dur={DUR} begin={i * (DUR / COUNT)} color={color} />
    ))}
  </>;
}

export function OrchestrationCanvas() {
  const entries = useActivityStore((s) => s.entries);
  const [activeNode, setActiveNode] = useState<HoverNode | null>(null);
  const [clickedNode, setClickedNode] = useState<HoverNode | null>(null);
  const router = useRouter();

  function handleClick(key: HoverNode) {
    const routes: Record<HoverNode, string> = {
      health: "/run?tab=health&autorun=1",
      log:    "/run?tab=log&autorun=1",
      backup: "/run?tab=backup&autorun=1",
    };
    setClickedNode(key);
    setTimeout(() => { setClickedNode(null); router.push(routes[key]); }, 1400);
  }

  function gProps(key: HoverNode) {
    const color = eColor(key, entries);
    const isActive = activeNode === key || clickedNode === key;
    return {
      onMouseEnter: () => setActiveNode(key),
      onMouseLeave: () => setActiveNode(null),
      onClick:      () => handleClick(key),
      style: {
        cursor: "pointer",
        filter: isActive
          ? `drop-shadow(0 0 20px ${color}) drop-shadow(0 0 40px ${color}55)`
          : "none",
        transition: "filter 0.22s",
      } as React.CSSProperties,
    };
  }

  const hC = eColor("health", entries);
  const lC = eColor("log",    entries);
  const bC = eColor("backup", entries);

  return (
    <div className="orch-canvas rise rise-d1 py-2">
      <svg viewBox="0 0 720 390" role="img"
        aria-label="Orchestration graph — hover or click a node to activate it"
        className="block h-auto w-full">
        <defs>
          <path id="e1" d={EDGE_D.health} />
          <path id="e2" d={EDGE_D.log}    />
          <path id="e3" d={EDGE_D.backup} />
        </defs>

        {/* Ambient edges */}
        {(["health","log","backup"] as HoverNode[]).map((k, i) => (
          <use key={k} href={`#e${i+1}`} className="edge"
            style={{ opacity: activeNode && activeNode !== k ? 0.22 : 1, transition: "opacity 0.3s" }} />
        ))}

        {/* Ambient slow linear sparks (always visible — one per edge) */}
        <Spark pathId="#e1" dur={2.6} begin={0}    color={hC} />
        <Spark pathId="#e2" dur={2.6} begin={0.9}  color={lC} />
        <Spark pathId="#e3" dur={2.6} begin={0.45} color={bC} />

        {/* Active electricity overlays */}
        {activeNode === "health" && <ElectricEdge nodeKey="health" color={hC} />}
        {activeNode === "log"    && <ElectricEdge nodeKey="log"    color={lC} />}
        {activeNode === "backup" && <ElectricEdge nodeKey="backup" color={bC} />}

        {/* Click flash rings */}
        {clickedNode === "health" && <circle cx="138" cy="86"  r="58" fill="none" stroke={hC} strokeWidth="3" style={{ animation: "hover-ring-pulse 0.28s ease-in-out infinite", filter: `drop-shadow(0 0 18px ${hC})` }} />}
        {clickedNode === "log"    && <circle cx="582" cy="86"  r="58" fill="none" stroke={lC} strokeWidth="3" style={{ animation: "hover-ring-pulse 0.28s ease-in-out infinite", filter: `drop-shadow(0 0 18px ${lC})` }} />}
        {clickedNode === "backup" && <circle cx="360" cy="300" r="58" fill="none" stroke={bC} strokeWidth="3" style={{ animation: "hover-ring-pulse 0.28s ease-in-out infinite", filter: `drop-shadow(0 0 18px ${bC})` }} />}

        {/* ── Orchestrator center ── */}
        <g style={{ filter: activeNode ? "drop-shadow(0 0 24px #3E9CFF) drop-shadow(0 0 48px #3E9CFF44)" : "none", transition: "filter 0.3s" }}>
          <circle cx="360" cy="150" r="46" className="node-card center" />
          <circle cx="360" cy="150" r="46" fill="none" stroke="var(--brand)" strokeWidth="1" opacity="0.4">
            <animate attributeName="r" values="46;54;46" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values=".4;0;.4" dur="3s" repeatCount="indefinite" />
          </circle>
          <path className="nicon-c" d="M360 138v-6M360 168v6M348 150h-6M372 150h6" />
          <circle cx="360" cy="150" r="5" fill="none" stroke="#fff" strokeWidth="1.8" />
          <text x="360" y="210" textAnchor="middle" className="ntitle">Orchestrator</text>
          <text x="360" y="226" textAnchor="middle" className="nsub">router · supervisor</text>
        </g>

        {/* ── System Health (top-left) ── */}
        {/* ntitle at y=148 (86+62), nsub at y=164 — well clear of hover ring at r=52 bottom=138 */}
        <g {...gProps("health")}>
          <circle cx="138" cy="86" r="36" className="node-card" />
          <circle cx="138" cy="86" r="40" className={ringClass("health", entries)} />
          {(activeNode === "health" || clickedNode === "health") && <>
            <circle cx="138" cy="86" r="50" fill="none" stroke={hC} strokeWidth="1.5"
              style={{ animation: "hover-ring-pulse 0.9s ease-in-out infinite", filter: `drop-shadow(0 0 8px ${hC})` }} />
            <Sparks cx={138} cy={86} color={hC} />
          </>}
          <path className="nicon" d="M124 86h5l3 7 4-14 3 7h5" />
          <text x="138" y="150" textAnchor="middle" className="ntitle">System Health</text>
          <text x="138" y="165" textAnchor="middle" className="nsub">{subLabel("health","cpu·mem·disk",entries)}</text>
        </g>

        {/* ── Log Analyzer (top-right) ── */}
        <g {...gProps("log")}>
          <circle cx="582" cy="86" r="36" className="node-card" />
          <circle cx="582" cy="86" r="40" className={ringClass("log", entries)} />
          {(activeNode === "log" || clickedNode === "log") && <>
            <circle cx="582" cy="86" r="50" fill="none" stroke={lC} strokeWidth="1.5"
              style={{ animation: "hover-ring-pulse 0.9s ease-in-out infinite", filter: `drop-shadow(0 0 8px ${lC})` }} />
            <Sparks cx={582} cy={86} color={lC} />
          </>}
          <path className="nicon" d="M576 76h9l3 3v15h-12zM585 76v3h3M579 88h6M579 92h4" />
          <text x="582" y="150" textAnchor="middle" className="ntitle">Log Analyzer</text>
          <text x="582" y="165" textAnchor="middle" className="nsub">{subLabel("log","reads logs",entries)}</text>
        </g>

        {/* ── Backup & DR (bottom-center, cy=300, huge gap from orchestrator) ── */}
        {/* Top of node: 300-36=264, bottom of orchestrator: 150+46=196, gap = 68px */}
        <g {...gProps("backup")}>
          <circle cx="360" cy="300" r="36" className="node-card" />
          <circle cx="360" cy="300" r="40" className={ringClass("backup", entries)} />
          {(activeNode === "backup" || clickedNode === "backup") && <>
            <circle cx="360" cy="300" r="50" fill="none" stroke={bC} strokeWidth="1.5"
              style={{ animation: "hover-ring-pulse 0.9s ease-in-out infinite", filter: `drop-shadow(0 0 8px ${bC})` }} />
            <Sparks cx={360} cy={300} color={bC} />
          </>}
          <ellipse cx="360" cy="292" rx="11" ry="3.5" className="nicon" />
          <path className="nicon" d="M349 292v12c0 1.9 5 3.3 11 3.3s11-1.4 11-3.3v-12" />
          <text x="360" y="355" textAnchor="middle" className="ntitle">Backup &amp; DR</text>
          <text x="360" y="371" textAnchor="middle" className="nsub">{subLabel("backup","backup·dr",entries)}</text>
        </g>
      </svg>
    </div>
  );
}
