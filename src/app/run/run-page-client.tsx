"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Play, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { PageHeader } from "@/components/aurora/page-header";
import { AgentTabs, type AgentTabValue } from "@/components/run/agent-tabs";
import { AgentRobotEntry } from "@/components/run/agent-robot-entry";
import { ReasoningTrace } from "@/components/run/reasoning-trace";
import { ReportCard } from "@/components/run/report-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useRunAgent } from "@/hooks/use-run-agent";
import { inferOutcome } from "@/lib/outcome";
import { parseBackupKv, parseHealthKv } from "@/lib/parse-trace";

const PLAN: Record<AgentTabValue, string> = {
  health: "Plan: inspect CPU, memory, disk, network, and top processes; flag anything above 85%.",
  log: "Plan: read the log file, then count and summarize errors and warnings.",
  backup: "Plan: back up the data folder, then check disaster-recovery status.",
};

const HEALTH_SUGGESTIONS = [
  "Check my network speed",
  "Which process is using the most RAM?",
  "How long has this computer been running?",
  "Check all drives and disk usage",
  "Is the Print Spooler service running?",
  "Show me CPU temperature",
];

const TITLE: Record<AgentTabValue, string> = {
  health: "Health report",
  log: "Log summary",
  backup: "Backup & DR report",
};

function isAgentTab(value: string | null): value is AgentTabValue {
  return value === "health" || value === "log" || value === "backup";
}

export function RunPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AgentTabValue>(
    () => (isAgentTab(searchParams.get("tab")) ? (searchParams.get("tab") as AgentTabValue) : "health")
  );
  const [healthQuery, setHealthQuery] = useState("");

  const health = useRunAgent("health");
  const log = useRunAgent("log");
  const backup = useRunAgent("backup");
  const runners = { health, log, backup };
  const current = runners[activeTab];

  const autoranRef = useRef(false);
  useEffect(() => {
    if (autoranRef.current) return;
    const tabParam = searchParams.get("tab");
    if (searchParams.get("autorun") === "1" && isAgentTab(tabParam)) {
      autoranRef.current = true;
      runners[tabParam].run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleTabChange(tab: AgentTabValue) {
    setActiveTab(tab);
    router.replace(`/run?tab=${tab}`, { scroll: false });
  }

  function runCurrent() {
    if (activeTab === "health" && healthQuery.trim()) {
      health.run(healthQuery.trim());
    } else {
      current.run();
    }
  }

  const kv = current.data
    ? activeTab === "health"
      ? parseHealthKv(current.data.trace)
      : activeTab === "backup"
      ? parseBackupKv(current.data.trace)
      : undefined
    : undefined;
  const outcome = current.data ? inferOutcome(current.data.report) : null;
  const showSkeleton = current.loading && !current.data;
  const showRobotEntry = !current.data && !current.loading;

  return (
    <div>
      <PageHeader
        eyebrow="Agent run"
        title="Specialist agents"
        subtitle="Pick an agent and watch it reason, call its tools, and produce a verified report."
      />
      <AgentTabs value={activeTab} onValueChange={handleTabChange} />

      {/* Custom query input — only for the health agent */}
      <AnimatePresence>
        {activeTab === "health" && (
          <motion.div
            key="health-query-box"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="mb-5"
          >
            <div className="panel-deep flex flex-col gap-3 rounded-2xl border border-iris/50 p-4">
              <div className="flex items-center gap-2">
                <Search className="size-3.5 shrink-0 text-iris-2" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-faint">
                  Ask the health agent anything specific
                </span>
                {healthQuery && (
                  <button
                    type="button"
                    aria-label="Clear query"
                    className="ml-auto text-faint transition-colors hover:text-foreground"
                    onClick={() => setHealthQuery("")}
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              <input
                type="text"
                value={healthQuery}
                onChange={(e) => setHealthQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !current.loading && runCurrent()}
                placeholder="e.g. check network, top processes, is Print Spooler running…"
                className="w-full rounded-lg bg-black/30 px-3 py-2 font-mono text-[13px] text-foreground placeholder:text-faint focus:outline-none focus:ring-1 focus:ring-iris/50"
              />
              {/* Quick suggestion chips */}
              <div className="flex flex-wrap gap-1.5">
                {HEALTH_SUGGESTIONS.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setHealthQuery(s)}
                    className="rounded-full border border-iris/20 bg-iris/8 px-2.5 py-0.5 font-mono text-[10.5px] text-iris-2 transition-colors hover:border-iris/50 hover:bg-iris/15"
                  >
                    {s}
                  </button>
                ))}
              </div>
              {healthQuery && (
                <p className="font-mono text-[10px] text-faint">
                  ↳ Pull the robot&apos;s tail below to run your custom query
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Robot entry — slides in when agent hasn't run yet */}
      <AnimatePresence mode="wait">
        {showRobotEntry && (
          <motion.div
            key={`entry-${activeTab}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AgentRobotEntry
              agentKey={activeTab}
              onRun={runCurrent}
              disabled={current.loading}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {(current.loading || current.data) && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 gap-4.5 lg:grid-cols-[1.5fr_1fr] lg:items-start"
        >
          {showSkeleton ? (
            <div className="panel-deep space-y-3 rounded-2xl border p-4.5">
              <Skeleton className="h-5 w-2/3 bg-white/5" />
              <Skeleton className="h-14 w-full bg-white/5" />
              <Skeleton className="h-14 w-full bg-white/5" />
              <Skeleton className="h-14 w-full bg-white/5" />
            </div>
          ) : (
            <ReasoningTrace
              trace={current.data?.trace ?? []}
              plan={PLAN[activeTab]}
              loading={current.loading}
            />
          )}

          {showSkeleton ? (
            <div className="panel-deep space-y-3 rounded-2xl border p-4.5">
              <Skeleton className="h-5 w-1/2 bg-white/5" />
              <Skeleton className="h-4 w-full bg-white/5" />
              <Skeleton className="h-4 w-5/6 bg-white/5" />
              <Skeleton className="h-4 w-2/3 bg-white/5" />
            </div>
          ) : current.data && outcome ? (
            <ReportCard
              title={TITLE[activeTab]}
              severity={outcome.severity}
              label={outcome.label}
              report={current.data.report}
              kv={kv}
            />
          ) : null}
        </motion.div>
      )}

      {current.data && (
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 bg-card"
            onClick={runCurrent}
            disabled={current.loading}
          >
            {current.loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Play className="size-3.5" />
            )}
            Run again
          </Button>
        </div>
      )}
    </div>
  );
}
