import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge, StatusDot } from "@/components/aurora/status";
import type { Severity } from "@/lib/outcome";

function FlowNode({ label, children, active }: { label: string; children: ReactNode; active?: boolean }) {
  return (
    <div
      className={cn(
        "flex-1 rounded-[20px] border border-border bg-card p-3.5 transition-colors duration-300",
        active && "border-brand/50 bg-grad-soft"
      )}
    >
      <div className="mb-1.5 text-[10px] uppercase tracking-[0.1em] text-faint">{label}</div>
      {children}
    </div>
  );
}

function FlowConnector() {
  return (
    <div className="flex items-center justify-center py-1 sm:w-6 sm:py-0">
      <ArrowRight className="rotate-90 text-cyan sm:rotate-0" size={16} />
    </div>
  );
}

export function RouteFlow({
  requestText,
  matchedLabel,
  outcome,
  pending,
}: {
  requestText: string;
  matchedLabel: string | null;
  outcome: { severity: Severity; label: string } | null;
  pending: boolean;
}) {
  return (
    <div className="mb-5 flex flex-col sm:flex-row sm:items-stretch">
      <FlowNode label="Request">
        <span className="line-clamp-2 text-[13.5px] font-medium">{requestText ? `“${requestText}”` : "—"}</span>
      </FlowNode>
      <FlowConnector />
      <FlowNode label="Orchestrator" active={!!matchedLabel}>
        {pending ? (
          <span className="flex items-center gap-2 text-[13.5px] font-semibold">
            <StatusDot severity="warn" live /> Routing&hellip;
          </span>
        ) : matchedLabel ? (
          <span className="flex items-center gap-2 text-[13.5px] font-semibold">
            <StatusDot severity="ok" /> Matched &rarr; {matchedLabel}
          </span>
        ) : (
          <span className="text-[13.5px] text-muted-foreground">Waiting for request</span>
        )}
      </FlowNode>
      <FlowConnector />
      <FlowNode label="Result">{outcome ? <StatusBadge severity={outcome.severity}>{outcome.label}</StatusBadge> : <StatusBadge severity="idle">Pending</StatusBadge>}</FlowNode>
    </div>
  );
}
