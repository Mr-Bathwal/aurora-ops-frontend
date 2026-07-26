"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/aurora/page-header";
import { SectionLabel } from "@/components/aurora/section-label";
import { RouteFlow } from "@/components/orchestrator/route-flow";
import { ReportCard } from "@/components/run/report-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { RobotSvg } from "@/components/dashboard/robot-svg";
import { api, type OrchestrateResult } from "@/lib/api";
import { inferOutcome } from "@/lib/outcome";
import { useActivityStore } from "@/lib/activity-store";

const ROUTE_LABEL: Record<OrchestrateResult["agent"], string> = {
  health: "System Health",
  log: "Log Analyzer",
  backup: "Backup & DR",
  unknown: "No match",
};

/* Accumulated terminal cloud for the orchestrator robot */
const ORCH_LINES = [
  "Welcome! I'm your smart orchestrator...",
  "Describe your IT problem in plain language.",
  "I'll route it to the right specialist agent.",
  "No need to know which agent to pick.",
  "Type below and I'll handle it!",
] as const;

function OrchCloud({ settled }: { settled: boolean }) {
  const [completed, setCompleted] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!settled) return;
    if (lineIdx >= ORCH_LINES.length) return;
    const line = ORCH_LINES[lineIdx] ?? "";
    if (charIdx < line.length) {
      timer.current = setTimeout(() => {
        setCurrent(line.slice(0, charIdx + 1));
        setCharIdx((n) => n + 1);
      }, 26);
    } else {
      timer.current = setTimeout(() => {
        setCompleted((prev) => [...prev, line]);
        setCurrent("");
        setCharIdx(0);
        setLineIdx((i) => i + 1);
      }, 340);
    }
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [settled, lineIdx, charIdx]);

  return (
    <div
      className="panel-deep relative rounded-xl border px-5 py-4"
      style={{
        minWidth: 300,
        maxWidth: 440,
        borderColor: "rgba(124,107,255,0.6)",
        boxShadow: "0 0 52px rgba(124,107,255,0.32), 0 0 100px rgba(0,0,0,0.85)",
      }}
    >
      {/* Tail pointing down toward robot */}
      <div
        className="absolute -bottom-[10px] left-1/2 -translate-x-1/2"
        style={{
          borderTop: "10px solid rgba(124,107,255,0.6)",
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
        }}
      />
      <div className="mb-2 font-mono text-[9.5px] uppercase tracking-widest text-iris-2">
        [SMART_ORCH_BOT]
      </div>
      <div className="space-y-0.5">
        {completed.map((line, i) => (
          <div key={i} className="font-mono text-[12.5px] leading-[1.75] text-iris-2">
            {line}
          </div>
        ))}
        {current && (
          <div className="font-mono text-[12.5px] leading-[1.75] text-iris-2">
            {current}
            <span style={{ animation: "blink-cursor 0.8s infinite" }}>_</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrchestratorPage() {
  const [text, setText] = useState("");
  const [submittedText, setSubmittedText] = useState("");
  const [result, setResult] = useState<OrchestrateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [robotSettled, setRobotSettled] = useState(false);
  const add = useActivityStore((s) => s.add);

  async function handleSubmit() {
    const trimmed = text.trim();
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
      <PageHeader
        eyebrow="Smart orchestrator"
        title="Just describe what you need"
        subtitle="Type a request in plain language. The orchestrator reads it, picks the right specialist, and returns the result."
      />

      {/* Orchestrator robot sliding in from left */}
      <div className="mb-8 flex flex-col items-center py-6">
        <AnimatePresence>
          {robotSettled && (
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="mb-6"
            >
              <OrchCloud settled={robotSettled} />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ x: "-110vw", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 52, damping: 14 }}
          onAnimationComplete={() => setRobotSettled(true)}
          className="flex flex-col items-center"
        >
          <RobotSvg
            accentColor="#7C6BFF"
            eyeColor="#3FD0E0"
            size={142}
            animated
            waveArm={robotSettled && !loading}
          />
        </motion.div>
      </div>

      {/* Input box — taller, more prominent */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: robotSettled ? 1 : 0, y: robotSettled ? 0 : 16 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div
          className="panel-deep mb-5 flex items-center gap-3 rounded-2xl border px-5 py-2"
          style={{ minHeight: 72 }}
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="e.g. how is my server doing right now?"
            aria-label="Describe your request"
            className="h-12! border-none! bg-transparent! px-0! text-[15px] focus-visible:border-transparent! focus-visible:ring-0! placeholder:text-faint"
          />
          <Button
            onClick={handleSubmit}
            disabled={loading || !text.trim()}
            className="shrink-0 gap-1.5 bg-grad px-5 py-2.5 text-[#070810] hover:brightness-110"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Route request
          </Button>
        </div>
      </motion.div>

      {/* Route flow + results */}
      <SectionLabel>How it routed</SectionLabel>
      <RouteFlow
        requestText={submittedText}
        matchedLabel={result ? ROUTE_LABEL[result.agent] : null}
        outcome={outcome}
        pending={loading}
      />

      {loading && !result && (
        <div className="panel-deep space-y-3 rounded-2xl border p-4.5">
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
