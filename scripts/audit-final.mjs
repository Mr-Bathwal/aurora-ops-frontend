/** Pre-presentation sweep: every route, two widths, one pass.
 *
 * Collects the things that are embarrassing in a demo and invisible in development — console
 * errors, failed requests, sideways scroll, images served at the wrong size, and text that has
 * dropped below a readable size — then photographs each route so the frames can be reviewed
 * next to the numbers. Numbers and pictures catch different things.
 */
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { chromium } from "playwright-core";

const CHROME = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].find((p) => existsSync(p));

const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = "screenshots/final";
const ROUTES = [
  "/",
  "/run",
  "/run?tab=orchestrator",
  "/auto-remediate",
  "/activity",
  "/agents",
  "/hosts",
  "/login",
];
const WIDTHS = [
  { w: 1440, h: 900, tag: "desktop" },
  { w: 390, h: 844, tag: "mobile" },
];
const LOAD = { waitUntil: "domcontentloaded", timeout: 90_000 };

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--hide-scrollbars", "--mute-audio"],
});

let problems = 0;

for (const { w, h, tag } of WIDTHS) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });

  for (const route of ROUTES) {
    const errs = [];
    const bad = [];
    const onErr = (m) => m.type() === "error" && errs.push(m.text().slice(0, 120));
    const onFail = (r) => bad.push(`${r.request().method()} ${r.status()} ${r.url().slice(0, 90)}`);
    page.on("console", onErr);
    page.on("response", (r) => r.status() >= 400 && onFail(r));

    // Twice: the dev server compiles on first request, and a half-compiled page reports
    // failures that do not exist in a built app.
    await page.goto(BASE + route, LOAD);
    await page.waitForTimeout(900);
    errs.length = 0;
    bad.length = 0;
    await page.goto(BASE + route, LOAD);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(2600);

    const m = await page.evaluate(() => {
      const de = document.documentElement;
      // Raster served far larger than it renders — the classic demo-day payload mistake.
      const oversized = [...document.images]
        .filter((i) => i.naturalWidth && i.getBoundingClientRect().width)
        .filter((i) => i.naturalWidth > i.getBoundingClientRect().width * window.devicePixelRatio * 2.1)
        .map((i) => `${i.currentSrc.split("/").pop().slice(0, 40)} ${i.naturalWidth}px natural / ${Math.round(i.getBoundingClientRect().width)}px shown`);

      // Anything below 11px is unreadable on a projector.
      const tiny = new Set();
      for (const el of document.querySelectorAll("body *")) {
        if (el.children.length || !(el.textContent ?? "").trim()) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        const s = parseFloat(getComputedStyle(el).fontSize);
        if (s < 10.5) tiny.add(`${s}px "${el.textContent.trim().slice(0, 28)}"`);
      }

      // Placeholder copy that should never reach a demo.
      const body = document.body.innerText;
      const lorem = /lorem ipsum|TODO|FIXME|placeholder text|undefined|\bNaN\b/i.exec(body);

      return {
        overflow: de.scrollWidth - de.clientWidth,
        height: de.scrollHeight,
        oversized,
        tiny: [...tiny].slice(0, 6),
        lorem: lorem ? lorem[0] : null,
      };
    });

    const flags = [];
    if (errs.length) flags.push(`${errs.length} console error(s)`);
    if (bad.length) flags.push(`${bad.length} failed request(s)`);
    if (m.overflow > 0) flags.push(`overflow ${m.overflow}px`);
    if (m.oversized.length) flags.push(`${m.oversized.length} oversized image(s)`);
    if (m.tiny.length) flags.push(`${m.tiny.length} sub-10.5px text run(s)`);
    if (m.lorem) flags.push(`placeholder copy: ${m.lorem}`);
    if (flags.length) problems++;

    const name = route === "/" ? "home" : route.replace(/[/?=]/g, "-").replace(/^-+/, "");
    await page.screenshot({ path: `${OUT}/${tag}-${name}.png`, fullPage: true, timeout: 120_000 });

    console.log(`${tag.padEnd(7)} ${route.padEnd(26)} ${String(m.height).padStart(5)}px  ${flags.length ? "⚠ " + flags.join(", ") : "ok"}`);
    for (const e of errs.slice(0, 3)) console.log(`          error: ${e}`);
    for (const b of bad.slice(0, 3)) console.log(`          failed: ${b}`);
    for (const o of m.oversized.slice(0, 3)) console.log(`          image: ${o}`);
    for (const t of m.tiny.slice(0, 4)) console.log(`          tiny: ${t}`);

    page.removeListener("console", onErr);
  }
  await page.close();
}

console.log(`\n${problems === 0 ? "clean" : problems + " route/width combinations flagged"}`);
await browser.close();
