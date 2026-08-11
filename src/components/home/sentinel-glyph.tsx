"use client";

import { useId } from "react";

/** The three landing-page agent glyphs.
 *
 * Deliberately not `AgentIcon`. That one is a beveled metal plaque — a physical device with
 * screws and a specular sweep — which is the right object for the fleet page, where it sits
 * on an opaque panel and reads as a unit of hardware. On a glass card it fights: a second,
 * heavier piece of material floating on top of the first, with its own light source.
 *
 * These are cut from the same glass as the card instead. A translucent tile, an edge that
 * catches light along the top the way a real bevel does, a bloom underneath, and line art
 * that is doing something: the heart beats and carries a trace, the storage rims light in
 * sequence under a scanning bar, the shield takes a sheen across it. Standing still, the
 * card should still look like something is watching.
 */
export type SentinelGlyphName = "health" | "log" | "backup";

type Palette = {
  /** Stroke gradient, top-left → bottom-right. */
  ink: [string, string];
  /** Bloom behind the art, and the tint on the tile itself. */
  glow: string;
};

/** Each glyph is stroked with a two-stop gradient taken from the brand ramp, positioned so
 * the three sit at different points along blue→mint and stay tellable apart side by side.
 * The rose and violet these used to carry are gone: they were the last place on the
 * dashboard where an agent introduced a hue the rest of the page never uses. */
const PALETTE: Record<SentinelGlyphName, Palette> = {
  health: { ink: ["#7bd9ff", "#34f5c5"], glow: "#34f5c5" },
  log: { ink: ["#5ac8ff", "#7bd9ff"], glow: "#5ac8ff" },
  backup: { ink: ["#3e9cff", "#5ac8ff"], glow: "#2f7fe0" },
};

/** `ink` is a gradient paint (`url(#…)`) for SVG strokes; `glow` is the same accent as a
 * flat colour, because CSS `drop-shadow()` takes a colour and silently drops the filter if
 * handed a paint server reference. */
type ArtProps = { ink: string; glow: string; uid: string };

function Health({ ink, glow, uid }: ArtProps) {
  const traceD = "M14 50h12l5.5-13L39 62l6-14h37";
  return (
    <>
      {/* The heart is the thing that beats; the trace runs independently through it, so the
          two rhythms don't lock into one another and read as a single blinking object. */}
      <g className="glyph-beat">
        <path
          d="M48 71C48 71 25 57.5 25 41.5 25 32.6 31.8 27 38.2 27c4.4 0 8.1 2.6 9.8 5.8 1.7-3.2 5.4-5.8 9.8-5.8C64.2 27 71 32.6 71 41.5 71 57.5 48 71 48 71Z"
          fill={`url(#hf-${uid})`}
          stroke={ink}
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
      </g>

      <g clipPath={`url(#tile-${uid})`}>
        <path d={traceD} fill="none" stroke={ink} strokeOpacity="0.28" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <path
          className="glyph-trace"
          d={traceD}
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="26 300"
          style={{ filter: `drop-shadow(0 0 5px ${glow})` }}
        />
      </g>
    </>
  );
}

function Log({ ink, glow, uid }: ArtProps) {
  const rx = 19;
  const ry = 6.4;
  const tops = [28, 43, 58];
  return (
    <>
      <g clipPath={`url(#tile-${uid})`}>
        {tops.map((cy, i) => (
          <g key={cy}>
            {/* Body first, rim over it — otherwise the wall's fill sits on the ellipse and
                the platter reads as a flat pill. */}
            <path
              d={`M${48 - rx} ${cy}v13a${rx} ${ry} 0 0 0 ${rx * 2} 0V${cy}`}
              fill={`url(#hf-${uid})`}
              stroke={ink}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <ellipse cx="48" cy={cy} rx={rx} ry={ry} fill="#080a14" stroke={ink} strokeWidth="2.5" />
            <ellipse
              cx="48"
              cy={cy}
              rx={rx}
              ry={ry}
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.5"
              style={{
                animation: `glyph-rim 2.6s ease-in-out ${i * 0.42}s infinite`,
                filter: `drop-shadow(0 0 4px ${glow})`,
              }}
            />
            <circle cx="62" cy={cy + 9} r="1.9" fill={ink} opacity="0.85" />
          </g>
        ))}

        {/* The read head. A single bright bar tracking down the stack is what turns three
            drawn cylinders into something being read. */}
        <rect className="glyph-scan" x="24" y="34" width="48" height="2" rx="1" fill="#ffffff" opacity="0.5" style={{ filter: `drop-shadow(0 0 6px ${glow})` }} />
      </g>
    </>
  );
}

