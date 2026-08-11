/** Geometry check for the built deck.
 *
 * There is no renderer on this machine, and pptxgenjs will happily emit text that runs off the
 * slide or sits on top of other text — it reports no error either way. So the file itself is
 * parsed and every text-bearing shape measured: anything crossing the slide edge, and any two
 * text boxes whose rectangles intersect.
 *
 * Cards and rules are ignored deliberately. Text is *meant* to sit on top of a filled panel;
 * only text overlapping other text is a real fault.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const AdmZip = require("adm-zip");
const HERE = dirname(fileURLToPath(import.meta.url));

const EMU = 914400;
const W = 13.333, H = 7.5;
const PAD = 0.02;          // tolerance, in inches

const FILE = process.argv[2] ?? "Aurora-Ops-Overview.pptx";
const zip = new AdmZip(resolve(HERE, FILE));
console.log(`checking ${FILE}\n`);
const slides = zip
  .getEntries()
  .filter((e) => /^ppt\/slides\/slide\d+\.xml$/.test(e.entryName))
  .sort((a, b) => Number(a.entryName.match(/\d+/)[0]) - Number(b.entryName.match(/\d+/)[0]));

let offSlide = 0, collisions = 0, negatives = 0;

for (const [i, entry] of slides.entries()) {
  const xml = zip.readAsText(entry);
  const boxes = [];

  /* Negative extents. pptxgenjs will happily write a negative cx/cy if a shape is given a
     negative width or height — an upward arrow drawn as h: -1.54, say. A zip reader parses
     the result without complaint and PowerPoint then refuses to open the file at all, with
     no indication of which shape is at fault. The per-shape regexes below cannot catch it,
     because they only match digits, so the offending shape is skipped silently. */
  for (const m of xml.matchAll(/<a:ext cx="(-?\d+)" cy="(-?\d+)"\/>/g)) {
    if (+m[1] < 0 || +m[2] < 0) {
      negatives++;
      console.log(`  slide ${String(i + 1).padStart(2)} NEGATIVE EXTENT  cx=${m[1]} cy=${m[2]}  — PowerPoint will refuse to open this file`);
    }
  }

  // Each <p:sp> is one shape. Take its transform and whether it carries any text.
  for (const sp of xml.split("<p:sp>").slice(1)) {
    const off = sp.match(/<a:off x="(-?\d+)" y="(-?\d+)"\/>/);
    const ext = sp.match(/<a:ext cx="(\d+)" cy="(\d+)"\/>/);
    if (!off || !ext) continue;
    const texts = [...sp.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1]).join(" ").trim();
    if (!texts) continue;                       // a card or a rule, not text
    if (/rot="/.test(sp)) continue;             // rotated beams are decorative

    boxes.push({
      kind: "text",
      x: +off[1] / EMU, y: +off[2] / EMU,
      w: +ext[1] / EMU, h: +ext[2] / EMU,
      label: texts.slice(0, 38),
    });
  }

  /* Images too. This is the check that was missing, and it is the one that mattered: text laid
     over a screenshot passed silently because only text was ever compared against text. A
     caption belongs beside or beneath a picture, never on top of one. */
  for (const pic of xml.split("<p:pic>").slice(1)) {
    const off = pic.match(/<a:off x="(-?\d+)" y="(-?\d+)"\/>/);
    const ext = pic.match(/<a:ext cx="(\d+)" cy="(\d+)"\/>/);
    if (!off || !ext) continue;
    boxes.push({
      kind: "image",
      x: +off[1] / EMU, y: +off[2] / EMU,
      w: +ext[1] / EMU, h: +ext[2] / EMU,
      label: "[image]",
    });
  }

  for (const b of boxes) {
    const over = [];
    if (b.x < -PAD) over.push(`left ${b.x.toFixed(2)}"`);
    if (b.y < -PAD) over.push(`top ${b.y.toFixed(2)}"`);
    if (b.x + b.w > W + PAD) over.push(`right by ${(b.x + b.w - W).toFixed(2)}"`);
    if (b.y + b.h > H + PAD) over.push(`bottom by ${(b.y + b.h - H).toFixed(2)}"`);
    if (over.length) {
      offSlide++;
      console.log(`  slide ${String(i + 1).padStart(2)} OFF-SLIDE  ${over.join(", ")}  — "${b.label}"`);
    }
  }

  for (let a = 0; a < boxes.length; a++) {
    for (let c = a + 1; c < boxes.length; c++) {
      const p = boxes[a], q = boxes[c];
      if (p.kind === "image" && q.kind === "image") continue;   // two pictures never share a slot
      const ox = Math.min(p.x + p.w, q.x + q.w) - Math.max(p.x, q.x);
      const oy = Math.min(p.y + p.h, q.y + q.h) - Math.max(p.y, q.y);
      if (ox > 0.06 && oy > 0.06) {
        collisions++;
        const kind = p.kind === "image" || q.kind === "image" ? "TEXT ON IMAGE" : "TEXT OVERLAP";
        console.log(
          `  slide ${String(i + 1).padStart(2)} ${kind} ${ox.toFixed(2)}"x${oy.toFixed(2)}"` +
          `  — "${p.label}"  vs  "${q.label}"`
        );
      }
    }
  }
}

console.log(
  `\n${slides.length} slides · ${offSlide} off-slide · ${collisions} text collisions · ${negatives} negative extents` +
  `${offSlide + collisions + negatives === 0 ? "  — clean" : ""}`
);
