import type { ReactNode } from "react";
import { Brain, Terminal, CheckCircle2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TraceStep } from "@/lib/api";

const CODE_TOOLS = new Set(["run_custom_check", "save_custom_tool"]);

function formatArgs(args: Record<string, unknown>) {
  const entries = Object.entries(args ?? {});
  if (entries.length === 0) return "()";
  // For code tools, skip the raw args inline — we render them as a block below
  return `(${entries
    .filter(([k]) => k !== "python_code" && k !== "code")
    .map(([, v]) => (typeof v === "string" ? v : JSON.stringify(v)))
    .join(", ")})`;
}

function CodeBlock({ code, label }: { code: string; label: string }) {
  return (
    <div className="mt-2">
      <div className="mb-1 font-mono text-[9px] uppercase tracking-widest text-faint">{label}</div>
      <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-cyan/30 bg-black/40 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-cyan">
        {code}
      </pre>
    </div>
  );
}

function Step({
  icon: Icon,
  kind,
  tone,
  children,
  isLast,
}: {
  icon: LucideIcon;
  kind: string;
  tone: "think" | "tool" | "done";
  children: ReactNode;
  isLast?: boolean;
}) {
  return (
    <div className="relative flex gap-3.5 px-4.5 py-2.5">
      {!isLast && <span className="absolute top-[35px] bottom-[-10px] left-[30px] w-px bg-border" />}
      <div
        className={cn(
          "z-1 grid size-6.5 shrink-0 place-items-center rounded-lg border border-border bg-secondary text-muted-foreground",
          tone === "think" && "border-iris/40 bg-grad-soft text-iris-2",
          tone === "tool" && "text-cyan",
          tone === "done" && "border-ok/40 bg-ok-soft text-ok"
        )}
      >
        <Icon className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1 pb-1">
        <div className="mb-0.5 text-[10px] tracking-[0.1em] text-faint uppercase">{kind}</div>
        {children}
      </div>
    </div>
  );
}

export function ReasoningTrace({ trace, plan, loading }: { trace: TraceStep[]; plan: string; loading: boolean }) {
  const calls = trace.filter((s): s is { type: "tool_call"; name: string; args: Record<string, unknown> } => s.type === "tool_call");
  const results = trace.filter((s): s is { type: "tool_result"; name: string; content: string } => s.type === "tool_result");
  const showDone = !loading && trace.length > 0;

  return (
    <div className="panel-deep overflow-hidden rounded-2xl border">
      {/* Neon top accent line — visually lifts the panel above the rain */}
      <div className="h-[2px] w-full" style={{
        background: "linear-gradient(90deg, transparent 0%, #7C6BFF 25%, #3FD0E0 75%, transparent 100%)",
        boxShadow: "0 0 14px rgba(124,107,255,0.8), 0 0 28px rgba(63,208,224,0.5)",
      }} />
      <div className="flex items-center justify-between border-b border-white/8 px-4.5 py-3.5">
        <h3 className="flex items-center gap-2 font-heading text-[14px] font-semibold">
          <span className={cn("dot", loading ? "bg-warn dot-live" : "dot-ok")} /> Reasoning trace
        </h3>
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11.5px] text-muted-foreground">
          {loading ? "running…" : `${calls.length} tool call${calls.length === 1 ? "" : "s"}`}
        </span>
      </div>
      <div className="py-1.5">
        <Step icon={Brain} kind="Reason" tone="think">
          <p className="text-[13px]">{plan}</p>
        </Step>
        {calls.map((call, i) => {
          const isCodeTool = CODE_TOOLS.has(call.name);
          const codeArg =
            typeof call.args.python_code === "string"
              ? call.args.python_code
              : typeof call.args.code === "string"
              ? call.args.code
              : null;
          return (
            <Step key={`${call.name}-${i}`} icon={Terminal}
              kind={isCodeTool ? "AI-generated code" : "Tool call"}
              tone="tool"
            >
              <div className="font-mono text-[12px] text-iris-2">
                {call.name}
                {formatArgs(call.args)}
              </div>
              {isCodeTool && codeArg && (
                <CodeBlock
                  code={codeArg}
                  label={call.name === "save_custom_tool" ? "snippet to save" : "generated snippet"}
                />
              )}
              {results[i] && (
                <div className="mt-1.5 overflow-x-auto whitespace-pre-wrap rounded-lg border border-border/60 bg-black/30 px-2.75 py-2 font-mono text-[11.5px] text-muted-foreground">
                  {results[i].content}
                </div>
              )}
            </Step>
          );
        })}
        {showDone && (
          <Step icon={CheckCircle2} kind="Report ready" tone="done" isLast>
            <p className="text-[13px]">Synthesized tool output into a report.</p>
          </Step>
        )}
      </div>
    </div>
  );
}
