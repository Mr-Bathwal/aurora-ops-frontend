/** Drives a real Chrome to photograph pages. Two modes, one rig.
 *
 *   study    node scripts/shoot.mjs <url> <outDir>
 *            Scrolls a page top to bottom, saves a frame per screen, and dumps the design
 *            system it measures off the live DOM — type scale, colours, radii, shadows.
 *            Built for reading a reference site precisely instead of guessing from a JPEG.
 *
 *   product  node scripts/shoot.mjs <url> --shot <file.png>
 *            One clean 2x capture of a route with the site chrome hidden, for use as
 *            imagery inside the marketing page. This is where the screenshots in the hero
 *            and feature sections come from — the product is its own art department.
 *
 * Uses the Chrome already installed rather than downloading one, and runs headless on
 * SwiftShader so WebGL still composites. Frames are honest about geometry, colour and text;
 * they say nothing about how fast anything runs on real hardware.
 */

import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { chromium } from "playwright-core";

const CHROME = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].find((p) => existsSync(p));

if (!CHROME) {
  console.error("No Chrome or Edge found.");
  process.exit(1);
}

const argv = process.argv.slice(2);
const url = argv[0] ?? "http://localhost:3000";
const shotIdx = argv.indexOf("--shot");
const productMode = shotIdx !== -1;
const shotPath = productMode ? resolve(argv[shotIdx + 1]) : null;
const outDir = productMode ? null : resolve(argv[1] ?? "screenshots/study");

// Never `networkidle` against `next dev`: it holds an HMR websocket open, so the network is
// never idle and the wait can only time out.
const LOAD = { waitUntil: "domcontentloaded", timeout: 90_000 };

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: [
    // Headless has no GPU and Chrome will not fall back to software WebGL unless told to.
    // Without these the canvas is never created and every frame is just the page colour.
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--hide-scrollbars",
    "--mute-audio",
  ],
});

if (productMode) {
  // 2x, because this image gets displayed at up to ~1100 CSS px, and anything shot at 1x
  // looks soft the moment it lands on a retina screen.
  const page = await browser.newPage({ viewport: { width: 1400, height: 860 }, deviceScaleFactor: 2 });

  await page.goto(url, LOAD);
  await page.waitForTimeout(1200);
  await page.goto(url, LOAD); // warm route — the dev server compiles on first request
  await page.addStyleTag({
    content: `
      nextjs-portal, [data-nextjs-toast] { display: none !important; }
      /* The site's own nav and footer are hidden: this screenshot is displayed *inside* a
         page that already has both, and showing them twice reads as a rendering bug. */
      body > div > header, body > div > footer { display: none !important; }
      main { padding-top: 28px !important; }
    `,
  });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2600); // canvases, chart mounts, entrance transitions

  mkdirSync(dirname(shotPath), { recursive: true });
  await page.screenshot({ path: shotPath });
  console.log(`shot  ${url}  ->  ${shotPath}`);
} else {
  const wIdx = argv.indexOf("--w");
  const W = wIdx === -1 ? 1440 : Number(argv[wIdx + 1]);
  const H = 900;
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await page.goto(url, LOAD);
  await page.waitForTimeout(4000);

  const height = await page.evaluate(() => document.body.scrollHeight);
  console.log(`page height ${height}px  (~${Math.ceil(height / H)} screens)`);

  // Stepped rather than one full-page shot: scroll-triggered reveals stay hidden otherwise,
  // and a lazy-loaded page photographs as a column of blanks.
  const steps = Math.min(Math.ceil(height / H), 14);
  for (let i = 0; i < steps; i++) {
    const y = i * H;
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
    await page.waitForTimeout(1400);
    // Generous: on SwiftShader a wide viewport with a full-bleed photograph, blurred
    // screen-blended layers and a WebGL canvas can take well past the 30s default to
    // rasterise, and the failure looks like a hang rather than a slow frame.
    await page.screenshot({ path: `${outDir}/${String(i).padStart(2, "0")}-y${y}.png`, timeout: 120_000 });
    console.log(`  captured y=${y}`);
  }

  const tokens = await page.evaluate(() => {
    const fonts = new Map(), sizes = new Map(), weights = new Map();
    const colors = new Map(), bgs = new Map(), radii = new Map(), shadows = new Map();
    const bump = (m, k) => k && m.set(k, (m.get(k) ?? 0) + 1);

    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const s = getComputedStyle(el);
      if ((el.textContent ?? "").trim() && el.children.length === 0) {
        bump(fonts, s.fontFamily.split(",")[0].replace(/["']/g, ""));
        bump(sizes, `${Math.round(parseFloat(s.fontSize))}px`);
        bump(weights, s.fontWeight);
        bump(colors, s.color);
      }
      if (s.backgroundColor !== "rgba(0, 0, 0, 0)") bump(bgs, s.backgroundColor);
      if (s.backgroundImage !== "none" && s.backgroundImage.includes("gradient"))
        bump(bgs, s.backgroundImage.slice(0, 110));
      if (s.borderRadius !== "0px") bump(radii, s.borderRadius);
      if (s.boxShadow !== "none") bump(shadows, s.boxShadow.slice(0, 90));
    }

    const top = (m, n = 18) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n)
      .map(([k, v]) => `${String(v).padStart(4)}x  ${k}`);

    return {
      fonts: top(fonts), sizes: top(sizes, 22), weights: top(weights),
      textColors: top(colors), backgrounds: top(bgs, 24), radii: top(radii), shadows: top(shadows, 10),
      headings: [...document.querySelectorAll("h1, h2, h3")].slice(0, 30).map((h) => {
        const s = getComputedStyle(h);
        return `${h.tagName} ${Math.round(parseFloat(s.fontSize))}px/${s.fontWeight} — ${(h.textContent ?? "").trim().slice(0, 70)}`;
      }),
    };
  });

  writeFileSync(`${outDir}/tokens.json`, JSON.stringify(tokens, null, 2));
  console.log("\n=== FONTS ===\n" + tokens.fonts.join("\n"));
  console.log("\n=== TYPE SCALE ===\n" + tokens.sizes.join("\n"));
  console.log("\n=== TEXT COLOURS ===\n" + tokens.textColors.join("\n"));
  console.log("\n=== SURFACES ===\n" + tokens.backgrounds.join("\n"));
  console.log("\n=== RADII ===\n" + tokens.radii.join("\n"));
  console.log("\n=== HEADINGS ===\n" + tokens.headings.join("\n"));
  console.log(`\n${steps} frames -> ${outDir}`);
}

await browser.close();
