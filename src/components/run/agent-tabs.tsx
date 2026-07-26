"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { motion } from "framer-motion";

const TABS = [
  { value: "health", label: "System Health" },
  { value: "log", label: "Log Analyzer" },
  { value: "backup", label: "Backup & DR" },
] as const;

export type AgentTabValue = (typeof TABS)[number]["value"];

export function AgentTabs({ value, onValueChange }: { value: AgentTabValue; onValueChange: (value: AgentTabValue) => void }) {
  return (
    <TabsPrimitive.Root value={value} onValueChange={(v) => onValueChange(v as AgentTabValue)}>
      <TabsPrimitive.List className="mb-5 inline-flex rounded-[11px] border border-border bg-card p-1">
        {TABS.map((tab) => (
          <TabsPrimitive.Tab
            key={tab.value}
            value={tab.value}
            className="relative rounded-lg px-4 py-2 text-[13px] font-medium text-muted-foreground transition-colors data-active:text-[#070810]"
          >
            {value === tab.value && (
              <motion.span
                layoutId="agent-tab-pill"
                className="absolute inset-0 -z-10 rounded-lg bg-grad shadow-[0_6px_16px_-8px_var(--iris)]"
                transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
              />
            )}
            {tab.label}
          </TabsPrimitive.Tab>
        ))}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
}
