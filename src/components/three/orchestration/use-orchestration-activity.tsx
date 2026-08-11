"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useActivityStore, lastRunFor, type AgentKey } from "@/lib/activity-store";

export type SatelliteKey = "health" | "log" | "backup";

const SEVERITY_COLOR: Record<string, string> = { ok: "#34f5c5", warn: "#ffc56b", crit: "#ff6b81" };
const IDLE_COLOR = "#5ac8ff";

const ROUTES: Record<SatelliteKey, string> = {
  health: "/run?tab=health&autorun=1",
  log: "/run?tab=log&autorun=1",
  backup: "/run?tab=backup&autorun=1",
};

interface AgentVisualState {
  color: string;
  severity: "ok" | "warn" | "crit" | "idle";
  label: string;
}

interface OrchestrationActivityValue {
  agents: Record<SatelliteKey, AgentVisualState>;
  hoveredAgent: SatelliteKey | null;
  setHoveredAgent: (key: SatelliteKey | null) => void;
  clickedAgent: SatelliteKey | null;
  triggerClick: (key: SatelliteKey) => void;
  anyActive: boolean;
}

const OrchestrationActivityContext = createContext<OrchestrationActivityValue | null>(null);

const LABELS: Record<SatelliteKey, string> = { health: "System Health", log: "Log Analyzer", backup: "Backup & DR" };

export function OrchestrationActivityProvider({
  children,
  navigate,
}: {
  children: ReactNode;
  /** Passed down from a non-lazily-loaded ancestor rather than calling useRouter() here —
   * useRouter() called from deep inside a next/dynamic(ssr:false)+Suspense tree can resolve
   * to a detached router context whose .push() silently no-ops instead of throwing. */
  navigate: (path: string) => void;
}) {
  const entries = useActivityStore((s) => s.entries);
  const [hoveredAgent, setHoveredAgent] = useState<SatelliteKey | null>(null);
  const [clickedAgent, setClickedAgent] = useState<SatelliteKey | null>(null);

  const agents = useMemo(() => {
    const build = (key: AgentKey): AgentVisualState => {
      const last = lastRunFor(entries, key);
      if (!last) return { color: IDLE_COLOR, severity: "idle", label: LABELS[key as SatelliteKey] };
      return {
        color: SEVERITY_COLOR[last.severity] ?? IDLE_COLOR,
        severity: (last.severity as "ok" | "warn" | "crit") ?? "idle",
        label: LABELS[key as SatelliteKey],
      };
    };
    return { health: build("health"), log: build("log"), backup: build("backup") };
  }, [entries]);

  function triggerClick(key: SatelliteKey) {
    setClickedAgent(key);
    setTimeout(() => {
      setClickedAgent(null);
      navigate(ROUTES[key]);
    }, 1400);
  }

  const value: OrchestrationActivityValue = {
    agents,
    hoveredAgent,
    setHoveredAgent,
    clickedAgent,
    triggerClick,
    anyActive: hoveredAgent !== null || clickedAgent !== null,
  };

  return (
    <OrchestrationActivityContext.Provider value={value}>
      {children}
    </OrchestrationActivityContext.Provider>
  );
}

export function useOrchestrationActivity() {
  const ctx = useContext(OrchestrationActivityContext);
  if (!ctx) throw new Error("useOrchestrationActivity must be used within OrchestrationActivityProvider");
  return ctx;
}
