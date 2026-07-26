import type { TraceStep } from "@/lib/api";
import type { Severity } from "@/lib/outcome";

function toolResult(trace: TraceStep[], name: string): string | null {
  const step = trace.find((s) => s.type === "tool_result" && s.name === name);
  return step && step.type === "tool_result" ? step.content : null;
}

function severityForPercent(value: number): Severity {
  if (value >= 90) return "crit";
  if (value >= 70) return "warn";
  return "ok";
}

export interface KvRow {
  label: string;
  value: string;
  severity: Severity;
}

/** Built from the agent's raw tool outputs (deterministic strings from psutil), not the LLM prose — so the numbers are exact. */
export function parseHealthKv(trace: TraceStep[]): KvRow[] {
  const rows: KvRow[] = [];
  const specs: Array<[string, string]> = [
    ["get_cpu_usage", "CPU"],
    ["get_memory_usage", "Memory"],
    ["get_disk_usage", "Disk"],
  ];
  for (const [tool, label] of specs) {
    const raw = toolResult(trace, tool);
    if (!raw) continue;
    const match = raw.match(/([\d.]+)%/);
    const pct = match ? Number(match[1]) : null;
    const severity = pct === null ? "ok" : severityForPercent(pct);
    const tag = severity === "ok" ? "OK" : severity === "warn" ? "Watch" : "Critical";
    rows.push({ label, value: pct !== null ? `${pct}% · ${tag}` : raw, severity });
  }
  return rows;
}

export function parseBackupKv(trace: TraceStep[]): KvRow[] {
  const rows: KvRow[] = [];
  const backup = toolResult(trace, "create_backup");
  const dr = toolResult(trace, "check_dr_status");

  if (backup) {
    const failed = /error/i.test(backup);
    rows.push({ label: "Backup", value: failed ? backup : "Created", severity: failed ? "warn" : "ok" });
  }
  if (dr) {
    const atRisk = /at risk/i.test(dr);
    const healthy = /healthy/i.test(dr);
    rows.push({ label: "DR status", value: atRisk ? "AT RISK" : healthy ? "HEALTHY" : dr, severity: atRisk ? "warn" : "ok" });

    const ageMatch = dr.match(/\(([\d.]+)\s*hours?\s*ago\)/i);
    if (ageMatch) rows.push({ label: "Last backup", value: `${ageMatch[1]}h ago`, severity: "ok" });

    const totalMatch = dr.match(/Total backups:\s*(\d+)/i);
    if (totalMatch) rows.push({ label: "Total backups", value: totalMatch[1], severity: "ok" });
  }
  return rows;
}
