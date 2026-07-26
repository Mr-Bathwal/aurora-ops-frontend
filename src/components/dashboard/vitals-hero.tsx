"use client";

import { useVitals } from "@/hooks/use-vitals";
import { Gauge } from "@/components/dashboard/gauge";
import { Skeleton } from "@/components/ui/skeleton";

export function VitalsHero() {
  const { vitals, loading, error } = useVitals();

  return (
    <div className="rise relative pt-6 pb-4">
      {/* Ambient iris glow — no overflow-hidden, just a glow layer */}
      <div
        className="pointer-events-none absolute -top-10 right-20 -z-10 size-[380px] rounded-full opacity-18"
        style={{ background: "radial-gradient(circle, #7C6BFF 0%, transparent 70%)" }}
      />

      {/* Content row — heading left, gauges right */}
      <div className="flex flex-wrap items-center justify-between gap-10 py-4">
        <div>
          <div className="mb-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.22em] text-grad">
            Operations command center
          </div>
          <h1 className="font-heading text-[30px] font-bold leading-tight tracking-tight text-foreground sm:text-[36px] lg:text-[44px]">
            Your infrastructure, run by agents.
          </h1>
          <p className="mt-3 max-w-[50ch] text-[14px] leading-relaxed text-muted-foreground">
            Run a specialist, describe a problem in plain language, or let the platform diagnose and fix issues on its own.
          </p>
        </div>

        {/* Gauges — right-side, slightly larger */}
        <div className="flex gap-8">
          {error ? (
            <div className="font-mono text-[13px] text-crit">Vitals unavailable</div>
          ) : loading ? (
            <>
              <Skeleton className="size-[88px] rounded-full bg-card/40" />
              <Skeleton className="size-[88px] rounded-full bg-card/40" />
              <Skeleton className="size-[88px] rounded-full bg-card/40" />
            </>
          ) : (
            <>
              <Gauge value={vitals!.cpu}    label="CPU"    />
              <Gauge value={vitals!.memory} label="Memory" />
              <Gauge value={vitals!.disk}   label="Disk"   />
            </>
          )}
        </div>
      </div>

      {/* Gradient separator line */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  );
}
