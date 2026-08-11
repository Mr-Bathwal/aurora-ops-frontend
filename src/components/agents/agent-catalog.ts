import type { AgentIconName } from "@/components/agents/agent-icon";
import type { RunnableAgent } from "@/hooks/use-run-agent";

export type CatalogAgent = {
  key: string;
  name: string;
  icon: AgentIconName;
  /** Accent used for the card's border glow and meters. */
  color: string;
  blurb: string;
  /** Set when the agent is wired to a live backend endpoint; standby agents leave this null. */
  runnable: RunnableAgent | null;
  /** Two readouts rendered as meters on the card face. */
  meters: [{ label: string; value: number }, { label: string; value: number }];
};

/** The deployed fleet. Three agents call real endpoints; the rest are provisioned tiles
 * that report their standby posture rather than pretending to run. */
export const AGENT_CATALOG: CatalogAgent[] = [
  {
    key: "health",
    name: "System Health",
    icon: "health",
    color: "#34f5c5",
    blurb: "Watches CPU, memory, disk, and network in real time — flags trouble before it pages anyone.",
    runnable: "health",
    meters: [
      { label: "Coverage", value: 96 },
      { label: "Confidence", value: 88 },
    ],
  },
  {
    key: "log",
    name: "Log Analyzer",
    icon: "log",
    color: "#5ac8ff",
    blurb: "Reads logs so nobody has to. Counts errors and warnings, surfaces what actually matters.",
    runnable: "log",
    meters: [
      { label: "Log status", value: 74 },
      { label: "Signal", value: 81 },
    ],
  },
  {
    key: "backup",
    name: "Backup & DR",
    icon: "backup",
    color: "#2f7fe0",
    blurb: "Creates timestamped backups and checks disaster-recovery status on demand.",
    runnable: "backup",
    meters: [
      { label: "Snapshots", value: 92 },
      { label: "DR posture", value: 69 },
    ],
  },
  {
    key: "sentinel",
    name: "Network Sentinel",
    icon: "sentinel",
    color: "#3e9cff",
    blurb: "Holds the perimeter — watches open ports, egress spikes, and unexpected inbound traffic.",
    runnable: null,
    meters: [
      { label: "Perimeter", value: 84 },
      { label: "Anomalies", value: 12 },
    ],
  },
  {
    key: "disk-auditor",
    name: "Disk Auditor",
    icon: "disk",
    color: "#7bd9ff",
    blurb: "Audits volumes for capacity cliffs, SMART warnings, and directories that grow without limit.",
    runnable: null,
    meters: [
      { label: "Volumes", value: 61 },
      { label: "Headroom", value: 38 },
    ],
  },
  {
    key: "mesh",
    name: "Mesh Router",
    icon: "network",
    color: "#5fe3d8",
    blurb: "Maps service-to-service traffic and reroutes around degraded links before latency lands.",
    runnable: null,
    meters: [
      { label: "Routes", value: 78 },
      { label: "Latency", value: 24 },
    ],
  },
  {
    key: "diagnostics",
    name: "Diagnostics",
    icon: "diagnostics",
    color: "#43d9a8",
    blurb: "Correlates vitals against recent deploys to explain why a box started behaving badly.",
    runnable: null,
    meters: [
      { label: "Baselines", value: 88 },
      { label: "Drift", value: 31 },
    ],
  },
  {
    key: "reactor",
    name: "Reaction Engine",
    icon: "reacting",
    color: "#8fb8ff",
    blurb: "Executes the remediation chosen upstream, then verifies the fix actually held.",
    runnable: null,
    meters: [
      { label: "Playbooks", value: 70 },
      { label: "Verified", value: 94 },
    ],
  },
];
