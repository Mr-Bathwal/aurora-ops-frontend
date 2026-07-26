import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Prose } from "@/components/aurora/prose";

const NEON: Record<string, string> = {
  ok:   "linear-gradient(90deg,transparent,#46E0A0,#3FD0E0,transparent)",
  warn: "linear-gradient(90deg,transparent,#FFC56B,transparent)",
  crit: "linear-gradient(90deg,transparent,#FF6B81,transparent)",
};
const NEON_GLOW: Record<string, string> = {
  ok:   "0 0 12px rgba(70,224,160,0.7)",
  warn: "0 0 12px rgba(255,197,107,0.7)",
  crit: "0 0 12px rgba(255,107,129,0.7)",
};

export function PipelineStage({
  icon: Icon,
  title,
  who,
  tone,
  text,
  isLast,
}: {
  icon: LucideIcon;
  title: string;
  who: string;
  tone: "ok" | "warn" | "crit";
  text: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex w-11 shrink-0 flex-col items-center">
        <div
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-secondary text-muted-foreground",
            tone === "ok"   && "border-ok/40 bg-ok-soft text-ok",
            tone === "warn" && "border-warn/40 bg-warn-soft text-warn",
            tone === "crit" && "border-crit/40 bg-crit-soft text-crit"
          )}
        >
          <Icon className="size-5" />
        </div>
        {!isLast && <div className="my-1 w-px flex-1 bg-gradient-to-b from-iris to-cyan opacity-50" />}
      </div>

      <div
        className={cn(
          "panel-deep mb-3.5 flex-1 overflow-hidden rounded-2xl border",
          tone === "warn" && "border-warn/60",
          tone === "crit" && "border-crit/60"
        )}
      >
        {/* Tone-coloured neon accent line at the top */}
        <div
          className="h-[2px] w-full"
          style={{ background: NEON[tone], boxShadow: NEON_GLOW[tone] }}
        />
        <div className="p-4">
          <h4 className="flex items-center justify-between font-heading text-[14px] font-semibold">
            {title}
            <span className="font-mono text-[11.5px] font-normal text-faint">{who}</span>
          </h4>
          <Prose text={text} className="mt-2 text-[13px] leading-[1.55] text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
