"use client";

import { useState } from "react";
import { toast } from "sonner";
import { RouteFlow } from "@/components/orchestrator/route-flow";
import { MascotConsole } from "@/components/run/mascot-console";
import { ReportCard } from "@/components/run/report-card";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type OrchestrateResult } from "@/lib/api";
import { inferOutcome } from "@/lib/outcome";
import { useActivityStore } from "@/lib/activity-store";

const ROUTE_LABEL: Record<OrchestrateResult["agent"], string> = {
  health: "System Health",
  log: "Log Analyzer",
  backup: "Backup & DR",
  unknown: "No match",
};

/** Symptoms, deliberately — not agent names. The whole point of this tab is that you do not
 *  have to know which specialist owns the problem, so the examples must not give it away. */
const EXAMPLES = [
  "How is my server doing right now?",
  "Something went wrong last night",
  "I'm running out of space",
];

const PLAN =
  "Plan: read the request, decide which specialist owns it, run that one, and report back with its verdict.";

/** The orchestrator, as a panel rather than a page.
 *
 * It stopped deserving a nav slot of its own once you notice what it is: a way of picking
 * one of the three specialists without knowing their names. That is the same job the tabs
 * on /run do, so it belongs beside them — a fourth tab where the choosing is done for you.
 * The route /orchestrator still exists and redirects here, because it was linked from the
 * hero, the footer and the search palette.
 *
 * It wears the same console as the three specialists, for the same reason: it is one of the
 * four things behind that tab strip, and a tab that changes the entire page layout reads as
 * having navigated somewhere rather than having switched. What it replaced was a full-bleed
 * photoreal render of a data centre — a different visual language, on a page whose whole
 * design is a figure standing in the product's own sky.
 *
 * The console does not retire once a result lands, unlike the specialists': routing is a
 * conversation and you will want to ask a second thing. The verdict stacks underneath.
 */
export function OrchestratorConsole() {
  const [submittedText, setSubmittedText] = useState("");
  const [result, setResult] = useState<OrchestrateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const add = useActivityStore((s) => s.add);

  async function handleSubmit(query?: string) {
    const trimmed = (query ?? "").trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setSubmittedText(trimmed);
    setResult(null);
    try {
      const data = await api.orchestrate(trimmed);
      setResult(data);
      const outcome = inferOutcome(data.report);
      const isUnmatched = data.agent === "unknown";
      add({
        agentKey: "orchestrator",
        action: `routed → ${ROUTE_LABEL[data.agent]}`,
        severity: isUnmatched ? "warn" : outcome.severity,
        outcomeLabel: isUnmatched ? "No match" : outcome.label,
        report: data.report,
      });
      toast.success("Request routed", {
        description: `${ROUTE_LABEL[data.agent]} · ${isUnmatched ? "No match" : outcome.label}`,
      });
    } catch (e) {
      toast.error("Routing failed", {
        description: e instanceof Error ? e.message : "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  }

  const outcome = result ? inferOutcome(result.report) : null;
  const isUnmatched = result?.agent === "unknown";

  return (
    <div>
      <MascotConsole
        agentName="Orchestrator"
        color="#8fe9d0"
        greeting="What's going wrong? Describe the symptom in your own words — you don't need to know which agent handles it."
        plan={PLAN}
        suggestions={EXAMPLES}
        acceptsQuery
        requireQuery
        onRun={handleSubmit}
        loading={loading}
      />

      <div className="mt-5">
        <RouteFlow
          requestText={submittedText}
          matchedLabel={result ? ROUTE_LABEL[result.agent] : null}
          outcome={outcome}
          pending={loading}
        />
      </div>

      {loading && !result && (
        <div className="panel-deep space-y-3 rounded-[20px] border p-4.5">
          <Skeleton className="h-5 w-1/3 bg-white/5" />
          <Skeleton className="h-4 w-full bg-white/5" />
          <Skeleton className="h-4 w-5/6 bg-white/5" />
        </div>
      )}
      {result && outcome && (
        <ReportCard
          title={`${ROUTE_LABEL[result.agent]} · result`}
          severity={isUnmatched ? "warn" : outcome.severity}
          label={isUnmatched ? "No match" : outcome.label}
          report={result.report}
        />
      )}
    </div>
  );
}
