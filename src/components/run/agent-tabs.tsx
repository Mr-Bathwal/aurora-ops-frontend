"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

/** Three specialists and, at the end, the one that picks a specialist for you. The
 * orchestrator sits last and behind a separator because it is a different kind of thing —
 * not a fourth agent, but a way into the other three. */
const TABS = [
  { value: "health", label: "System Health" },
  { value: "log", label: "Log Analyzer" },
  { value: "backup", label: "Backup & DR" },
  { value: "orchestrator", label: "Orchestrator" },
] as const;

export type RunTabValue = (typeof TABS)[number]["value"];

/** The three that are actually agents — `useRunAgent` and the plan/suggestion tables are
 * keyed by this, and the orchestrator has none of those. */
export type AgentTabValue = Exclude<RunTabValue, "orchestrator">;

export function isAgentTab(value: RunTabValue): value is AgentTabValue {
  return value !== "orchestrator";
}

export function isRunTab(value: string | null): value is RunTabValue {
  return TABS.some((t) => t.value === value);
}

export function AgentTabs({ value, onValueChange }: { value: RunTabValue; onValueChange: (value: RunTabValue) => void }) {
  return (
    <TabsPrimitive.Root value={value} onValueChange={(v) => onValueChange(v as RunTabValue)}>
      <TabsPrimitive.List className="mb-5 inline-flex flex-wrap rounded-[12px] border border-border bg-card p-1">
        {TABS.map((tab) => (
          <TabsPrimitive.Tab
            key={tab.value}
            value={tab.value}
            className={
              "relative flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-medium text-muted-foreground transition-colors data-active:text-[#0c0f14] " +
              (tab.value === "orchestrator" ? "ml-1 border-l border-border/80 pl-4" : "")
            }
          >
            {value === tab.value && (
              <motion.span
                layoutId="agent-tab-pill"
                className="absolute inset-0 -z-10 rounded-lg bg-grad shadow-[0_6px_16px_-8px_var(--brand)]"
                transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
              />
            )}
            {tab.value === "orchestrator" && <Sparkles size={14} className="relative" />}
            {tab.label}
          </TabsPrimitive.Tab>
        ))}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
}
