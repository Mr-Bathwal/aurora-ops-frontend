"use client";

import { useEffect, useState } from "react";

interface RobotSvgProps {
  accentColor?: string;
  eyeColor?: string;
  size?: number;
  animated?: boolean;
  waveArm?: boolean;
}

export function RobotSvg({
  accentColor = "#7C6BFF",
  eyeColor = "#3FD0E0",
  size = 90,
  animated = true,
  waveArm = false,
}: RobotSvgProps) {
  const [blinking, setBlinking] = useState(false);
  const [eyeX, setEyeX] = useState(0);

  useEffect(() => {
    if (!animated) return;
    const eyeTimer = setInterval(() => {
      setEyeX((x) => (x === 0 ? 1.5 : x === 1.5 ? -1.5 : 0));
    }, 1400);
    const offset = Math.random() * 2400;
    const blinkTimer = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 130);
    }, 3400 + offset);
    return () => { clearInterval(eyeTimer); clearInterval(blinkTimer); };
  }, [animated]);

  const W = 60, H = 100;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={size} height={(size * H) / W} fill="none" xmlns="http://www.w3.org/2000/svg">

      {/* ── Shadow halo ── */}
      <ellipse cx="30" cy="97" rx="18" ry="2.5" fill={accentColor} opacity="0.2"
        style={{ filter: "blur(4px)" }} />

      {/* ── Antenna ── */}
      <line x1="30" y1="3" x2="30" y2="12" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
      {/* Outer glow ring */}
      <circle cx="30" cy="3" r="4.5" fill="none" stroke={eyeColor} strokeWidth="0.9" opacity="0.45" />
      {/* Tip orb */}
      <circle cx="30" cy="3" r="2.8" fill={eyeColor}
        style={{
          filter: `drop-shadow(0 0 6px ${eyeColor}) drop-shadow(0 0 14px ${eyeColor})`,
          animation: animated ? "wire-spark 1.5s ease-in-out infinite" : "none",
        }} />

      {/* ── Head ── */}
      <rect x="6" y="12" width="48" height="36" rx="14" fill="#080814" stroke={accentColor} strokeWidth="2" />
      {/* Head interior ambient */}
      <rect x="9" y="15" width="42" height="30" rx="11" fill={`${accentColor}0C`} />

      {/* ── Visor HUD bar across eye zone ── */}
      <rect x="8" y="21" width="44" height="18" rx="8"
        fill={`${eyeColor}15`}
        stroke={`${eyeColor}38`}
        strokeWidth="0.8" />

      {/* ── Eyes — large camera-lens style ── */}
      {!blinking ? (
        <>
          {/* Left eye */}
          <circle cx={18.5 + eyeX} cy="30" r="8.5" fill="#050510" stroke={eyeColor} strokeWidth="1.8"
            style={{ filter: `drop-shadow(0 0 8px ${eyeColor})` }} />
          {/* Iris ring detail */}
          <circle cx={18.5 + eyeX} cy="30" r="6.5" fill="none" stroke={eyeColor} strokeWidth="0.5" opacity="0.35" />
          {/* Iris fill */}
          <circle cx={18.5 + eyeX} cy="30" r="5" fill={eyeColor} opacity="0.92" />
          {/* Pupil */}
          <circle cx={18.5 + eyeX} cy="30" r="2.8" fill="#050510" />
          {/* Specular highlight */}
          <circle cx={20.8 + eyeX} cy="27.5" r="1.1" fill="#fff" opacity="0.75" />

          {/* Right eye */}
          <circle cx={41.5 + eyeX} cy="30" r="8.5" fill="#050510" stroke={eyeColor} strokeWidth="1.8"
            style={{ filter: `drop-shadow(0 0 8px ${eyeColor})` }} />
          <circle cx={41.5 + eyeX} cy="30" r="6.5" fill="none" stroke={eyeColor} strokeWidth="0.5" opacity="0.35" />
          <circle cx={41.5 + eyeX} cy="30" r="5" fill={eyeColor} opacity="0.92" />
          <circle cx={41.5 + eyeX} cy="30" r="2.8" fill="#050510" />
          <circle cx={43.8 + eyeX} cy="27.5" r="1.1" fill="#fff" opacity="0.75" />
        </>
      ) : (
        <>
          <rect x={10 + eyeX} y="29.2" width="17" height="2.5" rx="1.25" fill={eyeColor} />
          <rect x={33 + eyeX} y="29.2" width="17" height="2.5" rx="1.25" fill={eyeColor} />
        </>
      )}

      {/* ── Mouth — segmented LED bar ── */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={16 + i * 5} y="39.5" width="3.8" height="3.2" rx="1"
          fill={accentColor}
          opacity={0.3 + (i % 3) * 0.22}
          style={{ animation: animated ? `wire-spark ${0.28 + i * 0.09}s ease-in-out infinite alternate` : "none" }} />
      ))}

      {/* ── Neck ── */}
      <rect x="23" y="48" width="14" height="7" rx="3.5" fill="#080814" stroke={accentColor} strokeWidth="1" strokeOpacity="0.5" />
      {/* Neck dots */}
      <circle cx="27" cy="51.5" r="1" fill={accentColor} opacity="0.45" />
      <circle cx="30" cy="51.5" r="1" fill={accentColor} opacity="0.45" />
      <circle cx="33" cy="51.5" r="1" fill={accentColor} opacity="0.45" />

      {/* ── Body ── */}
      <rect x="10" y="55" width="40" height="30" rx="9" fill="#080814" stroke={accentColor} strokeWidth="1.8" />

      {/* Circuit lines — left side */}
      <path d="M14 61 L14 74 M14 67.5 L18 67.5" stroke={`${accentColor}42`} strokeWidth="0.9" strokeLinecap="round" />
      {/* Circuit lines — right side */}
      <path d="M46 61 L46 74 M46 67.5 L42 67.5" stroke={`${accentColor}42`} strokeWidth="0.9" strokeLinecap="round" />

      {/* Shoulder joint circles */}
      <circle cx="10" cy="59" r="4" fill="#0a0a18" stroke={accentColor} strokeWidth="1.2" strokeOpacity="0.5" />
      <circle cx="50" cy="59" r="4" fill="#0a0a18" stroke={accentColor} strokeWidth="1.2" strokeOpacity="0.5" />

      {/* ── Arc reactor chest core ── */}
      {/* Outer ambient ring */}
      <circle cx="30" cy="66" r="10" fill="none" stroke={eyeColor} strokeWidth="0.6" strokeOpacity="0.22" />
      {/* Main ring */}
      <circle cx="30" cy="66" r="7.5" fill={`${eyeColor}12`} stroke={eyeColor} strokeWidth="1.4" strokeOpacity="0.65"
        style={{ filter: `drop-shadow(0 0 9px ${eyeColor})`, animation: animated ? "eye-glow 2.2s ease-in-out infinite" : "none" }} />
      {/* Inner glow fill */}
      <circle cx="30" cy="66" r="4.5" fill={`${eyeColor}22`} />
      {/* Core */}
      <circle cx="30" cy="66" r="2.8" fill={eyeColor} opacity="0.88"
        style={{ filter: `drop-shadow(0 0 5px ${eyeColor})` }} />

      {/* Chest panel strip (below reactor) */}
      <rect x="16" y="77" width="10" height="4" rx="2" fill={`${accentColor}55`} />
      <rect x="28" y="77" width="8"  height="4" rx="2" fill={`${accentColor}3A`} />
      <rect x="38" y="77" width="7"  height="4" rx="2" fill={`${accentColor}25`} />

      {/* ── Left arm (CSS wave when waveArm=true) ── */}
      <g className={waveArm ? "wave-arm" : ""}>
        <rect x="1" y="58" width="9" height="17" rx="4.5" fill="#080814" stroke={accentColor} strokeWidth="1.5" strokeOpacity="0.7" />
        {/* Elbow joint */}
        <circle cx="5.5" cy="66.5" r="2.2" fill={`${accentColor}28`} stroke={accentColor} strokeWidth="0.8" strokeOpacity="0.5" />
      </g>

      {/* ── Right arm (static) ── */}
      <rect x="50" y="58" width="9" height="17" rx="4.5" fill="#080814" stroke={accentColor} strokeWidth="1.5" strokeOpacity="0.7" />
      <circle cx="54.5" cy="66.5" r="2.2" fill={`${accentColor}28`} stroke={accentColor} strokeWidth="0.8" strokeOpacity="0.5" />

      {/* ── Legs ── */}
      <rect x="12" y="85" width="14" height="15" rx="6" fill="#080814" stroke={accentColor} strokeWidth="1.4" strokeOpacity="0.65" />
      <rect x="34" y="85" width="14" height="15" rx="6" fill="#080814" stroke={accentColor} strokeWidth="1.4" strokeOpacity="0.65" />
      {/* Foot accent strip */}
      <rect x="13" y="95" width="12" height="3" rx="1.5" fill={`${accentColor}45`} />
      <rect x="35" y="95" width="12" height="3" rx="1.5" fill={`${accentColor}45`} />
    </svg>
  );
}
