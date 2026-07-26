"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface SpeakingCloudProps {
  tag: string;
  lines: readonly string[];
  href: string;
  color?: "iris" | "cyan" | "ok" | "warn";
  side?: "right" | "left";
}

const COLOR_MAP = {
  iris: { border: "#7C6BFF", text: "#A99BFF", glow: "rgba(124,107,255,0.25)" },
  cyan: { border: "#3FD0E0", text: "#3FD0E0", glow: "rgba(63,208,224,0.2)" },
  ok:   { border: "#46E0A0", text: "#46E0A0", glow: "rgba(70,224,160,0.2)" },
  warn: { border: "#FFC56B", text: "#FFC56B", glow: "rgba(255,197,107,0.2)" },
};

/*
  Terminal-style accumulated typing — lines stay once typed (like BrandEgg).
  No clearing / cycling.  Runs from mount until all lines typed.
*/
function AccumulatedTyper({
  lines,
  c,
}: {
  lines: readonly string[];
  c: (typeof COLOR_MAP)[keyof typeof COLOR_MAP];
}) {
  const [completed, setCompleted] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (lineIdx >= lines.length) return;
    const line = lines[lineIdx] ?? "";
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
  }, [lineIdx, charIdx, lines]);

  const done = lineIdx >= lines.length;

  return (
    <div className="min-h-[40px] font-mono text-[12px] leading-relaxed">
      {completed.map((line, i) => (
        <div key={i} style={{ color: c.text }}>{line}</div>
      ))}
      {current && (
        <div style={{ color: c.text }}>
          {current}
          <span style={{ animation: "blink-cursor 1s infinite" }}>_</span>
        </div>
      )}
      {done && (
        <div className="mt-2 text-[10px] text-faint">
          ↳ pull tail to activate
        </div>
      )}
    </div>
  );
}

export function SpeakingCloud({ tag, lines, href, color = "iris", side = "right" }: SpeakingCloudProps) {
  const router = useRouter();
  const c = COLOR_MAP[color];
  const [hovered, setHovered] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onEnter() {
    if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null; }
    setHovered(true);
  }
  function onLeave() {
    leaveTimer.current = setTimeout(() => setHovered(false), 80);
  }

  return (
    <div
      className="group relative cursor-pointer select-none"
      onClick={() => router.push(href)}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{ minWidth: 230 }}
    >
      {/* Tail pointing toward robot */}
      {side === "right" && (
        <div
          className="absolute top-1/2 -left-[10px] -translate-y-1/2"
          style={{
            borderRight: `10px solid ${hovered ? c.border : "rgba(124,107,255,0.35)"}`,
            borderTop: "7px solid transparent",
            borderBottom: "7px solid transparent",
            transition: "border-color 0.2s",
            filter: hovered ? `drop-shadow(0 0 4px ${c.border})` : "none",
          }}
        />
      )}
      {side === "left" && (
        <div
          className="absolute top-1/2 -right-[10px] -translate-y-1/2"
          style={{
            borderLeft: `10px solid ${hovered ? c.border : "rgba(124,107,255,0.35)"}`,
            borderTop: "7px solid transparent",
            borderBottom: "7px solid transparent",
            transition: "border-color 0.2s",
            filter: hovered ? `drop-shadow(0 0 4px ${c.border})` : "none",
          }}
        />
      )}

      {/* Cloud body */}
      <div
        className="relative overflow-hidden rounded-lg px-4 py-3 transition-all duration-200"
        style={{
          background: "rgba(6, 6, 16, 0.95)",
          border: `1px solid ${hovered ? c.border : "rgba(124,107,255,0.28)"}`,
          boxShadow: hovered
            ? `0 0 28px ${c.glow}, inset 0 0 16px rgba(63,208,224,0.04)`
            : "0 0 12px rgba(124,107,255,0.08)",
        }}
      >
        {/* Scan line */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] opacity-30"
          style={{
            background: `linear-gradient(90deg, transparent, ${c.border}, transparent)`,
            animation: "scan-line 3s linear infinite",
          }}
        />

        {/* Tag */}
        <div
          className="mb-1.5 font-mono text-[9.5px] font-semibold uppercase tracking-widest"
          style={{ color: c.border }}
        >
          [{tag}]
        </div>

        {/*
          Key trick: remount AccumulatedTyper each time hover starts,
          so typing resets and runs fresh without setState-in-effect issues.
        */}
        <AccumulatedTyper key={hovered ? "active" : "idle"} lines={lines} c={c} />
      </div>
    </div>
  );
}
