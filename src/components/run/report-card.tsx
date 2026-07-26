import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/aurora/status";
import { Prose } from "@/components/aurora/prose";
import type { Severity } from "@/lib/outcome";
import type { KvRow } from "@/lib/parse-trace";

export function ReportCard({
  title,
  severity,
  label,
  report,
  kv,
}: {
  title: string;
  severity: Severity;
  label: string;
  report: string;
  kv?: KvRow[];
}) {
  return (
    <div className="panel-deep overflow-hidden rounded-2xl border">
      <div className="h-[2px] w-full" style={{
        background: "linear-gradient(90deg, transparent 0%, #7C6BFF 25%, #3FD0E0 75%, transparent 100%)",
        boxShadow: "0 0 14px rgba(124,107,255,0.8), 0 0 28px rgba(63,208,224,0.5)",
      }} />
      <div className="flex items-center justify-between border-b border-white/8 px-4.5 py-3.5">
        <h3 className="font-heading text-[14px] font-semibold">{title}</h3>
        <StatusBadge severity={severity}>{label}</StatusBadge>
      </div>
      <div className="p-4.5">
        <Prose text={report} className="text-[13.5px] leading-relaxed" />
        {kv && kv.length > 0 && (
          <div className="mt-3 border-t border-border/60">
            {kv.map((row) => (
              <div key={row.label} className="flex justify-between border-b border-border/60 py-2.25 text-[13px] last:border-0">
                <span className="text-muted-foreground">{row.label}</span>
                <span
                  className={cn(
                    "font-mono",
                    row.severity === "ok" && "text-ok",
                    row.severity === "warn" && "text-warn",
                    row.severity === "crit" && "text-crit"
                  )}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
