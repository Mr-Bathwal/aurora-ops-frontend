/** Captures deck assets by asking the page where things are, rather than guessing coordinates.
 *
 * The first version cropped by hand-measured pixel offsets, and every one of them was slightly
 * wrong — half a robot in one, prompts shoved into a corner in another. Coordinates eyeballed
 * off a screenshot cannot be right, because the thing being measured moves whenever the layout
 * changes.
 *
 * So each asset here names a DOM element instead. The browser reports its real rectangle and
 * Playwright captures exactly that, with a little padding. If the layout changes, the crop
 * follows it. If an element cannot be found, this fails loudly rather than silently writing a
 * picture of the wrong thing.
 */
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const HERE = dirname(fileURLToPath(import.meta.url));
const IMG = resolve(HERE, "img");
const BASE = process.argv[2] ?? "http://localhost:3000";
mkdirSync(IMG, { recursive: true });

const CHROME = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].find((p) => existsSync(p));

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--hide-scrollbars"],
});
// 2x, because these land on a slide up to 12 inches wide and anything captured at 1x is soft.
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const LOAD = { waitUntil: "domcontentloaded", timeout: 90_000 };

/** Each asset names a page and a locator function that runs *in* the browser and returns the
 *  rectangle to capture. Padding is added around it so nothing is cut flush to its own border. */
const ASSETS = [
  {
    name: "console", url: "/run?tab=health", pad: 10,
    // Both cards of the console: the chat rail and the robot with its command boxes.
    find: () => {
      const img = document.querySelector('img[src*="mascot.webp"]');
      const grid = img.closest("div.grid");
      return grid.getBoundingClientRect();
    },
  },
  {
    name: "rail", url: "/run?tab=health", pad: 8,
    // Just the chat rail — the panel you actually type into.
    find: () => {
      const input = document.querySelector('input[aria-label="Command"]');
      let el = input;
      while (el && getComputedStyle(el).borderTopWidth === "0px") el = el.parentElement;
      while (el && el.getBoundingClientRect().height < 300) el = el.parentElement;
      return el.getBoundingClientRect();
    },
  },
  {
    name: "robot", url: "/run?tab=health", pad: 0,
    // The open card: robot, threads, and the command boxes beside it.
    find: () => {
      const img = document.querySelector('img[src*="mascot.webp"]');
      let el = img;
      while (el && el.getBoundingClientRect().width < 700) el = el.parentElement;
      return el.getBoundingClientRect();
    },
  },
  {
    name: "prompts", url: "/run?tab=orchestrator", pad: 46,
    // The example symptoms, and nothing else. They are the point of that tab.
    find: () => {
      const btns = [...document.querySelectorAll("button")].filter((b) =>
        /server doing right now|went wrong last night|running out of space/.test(b.textContent)
      );
      const r = btns.map((b) => b.getBoundingClientRect());
      return {
        x: Math.min(...r.map((b) => b.left)), y: Math.min(...r.map((b) => b.top)),
        width: Math.max(...r.map((b) => b.right)) - Math.min(...r.map((b) => b.left)),
        height: Math.max(...r.map((b) => b.bottom)) - Math.min(...r.map((b) => b.top)),
      };
    },
  },
  {
    name: "chart", url: "/auto-remediate", pad: 0, scrollTo: "Workflow",
    // The four stages, already written in plain English — the best asset for a lay audience.
    find: () => {
      const h = [...document.querySelectorAll("h2, h3")].find((e) => e.textContent.trim() === "Workflow");
      let el = h;
      while (el && getComputedStyle(el).borderTopWidth === "0px") el = el.parentElement;
      return el.getBoundingClientRect();
    },
  },
  {
    name: "graph", url: "/auto-remediate", pad: 0, scrollTo: "Watch the current move through it.",
    // The chain the backend actually walks.
    find: () => {
      const svg = [...document.querySelectorAll("svg")].sort(
        (a, b) => b.getBoundingClientRect().width * b.getBoundingClientRect().height
               - a.getBoundingClientRect().width * a.getBoundingClientRect().height
      )[0];
      return svg.getBoundingClientRect();
    },
  },
  {
    // The one asset worth driving the app for. A trace is the product's whole trust argument,
    // and a screenshot of an empty console cannot make it — so this actually runs the agent
    // and photographs what came back.
    //
    // The trace panel renders ~958px tall, past the fold, so these use a taller page and cap
    // the height: the first few tool calls make the point, and a full-length column would be
    // unreadable at slide scale anyway.
    name: "run", url: "/run?tab=health", pad: 0, runAgent: true, viewport: { width: 1440, height: 1500 },
    find: () => {
      const panels = [...document.querySelectorAll(".panel-deep")];
      const t = panels.find((e) => e.innerText.startsWith("Reasoning trace"));
      const r = panels.find((e) => e.innerText.startsWith("Health report"));
      const a = t.getBoundingClientRect(), b = r.getBoundingClientRect();
      return { x: a.x, y: a.y, width: b.right - a.left, height: Math.min(b.height, 470) };
    },
  },
  {
    name: "trace", url: "/run?tab=health", pad: 0, runAgent: true, viewport: { width: 1440, height: 1500 },
    // The tools it chose, in the order it chose them.
    find: () => {
      const t = [...document.querySelectorAll(".panel-deep")].find((e) => e.innerText.startsWith("Reasoning trace"));
      const r = t.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: Math.min(r.height, 560) };
    },
  },
  {
    name: "report", url: "/run?tab=health", pad: 0, runAgent: true, viewport: { width: 1440, height: 1500 },
    // The verdict: one word, colour-coded, with the reasoning beneath it.
    find: () => {
      const r = [...document.querySelectorAll(".panel-deep")].find((e) => e.innerText.startsWith("Health report"));
      return r.getBoundingClientRect();
    },
  },
  {
    name: "activity", url: "/activity", pad: 10,
    // The record: what ran, when, and how it resolved.
    find: () => {
      const seed = [...document.querySelectorAll("*")].find((e) => /Operational rhythms/.test(e.textContent) && e.children.length);
      let el = seed;
      while (el && el.getBoundingClientRect().width < 1100) el = el.parentElement;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: Math.min(r.height, 330) };
    },
  },
  {
    name: "fleetgrid", url: "/agents", pad: 10,
    // The top row of agent tiles. Walk up from one card until the ancestor holds all three
    // live agents — that ancestor is the grid, whatever classes it happens to carry.
    find: () => {
      const names = ["System Health", "Log Analyzer", "Backup & DR"];
      const seed = [...document.querySelectorAll("h3, h2, div")].find(
        (e) => e.textContent.trim() === names[0]
      );
      let el = seed;
      while (el && !names.every((n) => el.textContent.includes(n))) el = el.parentElement;
      const r = el.getBoundingClientRect();
      // Only the first row: the grid is two rows deep and the second is standby agents.
      return { x: r.x, y: r.y, width: r.width, height: Math.min(r.height, 352) };
    },
  },
];

