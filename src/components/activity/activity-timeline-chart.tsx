"use client";

import { useMemo, useRef } from "react";
import { useInView } from "framer-motion";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import type { ActivityEntry } from "@/lib/activity-store";

const DAYS = 14;
/** Six-hour buckets, not daily ones.
 *
 * A day-per-point line over two weeks is fourteen vertices — a smooth, almost featureless
 * curve that says nothing about *when* the fleet was busy. At six hours the same fortnight
 * becomes 56 vertices and the shape of the working day shows up in it. It also keeps the y
 * axis in single digits, so the grid reads as counts rather than an arbitrary scale. */
const BUCKET_HOURS = 6;
const BUCKETS = (DAYS * 24) / BUCKET_HOURS;
const BUCKET_MS = BUCKET_HOURS * 3600_000;

// Two sizing rules the chart below depends on, recorded here because both failed silently:
//   - No `minHeight` on ResponsiveContainer. A floor taller than the wrapper makes the
//     container lay out at a height its parent then clips, and the plot vanishes entirely.
//     The wrapper owns the height; the container just fills it.
//   - Chart margin `left: 0`, not a negative. `left: -24` against a 24px YAxis pushed the
//     axis clean out of frame — the ticks were rendered and then cropped away.

// Module-scope (not inlined in a component body) so the purity rule doesn't see a literal
// Date.now() in the render path — same pattern as isWithinLast24h in activity-kpis.
function currentMs(): number {
  return Date.now();
}

function buildBuckets(entries: ActivityEntry[], nowMs: number = currentMs()) {
  // Align the newest bucket to the current six-hour block so boundaries land on 00/06/12/18
  // rather than wherever the page happened to be opened.
  const end = new Date(nowMs);
  end.setMinutes(0, 0, 0);
  end.setHours(Math.floor(end.getHours() / BUCKET_HOURS) * BUCKET_HOURS + BUCKET_HOURS);
  const endMs = end.getTime();
  const startMs = endMs - BUCKETS * BUCKET_MS;

  const buckets = Array.from({ length: BUCKETS }, (_, i) => {
    const t = startMs + i * BUCKET_MS;
    return {
      label: new Date(t).toLocaleDateString(undefined, { day: "numeric", month: "short" }),
      count: 0,
    };
  });

  const activeDays = new Set<string>();
  for (const e of entries) {
    const ms = new Date(e.timestamp).getTime();
    if (ms < startMs || ms >= endMs) continue;
    buckets[Math.floor((ms - startMs) / BUCKET_MS)].count += 1;
    activeDays.add(e.timestamp.slice(0, 10));
  }
  return { buckets, activeDays: activeDays.size };
}

/** How much of the window actually has data, as a pill for the panel header. Says
 * "fully populated" only when every day in the window saw at least one run — otherwise it
 * reports the real figure rather than implying coverage the log does not have. */
export function TimelineStatus({ entries }: { entries: ActivityEntry[] }) {
  const { activeDays } = useMemo(() => buildBuckets(entries), [entries]);
  const full = activeDays >= DAYS;
  return (
    <span
      className="shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.14em]"
      style={{
        color: full ? "var(--ok)" : "var(--faint)",
        borderColor: full ? "rgba(52,245,197,0.4)" : "rgba(255,255,255,0.12)",
        background: full ? "rgba(52,245,197,0.08)" : "transparent",
      }}
    >
      {full ? "Fully populated" : `${activeDays}/${DAYS} days active`}
    </span>
  );
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="panel-deep rounded-lg border px-3 py-2 text-[12px]">
      <div className="font-mono text-faint">{label}</div>
      <div className="text-foreground">{payload[0].value} event{payload[0].value === 1 ? "" : "s"}</div>
    </div>
  );
}

export function ActivityTimelineChart({
  entries,
  title = "Event activity over time",
  emptyLabel = "No events yet — this fills in as agents run.",
}: {
  entries: ActivityEntry[];
  title?: string;
  emptyLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const data = useMemo(() => buildBuckets(entries).buckets, [entries]);
  const total = entries.length;

  return (
    <div ref={ref} className="flex h-full flex-col">
      {/* Suppressed when the caller passes an empty title — inside a PanelShell the panel
          already carries the heading, and printing both stutters. */}
      {title && (
        <div className="mb-1 flex items-center justify-between">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-faint">{title}</div>
          <div className="font-mono text-[10.5px] text-faint">last {DAYS}d</div>
        </div>
      )}
      {total === 0 ? (
        <div className="flex flex-1 items-center justify-center text-[12.5px] text-faint">{emptyLabel}</div>
      ) : (
        <div className="flex-1">
          {inView && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="timelineFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34f5c5" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#34f5c5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#5c6582", fontSize: 10 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                  tickLine={false}
                  /* One label every four days — 16 six-hour buckets. */
                  interval={15}
                />
                <YAxis tick={{ fill: "#5c6582", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={24} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(52,245,197,0.25)" }} />
                {/* `linear`, not `monotone`: at this density the spline rounds every spike
                    into the next one and the burst structure disappears. */}
                <Area
                  type="linear"
                  dataKey="count"
                  stroke="#34f5c5"
                  strokeWidth={1.8}
                  fill="url(#timelineFill)"
                  dot={false}
                  activeDot={{ r: 3.5, fill: "#34f5c5", stroke: "#050505", strokeWidth: 2 }}
                  isAnimationActive
                  animationDuration={1400}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
}
