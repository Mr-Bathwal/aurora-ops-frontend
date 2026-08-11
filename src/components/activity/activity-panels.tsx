"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CircleAlert,
  Clock,
  Layers,
  ShieldCheck,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { useCountUp } from "@/hooks/use-count-up";
import { AGENT_LABELS, type ActivityEntry } from "@/lib/activity-store";

/** The panels that make up the audit dashboard.
 *
 * Everything here is derived from the entries the store actually holds — no invented
 * figures. Where a panel has nothing to show yet it says so, rather than animating a
 * plausible-looking shape: this is the page whose entire claim is that the record is
 * trustworthy, so a chart that makes numbers up would undercut the one thing it is for.
 */

const HOUR_BUCKETS = [
  { label: "6 AM", from: 5, to: 8 },
  { label: "9 AM", from: 8, to: 11 },
  { label: "12 PM", from: 11, to: 14 },
  { label: "3 PM", from: 14, to: 17 },
  { label: "6 PM", from: 17, to: 20 },
  { label: "9 PM", from: 20, to: 23 },
];

export function PanelShell({
  title,
  sub,
  icon: Icon,
  action,
  children,
  className = "",
}: {
  title: string;
  sub?: string;
  icon?: typeof Activity;
  /** Rendered where the icon would sit. For panels that carry a status pill instead. */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    /* Glass, and it reacts. Sitting directly on the field these have to read as panes of
       something laid over the sky — hence the heavy blur and the low-alpha fill — and they
       lift slightly under the cursor so the dashboard answers when you move across it. */
    <section
      className={`group/panel relative overflow-hidden rounded-[20px] border border-white/10 bg-[rgba(10,14,22,0.6)] p-5 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.9)] backdrop-blur-2xl transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-[rgba(52,245,197,0.4)] hover:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.95),0_0_34px_-14px_rgba(52,245,197,0.5)] ${className}`}
    >
      {/* A standing wash of mint along the top edge — the panels in the reference are lit
          from above rather than being flat plates, and this is what carries that. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[120px]"
        style={{
          background:
            "radial-gradient(120% 100% at 18% 0%, rgba(52,245,197,0.13), transparent 62%), radial-gradient(90% 100% at 88% 0%, rgba(52,245,197,0.07), transparent 66%)",
        }}
      />
      {/* And a brighter one that only shows on hover, so the glass catches light as you pass. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/panel:opacity-100"
        style={{
          background: "radial-gradient(70% 50% at 22% 0%, rgba(52,245,197,0.14), transparent 70%)",
        }}
      />
      {/* `relative` on both: the washes above are positioned, and in a shared stacking context
          positioned elements paint over static ones — without this they sit on top of the
          panel's own text. */}
      <div className="relative mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-[16px] font-semibold tracking-tight text-foreground">{title}</h2>
          {sub && <p className="mt-0.5 text-[12px] text-faint">{sub}</p>}
        </div>
        {action}
        {!action && Icon && (
          <span className="grid size-8 shrink-0 place-items-center rounded-[8px] border border-white/10 bg-white/[0.04]">
            <Icon className="text-brand-2" size={15} />
          </span>
        )}
      </div>
      <div className="relative">{children}</div>
    </section>
  );
}

