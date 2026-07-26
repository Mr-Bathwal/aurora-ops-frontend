"use client";

import { useState } from "react";
import { useActivityStore } from "@/lib/activity-store";
import { timeAgo } from "@/lib/format";
import type { RunnableAgent } from "@/hooks/use-run-agent";
import { RobotSvg } from "./robot-svg";
import { SpeakingCloud } from "./speaking-cloud";

const AGENT_CONFIG = {
  health: {
    tag: "SYS_HEALTH_BOT",
    accentColor: "#46E0A0",
    eyeColor: "#3FD0E0",
    intro: "Hi! I monitor your CPU, memory & disk. Let's check your system now!",
    lines: [
      "Hi! I monitor your CPU, memory & disk.",
      "Monitoring CPU, memory & disk 24/7.",
      "I flag anything above 85% threshold.",
      "Run me for a full system health report.",
      "Last scan: all vitals checked in real-time.",
    ] as const,
    color: "ok" as const,
    href: "/run?tab=health&autorun=1",
  },
  log: {
    tag: "LOG_ANALYZER_BOT",
    accentColor: "#FF6B81",
    eyeColor: "#FF6B81",
    intro: "Hi! I read your logs so you don't have to. Pull my tail to start scanning!",
    lines: [
      "Hi! I read your logs so you don't have to.",
      "Counting errors, warnings, anomalies.",
      "Plain English summaries of raw log data.",
      "Currently tracking: 3 critical errors.",
    ] as const,
    color: "warn" as const,
    href: "/run?tab=log&autorun=1",
  },
  backup: {
    tag: "BACKUP_DR_BOT",
    accentColor: "#7C6BFF",
    eyeColor: "#A99BFF",
    intro: "Hi! I protect your data with timestamped backups. Click me to begin!",
    lines: [
      "Hi! I protect your data with backups.",
      "Creating timestamped backups on demand.",
      "Checking disaster-recovery status.",
      "Copies only — never deletes your data.",
      "I keep your systems protected.",
    ] as const,
    color: "iris" as const,
    href: "/run?tab=backup&autorun=1",
  },
} as const;

interface RobotAgentProps {
  agentKey: RunnableAgent;
  introActive?: boolean;
}

export function RobotAgent({ agentKey, introActive = false }: RobotAgentProps) {
  const cfg = AGENT_CONFIG[agentKey];
  const last = useActivityStore((s) => s.entries.find((e) => e.agentKey === agentKey));
  const [hovered, setHovered] = useState(false);

  const showIntroCloud = introActive && !hovered;
  const showFullCloud = hovered;

  return (
    <div
      className="flex flex-col items-center gap-4"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Status row */}
      <div className="h-4 font-mono text-[10px] uppercase tracking-widest text-faint">
        {last ? (
          <span style={{ color: cfg.accentColor }}>
            ■ {last.outcomeLabel} · ran {timeAgo(last.timestamp)}
          </span>
        ) : (
          <span className="opacity-40">□ awaiting first run</span>
        )}
      </div>

      {/* Robot body */}
      <div className="relative flex items-center gap-5">
        <RobotSvg
          accentColor={cfg.accentColor}
          eyeColor={cfg.eyeColor}
          size={96}
          animated
          waveArm={introActive}
        />

        {/* Intro cloud (sequence phase only, replaces on hover) */}
        {showIntroCloud && (
          <div
            className="absolute left-[112px] top-1/2 z-10 -translate-y-1/2 rounded-xl px-4 py-3"
            style={{
              background: "rgba(6,6,16,0.96)",
              border: `1px solid ${cfg.accentColor}88`,
              boxShadow: `0 0 20px ${cfg.accentColor}33`,
              minWidth: 200,
              animation: "egg-in 0.35s ease forwards",
            }}
          >
            <div
              className="absolute -left-[9px] top-1/2 -translate-y-1/2"
              style={{
                borderRight: `9px solid ${cfg.accentColor}88`,
                borderTop: "6px solid transparent",
                borderBottom: "6px solid transparent",
              }}
            />
            <div
              className="mb-1 font-mono text-[9px] uppercase tracking-widest"
              style={{ color: cfg.accentColor }}
            >
              [INTRO]
            </div>
            <div
              className="font-mono text-[11.5px] leading-relaxed"
              style={{ color: cfg.accentColor }}
            >
              {cfg.intro}
            </div>
          </div>
        )}

        {/* Hover cloud — ONE cloud cycling through intro + all explanation lines */}
        {showFullCloud && (
          <SpeakingCloud
            tag={cfg.tag}
            lines={cfg.lines}
            href={cfg.href}
            color={cfg.color}
          />
        )}
      </div>

      {/* Name label */}
      <div
        className="font-mono text-[11px] tracking-wider"
        style={{ color: cfg.accentColor }}
      >
        {agentKey === "health"
          ? "System Health"
          : agentKey === "log"
          ? "Log Analyzer"
          : "Backup & DR"}
      </div>
    </div>
  );
}
