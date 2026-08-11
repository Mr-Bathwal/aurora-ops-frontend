/** Cuts deck-ready detail crops out of the full-page captures.
 *
 * A whole 1400x860 page shrunk onto a slide reads as a grey smudge — the point of a screenshot
 * on a slide is one legible thing, not the whole application. So each asset here is a tight
 * crop around the single element its slide is talking about.
 *
 * Two source scales, which is worth stating because mixing them up silently produces a
 * "bad extract area" and nothing else: `shoot.mjs --shot` captures 1400x860 at
 * deviceScaleFactor 2, so those files are 2800x1720. Study mode captures 1440x900 at
 * deviceScaleFactor 1. Coordinates below are always written in CSS pixels and scaled per file.
 */
import fs, { readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const HERE = dirname(fileURLToPath(import.meta.url));
const IMG = resolve(HERE, "img");
const GRAB = resolve(HERE, "..", "screenshots", "deckgrab");

/** left/top/width/height in CSS pixels. `s` is the source's deviceScaleFactor. */
async function cut(src, out, { l, t, w, h }, s) {
  const meta = await sharp(src).metadata();
  const box = { left: l * s, top: t * s, width: w * s, height: h * s };
  if (box.left + box.width > meta.width || box.top + box.height > meta.height) {
    throw new Error(
      `${out}: crop runs past ${src} (${meta.width}x${meta.height}) — ` +
      `wanted ${box.left + box.width}x${box.top + box.height}`
    );
  }
  await sharp(src).extract(box).png().toFile(resolve(IMG, out + ".png"));
  console.log(`  ${out.padEnd(12)} ${box.width}x${box.height}`);
}

// ── from the 2x product captures ─────────────────────────────────────────────────────────
// The two-card console: the robot with its command boxes, and the chat rail beside it.
await cut(resolve(IMG, "trace.png"), "console", { l: 20, t: 290, w: 1360, h: 420 }, 2);

// Just the chat rail — for "you talk to it in plain English".
await cut(resolve(IMG, "rail-src.png".replace("rail-src", "trace")), "rail", { l: 22, t: 296, w: 396, h: 400 }, 2);

// The orchestrator's example prompts. They are symptoms, never agent names — which is the
// whole point of that tab.
await cut(resolve(IMG, "transcript.png"), "prompts", { l: 680, t: 370, w: 680, h: 300 }, 2);

// The fleet grid, cropped to the live tiles.
await cut(resolve(IMG, "fleet.png"), "fleetgrid", { l: 20, t: 350, w: 1380, h: 360 }, 2);

// The landing hero, minus the navbar.
await cut(resolve(IMG, "landing.png"), "hero", { l: 0, t: 76, w: 1400, h: 700 }, 2);

// ── from the 1x scroll captures ──────────────────────────────────────────────────────────
// The chain graph: log analyzer → decision → agents → supervisor → verdict.
await cut(resolve(GRAB, "01-y900.png"), "graph", { l: 60, t: 430, w: 1320, h: 440 }, 1);

// The four-stage workflow, written in plain English. The single best asset for a
// non-technical room — it explains the whole chain without a word of jargon.
await cut(resolve(GRAB, "03-y2700.png"), "chart", { l: 270, t: 225, w: 900, h: 460 }, 1);

console.log(
  "\n" +
  readdirSync(IMG)
    .filter((f) => f.endsWith(".png"))
    .map((f) => `${f.padEnd(16)} ${(fs.statSync(resolve(IMG, f)).size / 1024).toFixed(0)}KB`)
    .join("\n")
);
