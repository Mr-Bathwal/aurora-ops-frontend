"use client";

import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/aurora/status";
import { useActivityStore } from "@/lib/activity-store";
import type { RunnableAgent } from "@/hooks/use-run-agent";
import { timeAgo } from "@/lib/format";

export function AgentCard({
  agentKey,
  icon: Icon,
  name,
  description,
  riseDelay,
}: {
  agentKey: RunnableAgent;
  icon: LucideIcon;
  name: string;
  description: string;
  riseDelay?: "rise-d2" | "rise-d3" | "rise-d4";
}) {
  const router = useRouter();
  const last = useActivityStore((s) => s.entries.find((e) => e.agentKey === agentKey));

  return (
    <div
      className={`spot rise ${riseDelay ?? ""} flex flex-col gap-3.25 rounded-2xl border border-border bg-card p-4.5 transition-all duration-200 hover:-translate-y-1 hover:border-iris/45 hover:shadow-[0_22px_44px_-22px_rgba(124,107,255,0.6)]`}
    >
      <div className="flex items-start justify-between">
        <div className="grid size-10 place-items-center rounded-[11px] border border-border bg-grad-soft">
          <Icon className="size-5 text-iris-2" />
        </div>
        {last ? <StatusBadge severity={last.severity}>{last.outcomeLabel}</StatusBadge> : <StatusBadge severity="idle">Not run yet</StatusBadge>}
      </div>
      <div>
        <div className="mb-1 font-heading text-[15.5px] font-semibold">{name}</div>
        <div className="min-h-[38px] text-[12.5px] leading-[1.5] text-muted-foreground">{description}</div>
      </div>
      <div className="flex items-center justify-between border-t border-border/60 pt-3.25">
        <span className="font-mono text-[11.5px] text-faint">{last ? `ran ${timeAgo(last.timestamp)}` : "never run"}</span>
        <Button
          size="sm"
          onClick={() => router.push(`/run?tab=${agentKey}&autorun=1`)}
          className="gap-1.5 bg-grad text-[#070810] shadow-[0_8px_22px_-10px_var(--iris)] hover:brightness-110"
        >
          Run agent
        </Button>
      </div>
    </div>
  );
}
