/** Capture a scroll-driven section at several scroll positions, to verify motion that only
 * exists as a function of scroll.
 *
 *   node scripts/scroll-shot.mjs <url> <selector> <outDir> [--w 1600] [--n 5]
 *
 * Uses viewport-mode clips, never fullPage — a fullPage shot resizes the viewport, which both
 * re-measures the section and restarts any entrance animation.
 */
import { existsSync, mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
].find((p) => existsSync(p));
if (!CHROME) throw new Error("Chrome not found");

const url = process.argv[2];
const sel = process.argv[3];
const outDir = process.argv[4];
const arg = (n, d) => {
  const i = process.argv.indexOf(n);
  return i === -1 ? d : process.argv[i + 1];
};
const W = Number(arg("--w", 1600));
const N = Number(arg("--n", 5));
const H = 950;

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--hide-scrollbars", "--mute-audio"],
});
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.addStyleTag({ content: "nextjs-portal,[data-nextjs-toast]{display:none!important}" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(4000);

const top = await page.evaluate((s) => {
  const el = document.querySelector(s);
  if (!el) return null;
  return el.getBoundingClientRect().top + window.scrollY;
}, sel);
if (top === null) throw new Error(`selector matched nothing: ${sel}`);

for (let i = 0; i < N; i++) {
  const p = N === 1 ? 0.5 : i / (N - 1);
  // Walk the section from just entering the viewport to just leaving it.
  // --start/--span are multiples of viewport height, measured from the section's top. The
  // default walks it right through; narrow the span to keep it fully framed while the
  // scroll-driven values still change.
  const START = Number(arg("--start", -0.75));
  const SPAN = Number(arg("--span", 1.2));
  await page.evaluate((y) => window.scrollTo(0, Math.max(0, y)), top + H * START + p * H * SPAN);
  await page.waitForTimeout(1100);
  const box = await page.locator(sel).first().boundingBox();
  if (!box) continue;
  const y = Math.max(0, box.y);
  const h = Math.min(box.height, H - y);
  if (h < 80) { console.log(`p=${p.toFixed(2)} off-screen`); continue; }
  await page.screenshot({ path: `${outDir}/s${i}.png`, clip: { x: box.x, y, width: box.width, height: h } });
  console.log(`p=${p.toFixed(2)} -> ${outDir}/s${i}.png`);
}
await browser.close();
