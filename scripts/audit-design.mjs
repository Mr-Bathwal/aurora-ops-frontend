/** Measures every route against the shared token system and reports only what deviates.
 *
 *   node scripts/audit-design.mjs [--w 1440]
 *
 * A contact sheet shows you that two pages look different; it cannot tell you *which* value
 * is off. This reads the live DOM of each route, bins every rendered font, size, colour and
 * radius, and prints the ones that are not in the system — with a sample of the element
 * using them, so each line is directly actionable.
 *
 * The canonical sets below are the tokens in globals.css, which were themselves measured off
 * the reference. Keeping this list in sync with that file is the point: when they disagree,
 * one of them is wrong and the audit is how you find out.
 */

import { existsSync } from "node:fs";
import { chromium } from "playwright-core";

const CHROME = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].find((p) => existsSync(p));

const argv = process.argv.slice(2);
const wIdx = argv.indexOf("--w");
const W = wIdx === -1 ? 1440 : Number(argv[wIdx + 1]);

const ROUTES = ["/", "/agents", "/run", "/orchestrator", "/auto-remediate", "/activity"];
const BASE = "http://localhost:3000";

/** The system. Anything outside these is reported. */
const CANON = {
  fonts: ["Manrope", "Inter", "JetBrains Mono"],
  // px. 10/11/13 are tolerated as micro-labels the scale does not name but the UI needs.
  sizes: [10, 11, 12, 13, 14, 16, 19, 22, 24, 32, 42, 64],
  // Text: primary / muted / faint. Plus pure white and fully transparent (gradient-clipped).
  // The last entry is --primary-foreground (#0c0f14): the page floor used *as text*, which
  // is what a label on a filled gradient button has to be. It is a surface token doing a
  // legitimate second job, not a stray colour.
  text: [
    "rgb(247, 249, 252)", "rgb(172, 181, 196)", "rgb(85, 101, 122)",
    "rgb(255, 255, 255)", "rgba(0, 0, 0, 0)", "rgb(12, 15, 20)",
  ],
  // The blue->mint ramp, plus the two status hues.
  accents: [
    "rgb(62, 156, 255)", "rgb(52, 245, 197)", "rgb(90, 200, 255)", "rgb(123, 217, 255)",
    "rgb(95, 227, 216)", "rgb(67, 217, 168)", "rgb(143, 184, 255)", "rgb(47, 127, 224)",
    "rgb(91, 155, 234)", "rgb(255, 197, 107)", "rgb(255, 107, 129)",
    // The lit panel edge, sampled off the reference at rgb(69,123,177).
    "rgb(92, 172, 224)",
  ],
  // `calc(infinity * 1px)` is what Tailwind's `rounded-full` computes to; it is the pill,
  // not a stray value. 28px is --radius-xl, the big product frame.
  radii: ["0px", "2px", "3px", "4px", "6px", "8px", "12px", "16px", "20px", "28px", "90px", "50%", "100%", "9999px", "3.35544e+07px"],
};

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--hide-scrollbars", "--mute-audio"],
});

const page = await browser.newPage({ viewport: { width: W, height: 1000 }, deviceScaleFactor: 1 });
const LOAD = { waitUntil: "domcontentloaded", timeout: 90_000 };

let totalIssues = 0;

for (const route of ROUTES) {
  await page.goto(BASE + route, LOAD);
  await page.waitForTimeout(700);
  await page.goto(BASE + route, LOAD);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2200);
  // Scroll the page so lazy/in-view sections actually render before measuring.
  await page.evaluate(async () => {
    const step = innerHeight;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 220));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForTimeout(600);

  const found = await page.evaluate((CANON) => {
    const bump = (m, k, sample) => {
      if (!k) return;
      const e = m.get(k) ?? { n: 0, sample };
      e.n++;
      m.set(k, e);
    };
    const fonts = new Map(), sizes = new Map(), text = new Map(), accents = new Map(), radii = new Map();
    const label = (el) =>
      (el.tagName.toLowerCase() + (typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "")).slice(0, 54);

    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const s = getComputedStyle(el);
      const hasText = (el.textContent ?? "").trim() && el.children.length === 0;

      if (hasText) {
        const fam = s.fontFamily.split(",")[0].replace(/["']/g, "").trim();
        if (!CANON.fonts.some((f) => fam.toLowerCase().startsWith(f.toLowerCase()))) bump(fonts, fam, label(el));
        const size = Math.round(parseFloat(s.fontSize));
        if (!CANON.sizes.includes(size)) bump(sizes, size + "px", label(el));
        const c = s.color;
        // `oklab(...)` only ever appears here as Tailwind's alpha modifier applied to a
        // palette colour (`text-brand/70`), so it is on-system by construction — flagging it
        // buries the real findings under noise.
        if (!c.startsWith("oklab") && !CANON.text.includes(c) && !CANON.accents.includes(c)) bump(text, c, label(el));
      }

      // Accent-ish backgrounds and borders: only flag saturated colours, since greys and
      // near-blacks are surfaces, not accents.
      for (const prop of ["backgroundColor", "borderTopColor"]) {
        const v = s[prop];
        const m = /^rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)$/.exec(v);
        if (!m) continue;
        const [rr, gg, bb] = [+m[1], +m[2], +m[3]];
        const a = m[4] === undefined ? 1 : +m[4];
        if (a < 0.5) continue;
        const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
        if (max - min < 45 || max < 90) continue; // grey / dark surface
        const key = `rgb(${rr}, ${gg}, ${bb})`;
        if (!CANON.accents.includes(key)) bump(accents, key + ` [${prop}]`, label(el));
      }

      const rad = s.borderRadius;
      if (rad && rad !== "0px") {
        for (const part of new Set(rad.split(/[\s/]+/))) {
          if (part && !CANON.radii.includes(part) && !part.endsWith("%")) bump(radii, part, label(el));
        }
      }
    }

    const top = (m, n = 6) =>
      [...m.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, n).map(([k, v]) => `${k} ×${v.n}  (${v.sample})`);

    return { fonts: top(fonts), sizes: top(sizes), text: top(text), accents: top(accents), radii: top(radii) };
  }, CANON);

  // A page that failed to compile renders almost nothing and therefore has nothing to flag,
  // which this script would happily report as "clean". That is the most dangerous possible
  // failure mode for an audit, so a page that is too empty to have been measured is a hard
  // error rather than a pass.
  const rendered = await page.evaluate(() => document.querySelectorAll("body *").length);
  if (rendered < 60) {
    console.log(`\n=== ${route} — DID NOT RENDER (${rendered} elements) — audit result meaningless ===`);
    totalIssues += 1;
    continue;
  }

  const n = Object.values(found).reduce((a, b) => a + b.length, 0);
  totalIssues += n;
  console.log(`\n=== ${route} ${n === 0 ? `— clean (${rendered} els)` : `— ${n} deviation group(s)`} ===`);
  for (const [k, v] of Object.entries(found)) {
    if (!v.length) continue;
    console.log(`  ${k}:`);
    for (const line of v) console.log(`    ${line}`);
  }
}

await browser.close();
console.log(`\n${totalIssues === 0 ? "All routes on-system." : `${totalIssues} deviation group(s) total.`}`);
