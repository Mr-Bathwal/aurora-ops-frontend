import Image from "next/image";

/** The deep-space plate behind the hero.
 *
 * Composited the way the reference composites it, which is not the way it looks. Its galaxy
 * photograph runs at 0.3 opacity — almost a tint — and every bright thing in that hero is a
 * separate layer blended with `mix-blend-mode: screen` on top of it. Screen can only ever
 * lighten, so a glow laid over a dark sky adds light instead of covering it, and the stars
 * underneath stay visible *through* the beam. Painting the same shapes normally, at any
 * opacity, buries them.
 *
 * Framing is owned by the parent, which sizes this box from the viewport width against the
 * plate's own aspect ratio — see hero.tsx. That is what keeps the same portion of the sky on
 * screen at every window size: with a fixed height, `cover` flips between scaling by width
 * and by height as the window changes, and the beam and the beaded arc slide out of frame
 * without anything in the CSS having changed.
 */
export function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <Image
        src="/media/images/hero/nebula.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
        style={{
          // 22% from the left rather than the default 50%. Where the box is taller than the
          // plate's ratio the crop is horizontal, and the light shaft lives in the left
          // strip — centring it was what reduced the shaft to a smudge in the corner.
          // Anchored to the top so the shaft always enters at the very top of the window.
          objectPosition: "22% top",
          // Lifted a little: the plate has to read as the room the page is in, and straight
          // out of the encoder it sits a touch flat against #050707.
          filter: "brightness(1.12) saturate(1.08)",
        }}
      />

      {/* The light shower, reinforcing the one already in the plate rather than inventing a
          second. Much softer than it was: the plate's own shaft used to arrive cropped, and
          these were carrying it. Now that the full shaft is on screen they only extend it
          past the plate's edge. Screen-blended, so the starfield stays visible through. */}
      <div
        className="absolute -top-[10%] left-[-9%] h-[120%] w-[38%] origin-top"
        style={{
          transform: "rotate(21deg)",
          background:
            "linear-gradient(92deg, transparent 4%, rgba(90,175,255,0.16) 30%," +
            "rgba(155,222,255,0.24) 50%, rgba(90,180,255,0.12) 72%, transparent 96%)",
          filter: "blur(52px)",
          mixBlendMode: "screen",
        }}
      />

      {/* The orbiting body. A glowing dot travels the arc right-to-left, the way a small
          moon tracks the ring in the reference. The path itself is invisible and traces the
          plate's baked arc, so the dot reads as riding that arc rather than a second line
          drawn over it. Screen-blended so it adds light to the sky.
          preserveAspectRatio="none" lets the viewBox map straight onto the box; the dot is
          small enough that the tiny non-uniform scale is invisible. */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1600 1000"
        preserveAspectRatio="none"
        style={{ mixBlendMode: "screen" }}
        aria-hidden
      >
        <defs>
          {/* Drawn right -> left, so animateMotion (which follows path direction) travels
              that way without any reversal trickery. */}
          <path id="hero-orbit" d="M 1520 470 C 1140 690, 470 690, 90 470" fill="none" />
          <radialGradient id="hero-orbit-dot">
            <stop offset="0" stopColor="#eafaff" />
            <stop offset="0.4" stopColor="#7cd6ff" stopOpacity="0.85" />
            <stop offset="1" stopColor="#7cd6ff" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* soft halo */}
        <circle r="17" fill="url(#hero-orbit-dot)">
          <animateMotion dur="15s" repeatCount="indefinite"><mpath href="#hero-orbit" /></animateMotion>
        </circle>
        {/* hot core */}
        <circle r="3.4" fill="#eafaff">
          <animateMotion dur="15s" repeatCount="indefinite"><mpath href="#hero-orbit" /></animateMotion>
        </circle>
      </svg>

      {/* Hand-off. Anchored to the bottom of this box — which is the bottom of the plate —
          so the photograph never ends on a visible horizontal edge no matter how the box is
          sized. */}
      <div
        className="absolute inset-x-0 bottom-0 h-[30%]"
        style={{ background: "linear-gradient(to bottom, transparent, var(--bg) 96%)" }}
      />
    </div>
  );
}
