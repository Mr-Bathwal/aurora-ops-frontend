"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import { Activity, ShieldCheck, Zap } from "lucide-react";
import { useCountUp } from "@/hooks/use-count-up";

/** The card's right-hand section — the reference pairs its dashboard with an "Insights"
 * panel, so ours pairs the orchestration scene with a fleet overview. It reads as the
 * console's status readout: how much is deployed, how much it is resolving on its own, and
 * the shape of the last stretch of work.
 *
 * The bars are a fixed profile rather than live data — the homepage has no backend to read
 * from, and a chart that animates up to a believable shape is the honest way to *present*
 * the product without inventing numbers that claim to be real. The count-up on the headline
 * stat only runs once the panel scrolls into view. */
const RHYTHM = [38, 52, 44, 66, 58, 79, 71, 88, 64, 82];

function StatTile({ icon: Icon, value, label }: { icon: typeof Zap; value: string; label: string }) {
  return (
    <div className="rounded-[12px] border border-white/8 bg-white/[0.03] p-3">
      <Icon className="mb-2 text-brand-2" size={15} />
      <div className="font-heading text-[19px] font-bold leading-none tabular-nums">{value}</div>
      <div className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.1em] text-faint">{label}</div>
    </div>
  );
}

export function FleetOverviewPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const score = useCountUp(inView ? 92 : 0, 1300);

  return (
    /* h-full so it matches the scene panel beside it — the two are siblings in the bezel and
       a short right-hand panel would leave a dead strip of frame under it.
       The border is the same lit cyan-blue as the scene panel's: rgb(92,172,224), sampled
       off the reference. Both panels are lit objects sitting in a dark bezel, so they carry
       the same edge — a faint white hairline here would break the pair. */
    <div
      ref={ref}
      className="flex h-full flex-col gap-3 rounded-[12px] border border-[rgba(92,172,224,0.72)] bg-[#0c0f16]/80 p-4 shadow-[0_0_26px_-6px_rgba(92,172,224,0.55)] backdrop-blur-sm"
    >
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="text-brand-2" size={16} />
          <span className="font-heading text-[14px] font-semibold">Fleet overview</span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-ok/25 bg-ok-soft px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-ok">
          <span className="size-1.5 rounded-full bg-ok" />
          Nominal
        </span>
      </div>

      {/* headline stat */}
      <div className="rounded-[12px] border border-white/8 bg-white/[0.03] p-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[11.5px] text-muted-foreground">Auto-resolved</span>
          <ShieldCheck className="text-ok" size={14} />
        </div>
        <div className="mt-1.5 flex items-end gap-1">
          <span className="font-heading text-[32px] font-bold leading-none tabular-nums text-foreground">{Math.round(score)}</span>
          <span className="mb-1 font-mono text-[12px] text-faint">/ 100</span>
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full transition-[width] duration-1000 ease-out"
            style={{ width: `${score}%`, backgroundImage: "var(--grad)" }}
          />
        </div>
      </div>

      {/* stat tiles */}
      <div className="grid grid-cols-2 gap-3">
        <StatTile icon={Zap} value="8" label="Agents live" />
        <StatTile icon={Activity} value="4.5h" label="Saved / wk" />
      </div>

      {/* resolution rhythm — takes the slack so the panel always fills its half of the
          bezel, whatever height the scene beside it resolves to. */}
      <div className="flex min-h-[110px] flex-1 flex-col rounded-[12px] border border-white/8 bg-white/[0.03] p-3">
        <span className="mb-2.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-faint">Resolution rhythm</span>
        <div className="flex min-h-[60px] flex-1 items-end gap-1.5">
          {RHYTHM.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-[3px] transition-[height] duration-700 ease-out"
              style={{
                height: inView ? `${h}%` : "0%",
                transitionDelay: `${i * 45}ms`,
                backgroundImage: "linear-gradient(to top, rgba(62,156,255,0.35), #34f5c5)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