function Backup({ ink, glow, uid }: ArtProps) {
  const bays = [24, 41, 58];
  return (
    <>
      <g clipPath={`url(#tile-${uid})`}>
        {bays.map((y) => (
          <g key={y}>
            <rect x="19" y={y} width="42" height="14" rx="4" fill={`url(#hf-${uid})`} stroke={ink} strokeWidth="2.4" />
            <path d={`M25 ${y + 7}h9`} stroke={ink} strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
            <circle cx="53" cy={y + 7} r="2.1" fill="#ffffff" opacity="0.9" style={{ filter: `drop-shadow(0 0 4px ${ink})` }} />
          </g>
        ))}

        {/* Integrated, not adjacent: the shield is knocked out of the rack with a dark halo
            so it sits in front of the bays instead of colliding with their strokes. */}
        <path
          d="M65 38l17 6.4v12.2c0 11.3-7.6 18.4-17 22-9.4-3.6-17-10.7-17-22V44.4L65 38Z"
          fill="#080a14"
          stroke="#080a14"
          strokeWidth="7"
          strokeLinejoin="round"
        />
        <path
          d="M65 38l17 6.4v12.2c0 11.3-7.6 18.4-17 22-9.4-3.6-17-10.7-17-22V44.4L65 38Z"
          fill={`url(#hf-${uid})`}
          stroke={ink}
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        <path d="M57 57.5l5.6 5.8L74 51.5" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 4px ${glow})` }} />

        <g clipPath={`url(#shield-${uid})`}>
          <rect className="glyph-sheen" x="44" y="34" width="12" height="50" fill="#ffffff" opacity="0.5" transform="skewX(-18)" />
        </g>
      </g>
    </>
  );
}

export function SentinelGlyph({
  name,
  size = 72,
  className,
}: {
  name: SentinelGlyphName;
  size?: number;
  className?: string;
}) {
  // React 19's useId returns «r0»-style values; the guillemets are not valid in an XML
  // NCName, which matters the moment this markup is serialized rather than parsed as HTML.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const p = PALETTE[name];
  const Art = name === "health" ? Health : name === "log" ? Log : Backup;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      className={className}
      role="img"
      aria-hidden
    >
      <defs>
        <clipPath id={`tile-${uid}`}>
          <rect x="4" y="4" width="88" height="88" rx="26" />
        </clipPath>
        <clipPath id={`shield-${uid}`}>
          <path d="M65 38l17 6.4v12.2c0 11.3-7.6 18.4-17 22-9.4-3.6-17-10.7-17-22V44.4L65 38Z" />
        </clipPath>

        <linearGradient id={`ink-${uid}`} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor={p.ink[0]} />
          <stop offset="1" stopColor={p.ink[1]} />
        </linearGradient>
        {/* Art fill — barely there. The line work carries the shape; a solid fill would make
            these read as stickers rather than as etched glass. */}
        <linearGradient id={`hf-${uid}`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={p.glow} stopOpacity="0.26" />
          <stop offset="1" stopColor={p.glow} stopOpacity="0.06" />
        </linearGradient>

        <linearGradient id={`face-${uid}`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.085" />
          <stop offset="0.55" stopColor="#ffffff" stopOpacity="0.022" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.045" />
        </linearGradient>
        {/* The edge is the whole trick. A uniform 1px stroke looks printed on; light
            collecting along the top rim and falling away by 40% is what a real chamfer does
            and is what makes the tile read as glass rather than as a bordered box. */}
        <linearGradient id={`edge-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="0.4" stopColor="#ffffff" stopOpacity="0.09" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.05" />
        </linearGradient>
        <radialGradient id={`bloom-${uid}`} cx="0.5" cy="0.52" r="0.5">
          <stop offset="0" stopColor={p.glow} stopOpacity="0.4" />
          <stop offset="1" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="4" y="4" width="88" height="88" rx="26" fill="#0c0f14" fillOpacity="0.55" />
      <rect x="4" y="4" width="88" height="88" rx="26" fill={`url(#face-${uid})`} />
      <circle cx="48" cy="50" r="40" fill={`url(#bloom-${uid})`} />

      <Art ink={`url(#ink-${uid})`} glow={p.glow} uid={uid} />

      <rect x="4.75" y="4.75" width="86.5" height="86.5" rx="25.25" fill="none" stroke={`url(#edge-${uid})`} strokeWidth="1.5" />
    </svg>
  );
}
