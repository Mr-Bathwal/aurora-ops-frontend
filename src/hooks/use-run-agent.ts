"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api, type AgentReport } from "@/lib/api";
import { useActivityStore } from "@/lib/activity-store";
import { inferOutcome } from "@/lib/outcome";

export type RunnableAgent = "health" | "log" | "backup";

const ACTION_LABEL: Record<RunnableAgent, string> = {
  health: "cpu · memory · disk",
  log: "read_log_file",
  backup: "create_backup · check_dr",
};

const RUN_LABEL: Record<RunnableAgent, string> = {
  health: "System Health",
  log: "Log Analyzer",
  backup: "Backup & DR",
};

export function useRunAgent(agentKey: RunnableAgent) {
  const [data, setData] = useState<AgentReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const add = useActivityStore((s) => s.add);

  async function run(query?: string) {
    setLoading(true);
    setError(null);
    try {
      const result =
        agentKey === "health" ? await api.systemHealth(query) : agentKey === "log" ? await api.logAnalysis() : await api.backup();
      setData(result);
      const outcome = inferOutcome(result.report);
      add({
        agentKey,
        action: ACTION_LABEL[agentKey],
        severity: outcome.severity,
        outcomeLabel: outcome.label,
        report: result.report,
      });
      toast.success(`${RUN_LABEL[agentKey]} finished`, { description: outcome.label });
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      setError(message);
      toast.error(`${RUN_LABEL[agentKey]} failed`, { description: message });
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { run, data, loading, error } as {
    run: (query?: string) => Promise<AgentReport | null>;
    data: AgentReport | null;
    loading: boolean;
    error: string | null;
  };
}
