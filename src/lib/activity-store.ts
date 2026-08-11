"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Severity } from "@/lib/outcome";

export type AgentKey = "health" | "log" | "backup" | "orchestrator" | "auto";

export const AGENT_LABELS: Record<AgentKey, string> = {
  health: "System Health",
  log: "Log Analyzer",
  backup: "Backup & DR",
  orchestrator: "Smart Orchestrator",
  auto: "Auto-Remediate",
};

export const AGENT_COLOR: Record<AgentKey, string> = {
  health: "#34f5c5",
  log: "#ff6b81",
  backup: "#3e9cff",
  orchestrator: "#34f5c5",
  auto: "#ffc56b",
};

export interface ActivityEntry {
  id: string;
  timestamp: string;
  operator: string;
  agentKey: AgentKey;
  action: string;
  severity: Severity;
  outcomeLabel: string;
  report: string;
}

interface ActivityState {
  entries: ActivityEntry[];
  add: (entry: Omit<ActivityEntry, "id" | "timestamp" | "operator">) => void;
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set) => ({
      entries: [],
      add: (entry) =>
        set((state) => ({
          entries: [
            {
              ...entry,
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              timestamp: new Date().toISOString(),
              operator: "Gourav B.",
            },
            ...state.entries,
          ].slice(0, 200),
        })),
    }),
    { name: "aurora-ops-activity" }
  )
);

export function lastRunFor(entries: ActivityEntry[], agentKey: AgentKey) {
  return entries.find((e) => e.agentKey === agentKey);
}
