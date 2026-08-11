"use client";

import { Cloud, HardDrive, Terminal } from "lucide-react";
import type { ConnectionType, HostStatus } from "@/lib/control-api";

/** Shared vocabulary for how a host is doing and how it is reached.
 *
 * Both dots carry a shape or a label as well as a colour. Colour alone fails for the ~8% of
 * men with a colour vision deficiency, and "which of these servers is broken" is exactly the
 * question you cannot afford to answer wrongly.
 */

const STATUS: Record<HostStatus, { label: string; dot: string; text: string; ring: string }> = {
  online: { label: "Online", dot: "bg-ok", text: "text-ok", ring: "ring-ok/30" },
  pending: { label: "Awaiting enrolment", dot: "bg-warn", text: "text-warn", ring: "ring-warn/30" },
  error: { label: "Unreachable", dot: "bg-crit", text: "text-crit", ring: "ring-crit/30" },
  offline: { label: "Offline", dot: "bg-faint", text: "text-faint", ring: "ring-white/10" },
};

export function StatusPill({ status }: { status: HostStatus }) {
  const s = STATUS[status] ?? STATUS.offline;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium ring-1 ${s.ring} ${s.text}`}
    >
      <span className={`size-1.5 rounded-full ${s.dot}`} aria-hidden />
      {s.label}
    </span>
  );
}

const CONNECTION = {
  local: { label: "This server", Icon: HardDrive },
  agent: { label: "Agent", Icon: Cloud },
  ssh: { label: "SSH", Icon: Terminal },
} as const;

export function ConnectionBadge({ type }: { type: ConnectionType }) {
  const c = CONNECTION[type] ?? CONNECTION.local;
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
      <c.Icon size={12} className="text-brand" />
      {c.label}
    </span>
  );
}

/** "3 minutes ago". Relative because the absolute timestamp is never the question — what you
 * want to know is whether this host checked in recently enough to trust the reading. */
export function relativeTime(iso: string | null): string {
  if (!iso) return "never";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "unknown";
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
