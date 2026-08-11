/** Pulls exact hero geometry off a page, so "match the reference" is a number rather than
 * an opinion. Run it against the reference and against ours, then diff the two.
 *
 *   node scripts/measure-hero.mjs https://orbitaix.webflow.io
 *   node scripts/measure-hero.mjs http://localhost:3000
 */

import { existsSync } from "node:fs";
import { chromium } from "playwright-core";

const CHROME = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].find((p) => existsSync(p));

const url = process.argv[2] ?? "http://localhost:3000";

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--hide-scrollbars"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90_000 });
await page.waitForTimeout(4000);

const out = await page.evaluate(() => {
  const box = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return {
      text: (el.textContent ?? "").trim().slice(0, 46),
      x: Math.round(r.x), y: Math.round(r.y),
      w: Math.round(r.width), h: Math.round(r.height),
      font: `${Math.round(parseFloat(s.fontSize))}px/${s.fontWeight}`,
      lh: s.lineHeight,
      ls: s.letterSpacing,
      radius: s.borderRadius,
      pad: s.padding,
      color: s.color,
    };
  };

  const h1 = document.querySelector("h1");
  // The paragraph directly after the headline, and the first two buttons/links that look
  // like calls to action — enough to pin the vertical rhythm without hard-coding selectors
  // that only exist on one of the two sites.
  const paras = [...document.querySelectorAll("p")]
    .filter((p) => p.getBoundingClientRect().top > 0 && p.getBoundingClientRect().top < 900 && p.textContent.trim().length > 40);
  const ctas = [...document.querySelectorAll("a, button")]
    .filter((el) => {
      const r = el.getBoundingClientRect();
      return r.height > 34 && r.height < 90 && r.width > 90 && r.top > 200 && r.top < 900;
    })
    .slice(0, 3);
  // The widest image or framed element below the CTAs — the product shot.
  const shot = [...document.querySelectorAll("img, picture, video, canvas, div")]
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter(({ r }) => r.top > 380 && r.top < 900 && r.width > 700)
    .sort((a, b) => b.r.width - a.r.width)[0];

  const nav = document.querySelector("header, nav");

  return {
    viewport: `${innerWidth}x${innerHeight}`,
    nav: box(nav),
    h1: box(h1),
    para: box(paras[0]),
    ctas: ctas.map(box),
    shot: shot ? { ...box(shot.el), tag: shot.el.tagName } : null,
    pageBg: getComputedStyle(document.body).backgroundColor,
  };
});

console.log(`\n===== ${url} =====`);
console.log(JSON.stringify(out, null, 1));
await browser.close();
