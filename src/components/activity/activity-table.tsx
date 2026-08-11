import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/aurora/status";
import { AGENT_LABELS, AGENT_COLOR, type ActivityEntry } from "@/lib/activity-store";
import { formatClock, formatTimestamp } from "@/lib/format";

function AgentAvatar({ agentKey }: { agentKey: ActivityEntry["agentKey"] }) {
  const color = AGENT_COLOR[agentKey];
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="grid size-5 shrink-0 place-items-center rounded-full text-[9px] font-bold"
        style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}
      >
        {AGENT_LABELS[agentKey].charAt(0)}
      </span>
      {AGENT_LABELS[agentKey]}
    </span>
  );
}

export function ActivityTable({ entries, variant = "full" }: { entries: ActivityEntry[]; variant?: "compact" | "full" }) {
  if (entries.length === 0) {
    return <div className="px-3 py-10 text-center text-sm text-muted-foreground">No runs yet — run an agent to see activity here.</div>;
  }

  if (variant === "compact") {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Agent</TableHead>
            <TableHead>Outcome</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="font-mono text-[12px] text-muted-foreground">{formatClock(e.timestamp)}</TableCell>
              <TableCell>{AGENT_LABELS[e.agentKey]}</TableCell>
              <TableCell>
                <StatusBadge severity={e.severity}>{e.outcomeLabel}</StatusBadge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Timestamp</TableHead>
          <TableHead>Event ID</TableHead>
          <TableHead>Operator</TableHead>
          <TableHead>Agent</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Outcome</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((e) => (
          <TableRow
            key={e.id}
            className="cursor-default transition-all duration-150 hover:relative hover:z-1 hover:scale-[1.007] hover:bg-white/[0.035] hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)]"
          >
            <TableCell className="font-mono text-[12px] text-muted-foreground">{formatTimestamp(e.timestamp)}</TableCell>
            <TableCell className="font-mono text-[11px] text-faint">{e.id.split("-")[0]}</TableCell>
            <TableCell>{e.operator}</TableCell>
            <TableCell>
              <AgentAvatar agentKey={e.agentKey} />
            </TableCell>
            <TableCell className="font-mono text-[12px] text-muted-foreground">{e.action}</TableCell>
            <TableCell>
              <StatusBadge severity={e.severity}>{e.outcomeLabel}</StatusBadge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
