import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Severity } from "@/lib/outcome";

const badgeStyles: Record<Severity | "idle", string> = {
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  crit: "bg-crit-soft text-crit",
  idle: "bg-secondary text-muted-foreground",
};

export function StatusBadge({
  severity,
  children,
  className,
}: {
  severity: Severity | "idle";
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold", badgeStyles[severity], className)}>
      {children}
    </span>
  );
}

export function StatusDot({ severity, live, className }: { severity: Severity; live?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "dot",
        severity === "ok" && "dot-ok",
        severity === "warn" && "dot-warn",
        severity === "crit" && "dot-crit",
        live && "dot-live",
        className
      )}
    />
  );
}
