"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RobotSvg } from "./robot-svg";

interface IntroCloud {
  tag: string;
  intro: string;
  lines: readonly string[];
  href: string;
  color: string;
  tailSide: "right" | "left";
}

const LEFT_CLOUD: IntroCloud = {
  tag: "AUTO_REMEDIATE",
  intro: "Hi! I run diagnose → remediate → verify pipeline. Click me!",
  lines: [
    "Hi! I run diagnose → remediate → verify.",
    "I detect issues and remediate them.",
    "Full diagnose → Remediate → Verify flow.",
    "Click to start auto-healing your system.",
  ],
  href: "/auto-remediate",
  color: "#3FD0E0",
  tailSide: "right",
};

const RIGHT_CLOUD: IntroCloud = {
  tag: "SMART_ORCH",
  intro: "Hi! Describe any problem in plain text and I'll route it.",
  lines: [
    "Hi! Describe any problem in plain text.",
    "I route it to the right specialist agent.",
    "No need to know which agent to use.",
    "Just tell me what's wrong — I handle it.",
  ],
  href: "/orchestrator",
  color: "#7C6BFF",
  tailSide: "left",
};

/* Accumulated terminal-style typing — mirrors BrandEgg behavior */
function AccumulatedTyper({
  allLines,
  color,
}: {
  allLines: string[];
  color: string;
}) {
  const [completed, setCompleted] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (lineIdx >= allLines.length) return;
    const line = allLines[lineIdx] ?? "";
    if (charIdx < line.length) {
      timer.current = setTimeout(() => {
        setCurrent(line.slice(0, charIdx + 1));
        setCharIdx((n) => n + 1);
      }, 26);
    } else {
      timer.current = setTimeout(() => {
        setCompleted((prev) => [...prev, line]);
        setCurrent("");
        setCharIdx(0);
        setLineIdx((i) => i + 1);
      }, 360);
    }
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [lineIdx, charIdx, allLines]);

  const done = lineIdx >= allLines.length;

  return (
    <div className="min-h-[38px] font-mono text-[12px] leading-relaxed">
      {completed.map((line, i) => (
        <div key={i} style={{ color }}>{line}</div>
      ))}
      {current && (
        <div style={{ color }}>
          {current}
          <span style={{ animation: "blink-cursor 0.8s infinite" }}>_</span>
        </div>
      )}
      {done && (
        <div className="mt-1.5 font-mono text-[10px]" style={{ color: `${color}70` }}>
          ↳ click to activate
        </div>
      )}
    </div>
  );
}

/*
  TypingCloud:
  - When parentHovered=false (sequence intro): shows cloud.intro statically
  - When parentHovered=true (hover): accumulated typing of all lines
  - No individual hover handlers here — parent controls via parentHovered prop
*/
function TypingCloud({
  cloud,
  visible,
  parentHovered,
  onNavigate,
}: {
  cloud: IntroCloud;
  visible: boolean;
  parentHovered: boolean;
  onNavigate: (href: string) => void;
}) {
  const tailRight = cloud.tailSide === "right";
  const allLines = [cloud.intro, ...cloud.lines];

  if (!visible) return null;

  return (
    <div
      className="relative cursor-pointer"
      style={{ minWidth: 215, animation: "egg-in 0.35s ease forwards" }}
      onClick={() => onNavigate(cloud.href)}
    >
      {tailRight && (
        <div
          className="absolute -right-[9px] top-1/2 -translate-y-1/2"
          style={{
            borderLeft: `9px solid ${cloud.color}${parentHovered ? "bb" : "55"}`,
            borderTop: "7px solid transparent",
            borderBottom: "7px solid transparent",
          }}
        />
      )}
      {!tailRight && (
        <div
          className="absolute -left-[9px] top-1/2 -translate-y-1/2"
          style={{
            borderRight: `9px solid ${cloud.color}${parentHovered ? "bb" : "55"}`,
            borderTop: "7px solid transparent",
            borderBottom: "7px solid transparent",
          }}
        />
      )}
      <div
        className="overflow-hidden rounded-xl px-4 py-3 transition-all duration-200"
        style={{
          background: "rgba(6,6,16,0.96)",
          border: `1px solid ${cloud.color}${parentHovered ? "cc" : "44"}`,
          boxShadow: parentHovered ? `0 0 22px ${cloud.color}33` : "none",
        }}
      >
        <div
          className="mb-1 font-mono text-[9px] uppercase tracking-widest"
          style={{ color: cloud.color }}
        >
          [{cloud.tag}]
        </div>

        {parentHovered ? (
          /* Hover: accumulated typing of all lines — key remounts on each hover start */
          <AccumulatedTyper key="typing" allLines={allLines} color={cloud.color} />
        ) : (
          /* Sequence intro: static text */
          <div className="min-h-[38px] font-mono text-[12px] leading-relaxed" style={{ color: cloud.color }}>
            {cloud.intro}
            <span style={{ animation: "blink-cursor 0.8s infinite" }}>_</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface OperatorRobotProps {
  leftActive?: boolean;
  rightActive?: boolean;
}

export function OperatorRobot({ leftActive = false, rightActive = false }: OperatorRobotProps) {
  const router = useRouter();
  const [waving, setWaving] = useState(false);
  const waveStarted = useRef(false);

  /* Single hover zone — ONE wrapper controls everything.
     Debounce prevents rapid flicker when cursor moves between robot + clouds. */
  const [zoneHovered, setZoneHovered] = useState(false);
  const [rightReady, setRightReady] = useState(false); // right cloud delayed 3s after hover
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleEnter() {
    if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null; }
    if (!zoneHovered) {
      setZoneHovered(true);
      // Right cloud appears 3 s after left (left types its intro line first)
      rightTimer.current = setTimeout(() => setRightReady(true), 3000);
    }
  }

  function handleLeave() {
    leaveTimer.current = setTimeout(() => {
      setZoneHovered(false);
      setRightReady(false);
      if (rightTimer.current) { clearTimeout(rightTimer.current); rightTimer.current = null; }
      leaveTimer.current = null;
    }, 120); // 120 ms debounce absorbs rapid leave/enter within the zone
  }

  /* Wave arm once when leftActive first becomes true */
  useEffect(() => {
    if (!leftActive || waveStarted.current) return;
    waveStarted.current = true;
    setWaving(true);
    const t = setTimeout(() => setWaving(false), 4000);
    return () => clearTimeout(t);
  }, [leftActive]);

  const showLeft  = leftActive  || zoneHovered;
  const showRight = rightActive || rightReady;

  return (
    <div className="mt-10 flex flex-col items-center gap-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-faint">
        ▸ operations controller
      </div>

      {/* SINGLE hover zone wrapping everything — no nested hover handlers */}
      <div
        className="flex flex-wrap items-center justify-center gap-8"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        <TypingCloud
          cloud={LEFT_CLOUD}
          visible={showLeft}
          parentHovered={zoneHovered}
          onNavigate={(href) => router.push(href)}
        />

        <div className="flex flex-col items-center gap-2">
          <RobotSvg accentColor="#3FD0E0" eyeColor="#7C6BFF" size={112} animated waveArm={waving} />
          <div className="font-mono text-[10px] uppercase tracking-widest text-cyan">OPERATOR</div>
        </div>

        <TypingCloud
          cloud={RIGHT_CLOUD}
          visible={showRight}
          parentHovered={zoneHovered && rightReady}
          onNavigate={(href) => router.push(href)}
        />
      </div>
    </div>
  );
}
