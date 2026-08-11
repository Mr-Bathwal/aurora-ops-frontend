"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Play, Lock } from "lucide-react";
import { AgentIcon } from "@/components/agents/agent-icon";
import type { CatalogAgent } from "@/components/agents/agent-catalog";
import { StatusBadge } from "@/components/aurora/status";
import { Button } from "@/components/ui/button";
import { useActivityStore } from "@/lib/activity-store";
import type { AgentKey } from "@/lib/activity-store";
import { timeAgo } from "@/lib/format";

function Meter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
        <span>{label}</span>
        <span style={{ color }}>{value}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/8">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}55, ${color})`, boxShadow: `0 0 8px ${color}` }}
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
        />
      </div>
    </div>
  );
}

export function FleetCard({ agent, index }: { agent: CatalogAgent; index: number }) {
  const router = useRouter();
  const last = useActivityStore((s) =>
    agent.runnable ? s.entries.find((e) => e.agentKey === (agent.runnable as AgentKey)) : undefined
  );

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: Math.min(index, 7) * 0.05, ease: [0.2, 0.7, 0.2, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-[20px] border border-white/10 bg-[rgba(10,11,22,0.72)] p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5"
      style={{ ["--tint" as string]: agent.color }}
    >
      {/* Accent wash that blooms on hover */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(340px circle at 50% -10%, ${agent.color}22, transparent 70%)` }}
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-[20px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ boxShadow: `inset 0 0 0 1px ${agent.color}55, 0 26px 60px -30px ${agent.color}` }}
      />

      <div className="relative z-1 mb-4 flex items-start justify-between gap-3">
        <div className="transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-2">
          <AgentIcon name={agent.icon} size={84} live={Boolean(agent.runnable)} />
        </div>
        {agent.runnable ? (
          last ? (
            <StatusBadge severity={last.severity}>{last.outcomeLabel}</StatusBadge>
          ) : (
            <StatusBadge severity="ok">Ready</StatusBadge>
          )
        ) : (
          <StatusBadge severity="idle">Standby</StatusBadge>
        )}
      </div>

      <h3 className="relative z-1 font-heading text-[16px] font-semibold tracking-tight">{agent.name}</h3>
      <p className="relative z-1 mt-1.5 min-h-[54px] text-[12.5px] leading-[1.55] text-muted-foreground">{agent.blurb}</p>

      <div className="relative z-1 my-4 space-y-2.5">
        {agent.meters.map((m) => (
          <Meter key={m.label} label={m.label} value={m.value} color={agent.color} />
        ))}
      </div>

      <div className="relative z-1 mt-auto flex items-center justify-between gap-3 border-t border-white/8 pt-3.5">
        <span className="font-mono text-[10.5px] text-faint">
          {agent.runnable ? (last ? `ran ${timeAgo(last.timestamp)}` : "never run") : "awaiting rollout"}
        </span>
        {agent.runnable ? (
          <Button
            size="sm"
            onClick={() => router.push(`/run?tab=${agent.runnable}&autorun=1`)}
            className="gap-1.5 text-[#0c0f14]"
            style={{
              background: `linear-gradient(135deg, ${agent.color}, #ffffff30)`,
              boxShadow: `0 10px 24px -12px ${agent.color}`,
            }}
          >
            <Play size={14} fill="currentColor" />
            Run agent
          </Button>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 font-mono text-[11px] text-faint">
            <Lock size={12} />
            Not deployed
          </span>
        )}
      </div>
    </motion.article>
  );
}
