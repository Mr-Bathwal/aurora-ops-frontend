"use client";

import { useId } from "react";

/** Illustrated agent tiles: a beveled metal frame, a recessed dark faceplate, a glowing
 * symbol, and a specular sweep — the "physical device" look from the design references,
 * as pure SVG so it stays crisp at any size and re-themes per agent. */
export type AgentIconName =
  | "health"
  | "log"
  | "sentinel"
  | "disk"
  | "network"
  | "diagnostics"
  | "logic"
  | "reacting"
  | "backup";

type Theme = {
  /** Bevel frame, light edge → dark edge. */
  frame: [string, string];
  /** Symbol fill/stroke and the bloom behind it. */
  ink: string;
  glow: string;
};

const THEME: Record<AgentIconName, Theme> = {
  // Every agent now sits on the blue→mint ramp. The old set reached for a fresh hue per
  // agent — amber, violet, rose, lime — which read as eight unrelated products the moment
  // more than two appeared together, and made the orchestrator screenshot unusable as
  // imagery on a two-accent page.
  //
  // They stay tellable apart, but by *glyph* first and hue second, which is the right way
  // round: the heart, the stack, the shield and the disc are what identify these, and the
  // colour is only there to separate adjacent branches in the flow.
  health:      { frame: ["#b6fbec", "#0f6e5a"], ink: "#34f5c5", glow: "#34f5c5" },
  log:         { frame: ["#c3e8ff", "#14587f"], ink: "#5ac8ff", glow: "#5ac8ff" },
  sentinel:    { frame: ["#b7d7ff", "#154a8a"], ink: "#3e9cff", glow: "#3e9cff" },
  disk:        { frame: ["#d2f0ff", "#186079"], ink: "#7bd9ff", glow: "#7bd9ff" },
  network:     { frame: ["#c6f5f0", "#146862"], ink: "#5fe3d8", glow: "#5fe3d8" },
  diagnostics: { frame: ["#bcf1dd", "#12644b"], ink: "#43d9a8", glow: "#43d9a8" },
  // The hub stays neutral. It is not one of the specialists and colouring it would imply
  // it belongs to a branch.
  logic:       { frame: ["#e6ecff", "#4a5170"], ink: "#dbe4ff", glow: "#9fb4ff" },
  reacting:    { frame: ["#d3e1ff", "#284c90"], ink: "#8fb8ff", glow: "#8fb8ff" },
  backup:      { frame: ["#bad3f8", "#0f3a78"], ink: "#5b9bea", glow: "#2f7fe0" },
};

