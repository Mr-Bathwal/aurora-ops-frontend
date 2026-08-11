/** Lifts the Aurora Ops mascot out of its generated banner.
 *
 * The source ships the robot on a solid teal field (rgb 30,64,79) with a mesh sphere, bokeh
 * and stars baked in — none of which can come along, because the page already has its own
 * plexus backdrop and two meshes on top of each other read as a rendering fault.
 *
 * The robot is drawn as light rather than as a solid object, so it is treated as light:
 * subtract the background colour, lift what remains, and composite with `mix-blend-mode:
 * screen`. Anything that was background falls to black, and black is invisible under screen —
 * so no cut-out edge exists to look wrong. A hard alpha matte would have to decide where the
 * glow ends, and there is no correct answer to that.
 *
 * The legs run off the bottom of the source frame. Rather than pretend otherwise, the bottom
 * is faded out so the mascot reads as emerging from the dark.
 */
import { resolve } from "node:path";
import sharp from "sharp";

const SRC = "C:/Users/goura/Downloads/Generated Image August 08, 2026 - 2_28AM.jpg";
const OUT = resolve("public/media/images/hero/mascot.webp");
const PREVIEW = resolve("scripts/.mascot-preview.png");

// Chosen off the frame, not detected: the mesh lines are bright enough that every automatic
// bounding box swallowed the whole banner.
const CROP = { left: 612, top: 26, width: 556, height: 598 };

// Measured beside the robot. Slightly under the true value on purpose — overshooting punches
// black holes in the mascot's own dark panels.
const BG = [28, 60, 74];
const GAIN = 1.5;

const { width: W, height: H } = CROP;

/** Kills the mesh and bokeh that survive in the corners, and dissolves the cropped legs.
 *
 * Two separate masks composited in turn rather than one SVG using `mix-blend-mode` — librsvg
 * does not honour that property, so the second rect would simply paint over the first. Each is
 * resized to the exact crop: an SVG's width/height attributes are a *hint*, and sharp renders
 * at librsvg's own DPI, which came out smaller than the frame and failed the composite. */
