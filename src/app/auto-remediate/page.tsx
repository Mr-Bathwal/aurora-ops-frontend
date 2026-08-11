"use client";

import { useState } from "react";
import { toast } from "sonner";
import { SectionBand } from "@/components/aurora/section-band";
import { SectionHeading } from "@/components/aurora/section-heading";
import { PlexusBackdrop } from "@/components/auto-remediate/plexus-backdrop";
import { ProcessIntro } from "@/components/auto-remediate/process-intro";
import { RemediationGraph } from "@/components/auto-remediate/remediation-graph";
import { RunConsole, type Exchange } from "@/components/auto-remediate/run-console";
import { WorkflowChart } from "@/components/auto-remediate/workflow-chart";
import { api } from "@/lib/api";
import { inferOutcome } from "@/lib/outcome";
import { useActivityStore } from "@/lib/activity-store";

/** Auto-remediate, told as a scroll.
 *
 * Four chapters in the landing page's own band grammar: what the chain is, the chain lighting
 * up stage by stage, the console you drive it from, and the workflow it produced. The bands
 * sit on the page floor and on pure black rather than on a plate — the graph is a dark scene
 * and wants the room dark behind it, exactly as the home page's outcome band does.
 */
export default function AutoRemediatePage() {
  const [history, setHistory] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(false);
  // Bumped on every run so the graph remounts its animated layer and retells the story with
  // the request in flight.
  const [replayToken, setReplayToken] = useState(0);
  // Stamped here, in the handler, so the workflow chart's clock never has to reset itself
  // from inside an effect.
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const add = useActivityStore((s) => s.add);

  async function handleSend(prompt: string) {
    if (loading) return;
    const id = Date.now();
    setLoading(true);
    setStartedAt(Date.now());
    setReplayToken((t) => t + 1);

    try {
      const data = await api.autoRemediate(prompt);
      const outcome = inferOutcome(data.report);
      setHistory((h) => [...h, { id, prompt, result: data, error: null }]);
      add({
        agentKey: "auto",
        action: data.needs_backup ? "diagnose → remediate → verify" : "diagnose → verify",
        severity: outcome.severity,
        outcomeLabel: outcome.label,
        report: data.report,
      });
      toast.success("Chain complete", { description: outcome.label });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      setHistory((h) => [...h, { id, prompt, result: null, error: message }]);
      toast.error("Chain failed", { description: message });
    } finally {
      setLoading(false);
    }
  }

  const lastResult = [...history].reverse().find((x) => x.result)?.result ?? null;
  const outcome = lastResult ? inferOutcome(lastResult.report) : null;

  return (
    <>
      <PlexusBackdrop />

      {/* Every band below is transparent so the field reads through the whole scroll — the
          floor bands paint nothing by default, and the raised one trades its opaque
          `--bg-2` for the same colour at 68%, which keeps the chapter break without
          punching a hole in the backdrop. */}

      {/* 1 — What it is. */}
      <SectionBand tone="floor">
        <ProcessIntro />
      </SectionBand>

      {/* 2 — The chain, lighting stage by stage as it comes into view. */}
      <SectionBand tone="floor">
        <SectionHeading
          eyebrow="The chain"
          sub="One diagnosis, one decision, and only the lanes that decision opens. Every wire here is an edge in the graph the backend actually walks."
        >
          Watch the current move through it.
        </SectionHeading>
        <div className="mt-12">
          <RemediationGraph replayToken={replayToken} />
        </div>
      </SectionBand>

      {/* 3 + 4 — Drive it, then read what it did. Raised, so the working half of the page
          separates from the story half the way the home page's chapters do. */}
      <SectionBand tone="raised" className="-mb-36 bg-[rgba(12,15,20,0.68)] backdrop-blur-[2px]">
        <SectionHeading
          eyebrow="Run it"
          sub="Send one message and four stages answer — the diagnosis, the routing decision, the fix if one was needed, and the supervisor's verdict."
        >
          Talk to the chain.
        </SectionHeading>

        <div className="mx-auto mt-12 max-w-[900px]">
          <RunConsole history={history} loading={loading} onSend={handleSend} />
        </div>

        <div className="mx-auto mt-6 max-w-[900px]">
          <WorkflowChart result={lastResult} loading={loading} outcome={outcome} startedAt={startedAt} />
        </div>
      </SectionBand>
    </>
  );
}
