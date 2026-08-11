"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { PageHeader } from "@/components/aurora/page-header";
import { AgentTabs, isAgentTab, isRunTab, type AgentTabValue, type RunTabValue } from "@/components/run/agent-tabs";
import { MascotConsole } from "@/components/run/mascot-console";
import { ReasoningTrace } from "@/components/run/reasoning-trace";
import { ReportCard } from "@/components/run/report-card";
import { RunBackdrop } from "@/components/run/run-backdrop";
import { OrchestratorConsole } from "@/components/orchestrator/orchestrator-console";
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

/** For the health agent these are real queries the operator can send; for the other two
 * they narrate the fixed playbook, since those endpoints take no query. */
const SUGGESTIONS: Record<AgentTabValue, string[]> = {
  health: [
    "Check memory usage",
    "Which process is using the most RAM?",
    "Check all drives and disk usage",
    "Check my network speed",
  ],
  log: ["Read the log file", "Count errors and warnings", "Summarize what actually matters"],
  backup: ["Back up the data folder", "Check disaster-recovery status", "Report the snapshot timestamp"],
};

const AGENT_META: Record<AgentTabValue, { name: string; color: string }> = {
  health: { name: "System Health", color: "#34f5c5" },
  log: { name: "Log Analyzer", color: "#5ac8ff" },
  backup: { name: "Backup & DR", color: "#2f7fe0" },
};

const TITLE: Record<AgentTabValue, string> = {
  health: "Health report",
  log: "Log summary",
  backup: "Backup & DR report",
};

export function RunPageClient({ initialTab, autorun }: { initialTab: string | null; autorun: boolean }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<RunTabValue>(() => (isRunTab(initialTab) ? initialTab : "health"));
  const health = useRunAgent("health");
  const log = useRunAgent("log");
  const backup = useRunAgent("backup");
  const runners = { health, log, backup };

  // Null on the orchestrator tab, which has no runner of its own — it hands the request to
  // one of these three on the server side instead.
  const agentTab = isAgentTab(activeTab) ? activeTab : null;
  const current = agentTab ? runners[agentTab] : null;

  const autoranRef = useRef(false);
  useEffect(() => {
    if (autoranRef.current) return;
    if (autorun && isRunTab(initialTab) && isAgentTab(initialTab)) {
      autoranRef.current = true;
      runners[initialTab].run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleTabChange(tab: RunTabValue) {
    setActiveTab(tab);
    router.replace(`/run?tab=${tab}`, { scroll: false });
  }

  /** Only the health endpoint accepts a query; the others always run their fixed playbook. */
  function runCurrent(query?: string) {
    current?.run(agentTab === "health" ? query : undefined);
  }

  const kv = current?.data
    ? agentTab === "health"
      ? parseHealthKv(current.data.trace)
      : agentTab === "backup"
      ? parseBackupKv(current.data.trace)
      : undefined
    : undefined;
  const outcome = current?.data ? inferOutcome(current.data.report) : null;
  const showSkeleton = !!current?.loading && !current?.data;
  const showRunPanel = !!current && !current.data && !current.loading;

  return (
    <div>
      <RunBackdrop />

      <PageHeader
        eyebrow="Agent run"
        title="Specialist agents"
        subtitle={
          agentTab
            ? "Pick an agent and watch it reason, call its tools, and produce a verified report."
            : "Not sure which agent you need? Describe the problem and the orchestrator picks one for you."
        }
      />
      <AgentTabs value={activeTab} onValueChange={handleTabChange} />

      {/* The orchestrator is a tab here rather than a page of its own: choosing an agent by
          name and describing a problem are the same task, so they live behind the same
          control. */}
      {!agentTab && <OrchestratorConsole />}

      {/* The console — the pre-run state: the chat rail you drive the agent from on the left,
          the agent itself on the right. It carries the page's only robot. The tendril scene
          that used to sit above this held a second copy of the same figure, which read as a
          duplicate rather than as two moments of one flow. */}
      <AnimatePresence mode="wait">
        {showRunPanel && agentTab && (
          <motion.div
            key={`entry-${agentTab}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <MascotConsole
              agentName={AGENT_META[agentTab].name}
              color={AGENT_META[agentTab].color}
              plan={PLAN[agentTab]}
              suggestions={SUGGESTIONS[agentTab]}
              acceptsQuery={agentTab === "health"}
              onRun={runCurrent}
              loading={current.loading}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {agentTab && current && (current.loading || current.data) && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 gap-4.5 lg:grid-cols-[1.5fr_1fr] lg:items-start"
        >
          {showSkeleton ? (
            <div className="panel-deep space-y-3 rounded-[20px] border p-4.5">
              <Skeleton className="h-5 w-2/3 bg-white/5" />
              <Skeleton className="h-14 w-full bg-white/5" />
              <Skeleton className="h-14 w-full bg-white/5" />
              <Skeleton className="h-14 w-full bg-white/5" />
            </div>
          ) : (
            <ReasoningTrace
              trace={current.data?.trace ?? []}
              plan={PLAN[agentTab]}
              loading={current.loading}
            />
          )}

          {showSkeleton ? (
            <div className="panel-deep space-y-3 rounded-[20px] border p-4.5">
              <Skeleton className="h-5 w-1/2 bg-white/5" />
              <Skeleton className="h-4 w-full bg-white/5" />
              <Skeleton className="h-4 w-5/6 bg-white/5" />
              <Skeleton className="h-4 w-2/3 bg-white/5" />
            </div>
          ) : current.data && outcome ? (
            <ReportCard
              title={TITLE[agentTab]}
              severity={outcome.severity}
              label={outcome.label}
              report={current.data.report}
              kv={kv}
            />
          ) : null}
        </motion.div>
      )}

      {current?.data && (
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 bg-card"
            onClick={() => runCurrent()}
            disabled={current.loading}
          >
            {current.loading ? (
              <RefreshCw className="animate-spin" size={15} />
            ) : (
              <Play size={15} />
            )}
            Run again
          </Button>
        </div>
      )}
    </div>
  );
}
