/** Screenshots a route with the activity store pre-seeded, so dashboard panels can be
 * reviewed with data in them. Seeding happens in an init script (before the app boots) so
 * zustand's persist rehydrates from it rather than racing it.
 *
 *   node scripts/seed-shot.mjs <url> <out.png> [--w 1600] [--hover <sel>] [--clip <sel>]
 *
 * --hover moves the real cursor over a selector before shooting, which is the only way to
 * capture a :hover / :focus-within state. --clip crops to a selector's box (plus a margin,
 * since a drawer tilting out of the rack paints outside its own bounds).
 *
 * WARNING — recharts and fullPage do not mix. Omitting --clip takes a fullPage shot, which
 * resizes the viewport; ResponsiveContainer re-measures, recharts restarts its entrance
 * animation from zero, and the series is captured before it has drawn. The axes and grid
 * still render, so the result looks convincingly like a chart with no data in it. Twice now
 * that has been mistaken for a bug. To check a chart, always --clip it.
 */
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { chromium } from "playwright-core";

// Forward slashes: backslashes in a JS string literal eat the following character
// ("\P" is just "P"), which silently produced an unresolvable path here.
const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
].find((p) => existsSync(p));
if (!CHROME) throw new Error("Chrome not found at either Program Files location");

const url = process.argv[2];
const out = resolve(process.argv[3]);
const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i === -1 ? fallback : process.argv[i + 1];
};
const W = Number(arg("--w", 1600));
const hoverSel = arg("--hover", null);
const clipSel = arg("--clip", null);
const N = Number(arg("--n", 34)); // how many runs to seed

const AGENTS = ["health", "log", "backup", "orchestrator", "auto"];
const SEV = ["ok", "ok", "ok", "warn", "warn", "crit"];
const ACTIONS = { health: "cpu · memory · disk", log: "read_log_file", backup: "create_backup → check_dr", orchestrator: "routed → System Health", auto: "diagnose → remediate → verify" };
const LABELS = { ok: "Healthy", warn: "Advisory", crit: "Critical" };
const REPORTS = {
  health: "CPU load steady at 34% across all four cores. Memory at 61% of 32 GB with no swap pressure. Root volume at 78% — trending up roughly 2% per week, worth watching but not yet actionable.",
  log: "Scanned 41,203 lines from /var/log/syslog over the last 24 hours. 12 warnings, all originating from the same NTP client retry loop. No errors, no authentication failures.",
  backup: "Snapshot completed in 4m 12s, 218 GB written to the offsite target. Checksum verified against the source. Last successful DR restore drill was 6 days ago.",
  orchestrator: "Request classified as an infrastructure health question with high confidence and routed to System Health. No fallback or clarification round was needed.",
  auto: "Diagnosed a runaway log writer holding the root volume. Rotated and compressed the offending files, reclaiming 11 GB, then re-ran the health check to confirm the volume dropped back under threshold.",
};

const entries = [];
let seed = 7;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
for (let i = 0; i < N; i++) {
  const a = AGENTS[Math.floor(rnd() * AGENTS.length)];
  const s = SEV[Math.floor(rnd() * SEV.length)];
  // Spread across the full 14-day window and the whole clock, so six-hour bucketing
  // has something to show rather than one blob in the middle of the range.
  const d = new Date(Date.now() - Math.floor(rnd() * 14) * 864e5 - Math.floor(rnd() * 24) * 36e5 - Math.floor(rnd() * 60) * 6e4);
  entries.push({ id: `seed-${i}`, timestamp: d.toISOString(), operator: "Gourav B.", agentKey: a, action: ACTIONS[a], severity: s, outcomeLabel: LABELS[s], report: REPORTS[a] });
}
entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

const browser = await chromium.launch({ executablePath: CHROME, headless: true, // No --hide-scrollbars: the rack styles its own scrollbar, and hiding them makes that
// impossible to verify. Overlay scrollbars mean this does not shift layout.
args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--mute-audio"] });
const page = await browser.newPage({ viewport: { width: W, height: 1000 }, deviceScaleFactor: 1 });
await page.addInitScript((payload) => {
  localStorage.setItem("aurora-ops-activity", JSON.stringify({ state: { entries: payload }, version: 0 }));
}, entries);
const LOAD = { waitUntil: "domcontentloaded", timeout: 90000 };
await page.goto(url, LOAD); await page.waitForTimeout(900); await page.goto(url, LOAD);
await page.addStyleTag({ content: "nextjs-portal,[data-nextjs-toast]{display:none!important}" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(5200);

if (hoverSel) {
  await page.locator(hoverSel).first().hover();
  // Long enough for the 300ms transform/grid-rows transitions to settle.
  await page.waitForTimeout(900);
}

// Overlay scrollbars (what headless Chrome uses) only paint while a scroll is in flight, so
// styling them is otherwise impossible to verify from a screenshot. This has to be the last
// thing before the shutter — hovering scrolls the target into view and would cancel it.
const scrollSel = arg("--scroll", null);
if (scrollSel) {
  await page.locator(scrollSel).first().evaluate((el) => { el.scrollTop = 140; });
}

let clip;
if (clipSel) {
  const box = await page.locator(clipSel).first().boundingBox();
  if (!box) throw new Error(`--clip selector matched nothing: ${clipSel}`);
  const M = 40; // the pulled-out drawer paints outside the list's own box
  clip = {
    x: Math.max(0, box.x - M),
    y: Math.max(0, box.y - M),
    width: Math.min(W, box.width + M * 2),
    height: box.height + M * 2,
  };
}

mkdirSync(dirname(out), { recursive: true });
// fullPage and clip are mutually exclusive in playwright; clip implies viewport-space coords.
await page.screenshot({ path: out, ...(clip ? { clip } : { fullPage: true }), timeout: 120000 });
console.log(`seeded ${entries.length} entries -> ${out}${hoverSel ? ` (hovering ${hoverSel})` : ""}`);
await browser.close();
