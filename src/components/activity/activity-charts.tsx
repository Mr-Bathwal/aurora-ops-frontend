"use client";

import { useMemo, useRef } from "react";
import { useInView } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
import { AGENT_LABELS, AGENT_COLOR, type ActivityEntry, type AgentKey } from "@/lib/activity-store";

const SEVERITY_COLOR = { ok: "#34f5c5", warn: "#ffc56b", crit: "#ff6b81" } as const;
const SEVERITY_LABEL = { ok: "Healthy", warn: "Advisory", crit: "Critical" } as const;

function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="panel-deep rounded-lg border px-3 py-2 text-[12px]">
      <span className="font-mono text-foreground">{item.name}</span>
      <span className="ml-2 text-muted-foreground">{item.value}</span>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return <div className="flex h-full min-h-[140px] items-center justify-center text-[12.5px] text-faint">{label}</div>;
}

/** "Top Agent Performers" — ranked bar chart, draws itself once scrolled into view. */
export function AgentPerformersChart({ entries }: { entries: ActivityEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const byAgent = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of entries) counts[e.agentKey] = (counts[e.agentKey] ?? 0) + 1;
    return Object.entries(counts)
      .map(([key, count]) => ({ key, name: AGENT_LABELS[key as AgentKey], count, fill: AGENT_COLOR[key as AgentKey] }))
      .sort((a, b) => b.count - a.count);
  }, [entries]);

  return (
    <div ref={ref} className="flex h-full flex-col">
      <div className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-faint">Top agent performers</div>
      {byAgent.length === 0 ? (
        <EmptyChart label="No runs yet." />
      ) : (
        <div className="flex-1">
          {inView && (
            <ResponsiveContainer width="100%" height="100%" minHeight={160}>
              <BarChart data={byAgent} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "#969db4", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={100}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="count" name="Runs" radius={[0, 6, 6, 0]} isAnimationActive animationDuration={900} animationEasing="ease-out">
                  {byAgent.map((d) => (
                    <Cell key={d.key} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
}

/** "Outcome breakdown" — severity donut, draws itself once scrolled into view. */
export function OutcomeBreakdownChart({ entries }: { entries: ActivityEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const bySeverity = useMemo(() => {
    const counts = { ok: 0, warn: 0, crit: 0 };
    for (const e of entries) counts[e.severity]++;
    return (Object.keys(counts) as Array<keyof typeof counts>)
      .filter((k) => counts[k] > 0)
      .map((k) => ({ key: k, name: SEVERITY_LABEL[k], value: counts[k], fill: SEVERITY_COLOR[k] }));
  }, [entries]);

  return (
    <div ref={ref} className="flex h-full flex-col">
      <div className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-faint">Outcome breakdown</div>
      {bySeverity.length === 0 ? (
        <EmptyChart label="No runs yet." />
      ) : (
        <div className="flex flex-1 items-center gap-3">
          <div className="h-full min-h-[140px] flex-1">
            {inView && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bySeverity}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={42}
                    outerRadius={64}
                    paddingAngle={bySeverity.length > 1 ? 3 : 0}
                    stroke="none"
                    isAnimationActive
                    animationDuration={900}
                    animationEasing="ease-out"
                  >
                    {bySeverity.map((d) => (
                      <Cell key={d.key} fill={d.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex shrink-0 flex-col gap-1.5">
            {bySeverity.map((d) => (
              <div key={d.key} className="flex items-center gap-1.5 text-[11.5px]">
                <span className="size-2 shrink-0 rounded-full" style={{ background: d.fill }} />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="font-mono text-faint">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
