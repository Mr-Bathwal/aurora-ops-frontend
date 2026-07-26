"use client";

import { useCountUp } from "@/hooks/use-count-up";

const RADIUS = 32;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function severityColor(value: number) {
  if (value >= 90) return "var(--crit)";
  if (value >= 70) return "var(--warn)";
  return "var(--ok)";
}

export function Gauge({ value, label }: { value: number; label: string }) {
  const animated = useCountUp(value, 900);
  const offset = CIRCUMFERENCE * (1 - animated / 100);
  const color = severityColor(value);

  return (
    <div className="text-center">
      <svg width="76" height="76" viewBox="0 0 76 76">
        <circle cx="38" cy="38" r={RADIUS} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="6" />
        <circle
          cx="38"
          cy="38"
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 38 38)"
          style={{ transition: "stroke 0.4s" }}
        />
        <text x="38" y="42" textAnchor="middle" fill="#EDEFF7" className="font-mono text-[15px] font-medium">
          {Math.round(animated)}%
        </text>
      </svg>
      <div className="mt-1 text-[11px] uppercase tracking-[0.05em] text-faint">{label}</div>
    </div>
  );
}
