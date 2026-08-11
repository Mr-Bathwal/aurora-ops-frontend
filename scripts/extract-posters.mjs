/** Pulls a single still frame out of each stock clip, for use as a card backdrop.
 *
 * The sentinel cards are glass, and glass needs something behind it — the reference shows
 * dark data-centre imagery sitting under each card's frosting. The clips for that already
 * live in `public/media/video/library`, but mounting three <video> elements on the landing
 * page to show three essentially-static blurred backdrops is a lot of decode work for an
 * image. One frame each is the same picture at a fraction of the cost.
 *
 * There is no ffmpeg on this machine, so the extraction runs through the browser that is
 * already here: seek a <video>, draw it to a canvas, read the JPEG back out. The frames are
 * pulled over http from the dev server rather than file:// on purpose — a file:// document
 * and a file:// video are opaque origins to each other, which taints the canvas and makes
 * toDataURL throw SecurityError.
 *
 *   node scripts/extract-posters.mjs [--origin http://localhost:3000]
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright-core";

const CHROME_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];

/** clip -> output name, and the timestamp that has the best frame in it. Mid-clip rather
 * than t=0: these clips open on a fade from black often enough that frame zero is just a
 * dark rectangle. */
const WANTED = [
  { clip: "server-cables-blue.mp4", out: "health", at: 3.2 },
  { clip: "cpu-rack-blue.mp4", out: "log", at: 2.6 },
  { clip: "drive-bay-hands.mp4", out: "backup", at: 2.0 },
];

const WIDTH = 900;
const HEIGHT = 620;

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
}

const origin = arg("origin", "http://localhost:3000");
const outDir = resolve(process.cwd(), "public/media/images/cards");

const exe = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!exe) {
  console.error("No Chrome or Edge found. Looked in:\n  " + CHROME_CANDIDATES.join("\n  "));
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: exe,
  headless: true,
  args: ["--autoplay-policy=no-user-gesture-required", "--mute-audio"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(`${origin}/`, { waitUntil: "domcontentloaded", timeout: 90_000 });

for (const { clip, out, at } of WANTED) {
  const dataUrl = await page.evaluate(
    async ({ src, at, w, h }) => {
      const v = document.createElement("video");
      v.src = src;
      v.muted = true;
      v.crossOrigin = "anonymous";
      v.preload = "auto";

      await new Promise((ok, fail) => {
        v.onloadedmetadata = ok;
        v.onerror = () => fail(new Error(`cannot load ${src}`));
      });

      // Clamp: a clip shorter than the requested timestamp would otherwise seek to the end
      // and sit on whatever the last frame happens to be.
      v.currentTime = Math.min(at, Math.max(0, v.duration - 0.1));
      await new Promise((ok) => (v.onseeked = ok));

      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");

      // Cover, not stretch — these clips are 16:9 and the cards are not.
      const scale = Math.max(w / v.videoWidth, h / v.videoHeight);
      const dw = v.videoWidth * scale;
      const dh = v.videoHeight * scale;
      ctx.drawImage(v, (w - dw) / 2, (h - dh) / 2, dw, dh);

      return c.toDataURL("image/jpeg", 0.74);
    },
    { src: `${origin}/media/video/library/${clip}`, at, w: WIDTH, h: HEIGHT }
  );

  const bytes = Buffer.from(dataUrl.split(",")[1], "base64");
  const file = resolve(outDir, `${out}.jpg`);
  writeFileSync(file, bytes);
  console.log(`  ${clip} @${at}s -> ${out}.jpg  (${(bytes.length / 1024).toFixed(0)} KB)`);
}

await browser.close();
console.log(`\n${WANTED.length} posters -> ${outDir}`);