/** Each symbol draws inside a 64×64 box; the tile translates it into place. */
function Symbol({ name, ink }: { name: AgentIconName; ink: string }) {
  const s = { stroke: ink, strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" } as const;

  switch (name) {
    case "health":
      return (
        <>
          <path
            d="M32 57C10 42 6 26 16.5 17.5c7-5.6 14 -1 15.5 4.5 1.5-5.5 8.5-10.1 15.5-4.5C58 26 54 42 32 57Z"
            fill={ink}
            fillOpacity="0.22"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M9 34h12l4.5-9.5L32 45l5-11h18" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      );

    case "log":
      return (
        <>
          <ellipse cx="28" cy="15" rx="19" ry="7" fill={ink} fillOpacity="0.2" stroke={ink} strokeWidth="3" />
          <path d="M9 15v26c0 3.9 8.5 7 19 7s19-3.1 19-7V15" {...s} />
          <path d="M9 28c0 3.9 8.5 7 19 7s19-3.1 19-7" {...s} />
          <circle cx="42" cy="44" r="12" fill="#0a0d18" fillOpacity="0.85" stroke="#fff" strokeWidth="3" />
          <path d="M51 53l6 6" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
        </>
      );

    case "sentinel":
      return (
        <>
          <path d="M32 6v7" {...s} />
          <circle cx="32" cy="5" r="3.5" fill={ink} />
          <rect x="9" y="14" width="46" height="36" rx="13" fill={ink} fillOpacity="0.16" stroke={ink} strokeWidth="3" />
          <ellipse cx="23" cy="31" rx="4.5" ry="6" fill="#fff" />
          <ellipse cx="41" cy="31" rx="4.5" ry="6" fill="#fff" />
          <path d="M25 42h14" stroke={ink} strokeWidth="3" strokeLinecap="round" />
          <path d="M9 26H4M55 26h5" {...s} />
        </>
      );

    case "disk":
      return (
        <>
          <circle cx="32" cy="32" r="24" fill={ink} fillOpacity="0.16" stroke={ink} strokeWidth="3" />
          <circle cx="32" cy="32" r="13" stroke={ink} strokeWidth="2" fill="none" opacity="0.55" />
          <circle cx="32" cy="32" r="5" fill={ink} />
          <path d="M32 8a24 24 0 0 1 21 12.4" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M22 33.5l7 7 14-15" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      );

    case "network":
      return (
        <>
          <circle cx="32" cy="32" r="23" fill={ink} fillOpacity="0.14" stroke={ink} strokeWidth="3" />
          <ellipse cx="32" cy="32" rx="10" ry="23" stroke={ink} strokeWidth="2.2" fill="none" opacity="0.7" />
          <path d="M10 25h44M10 39h44" stroke={ink} strokeWidth="2.2" opacity="0.7" />
          <circle cx="32" cy="9" r="4" fill="#fff" />
          <circle cx="13" cy="43" r="4" fill="#fff" />
          <circle cx="51" cy="43" r="4" fill="#fff" />
        </>
      );

    case "diagnostics":
      return (
        <>
          <rect x="6" y="12" width="52" height="36" rx="7" fill={ink} fillOpacity="0.14" stroke={ink} strokeWidth="3" />
          <path d="M13 32h8l5-11 6 22 5-11h14" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M24 55h16" {...s} />
          <path d="M32 48v7" {...s} />
        </>
      );

    case "logic":
      return (
        <>
          <rect x="21" y="6" width="22" height="15" rx="4.5" fill={ink} fillOpacity="0.2" stroke={ink} strokeWidth="3" />
          <path d="M32 21v11M14 43V37a5 5 0 0 1 5-5h26a5 5 0 0 1 5 5v6" {...s} />
          <rect x="3" y="43" width="22" height="15" rx="4.5" fill={ink} fillOpacity="0.2" stroke={ink} strokeWidth="3" />
          <rect x="39" y="43" width="22" height="15" rx="4.5" fill={ink} fillOpacity="0.2" stroke={ink} strokeWidth="3" />
        </>
      );

    case "reacting":
      return (
        <>
          <path d="M53 26A22 22 0 0 0 12 21" {...s} strokeWidth="4" />
          <path d="M11 32V19h13" {...s} strokeWidth="4" />
          <path d="M11 38a22 22 0 0 0 41 5" {...s} strokeWidth="4" />
          <path d="M53 32v13H40" {...s} strokeWidth="4" />
        </>
      );

    case "backup":
      return (
        <>
          <path d="M32 5l21 8v17c0 14-9 23-21 29-12-6-21-15-21-29V13l21-8Z" fill={ink} fillOpacity="0.18" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M32 19v18" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M24 30l8 8 8-8" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M21 44h22" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
        </>
      );
  }
}

export function AgentIcon({
  name,
  size = 96,
  className,
  live = false,
}: {
  name: AgentIconName;
  size?: number;
  className?: string;
  /** Animates the status LEDs along the tile's lower edge. */
  live?: boolean;
}) {
  // Strip everything XML wouldn't accept in an id, not just colons: React 19's useId
  // returns «r0»-style values, and while a browser parsing inline HTML tolerates the
  // guillemets, the same markup serialized into a standalone .svg is parsed as XML and
  // rejects them outright. Cheap insurance for any path that renders these to an image
  // rather than into the DOM.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const t = THEME[name];
  const frameId = `f-${uid}`;
  const faceId = `p-${uid}`;
  const glossId = `g-${uid}`;
  const bloomId = `b-${uid}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      className={className}
      role="img"
      aria-label={`${name} agent`}
    >
      <defs>
        <linearGradient id={frameId} x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0" stopColor={t.frame[0]} />
          <stop offset="0.45" stopColor={t.frame[1]} />
          <stop offset="1" stopColor={t.frame[0]} stopOpacity="0.75" />
        </linearGradient>
        <radialGradient id={faceId} cx="0.5" cy="0.32" r="0.85">
          <stop offset="0" stopColor="#1b2033" />
          <stop offset="0.6" stopColor="#0c1020" />
          <stop offset="1" stopColor="#05070f" />
        </radialGradient>
        <linearGradient id={glossId} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.42" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={bloomId} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={t.glow} stopOpacity="0.55" />
          <stop offset="1" stopColor={t.glow} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Cast shadow under the tile */}
      <rect x="12" y="16" width="104" height="104" rx="30" fill="#000" opacity="0.55" />

      {/* Beveled frame */}
      <rect x="8" y="8" width="112" height="112" rx="30" fill={`url(#${frameId})`} />
      <rect x="8" y="8" width="112" height="112" rx="30" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.5" />

      {/* Recessed faceplate */}
      <rect x="17" y="17" width="94" height="94" rx="23" fill={`url(#${faceId})`} />
      <rect x="17" y="17" width="94" height="94" rx="23" fill="none" stroke="#000" strokeOpacity="0.6" strokeWidth="2" />

      {/* Bloom behind the symbol */}
      <circle cx="64" cy="60" r="40" fill={`url(#${bloomId})`} />

      <g transform="translate(32 30)" style={{ filter: `drop-shadow(0 0 6px ${t.glow})` }}>
        <Symbol name={name} ink={t.ink} />
      </g>

      {/* Status LEDs along the lower edge */}
      {[52, 64, 76].map((cx, i) => (
        <circle key={cx} cx={cx} cy="101" r="2.6" fill={t.glow} opacity={live ? 1 : 0.4}>
          {live && (
            <animate
              attributeName="opacity"
              values="1;0.15;1"
              dur="1.6s"
              begin={`${i * 0.25}s`}
              repeatCount="indefinite"
            />
          )}
        </circle>
      ))}

      {/* Corner screws */}
      {[
        [22, 22],
        [106, 22],
        [22, 106],
        [106, 106],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.4" fill="#000" opacity="0.45" />
      ))}

      {/* Specular sweep across the upper-left */}
      <path d="M8 38V38a30 30 0 0 1 30-30h52L8 90Z" fill={`url(#${glossId})`} />
    </svg>
  );
}