const measured = {};
for (const a of ASSETS) {
  await page.setViewportSize(a.viewport ?? { width: 1440, height: 900 });
  await page.goto(BASE + a.url, LOAD);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2600);

  if (a.runAgent) {
    // Drive a real run. Groq answers a seven-tool health check in a few seconds, so the wait
    // is generous rather than optimistic — a half-rendered trace is worse than no screenshot.
    await page.getByRole("button", { name: /^Run$/ }).click({ force: true });
    await page.waitForFunction(() => /HEALTHY|WARNING|CRITICAL/.test(document.body.innerText), null, { timeout: 120_000 });
    await page.waitForTimeout(3200);
  }

  if (a.scrollTo) {
    await page.evaluate((needle) => {
      const el = [...document.querySelectorAll("h2, h3")].find((e) => e.textContent.includes(needle));
      if (el) el.scrollIntoView({ block: "center", behavior: "instant" });
    }, a.scrollTo);
    await page.waitForTimeout(1400);
  }

  const box = await page.evaluate(a.find);
  if (!box || box.width < 40 || box.height < 40) throw new Error(`${a.name}: could not locate its element`);

  /* Full-page capture, and the clip converted into page coordinates.
     A viewport-clipped screenshot silently returns only the part of an element that happens to
     be on screen — which is how the chain graph came out with its lower half cut away. */
  const scrollY = await page.evaluate(() => window.scrollY);
  const clip = {
    x: Math.max(0, Math.round(box.x - a.pad)),
    y: Math.max(0, Math.round(box.y + scrollY - a.pad)),
    width: Math.round(box.width + a.pad * 2),
    height: Math.round(box.height + a.pad * 2),
  };
  await page.screenshot({ path: resolve(IMG, a.name + ".png"), clip, fullPage: true, timeout: 180_000 });
  measured[a.name] = +(clip.width / clip.height).toFixed(4);
  console.log(`  ${a.name.padEnd(11)} ${clip.width}x${clip.height} css   aspect ${measured[a.name]}`);
}

await browser.close();

// The deck places images at their true aspect; printing them here means the build script and
// the captures can never quietly disagree about shape.
console.log("\nconst AR = " + JSON.stringify(measured, null, 2).replace(/"/g, "") + ";");
