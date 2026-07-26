"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Activity, Database, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { PageHeader } from "@/components/aurora/page-header";
import { PipelineStage } from "@/components/auto-remediate/pipeline-stage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RobotSvg } from "@/components/dashboard/robot-svg";
import { api, type AutoRemediateResult } from "@/lib/api";
import { inferOutcome } from "@/lib/outcome";
import { useActivityStore } from "@/lib/activity-store";

/* ── Robot trio config ──────────────────────────────────── */
const TRIO = [
  { accentColor: "#FF6B81", eyeColor: "#FF6B81", name: "Diagnose",  from: { x: -700, y: 0 },  size: 100 },
  { accentColor: "#46E0A0", eyeColor: "#3FD0E0", name: "Verify",    from: { x: 0,    y: 700 }, size: 114 },
  { accentColor: "#7C6BFF", eyeColor: "#A99BFF", name: "Remediate", from: { x: 700,  y: 0 },  size: 100 },
] as const;

const TRIO_LINES = [
  "We are your full auto-remediation pipeline.",
  "Diagnose → Remediate → Verify — all automated.",
  "Three agents working as one unified system.",
  "Drag the tail below to activate!",
] as const;

/* ── Accumulated terminal cloud (same pattern as AccumulatedTyper) ── */
function PipelineCloud({ lines, color }: { lines: readonly string[]; color: string }) {
  const [completed, setCompleted] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (lineIdx >= lines.length) return;
    const line = lines[lineIdx] ?? "";
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
  }, [lineIdx, charIdx, lines]);

  const done = lineIdx >= lines.length;

  return (
    <div
      className="panel-deep relative rounded-xl border px-5 py-4"
      style={{
        minWidth: 310,
        maxWidth: 460,
        borderColor: `${color}70`,
        boxShadow: `0 0 52px ${color}38, 0 0 100px rgba(0,0,0,0.88)`,
      }}
    >
      {/* Down-tail toward robot cluster */}
      <div
        className="absolute -bottom-[10px] left-1/2 -translate-x-1/2"
        style={{
          borderTop: `10px solid ${color}70`,
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
        }}
      />
      <div className="mb-2 font-mono text-[9.5px] uppercase tracking-widest" style={{ color }}>
        [FULL_PIPELINE_BOT]
      </div>
      <div className="space-y-0.5">
        {completed.map((l, i) => (
          <div key={i} className="font-mono text-[12.5px] leading-[1.75]" style={{ color }}>{l}</div>
        ))}
        {current && (
          <div className="font-mono text-[12.5px] leading-[1.75]" style={{ color }}>
            {current}<span style={{ animation: "blink-cursor 0.8s infinite" }}>_</span>
          </div>
        )}
        {done && (
          <div className="mt-1.5 font-mono text-[10px]" style={{ color: `${color}70` }}>
            ↓ drag tail to activate pipeline
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Elastic draggable tail ──────────────────────────── */
function PipelineTail({ onPull }: { onPull: () => void }) {
  const color = "#3FD0E0";
  const tailY = useMotionValue(0);
  const cordH = useTransform(tailY, [0, 120], [72, 160]);

  return (
    <div className="mt-1 flex flex-col items-center">
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.45 }}
        style={{ y: tailY }}
        whileDrag={{ scale: 1.06 }}
        onDragEnd={(_, info) => { if (info.offset.y > 55) onPull(); }}
        className="flex cursor-grab flex-col items-center touch-none select-none active:cursor-grabbing"
      >
        <motion.div style={{ height: cordH }} className="flex flex-col items-center">
          <div
            className="w-0.5 flex-1"
            style={{
              background: `repeating-linear-gradient(180deg,${color} 0px,${color} 7px,transparent 7px,transparent 14px)`,
              filter: `drop-shadow(0 0 5px ${color})`,
            }}
          />
          <div
            className="mt-1 grid size-8 place-items-center rounded-full"
            style={{ background: color, boxShadow: `0 0 18px ${color}, 0 0 36px ${color}60` }}
          >
            <div className="size-3.5 rounded-full bg-[#050510]" />
          </div>
        </motion.div>
      </motion.div>
      <div
        className="mt-2.5 font-mono text-[9px] uppercase tracking-widest"
        style={{ color, animation: "wire-spark 1.6s ease-in-out infinite" }}
      >
        drag to activate ↓
      </div>
    </div>
  );
}

/* ── Triple-robot merge component ──────────────────────── */
function RobotTrioEntry({ onRun }: { onRun: () => void }) {
  const settledRef = useRef(0);
  const [allSettled, setAllSettled] = useState(false);
  const [pulled, setPulled] = useState(false);

  function onOneSettled() {
    settledRef.current++;
    if (settledRef.current >= TRIO.length) setAllSettled(true);
  }

  function handlePull() {
    if (pulled) return;
    setPulled(true);
    onRun();
  }

  return (
    <div className="flex flex-col items-center py-8">
      <AnimatePresence>
        {allSettled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.86, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-8"
          >
            <PipelineCloud lines={TRIO_LINES} color="#3FD0E0" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Three robots entering from different directions */}
      <div className="flex items-end gap-6">
        {TRIO.map((bot, i) => (
          <motion.div
            key={bot.name}
            initial={bot.from}
            animate={{ x: 0, y: 0 }}
            transition={{ type: "spring", stiffness: 52, damping: 14, delay: i * 0.08 }}
            onAnimationComplete={onOneSettled}
            className="flex flex-col items-center gap-1"
          >
            <RobotSvg
              accentColor={bot.accentColor}
              eyeColor={bot.eyeColor}
              size={bot.size}
              animated
              waveArm={allSettled && !pulled && i === 1}
            />
            <div className="font-mono text-[9px] uppercase tracking-widest" style={{ color: bot.accentColor }}>
              {bot.name}
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {allSettled && !pulled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.4 }}
          >
            <PipelineTail onPull={handlePull} />
          </motion.div>
        )}
      </AnimatePresence>

      {pulled && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 font-mono text-[11px] uppercase tracking-widest text-cyan"
        >
          ⚡ Pipeline activating...
        </motion.div>
      )}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────── */
export default function AutoRemediatePage() {
  const [result, setResult] = useState<AutoRemediateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const add = useActivityStore((s) => s.add);

  async function handleRun() {
    setLoading(true);
    try {
      const data = await api.autoRemediate();
      setResult(data);
      const outcome = inferOutcome(data.report);
      add({
        agentKey: "auto",
        action: data.needs_backup ? "diagnose → remediate → verify" : "diagnose → verify",
        severity: outcome.severity,
        outcomeLabel: outcome.label,
        report: data.report,
      });
      toast.success("Auto-remediation complete", { description: outcome.label });
    } catch (e) {
      toast.error("Auto-remediation failed", {
        description: e instanceof Error ? e.message : "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  }

  const finalOutcome = result ? inferOutcome(result.report) : null;

  return (
    <div>
      <PageHeader
        eyebrow="Auto diagnose & fix"
        title="Collaborative remediation"
        subtitle="Agents hand work to each other and a supervisor verifies the outcome before reporting."
      />

      {/* Triple-robot entry — shown when nothing has run */}
      <AnimatePresence mode="wait">
        {!result && !loading && (
          <motion.div
            key="trio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <RobotTrioEntry onRun={handleRun} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading skeletons */}
      {loading && !result && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3.5"
        >
          {[0, 1, 2].map((i) => (
            <div key={i} className="panel-deep rounded-2xl border p-5">
              <Skeleton className="mb-3 h-5 w-1/3 bg-white/5" />
              <Skeleton className="h-4 w-full bg-white/5" />
              <Skeleton className="mt-2 h-4 w-4/5 bg-white/5" />
            </div>
          ))}
        </motion.div>
      )}

      {/* Pipeline results */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <PipelineStage icon={Activity}    title="Diagnose"  who="Log Analyzer"  tone="ok"                        text={result.diagnosis} />
          <div className="mb-3.5 ml-[60px] font-mono text-[11.5px] text-iris-2">
            &#9656; decision:{" "}
            {result.needs_backup
              ? "backup issue found → route to remediation"
              : "no backup issue → skip to verification"}
          </div>
          {result.needs_backup && result.remediation && (
            <PipelineStage icon={Database}    title="Remediate" who="Backup & DR"   tone="ok"                        text={result.remediation} />
          )}
          <PipelineStage
            icon={ShieldCheck}
            title="Verify"
            who="Supervisor"
            tone={finalOutcome?.severity ?? "ok"}
            text={result.report}
            isLast
          />
          <Button
            onClick={handleRun}
            disabled={loading}
            className="mt-1.5 gap-1.5 bg-grad text-[#070810] hover:brightness-110"
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            Run again
          </Button>
        </motion.div>
      )}
    </div>
  );
}
