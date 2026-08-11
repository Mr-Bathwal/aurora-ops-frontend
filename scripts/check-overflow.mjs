/** Fails if any route scrolls sideways at any common width.
 *
 * Horizontal overflow is the classic cost of full-bleed sections: escaping a padded
 * container with `w-screen` and a translate is the standard trick, and on a page that has a
 * vertical scrollbar `100vw` counts the scrollbar while the body does not — so the layout
 * is a scrollbar-width too wide and the whole page drifts. It is invisible on a trackpad
 * and immediately obvious on a phone, which is a bad combination to ship on.
 */

import { existsSync } from "node:fs";
import { chromium } from "playwright-core";

const CHROME = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].find((p) => existsSync(p));

const BASE = process.argv[2] ?? "http://localhost:3000";
const ROUTES = ["/", "/run", "/orchestrator", "/activity", "/agents", "/auto-remediate"];
const WIDTHS = [390, 768, 1024, 1440, 1920];

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--mute-audio"],
});

let failures = 0;

for (const width of WIDTHS) {
  // Scrollbars deliberately left visible: hiding them is what masks this class of bug.
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await page.waitForTimeout(1400);

    const { scrollW, clientW, culprits } = await page.evaluate(() => {
      const doc = document.documentElement;
      const over = [];
      if (doc.scrollWidth > doc.clientWidth) {
        for (const el of document.querySelectorAll("body *")) {
          const r = el.getBoundingClientRect();
          if (r.right > doc.clientWidth + 1 || r.left < -1) {
            over.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)}`);
            if (over.length >= 4) break;
          }
        }
      }
      return { scrollW: doc.scrollWidth, clientW: doc.clientWidth, culprits: over };
    });

    const bad = scrollW > clientW;
    if (bad) failures++;
    console.log(`${bad ? "FAIL" : "ok  "}  ${String(width).padStart(4)}px  ${route.padEnd(16)} ${scrollW}/${clientW}`);
    for (const c of culprits) console.log(`         ^ ${c}`);
  }
  await page.close();
}

await browser.close();
console.log(failures ? `\n${failures} overflowing combination(s)` : "\nno horizontal overflow anywhere");
process.exit(failures ? 1 : 0);