function gradientMask(defs, fill) {
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
       <defs>${defs}</defs><rect width="${W}" height="${H}" fill="${fill}"/></svg>`
  );
  return sharp(svg).resize(W, H, { fit: "fill" }).png().toBuffer();
}

const radial = await gradientMask(
  `<radialGradient id="r" cx="0.5" cy="0.44" r="0.60">
     <stop offset="0" stop-color="#fff"/><stop offset="0.34" stop-color="#fff"/>
     <stop offset="0.72" stop-color="#4a4a4a"/><stop offset="1" stop-color="#000"/></radialGradient>`,
  "url(#r)"
);
const bottomFade = await gradientMask(
  `<linearGradient id="b" x1="0" y1="0" x2="0" y2="1">
     <stop offset="0" stop-color="#fff"/><stop offset="0.70" stop-color="#fff"/>
     <stop offset="1" stop-color="#000"/></linearGradient>`,
  "url(#b)"
);

const lifted = await sharp(SRC)
  .extract(CROP)
  .linear([GAIN, GAIN, GAIN], BG.map((v) => -GAIN * v))
  .toColourspace("srgb")
  .png()
  .toBuffer();

// Flattened to a buffer before anything else touches it. sharp runs `resize` *before*
// `composite` whatever order the calls are written in, so resizing this instance for the
// preview shrank the base out from under masks still waiting to be applied.
const composed = await sharp(lifted)
  .composite([
    { input: radial, blend: "multiply" },
    { input: bottomFade, blend: "multiply" },
  ])
  .png()
  .toBuffer();

/* ── Colour grade ────────────────────────────────────────────────────────────────────────
 * The source only *looked* cyan because of the teal wash over it. Take the wash away and the
 * underlying render is brass and tan — the exact palette we rejected twice, and the chest
 * gears are the worst of it.
 *
 * So the hue is not corrected, it is replaced: reduce to luminance, then map that luminance
 * onto a ramp built from the product's own two brand stops. A hue rotation would have carried
 * the warm cast through at a different angle; a duotone cannot, because the input hue is
 * discarded before the output hue is chosen. Dark values land near black, which the `screen`
 * composite then drops entirely.
 */
// Weighted toward the lower mids, because that is where most of this render's luminance
// actually sits — an evenly spaced ramp put the whole body in the blue stop and only the eyes
// reached mint.
const RAMP = [
  [0.0, [0, 0, 0]],
  [0.16, [8, 36, 58]],
  [0.34, [22, 104, 170]],
  [0.52, [46, 178, 204]],
  [0.72, [86, 232, 212]],
  [0.9, [150, 246, 224]],
  [1.0, [232, 255, 250]],
];

/** Mid-tone lift applied to luminance *before* the ramp is sampled.
 *
 * Measured on the matted figure, 55% of it sits between 0.1 and 0.3 luminance, so a straight
 * mapping parked most of the robot in the two darkest stops and the render read as an outline
 * catching light at its edges rather than as a solid figure. 0.52 pulls that bulk up into the
 * azure and cyan stops, which is what fills it in.
 *
 * Colour only — the alpha matte below is still built from the unlifted luminance. Lifting both
 * would drag the faint background haze back up into visibility along with the robot.
 */
const LIFT = 0.52;

function gradeAt(t) {
  for (let i = 1; i < RAMP.length; i++) {
    if (t <= RAMP[i][0]) {
      const [t0, c0] = RAMP[i - 1];
      const [t1, c1] = RAMP[i];
      const k = (t - t0) / (t1 - t0);
      return [0, 1, 2].map((c) => c0[c] + (c1[c] - c0[c]) * k);
    }
  }
  return RAMP[RAMP.length - 1][1];
}

/* Alpha is baked from luminance rather than left to `mix-blend-mode: screen`.
 *
 * Screen was the right idea and it did not survive contact: the computed style said `screen`,
 * no ancestor isolated it, and the mascot still painted at rgb(1,4,3) over a rgb(12,15,20)
 * band — darker than its own backdrop, which screen cannot produce. Whatever the compositor
 * was doing, the page was wrong, and a blend mode that depends on an unbroken chain of
 * stacking contexts is fragile anyway: any future ancestor gaining a z-index, a transform or
 * an opacity would silently reintroduce the black box.
 *
 * A real alpha channel has no such dependency. Since this mascot is drawn as light, luminance
 * *is* its coverage — dark pixels are where there is nothing, bright pixels are where the
 * robot is — so the matte is exact rather than estimated, and it composites correctly over
 * any background at all.
 */
const graded = await (async () => {
  const { data, info: raw } = await sharp(composed).raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(raw.width * raw.height * 4);
  // 256-entry lookup rather than interpolating per pixel — same result, one pass.
  const lut = Array.from({ length: 256 }, (_, i) => gradeAt(Math.pow(i / 255, LIFT)));
  // Slightly convex: lifts the mid-tones so the body reads solid, while the faintest haze
  // still falls all the way to zero.
  const alphaLut = Array.from({ length: 256 }, (_, i) =>
    Math.round(Math.min(1, Math.pow(i / 255, 0.60) * 1.42) * 255)
  );
  for (let p = 0, q = 0; p < data.length; p += raw.channels, q += 4) {
    const l = Math.round(0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2]);
    const c = lut[l];
    out[q] = c[0];
    out[q + 1] = c[1];
    out[q + 2] = c[2];
    out[q + 3] = alphaLut[l];
  }
  return sharp(out, { raw: { width: raw.width, height: raw.height, channels: 4 } }).png().toBuffer();
})();

const info = await sharp(graded).webp({ quality: 90, effort: 6, alphaQuality: 100 }).toFile(OUT);
console.log("wrote", OUT, `${info.width}x${info.height}`, `${(info.size / 1024).toFixed(0)}KB`);

await sharp(graded).resize(560).png().toFile(PREVIEW);

// How much of the frame still carries light — a high number means background survived.
const { data, info: raw } = await sharp(composed).raw().toBuffer({ resolveWithObject: true });
let lit = 0;
for (let i = 0; i < data.length; i += raw.channels) {
  if ((data[i] + data[i + 1] + data[i + 2]) / 3 > 26) lit++;
}
console.log(`lit pixels: ${((lit / (raw.width * raw.height)) * 100).toFixed(1)}% of frame`);
