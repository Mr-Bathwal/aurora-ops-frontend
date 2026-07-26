import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/aurora/status";
import { AGENT_LABELS, type ActivityEntry } from "@/lib/activity-store";
import { formatClock, formatTimestamp } from "@/lib/format";

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
        <TableRow>
          <TableHead>Timestamp</TableHead>
          <TableHead>Operator</TableHead>
          <TableHead>Agent</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Outcome</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((e) => (
          <TableRow key={e.id}>
            <TableCell className="font-mono text-[12px] text-muted-foreground">{formatTimestamp(e.timestamp)}</TableCell>
            <TableCell>{e.operator}</TableCell>
            <TableCell>{AGENT_LABELS[e.agentKey]}</TableCell>
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
