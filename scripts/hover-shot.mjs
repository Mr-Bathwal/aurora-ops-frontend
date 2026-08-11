/** Hovers an element and screenshots the result, so hover-only states (which the plain
 * product shot can never show) can be reviewed the same way as everything else.
 *
 *   node scripts/hover-shot.mjs <url> <selector> <out.png> [--w 1440]
 */

import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { chromium } from "playwright-core";

const CHROME = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].find((p) => existsSync(p));

const argv = process.argv.slice(2);
const url = argv[0];
const selector = argv[1];
const out = resolve(argv[2]);
const wIdx = argv.indexOf("--w");
const W = wIdx === -1 ? 1440 : Number(argv[wIdx + 1]);

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--hide-scrollbars", "--mute-audio"],
});
const page = await browser.newPage({ viewport: { width: W, height: 1000 }, deviceScaleFactor: 1 });
const LOAD = { waitUntil: "domcontentloaded", timeout: 90_000 };
await page.goto(url, LOAD);
await page.waitForTimeout(1000);
await page.goto(url, LOAD);
await page.addStyleTag({ content: "nextjs-portal,[data-nextjs-toast]{display:none!important}" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1800);

const el = page.locator(selector).first();
await el.scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await el.hover();
await page.waitForTimeout(900); // let the flow animation + shadows settle

// Frame the scene, not the whole page.
const scene = page.locator(".orchestration-scene").first();
const box = (await scene.count()) ? await scene.boundingBox() : null;

mkdirSync(dirname(out), { recursive: true });
if (box) {
  await page.screenshot({ path: out, clip: { x: box.x, y: Math.max(0, box.y), width: box.width, height: box.height } });
} else {
  await page.screenshot({ path: out });
}
console.log(`hovered ${selector} -> ${out}`);
await browser.close();