/** When runs actually happen, bucketed across the working day. */
export function OperationalRhythms({ entries }: { entries: ActivityEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const counts = HOUR_BUCKETS.map((b) => {
    const n = entries.filter((e) => {
      const h = new Date(e.timestamp).getHours();
      return h >= b.from && h < b.to;
    }).length;
    return { ...b, n };
  });
  const max = Math.max(1, ...counts.map((c) => c.n));
  const peak = counts.reduce((a, b) => (b.n > a.n ? b : a), counts[0]);

  return (
    <PanelShell title="Operational rhythms" sub="When the fleet is busiest" icon={TrendingUp}>
      {/* No `items-end` on the row: that sizes each column to its own content, which leaves
          the bar track with no height for a percentage to resolve against — and the bars
          silently render at zero. The row stretches; the track inside takes the slack. */}
      <div ref={ref} className="flex h-[150px] gap-3">
        {counts.map((c) => (
          <div key={c.label} className="flex h-full flex-1 flex-col items-center gap-2">
            <div className="flex w-full flex-1 items-end">
              {/* Lit at the cap and falling away underneath, so a bar reads as a column of
                  light standing on the axis rather than a filled rectangle. */}
              <div
                className="w-full rounded-t-[6px] transition-[height] duration-700 ease-out"
                style={{
                  height: inView ? `${Math.max(5, (c.n / max) * 100)}%` : "0%",
                  background:
                    "linear-gradient(180deg, #6ef5dc 0%, #34f5c5 22%, #1fa9a0 62%, rgba(24,92,96,0.28) 100%)",
                  boxShadow: "0 0 20px -6px rgba(52,245,197,0.75)",
                }}
              />
            </div>
            <span className="font-mono text-[9.5px] text-faint">{c.label}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 border-t border-white/8 pt-3 text-[12px] text-muted-foreground">
        {entries.length === 0 ? (
          "No runs recorded yet."
        ) : (
          <>
            Busiest around <span className="font-semibold text-brand-2">{peak.label}</span>
          </>
        )}
      </p>
    </PanelShell>
  );
}

const OUTCOMES = [
  { key: "ok", label: "Healthy", color: "var(--ok)", icon: ShieldCheck },
  { key: "warn", label: "Advisory", color: "var(--warn)", icon: TriangleAlert },
  { key: "crit", label: "Critical", color: "var(--crit)", icon: CircleAlert },
] as const;

/** Outcome mix as a ring. SVG rather than a chart library: three arcs and a label do not
 * justify the dependency, and drawing it directly means the stroke, the gap and the cap all
 * match the rest of the page exactly. */
export function OutcomeBreakdown({ entries }: { entries: ActivityEntry[] }) {
  const total = entries.length;
  const counts = OUTCOMES.map((o) => ({ ...o, n: entries.filter((e) => e.severity === o.key).length }));

  const R = 54;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <PanelShell title="Outcome breakdown" sub="How runs resolved" icon={Layers}>
      <div className="flex items-center gap-6">
        <div className="relative grid size-[140px] shrink-0 place-items-center">
          <svg
            width="140"
            height="140"
            viewBox="0 0 140 140"
            className="-rotate-90"
            /* The arcs glow in their own colour rather than sitting flat on the panel —
               a filter on the whole ring is cheaper than three blurred duplicates. */
            style={{ filter: "drop-shadow(0 0 7px rgba(52,245,197,0.28))" }}
          >
            <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="13" />
            {total > 0 &&
              counts.map((c) => {
                if (c.n === 0) return null;
                const len = (c.n / total) * C;
                const el = (
                  <circle
                    key={c.key}
                    cx="70"
                    cy="70"
                    r={R}
                    fill="none"
                    stroke={c.color}
                    strokeWidth="13"
                    strokeLinecap="butt"
                    strokeDasharray={`${Math.max(0, len - 3)} ${C - Math.max(0, len - 3)}`}
                    strokeDashoffset={-offset}
                  />
                );
                offset += len;
                return el;
              })}
          </svg>
          <div className="absolute text-center">
            <div className="font-heading text-[24px] font-bold leading-none tabular-nums">{total}</div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">runs</div>
          </div>
        </div>

        {/* Severity glyphs, not colour swatches. A shield, a warning triangle and an alert
            circle say which row is which without relying on colour alone. */}
        <ul className="flex-1 space-y-3">
          {counts.map((c) => (
            <li key={c.key} className="flex items-center gap-2.5 text-[13px]">
              <c.icon className="size-[15px] shrink-0" style={{ color: c.color }} aria-hidden />
              <span className="flex-1 text-muted-foreground">{c.label}</span>
              <span className="font-mono tabular-nums text-foreground">{c.n}</span>
            </li>
          ))}
        </ul>
      </div>
    </PanelShell>
  );
}

function Tile({ icon: Icon, value, unit, label, note }: {
  icon: typeof Activity; value: number; unit?: string; label: string; note: string;
}) {
  const animated = useCountUp(value, 900);
  return (
    /* Flex column with the value pushed apart from the caption so the tile reads the same
       whether it sits at its natural height or is stretched to match the panel beside it. */
    <div className="flex flex-col justify-between rounded-[12px] border border-white/10 bg-[rgba(10,14,22,0.66)] p-3.5 backdrop-blur-xl transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-[rgba(52,245,197,0.45)]">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11.5px] text-muted-foreground">{label}</span>
        <Icon className="text-brand-2" size={14} />
      </div>
      <div className="font-heading text-[24px] font-bold leading-none tabular-nums text-foreground">
        {Math.round(animated)}
        {unit && <span className="ml-0.5 font-mono text-[13px] text-faint">{unit}</span>}
      </div>
      <div className="mt-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-brand-2">{note}</div>
    </div>
  );
}

/** Four derived readouts. Each is computed from the log, so they move when it does. */
export function ActivityTiles({ entries }: { entries: ActivityEntry[] }) {
  const total = entries.length;
  const ok = entries.filter((e) => e.severity === "ok").length;
  const crit = entries.filter((e) => e.severity === "crit").length;
  const score = total === 0 ? 0 : Math.round((ok / total) * 100);
  const agents = new Set(entries.map((e) => e.agentKey)).size;
  // Consecutive most-recent runs that did not end critical — entries are newest-first.
  let streak = 0;
  for (const e of entries) {
    if (e.severity === "crit") break;
    streak++;
  }

  return (
    /* auto-rows-fr so the two rows split whatever height the row gives this cell evenly,
       instead of both hugging their content and leaving a gap underneath. */
    <div className="grid auto-rows-fr grid-cols-2 gap-3">
      <Tile icon={TrendingUp} value={score} unit="/100" label="Resolution score" note="Healthy share" />
      <Tile icon={Clock} value={streak} label="Clean streak" note="Runs since a critical" />
      <Tile icon={Activity} value={agents} label="Agents engaged" note={`of ${Object.keys(AGENT_LABELS).length} deployed`} />
      <Tile icon={AlertTriangle} value={crit} label="Criticals" note="Needs a human" />
    </div>
  );
}
