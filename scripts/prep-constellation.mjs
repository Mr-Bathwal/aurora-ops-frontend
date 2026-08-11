/** Prepares the /run constellation backdrop from its generated source.
 *
 * The only real work is removing the generator's sparkle watermark. Painting it out — which
 * worked on the plexus background, whose surround was true black — leaves a visible void
 * here, because this artwork's field is a dark navy full of stars rather than nothing. A dark
 * disc in a starfield reads as a hole punched in the sky.
 *
 * So the sky is repaired rather than erased: a clean patch from the same row is cloned over
 * the mark with a feathered edge. The donor was picked by matching mean luminance (17.2
 * against the target region's 20.8, which the mark itself inflates) and checking it carries
 * no bright structure of its own to duplicate visibly.
 */
import { resolve } from "node:path";
import sharp from "sharp";

const SRC = "C:/Users/goura/Downloads/Gemini_Generated_Image_kjudagkjudagkjud.png";
const DEST = resolve("public/media/images/hero/constellation-field.webp");
const PREVIEW = resolve("scripts/.constellation-preview.png");

const MARK = { cx: 2790, cy: 1135 };
const DONOR = { cx: 2470, cy: 1135 };
const BOX = 220;
const OUT_WIDTH = 2400;

const half = BOX / 2;

// White with a falloff to fully transparent. `dest-in` keeps the donor only where this has
// alpha, so the clone dissolves into the surrounding sky instead of landing as a square.
const feather = await sharp(
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${BOX}" height="${BOX}" viewBox="0 0 ${BOX} ${BOX}">
       <defs><radialGradient id="m">
         <stop offset="0" stop-color="#fff" stop-opacity="1"/>
         <stop offset="0.52" stop-color="#fff" stop-opacity="1"/>
         <stop offset="1" stop-color="#fff" stop-opacity="0"/>
       </radialGradient></defs>
       <rect width="${BOX}" height="${BOX}" fill="url(#m)"/></svg>`
  )
)
  .resize(BOX, BOX, { fit: "fill" })
  .png()
  .toBuffer();

const donor = await sharp(SRC)
  .extract({ left: DONOR.cx - half, top: DONOR.cy - half, width: BOX, height: BOX })
  .png()
  .toBuffer();

const patch = await sharp(donor).composite([{ input: feather, blend: "dest-in" }]).png().toBuffer();

// Two passes. sharp applies `resize` before `composite` regardless of call order, so a single
// pipeline would drop the patch at native coordinates onto an already-shrunk image.
const repaired = await sharp(SRC)
  .composite([{ input: patch, left: MARK.cx - half, top: MARK.cy - half }])
  .png()
  .toBuffer();

const info = await sharp(repaired)
  .resize(OUT_WIDTH, null, { fit: "inside", kernel: "lanczos3" })
  .webp({ quality: 82, effort: 6 })
  .toFile(DEST);
console.log("wrote", DEST, `${info.width}x${info.height}`, `${(info.size / 1024).toFixed(0)}KB`);

const scale = OUT_WIDTH / 3026;
await sharp(DEST)
  .extract({
    left: Math.round((MARK.cx - 190) * scale),
    top: Math.round((MARK.cy - 170) * scale),
    width: 300,
    height: 270,
  })
  .resize(340)
  .png()
  .toFile(PREVIEW);

/* A solid grey blob is what the mark looks like numerically; stars are bright and tiny. */
const { data, info: raw } = await sharp(DEST)
  .extract({
    left: Math.round((MARK.cx - 110) * scale),
    top: Math.round((MARK.cy - 110) * scale),
    width: 190,
    height: 190,
  })
  .raw()
  .toBuffer({ resolveWithObject: true });
let blob = 0;
for (let q = 0; q < data.length; q += raw.channels) {
  const [r, g, b] = [data[q], data[q + 1], data[q + 2]];
  if (r > 74 && r < 190 && Math.abs(r - b) < 12 && Math.abs(g - b) < 12) blob++;
}
console.log(`mid-grey pixels where the mark was: ${blob}`, blob < 70 ? "(clear)" : "(still present)");
