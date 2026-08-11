"use client";

import { motion } from "framer-motion";
import { PageHeader } from "@/components/aurora/page-header";
import { AGENT_CATALOG } from "@/components/agents/agent-catalog";
import { FleetCard } from "@/components/agents/fleet-card";

const LIVE = AGENT_CATALOG.filter((a) => a.runnable).length;

export default function AgentsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Deployed sentinels"
        title="The fleet"
        subtitle="Every agent runs its own tools against your infrastructure and reports back in plain language. Three are wired to live endpoints today; the rest are provisioned and waiting on rollout."
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[20px] border border-white/8 bg-[rgba(10,11,22,0.6)] px-5 py-3.5 font-mono text-[11px] uppercase tracking-[0.14em] text-faint backdrop-blur-xl"
      >
        <span>
          <span className="text-ok">{LIVE}</span> live
        </span>
        <span>
          <span className="text-foreground">{AGENT_CATALOG.length - LIVE}</span> standby
        </span>
        <span className="ml-auto normal-case tracking-normal">Click any live tile to run it end-to-end</span>
      </motion.div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {AGENT_CATALOG.map((agent, i) => (
          <FleetCard key={agent.key} agent={agent} index={i} />
        ))}
      </div>
    </div>
  );
}
