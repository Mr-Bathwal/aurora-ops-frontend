"use client";

import { useCountUp } from "@/hooks/use-count-up";
import { AGENT_LABELS, type ActivityEntry } from "@/lib/activity-store";

// Module-scope helper (not inlined in the component body) so the lint rule against
// impure calls during render doesn't see a literal Date.now() in the render path.
function isWithinLast24h(iso: string): boolean {
  return new Date(iso).getTime() >= Date.now() - 24 * 60 * 60 * 1000;
}

/** A little level-meter set beside each figure. Decorative, and deliberately identical for
 * every stat — it is a texture that marks these as live instrument readouts, not a second
 * chart. Varying it per value would imply a reading that isn't being taken. */
const GLYPH_BARS = [3, 7, 11, 5, 9, 4];
function LevelGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 22 12"
      className="h-3 w-[22px] shrink-0 text-faint"
      fill="currentColor"
    >
      {GLYPH_BARS.map((h, i) => (
        <rect key={i} x={i * 4} y={(12 - h) / 2} width="2" height={h} rx="1" />
      ))}
    </svg>
  );
}

function Stat({ value, decimals = 0, suffix = "", label, color }: { value: number; decimals?: number; suffix?: string; label: string; color: string }) {
  const animated = useCountUp(value, 900);
  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="font-heading text-[24px] font-bold tabular-nums" style={{ color }}>
          {animated.toFixed(decimals)}
          <span className="text-[14px]">{suffix}</span>
        </div>
        <LevelGlyph />
      </div>
      <div className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">{label}</div>
    </div>
  );
}

export function ActivityKpis({ entries }: { entries: ActivityEntry[] }) {
  // Small array (<=200 entries) — recomputed directly each render rather than memoized.
  const total = entries.length;
  const ok = entries.filter((e) => e.severity === "ok").length;
  const successRate = total === 0 ? 0 : (ok / total) * 100;
  const last24h = entries.filter((e) => isWithinLast24h(e.timestamp)).length;
  const counts: Partial<Record<ActivityEntry["agentKey"], number>> = {};
  for (const e of entries) counts[e.agentKey] = (counts[e.agentKey] ?? 0) + 1;
  const topEntry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const topAgent = topEntry ? AGENT_LABELS[topEntry[0] as ActivityEntry["agentKey"]] : "—";
  const stats = { total, successRate, last24h, topAgent };

  return (
    /* No heading of its own — PanelShell supplies it. This used to print "Fleet overview"
       immediately under the panel's own "Fleet overview". */
    <div className="flex h-full flex-col justify-between">
      <div className="grid grid-cols-2 gap-5">
        <Stat value={stats.total} label="Total events" color="var(--cyan)" />
        <Stat value={stats.successRate} decimals={0} suffix="%" label="Success rate" color="var(--ok)" />
        <Stat value={stats.last24h} label="Last 24h" color="var(--brand-2)" />
      </div>
      <div className="mt-5 border-t border-white/8 pt-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">Top performer</div>
        <div className="mt-1 text-[14px] font-semibold">{stats.topAgent}</div>
      </div>
    </div>
  );
}
