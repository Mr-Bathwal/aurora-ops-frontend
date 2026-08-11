"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, CircleDashed, Loader2, MinusCircle } from "lucide-react";
import { Prose } from "@/components/aurora/prose";
import { StatusBadge } from "@/components/aurora/status";
import { cn } from "@/lib/utils";
import type { AutoRemediateResult } from "@/lib/api";
import type { Severity } from "@/lib/outcome";

/** The full workflow, row by row, for someone who wants to read what actually happened.
 *
 * Honest about what it can know. `/api/auto-remediate` is one POST that returns the finished
 * chain, so while a run is in flight there is no per-stage truth to report — every stage says
 * "in flight" and the elapsed clock is the only live number on the page. The moment the
 * response lands each row resolves to what really ran, including the stage that did not.
 *
 * Making the rows resolve one at a time would need the backend to stream (SSE off
 * `auto_ops.py`, emitting after each node). The component already takes per-row statuses, so
 * that change lands here without a rewrite.
 */

type RowStatus = "queued" | "running" | "done" | "skipped";

const STATUS_META: Record<RowStatus, { icon: typeof Check; tone: string; label: string }> = {
  queued: { icon: CircleDashed, tone: "text-faint", label: "Queued" },
  running: { icon: Loader2, tone: "text-brand-2", label: "In flight" },
  done: { icon: Check, tone: "text-ok", label: "Complete" },
  skipped: { icon: MinusCircle, tone: "text-muted-foreground", label: "Skipped" },
};

/** `startedAt` is stamped by the caller in the click handler rather than here in an effect.
 * An effect that resets its own clock has to setState synchronously to do it, which is the
 * cascading-render pattern the compiler's lint rule exists to stop; the timestamp belongs to
 * the event that started the run anyway. Only the ticker sets state, and it does so from a
 * timer callback. A stale tick from a previous run reads as a negative age and floors to 0. */
function useElapsed(running: boolean, startedAt: number | null) {
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!running || startedAt == null) return;
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [running, startedAt]);

  return startedAt == null ? 0 : Math.max(0, now - startedAt);
}

function Row({
  index,
  total,
  name,
  who,
  status,
  body,
  note,
  defaultOpen,
}: {
  index: number;
  total: number;
  name: string;
  who: string;
  status: RowStatus;
  body?: string | null;
  note?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  const expandable = status === "done" && !!body;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index, 6) * 0.05 }}
      className="flex gap-4"
    >
      {/* Rail */}
      <div className="flex w-8 shrink-0 flex-col items-center">
        <div
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full border transition-colors",
            status === "done" && "border-ok/45 bg-ok-soft",
            status === "running" && "border-brand/50 bg-grad-soft",
            status === "queued" && "border-white/10 bg-white/[0.02]",
            status === "skipped" && "border-white/10 bg-white/[0.02]"
          )}
        >
          <Icon size={15} className={cn(meta.tone, status === "running" && "animate-spin")} />
        </div>
        {index < total - 1 && (
          <div
            className={cn(
              "my-1 w-px flex-1",
              status === "done" ? "bg-gradient-to-b from-ok/50 to-brand/25" : "bg-white/8"
            )}
          />
        )}
      </div>

      {/* Body */}
      <div className={cn("mb-3 min-w-0 flex-1 rounded-[16px] border border-white/8 bg-[rgba(10,14,22,0.55)] transition-colors", status === "skipped" && "opacity-60")}>
        <button
          type="button"
          onClick={() => expandable && setOpen((o) => !o)}
          disabled={!expandable}
          className={cn("flex w-full items-center gap-3 px-4 py-3 text-left", expandable && "cursor-pointer")}
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className="font-heading text-[14px] font-semibold text-foreground">{name}</span>
              <span className="font-mono text-[11.5px] text-faint">{who}</span>
            </div>
            {note && <p className="mt-1 text-[12.5px] leading-[1.5] text-muted-foreground">{note}</p>}
          </div>
          <span className={cn("shrink-0 font-mono text-[11px] uppercase tracking-[0.12em]", meta.tone)}>
            {meta.label}
          </span>
          {expandable && (
            <ChevronDown size={15} className={cn("shrink-0 text-faint transition-transform duration-200", open && "rotate-180")} />
          )}
        </button>

        <AnimatePresence initial={false}>
          {open && expandable && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.24, ease: [0.2, 0.7, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="border-t border-white/8 px-4 py-3">
                <Prose text={body ?? ""} className="text-[13px] leading-[1.6] text-muted-foreground" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function WorkflowChart({
  result,
  loading,
  outcome,
  startedAt,
}: {
  result: AutoRemediateResult | null;
  loading: boolean;
  outcome: { severity: Severity; label: string } | null;
  /** When the in-flight run was dispatched, or null if nothing has run. */
  startedAt: number | null;
}) {
  const elapsed = useElapsed(loading, startedAt);

  const phase: RowStatus = loading ? "running" : result ? "done" : "queued";
  const remediateStatus: RowStatus = loading
    ? "running"
    : result
      ? result.needs_backup
        ? "done"
        : "skipped"
      : "queued";

  const rows = [
    {
      name: "Diagnostic intake",
      who: "Log Analyzer",
      status: phase,
      body: result?.diagnosis,
      note: "Reads the log file, counts errors and warnings, and writes a diagnosis.",
      defaultOpen: true,
    },
    {
      name: "Decision route",
      who: "Supervisor",
      status: phase,
      body: result
        ? result.needs_backup
          ? "The diagnosis points at a backup or disaster-recovery failure, so the chain routes to remediation."
          : "The diagnosis does not implicate backups, so remediation is skipped and the chain goes straight to verification."
        : null,
      note: "Decides whether the finding implicates backup or DR.",
    },
    {
      name: "Remediation",
      who: "Backup & DR",
      status: remediateStatus,
      body: result?.remediation,
      note:
        result && !result.needs_backup
          ? "Not run — the router did not send work down this lane."
          : "Creates a timestamped backup and checks disaster-recovery posture.",
    },
    {
      name: "Chain verification",
      who: "Supervisor",
      status: phase,
      body: result?.report,
      note: "Reads the whole chain back and states whether the issue is resolved.",
      defaultOpen: true,
    },
  ];

  return (
    <div className="rounded-[24px] border border-white/10 bg-[rgba(8,11,18,0.6)] p-5 backdrop-blur-xl sm:p-6">
      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-white/8 pb-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-[16px] font-semibold">Workflow</h3>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            {loading
              ? "The chain is running. Stages resolve together — the backend returns the finished run in one response."
              : result
                ? `Ran ${result.needs_backup ? "four" : "three"} stages${result.needs_backup ? "" : ", skipping remediation"}.`
                : "Nothing has run yet. Send a request above and every stage lands here."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {(loading || result) && (
            <span className="font-mono text-[12px] tabular-nums text-faint">
              {loading ? `${(elapsed / 1000).toFixed(1)}s` : "done"}
            </span>
          )}
          {outcome ? (
            <StatusBadge severity={outcome.severity}>{outcome.label}</StatusBadge>
          ) : (
            <StatusBadge severity="idle">{loading ? "Running" : "Idle"}</StatusBadge>
          )}
        </div>
      </div>

      <div>
        {rows.map((r, i) => (
          <Row key={r.name} index={i} total={rows.length} {...r} />
        ))}
      </div>
    </div>
  );
}
