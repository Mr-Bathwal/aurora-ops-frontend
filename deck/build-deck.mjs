/** Builds the Aurora Ops deck: EY's visual language, every slide, no exceptions.
 *
 * One ground throughout — EY charcoal #2E2E38 — with a single saturated yellow spent sparingly
 * and everything else white and grey. The earlier version alternated white and dark slides,
 * which read as two decks stapled together. Yellow marks exactly one thing per slide and never
 * decorates; that restraint is what makes the palette read as EY rather than as "yellow".
 *
 * The charcoal ground is also doing practical work. The product itself is near-black, so its
 * screenshots sit directly on the slide with only a hairline — on a white deck each one would
 * have been a dark rectangle punched into the page.
 *
 * Written for a non-technical room. Every headline is a plain-English claim; the machinery is
 * demoted to a small "under the hood" line so a technical questioner still finds the real names
 * without the rest of the audience having to read them.
 *
 * Typeface is Arial, EY's own sanctioned fallback for EY Interstate. A brand font we do not
 * ship would fall back silently and differently on every machine; choosing the fallback means
 * the deck looks the same wherever it opens.
 */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const pptxgen = require("pptxgenjs");
const HERE = dirname(fileURLToPath(import.meta.url));

const C = {
  yellow:   "FFE600",
  ground:   "2E2E38",   // EY charcoal — the only slide background in the deck
  raised:   "3A3A46",   // cards
  raised2:  "45454F",
  line:     "50505C",
  white:    "FFFFFF",
  body:     "C4C4CD",
  muted:    "8B8B98",
  good:     "5FD08A",
  bad:      "FF8A8A",
};

const F = { head: "Arial", body: "Arial" };

/** Printed by prep-shots.mjs from the real captures, so the deck and the images can never
 *  quietly disagree about shape. Never hand-edit these. */
const AR = {
  console: 3.3429,
  rail: 0.9519,
  robot: 2.46,
  prompts: 1.4304,
  chart: 1.9608,
  graph: 1.8176,
  fleetgrid: 3.7742,
};
const img = (n) => ({ data: "image/png;base64," + readFileSync(resolve(HERE, "img", n + ".png")).toString("base64") });

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.author = "Gourav Kumar Bathwal";
pres.company = "Aurora Ops";
pres.title = "Aurora Ops — Agentic IT Operations";

/* ── furniture ──────────────────────────────────────────────────────────────────────────── */

function slide(eyebrow, title, opts = {}) {
  const s = pres.addSlide();
  s.background = { color: C.ground };
  s.addShape(pres.ShapeType.rect, { x: 0.62, y: 0.44, w: 0.46, h: 0.09, fill: { color: C.yellow }, line: { width: 0 } });
  s.addText(eyebrow.toUpperCase(), {
    x: 0.62, y: 0.62, w: 9, h: 0.26, margin: 0,
    fontFace: F.body, fontSize: 10.5, bold: true, color: C.yellow, charSpacing: 2.2,
  });
  s.addText(title, {
    x: 0.6, y: 0.92, w: opts.titleW ?? 11.8, h: opts.titleH ?? 0.8, margin: 0,
    fontFace: F.head, fontSize: opts.titleSize ?? 30, bold: true, color: C.white,
  });
  return s;
}

function card(s, { x, y, w, h, accent = false, fill = C.raised }) {
  s.addShape(pres.ShapeType.rect, { x, y, w, h, fill: { color: fill }, line: { color: C.line, width: 1 } });
  if (accent) s.addShape(pres.ShapeType.rect, { x, y, w: 0.06, h, fill: { color: C.yellow }, line: { width: 0 } });
}

function body(s, text, { x, y, w, h = 0.8, size = 13, color = C.body, bold = false }) {
  s.addText(text, { x, y, w, h, margin: 0, fontFace: F.body, fontSize: size, bold, color, lineSpacing: size * 1.55 });
}

function h3(s, text, { x, y, w = 4, size = 15, color = C.white }) {
  s.addText(text, { x, y, w, h: 0.32, margin: 0, fontFace: F.head, fontSize: size, bold: true, color });
}

/** A screenshot in an EY mount, and the height it consumes.
 *
 * The product is near-black, so a screenshot dropped straight onto the charcoal ground reads
 * as a hole punched in the slide — which is exactly why the branding felt thin wherever a
 * picture appeared. The mount fixes it: a raised panel, the yellow rule across its head, and a
 * caption strip underneath. The picture then reads as a deliberately framed exhibit, and the
 * yellow re-enters every slide that has one.
 *
 * Returns total height so callers lay out beneath it from a real number rather than a guess.
 */
const FIG_INSET = 0.16, FIG_RULE = 0.055, FIG_CAP = 0.4;

function figure(s, name, { x, y, w, label }) {
  const imgW = w - FIG_INSET * 2;
  const imgH = imgW / AR[name];
  // A long label wraps to two lines; the strip has to grow or it crowds the picture.
  const capH = label ? (label.length > 38 ? FIG_CAP + 0.2 : FIG_CAP) : 0;
  const h = FIG_RULE + FIG_INSET * 2 + imgH + capH;

  s.addShape(pres.ShapeType.rect, { x, y, w, h, fill: { color: C.raised }, line: { color: C.line, width: 1 } });
  s.addShape(pres.ShapeType.rect, { x, y, w, h: FIG_RULE, fill: { color: C.yellow }, line: { width: 0 } });

  const iy = y + FIG_RULE + FIG_INSET;
  s.addImage({ ...img(name), x: x + FIG_INSET, y: iy, w: imgW, h: imgH });

  if (label) {
    s.addText(label.toUpperCase(), {
      x: x + FIG_INSET, y: iy + imgH + 0.06, w: imgW, h: 0.26, margin: 0,
      fontFace: F.body, fontSize: 9, bold: true, color: C.muted, charSpacing: 1.5,
    });
  }
  return h;
}

/** The demoted technical line. Present for the one person in the room who wants it. */
function underHood(s, text, { x, y, w = 11.9 }) {
  s.addText("UNDER THE HOOD", {
    x, y, w: 1.66, h: 0.22, margin: 0, fontFace: F.body, fontSize: 8.5, bold: true, color: C.yellow, charSpacing: 1.6,
  });
  s.addText(text, {
    x: x + 1.72, y, w: w - 1.72, h: 0.34, margin: 0, fontFace: F.body, fontSize: 10, color: C.muted, lineSpacing: 13,
  });
}

function stat(s, value, label, { x, y, w = 3.4, accent = false }) {
  s.addText(value, {
    x, y, w, h: 0.72, margin: 0, fontFace: F.head, fontSize: 40, bold: true,
    color: accent ? C.yellow : C.white,
  });
  s.addText(label, { x, y: y + 0.74, w, h: 0.6, margin: 0, fontFace: F.body, fontSize: 11.5, color: C.body, lineSpacing: 15 });
}

const hdr = (t) => ({ text: t, options: { bold: true, color: C.ground, fill: { color: C.yellow }, fontSize: 10.5, charSpacing: 1 } });

function table(s, rows, { x, y, w, colW, fontSize = 11 }) {
  s.addTable(rows, {
    x, y, w, colW, fontFace: F.body, fontSize, color: C.body,
    border: { type: "solid", color: C.line, pt: 1 },
    fill: { color: C.raised },
    margin: [7, 10, 7, 10], valign: "top",
  });
}

/* ═════════════ 1 · TITLE ═════════════ */
{
  const s = pres.addSlide();
  s.background = { color: C.ground };
  s.addShape(pres.ShapeType.rect, { x: 10.3, y: -1.4, w: 1.6, h: 6.4, fill: { color: C.yellow }, line: { width: 0 }, rotate: 28 });
  s.addShape(pres.ShapeType.rect, { x: 12.1, y: -0.5, w: 0.44, h: 6.4, fill: { color: C.yellow }, line: { width: 0 }, rotate: 28 });

  s.addText("AURORA OPS", {
    x: 0.75, y: 2.3, w: 8, h: 0.34, margin: 0, fontFace: F.body, fontSize: 13, bold: true, color: C.yellow, charSpacing: 4,
  });
  s.addText("The IT engineer\nthat never sleeps", {
    x: 0.72, y: 2.76, w: 9, h: 1.6, margin: 0, fontFace: F.head, fontSize: 44, bold: true, color: C.white, lineSpacing: 50,
  });
  s.addText(
    "Alarms have told us something is broken for thirty years. Working out what it means, " +
    "fixing it, and checking the fix held is still a person — awake at 3am.",
    { x: 0.75, y: 4.5, w: 8.6, h: 0.9, margin: 0, fontFace: F.body, fontSize: 14.5, color: C.body, lineSpacing: 22 }
  );
  s.addShape(pres.ShapeType.rect, { x: 0.75, y: 5.66, w: 3.4, h: 0.035, fill: { color: C.yellow }, line: { width: 0 } });
  s.addText("Gourav Kumar Bathwal", {
    x: 0.75, y: 5.86, w: 6, h: 0.3, margin: 0, fontFace: F.body, fontSize: 13, bold: true, color: C.white,
  });
  s.addNotes("Open plainly. Do not say 'agentic' in the first minute — say what it does at 3am.");
}

/* ═════════════ 2 · THE STORY ═════════════ */
{
  const s = slide("The problem", "It is 3am. Something just broke.");

  const steps = [
    ["03:00", "An alarm goes off", "“Disk is 94% full on the main server.”", true],
    ["03:04", "Someone wakes up and logs in", "They start typing commands, one at a time, looking for what changed.", false],
    ["03:18", "They work out what happened", "A log file grew without limit because a clean-up job quietly stopped running.", false],
    ["03:26", "They fix it and check it held", "Take a backup first, clear the files, restart the job, run the check again.", false],
  ];
  steps.forEach(([t, head, desc, first], i) => {
    const y = 1.96 + i * 1.16;
    card(s, { x: 0.62, y, w: 11.9, h: 1.0, accent: first });
    s.addText(t, {
      x: 0.95, y: y + 0.32, w: 1.1, h: 0.36, margin: 0,
      fontFace: F.head, fontSize: 16, bold: true, color: first ? C.yellow : C.muted,
    });
    h3(s, head, { x: 2.2, y: y + 0.2, w: 4.2, size: 14.5 });
    body(s, desc, { x: 2.2, y: y + 0.54, w: 9.9, h: 0.34, size: 11.5 });
  });

  s.addText("Waking them up was automated in the 1990s. Everything after that is still a person typing.", {
    x: 0.62, y: 6.68, w: 11.9, h: 0.4, margin: 0, fontFace: F.head, fontSize: 15, bold: true, color: C.yellow,
  });

  s.addNotes("Everyone in the room recognises this, technical or not. Let it land before moving on.");
}

/* ═════════════ 3 · THREE PROBLEMS ═════════════ */
{
  const s = slide("The problem", "Three different problems get called one problem");

  const items = [
    ["Noticing", "“Something is wrong.”", "Solved. Thousands of tools do this. It is a commodity.", false],
    ["Understanding", "“Why is it wrong?”", "Still a person. Expensive, slow, and the senior engineer is the only one who is fast at it.", true],
    ["Fixing", "“Make it not wrong.”", "Still a person. Almost nobody has automated this safely.", true],
  ];
  items.forEach(([t, q, state, ours], i) => {
    const x = 0.62 + i * 4.02;
    card(s, { x, y: 1.96, w: 3.72, h: 2.6, accent: ours });
    h3(s, t, { x: x + 0.32, y: 2.26, w: 3, size: 19 });
    s.addText(q, {
      x: x + 0.32, y: 2.68, w: 3.1, h: 0.34, margin: 0, fontFace: F.body, fontSize: 13, italic: true, color: C.white,
    });
    body(s, state, { x: x + 0.32, y: 3.1, w: 3.1, h: 1.1, size: 11.5 });
    s.addText(ours ? "WE DO THIS" : "NOT OUR FIGHT", {
      x: x + 0.32, y: 4.16, w: 3, h: 0.26, margin: 0,
      fontFace: F.body, fontSize: 9.5, bold: true, color: ours ? C.yellow : C.muted, charSpacing: 1.6,
    });
  });

  card(s, { x: 0.62, y: 4.86, w: 11.9, h: 1.72, accent: true });
  h3(s, "Why the distinction decides everything", { x: 0.98, y: 5.12, w: 9 });
  body(s,
    "Called “monitoring”, this competes with Datadog and loses on day one. Called “what happens after the " +
    "alarm”, it enters a market roughly two years old, where most products still stop at telling you the answer " +
    "rather than doing anything about it.",
    { x: 0.98, y: 5.5, w: 11.2, h: 0.9, size: 12.5 });

  s.addNotes("The room will try to collapse these three into 'IT is slow'. Keep them apart — the pitch lives here.");
}

/* ═════════════ 4 · TOO MUCH INFORMATION ═════════════ */
{
  const s = slide("Why now", "We did not have too little information.\nWe had far too much.", { titleH: 1.24, titleSize: 30 });

  body(s,
    "For twenty years the answer to “we cannot see what is happening” was to add more monitoring. It worked, and " +
    "then it went too far. People stopped being able to listen.",
    { x: 0.62, y: 2.4, w: 11.9, h: 0.6, size: 14 });

  stat(s, "44%", "of companies had an outage last year caused by\nan alarm somebody had already switched off", { x: 0.62, y: 3.36, w: 3.7, accent: true });
  stat(s, "10,000", "alarms a day reaching a typical\noperations team", { x: 4.72, y: 3.36, w: 3.7 });
  stat(s, "1 in 20", "of those alarms actually needs\na human being", { x: 8.82, y: 3.36, w: 3.7 });

  card(s, { x: 0.62, y: 5.32, w: 11.9, h: 1.34, accent: true });
  body(s,
    "Read the first number again. The outage was not caused by nobody knowing. It was caused by somebody having " +
    "been told so many times that they had stopped looking. Another dashboard makes that worse, not better.",
    { x: 0.98, y: 5.58, w: 11.2, h: 0.8, size: 13.5, color: C.white });

  s.addText("2026 State of Production Reliability report · 1,039 practitioners surveyed", {
    x: 0.62, y: 6.86, w: 9, h: 0.24, margin: 0, fontFace: F.body, fontSize: 9, color: C.muted,
  });

  s.addNotes("Strongest slide in the deck. Pause after 44%.");
}

/* ═════════════ 5 · WHAT WE BUILT ═════════════ */
{
  const s = slide("The solution", "So we gave the judgement to an assistant");

  body(s,
    "You describe the problem the way you would to a colleague. It works out which checks to run, runs them on " +
    "the real machine, and tells you what it found in plain language — showing every step it took.",
    { x: 0.62, y: 1.82, w: 11.9, h: 0.5, size: 14, color: C.white });

  // The three beats sit above the picture as one line, so the screenshot owns the slide.
  [
    ["You ask", "in your own words"],
    ["It decides", "which checks matter, and what next"],
    ["It reports", "in plain language, with a clear verdict"],
  ].forEach(([t, d], i) => {
    const x = 0.62 + i * 4.02;
    s.addText(
      [{ text: t + " ", options: { bold: true, color: C.yellow } }, { text: d, options: { color: C.body } }],
      { x, y: 2.46, w: 3.9, h: 0.34, margin: 0, fontFace: F.body, fontSize: 12 }
    );
  });

  figure(s, "console", { x: 1.37, y: 2.96, w: 10.6, label: "The console — talk on the left, watch on the right" });

  underHood(s, "Three ReAct agents on Groq (llama-3.3-70b, temperature 0). 33 Python tools reading the host directly.", { x: 0.62, y: 6.9 });

  s.addNotes("This is the live product against a running backend, not a mock-up.");
}

/* ═════════════ 6 · THE SPECIALISTS ═════════════ */
{
  const s = slide("The fleet", "Three specialists, not one know-it-all");

  body(s,
    "Each one has its own narrow set of abilities and nothing else. That is a safety decision as much as an " +
    "organisational one — the log reader physically cannot delete a backup, because it was never given the ability.",
    { x: 0.62, y: 1.86, w: 11.9, h: 0.6, size: 13.5 });

  // The tiles already name each agent and what it does, so repeating that in cards below would
  // be the same information twice. What the picture cannot say is the safety point — so that
  // gets the space instead.
  const figH = figure(s, "fleetgrid", { x: 0.62, y: 2.56, w: 11.9, label: "The live fleet" });

  const y = 2.56 + figH + 0.16;
  [
    ["Looks only", "System Health and Log Analyzer", "can read everything and change nothing"],
    ["Can act", "Backup & DR", "the only one able to alter anything — and only backups"],
  ].forEach(([tag, who, what], i) => {
    const x = 0.62 + i * 6.06;
    card(s, { x, y, w: 5.84, h: 0.92, accent: i === 1 });
    s.addText(tag.toUpperCase(), {
      x: x + 0.32, y: y + 0.18, w: 2.4, h: 0.24, margin: 0,
      fontFace: F.body, fontSize: 9.5, bold: true, color: i === 1 ? C.yellow : C.muted, charSpacing: 1.5,
    });
    s.addText(
      [{ text: who + " — ", options: { bold: true, color: C.white } }, { text: what, options: { color: C.body } }],
      { x: x + 0.32, y: y + 0.44, w: 5.2, h: 0.4, margin: 0, fontFace: F.body, fontSize: 11, lineSpacing: 15 }
    );
  });

  s.addNotes("Say the safety line out loud: two of the three cannot change anything at all. That is deliberate.");
}

/* ═════════════ 7 · ASK IN PLAIN ENGLISH ═════════════ */
{
  const s = slide("Orchestrator", "You should not have to know who to ask");

  body(s,
    "Nobody calling a help desk knows whether their problem belongs to the storage team or the network team. " +
    "So you describe the symptom, and it works out which specialist owns it.",
    { x: 0.62, y: 1.86, w: 6.4, h: 0.9, size: 13.5 });

  card(s, { x: 0.62, y: 2.94, w: 6.4, h: 1.72, accent: true });
  h3(s, "Nothing you type names an agent", { x: 0.98, y: 3.16, w: 5.6, size: 15 });
  body(s,
    "You say what is wrong. It works out who owns it. If nothing fits, it says so plainly — a system with no " +
    "way to answer “I don't know” will always guess instead.",
    { x: 0.98, y: 3.54, w: 5.7, h: 0.9, size: 12 });

  const three = [
    ["Sounds like", "a health question"],
    ["Sounds like", "a logs question"],
    ["Sounds like", "a storage question"],
  ];
  three.forEach(([a, b], i) => {
    const y = 4.86 + i * 0.66;
    s.addShape(pres.ShapeType.rect, { x: 0.62, y, w: 0.05, h: 0.5, fill: { color: C.yellow }, line: { width: 0 } });
    s.addText(
      [{ text: a + " ", options: { color: C.muted } }, { text: b, options: { bold: true, color: C.white } }],
      { x: 0.94, y: y + 0.06, w: 5.6, h: 0.34, margin: 0, fontFace: F.body, fontSize: 12.5 }
    );
  });

  figure(s, "prompts", { x: 7.3, y: 1.9, w: 5.22, label: "What people actually type" });

  underHood(s, "One model call classifies the request into one of four routes, then a state machine hands it to that agent.", { x: 0.62, y: 6.9 });

  s.addNotes("The 'no match' branch is worth a sentence — it is a design decision, not a gap.");
}

/* ═════════════ 8 · IT FIXES, THEN CHECKS ═════════════ */
{
  const s = slide("Auto-remediation", "It does not just tell you. It fixes — then checks it worked.");

  body(s,
    "This is the part almost nobody else does. Most tools in this space stop at the diagnosis and hand you back " +
    "the problem. Ours takes the next step, on the one kind of problem where the next step is safe to take.",
    { x: 0.62, y: 1.9, w: 6.5, h: 0.9, size: 13.5 });

  figure(s, "chart", { x: 0.62, y: 2.96, w: 6.5, label: "The chain, as the operator sees it" });

  const stages = [
    ["Read the evidence", "The log reader goes through the machine's records and writes down what it found."],
    ["Decide if action is needed", "If nothing needs fixing, it skips straight to the end rather than doing something for the sake of it."],
    ["Act", "Take the backup, verify it is intact, report the recovery position."],
    ["Check the work", "A supervisor reads everything back and states plainly whether the issue is actually resolved."],
  ];
  stages.forEach(([t, d], i) => {
    const y = 1.96 + i * 1.22;
    s.addText(String(i + 1), {
      x: 7.5, y, w: 0.5, h: 0.4, margin: 0, fontFace: F.head, fontSize: 20, bold: true, color: C.yellow,
    });
    h3(s, t, { x: 8.1, y: y + 0.04, w: 4.4, size: 14 });
    body(s, d, { x: 8.1, y: y + 0.36, w: 4.4, h: 0.75, size: 11 });
  });

  s.addText("Step 4 is the one to remember: it checks its own work.", {
    x: 7.5, y: 6.9, w: 5.4, h: 0.3, margin: 0, fontFace: F.head, fontSize: 12.5, bold: true, color: C.yellow,
  });

  s.addNotes(
    "'An AI did something' is a demo. 'An AI did something and then verified it' is a product. " +
    "Backups are the right first place to allow action — reversible, and the worst case is a little wasted disk."
  );
}

/* ═════════════ 9 · GLASS BOX ═════════════ */
{
  const s = slide("Trust", "You can see every single thing it did");

  body(s,
    "The obvious objection to letting software touch your servers is “how do I know what it actually did?” " +
    "So nothing is hidden: every check it ran, in order, with what came back, and the reasoning that followed.",
    { x: 0.62, y: 1.86, w: 6.5, h: 0.9, size: 13.5 });

  figure(s, "rail", { x: 0.62, y: 2.9, w: 2.98, label: "The panel you drive it from" });

  const points = [
    ["Every step is shown", "Not a summary of what it did — the actual record of what it did."],
    ["The plan is stated first", "Before it runs anything, it tells you what it intends to check."],
    ["The verdict is one word", "Healthy, warning, or critical. No hedging, and it is colour-coded."],
    ["It admits failure", "If a run breaks halfway, it says so instead of reporting a partial answer as success."],
  ];
  points.forEach(([t, d], i) => {
    const y = 2.94 + i * 1.06;
    s.addShape(pres.ShapeType.rect, { x: 3.86, y, w: 0.05, h: 0.86, fill: { color: C.yellow }, line: { width: 0 } });
    h3(s, t, { x: 4.14, y: y + 0.02, w: 3.8, size: 13 });
    body(s, d, { x: 4.14, y: y + 0.34, w: 3.85, h: 0.5, size: 11 });
  });

  const gh = figure(s, "graph", { x: 8.2, y: 2.9, w: 4.32, label: "The chain, drawn live" });
  card(s, { x: 8.2, y: 2.9 + gh + 0.22, w: 4.32, h: 1.28, accent: true });
  h3(s, "Nothing taken on faith", { x: 8.52, y: 3.16 + gh + 0.22, w: 3.7, size: 13.5 });
  body(s, "Each stage lights only once the work has actually reached it — the picture follows the run, not a script.",
    { x: 8.52, y: 3.5 + gh + 0.22, w: 3.7, h: 0.62, size: 10.5 });

  s.addNotes("In a category whose entire barrier is trust, showing the working is not decoration — it is the mechanism.");
}

/* ═════════════ 10 · HOW IT THINKS ═════════════ */
{
  const s = slide("How it works", "It chooses its own next step — inside a route we control");

  body(s,
    "Two different things are happening, and keeping them apart is the whole design.",
    { x: 0.62, y: 1.86, w: 11.9, h: 0.4, size: 14, color: C.white });

  card(s, { x: 0.62, y: 2.42, w: 5.85, h: 2.6 });
  s.addText("INSIDE ONE SPECIALIST", {
    x: 0.94, y: 2.68, w: 5, h: 0.26, margin: 0, fontFace: F.body, fontSize: 10, bold: true, color: C.muted, charSpacing: 1.8,
  });
  h3(s, "The assistant decides", { x: 0.94, y: 3.0, w: 5, size: 17 });
  body(s,
    "It asks for one check. Our code runs it and hands back the result. It reads that and decides what to look " +
    "at next — exactly like a person troubleshooting. Nobody knows in advance how many steps it will take.",
    { x: 0.94, y: 3.46, w: 5.2, h: 1.2, size: 12 });

  card(s, { x: 6.67, y: 2.42, w: 5.85, h: 2.6, accent: true });
  s.addText("BETWEEN THE SPECIALISTS", {
    x: 7.02, y: 2.68, w: 5, h: 0.26, margin: 0, fontFace: F.body, fontSize: 10, bold: true, color: C.muted, charSpacing: 1.8,
  });
  h3(s, "We decide", { x: 7.02, y: 3.0, w: 5, size: 17 });
  body(s,
    "The order they work in is a fixed route we drew. It runs the same way every time and can be pointed at on " +
    "a diagram. The specialists never talk to each other — they hand along a shared clipboard, in order.",
    { x: 7.02, y: 3.46, w: 5.2, h: 1.2, size: 12 });

  card(s, { x: 0.62, y: 5.24, w: 11.9, h: 1.36 });
  h3(s, "Why not let them talk freely, the way some AI systems do?", { x: 0.98, y: 5.48, w: 9, size: 14 });
  body(s,
    "Because that is unpredictable, hard to debug, and can run in circles. When software is touching production " +
    "servers, unpredictable is the wrong kind of impressive.",
    { x: 0.98, y: 5.82, w: 11.2, h: 0.6, size: 12 });

  underHood(s, "ReAct loop per agent (LangGraph prebuilt); LangGraph StateGraph with a typed shared state between them. 8–14 model calls per auto-remediation run.", { x: 0.62, y: 6.84 });

  s.addNotes("If asked about CrewAI or AutoGen: a fixed route is auditable; an emergent one is a debugging problem.");
}

/* ═════════════ 11 · REACHING MACHINES ═════════════ */
{
  const s = slide("Deployment", "How it reaches machines it does not live on");

  body(s,
    "A company's firewall blocks strangers coming in and allows staff going out — it has to, or nobody inside " +
    "could load a website. So we flipped who makes the call.",
    { x: 0.62, y: 1.86, w: 11.9, h: 0.6, size: 13.5 });

  // Server
  card(s, { x: 0.62, y: 2.66, w: 3.5, h: 2.2 });
  h3(s, "Our server", { x: 0.94, y: 2.94, w: 3, size: 15 });
  body(s, "Pins a job to a list.\nThen waits.\nNever leaves the building.", { x: 0.94, y: 3.34, w: 3, h: 1.1, size: 11.5 });

  // Their machine
  card(s, { x: 8.9, y: 2.66, w: 3.6, h: 2.2, accent: true });
  h3(s, "Their machine", { x: 9.26, y: 2.94, w: 3, size: 15 });
  body(s, "A small helper asks\n“anything for me?”\nevery 3 seconds.", { x: 9.26, y: 3.34, w: 3, h: 1.1, size: 11.5 });

  // Three arrows, all one direction
  const arrows = [
    [3.02, "Signs in once, with a pass that expires in an hour and works only once"],
    [3.56, "“Anything for me?” — every 3 seconds, outbound"],
    [4.10, "Does the work locally, sends back the answer"],
  ];
  arrows.forEach(([y, label]) => {
    s.addShape(pres.ShapeType.line, {
      x: 4.32, y, w: 4.38, h: 0,
      line: { color: C.yellow, width: 2, endArrowType: "triangle", beginArrowType: "none" }, flipH: true,
    });
    s.addText(label, {
      x: 4.32, y: y - 0.34, w: 4.4, h: 0.3, margin: 0,
      fontFace: F.body, fontSize: 9.5, color: C.body, align: "center",
    });
  });

  s.addText("Every arrow points the same way. Nothing is ever opened on their side.", {
    x: 0.62, y: 5.06, w: 11.9, h: 0.34, margin: 0, fontFace: F.head, fontSize: 14, bold: true, color: C.yellow, align: "center",
  });

  card(s, { x: 0.62, y: 5.56, w: 11.9, h: 1.06 });
  body(s,
    "That single choice is why this installs in minutes instead of requiring a meeting with someone's network " +
    "team. It is also how the large endpoint-management products reach a laptop sitting behind a home router.",
    { x: 0.98, y: 5.76, w: 11.2, h: 0.7, size: 12 });

  underHood(s, "Three transports behind one interface — local (psutil), SSH (paramiko), and an outbound-polling daemon. Single-use enrolment token, 60-minute expiry, exchanged once for a long-lived key.", { x: 0.62, y: 6.8 });

  s.addNotes("Most projects at this stage assume the machine being inspected is the machine running the code. This one does not.");
}

/* ═════════════ 12 · SAFETY ═════════════ */
{
  const s = slide("Safety", "What stops it doing something it should not");

  body(s,
    "The assistant can never run anything. It can only ask — and our code decides whether to allow it. Every " +
    "limit below is enforced in code, not requested in an instruction the model could be talked out of.",
    { x: 0.62, y: 1.86, w: 11.9, h: 0.6, size: 13.5, color: C.white });

  const rules = [
    ["It orders from a menu", "For system commands there is a fixed list of 13, all read-only. Ask for anything else and it is refused by name."],
    ["Each specialist is boxed in", "It holds only its own abilities. Two of the three cannot change anything at all."],
    ["Written code is inspected first", "When it writes a snippet, the code is taken apart and checked before running. Anything unfamiliar is rejected rather than allowed."],
    ["It cannot read your secrets", "File names that look like passwords or keys are refused outright — otherwise the assistant could simply be asked to read the password file."],
    ["Nothing is stored in the clear", "Passwords, sign-in tokens and machine keys are stored as one-way fingerprints. Even we cannot read them back."],
  ];
  rules.forEach(([t, d], i) => {
    const y = 2.66 + i * 0.88;
    s.addShape(pres.ShapeType.rect, { x: 0.62, y, w: 0.05, h: 0.74, fill: { color: C.yellow }, line: { width: 0 } });
    h3(s, t, { x: 0.94, y: y + 0.02, w: 3.5, size: 13 });
    body(s, d, { x: 4.6, y, w: 7.9, h: 0.74, size: 11.5 });
  });

  s.addText(
    "Stated openly, not hidden: three hardening gaps remain before a real deployment — they are written into " +
    "the project's own documentation rather than left to be discovered.",
    { x: 0.62, y: 7.02, w: 11.9, h: 0.32, margin: 0, fontFace: F.body, fontSize: 10, color: C.muted }
  );

  s.addNotes("The secrets rule is the best story: it anticipates what the model could be talked into, not just what it is allowed to do.");
}

/* ═════════════ 13 · THE MARKET ═════════════ */
{
  const s = slide("The market", "Everyone builds the diagnosis. Few will act.");

  table(s, [
    [hdr("Who"), hdr("What they sell"), hdr("Where we sit")],
    ["Datadog, Grafana, Zabbix", "Watching and alarming", "They raise the alarm. We start where they stop."],
    ["PagerDuty, BigPanda", "Grouping 10,000 alarms into 12", "Useful, but still tells you nothing about the cause."],
    [{ text: "Resolve.ai, Cleric, Traversal", options: { bold: true, color: C.white } },
     "AI that investigates an alarm",
     { text: "Closest in ambition — but they need a large cloud setup we do not, and most deliberately never act.", options: { color: C.white } }],
    [{ text: "NinjaOne, Atera", options: { bold: true, color: C.white } },
     "Managing company laptops and servers",
     { text: "Our real neighbourhood. They automate rules a human wrote. We handle the case nobody wrote a rule for.", options: { color: C.white } }],
  ], { x: 0.62, y: 1.96, w: 11.9, colW: [3.0, 3.4, 5.5] });

  card(s, { x: 0.62, y: 4.7, w: 5.85, h: 2.06, accent: true });
  h3(s, "The gap we walk into", { x: 0.98, y: 4.96, w: 5 });
  body(s,
    "The impressive new tools assume you already run Kubernetes and spend six figures a year watching it. " +
    "Everyone else — a company with servers and laptops and no platform team — gets nothing.",
    { x: 0.98, y: 5.34, w: 5.2, h: 1.2, size: 12 });

  card(s, { x: 6.67, y: 4.7, w: 5.85, h: 2.06 });
  h3(s, "What we need to run", { x: 7.02, y: 4.96, w: 5 });
  s.addText("A computer.", {
    x: 7.02, y: 5.34, w: 5.2, h: 0.5, margin: 0, fontFace: F.head, fontSize: 26, bold: true, color: C.yellow,
  });
  body(s, "No cluster, no monitoring platform, no data pipeline. That is the difference between a product for a hundred companies and one for a hundred thousand.",
    { x: 7.02, y: 5.9, w: 5.2, h: 0.7, size: 11.5 });

  s.addNotes("Names to know: Resolve.ai reached unicorn valuation in under two years. Cleric is deliberately read-only. Traversal's 90% accuracy claim is self-reported, with no independent benchmark.");
}

/* ═════════════ 14 · WIN / LOSE ═════════════ */
{
  const s = slide("Honest position", "What we do better — and what we do not do yet");

  s.addShape(pres.ShapeType.rect, { x: 0.62, y: 1.86, w: 5.85, h: 0.06, fill: { color: C.yellow }, line: { width: 0 } });
  s.addText("WHAT WE DO BETTER", { x: 0.62, y: 2.02, w: 5, h: 0.26, margin: 0, fontFace: F.body, fontSize: 10.5, bold: true, color: C.yellow, charSpacing: 1.8 });

  [
    ["We actually fix things", "The best-funded competitor is deliberately read-only. It investigates and hands the problem back."],
    ["We need almost nothing", "No cluster, no monitoring platform. It runs against a plain machine."],
    ["Built for many machines", "Three ways to reach a host behind one interface — including through a firewall, with nothing opened."],
    ["Nothing is hidden", "Every check and every result is on screen. In a trust-limited market, that is the product."],
  ].forEach(([t, d], i) => {
    const y = 2.4 + i * 1.1;
    h3(s, t, { x: 0.62, y, w: 5.6, size: 13.5 });
    body(s, d, { x: 0.62, y: y + 0.3, w: 5.7, h: 0.7, size: 11 });
  });

  s.addShape(pres.ShapeType.rect, { x: 6.67, y: 1.86, w: 5.85, h: 0.06, fill: { color: C.line }, line: { width: 0 } });
  s.addText("WHAT WE DO NOT — AND THE HONEST ANSWER", { x: 6.67, y: 2.02, w: 5.8, h: 0.26, margin: 0, fontFace: F.body, fontSize: 10.5, bold: true, color: C.muted, charSpacing: 1.8 });

  [
    ["One machine at a time", "It cannot yet connect a fault on one server to a cause on another. The groundwork is built; the reasoning is not."],
    ["Logs come from files", "Not yet from the big logging platforms. That is a connector, not a redesign."],
    ["Only one specialist can act", "Said plainly: one area done properly beats four claimed."],
    ["No accuracy score", "Nor does anyone else, verifiably. Rivals' figures are their own marketing, with no independent test."],
  ].forEach(([t, d], i) => {
    const y = 2.4 + i * 1.1;
    h3(s, t, { x: 6.67, y, w: 5.7, size: 13.5, color: C.body });
    body(s, d, { x: 6.67, y: y + 0.3, w: 5.8, h: 0.7, size: 11 });
  });

  s.addNotes("Conceding the right column is exactly what makes the left column believable. Never claim a number you cannot defend.");
}

/* ═════════════ 15 · WHAT'S NEXT ═════════════ */
{
  const s = slide("Roadmap", "Ordered by what a real customer would hit first");

  [
    ["Harden", "Refuse to start without proper encryption configured, rather than quietly falling back. Verify a machine's identity on first contact. Retry the one failure we have actually seen in testing."],
    ["Connect", "Plug into the logging tools companies already use. Turn a verdict into a ticket. Stream progress live instead of estimating it."],
    ["Connect the dots", "Reason across machines, not one at a time. This is where the most valuable claim in the market sits, and where the groundwork already points."],
    ["Prove it", "A measured accuracy score on a set of known faults, with a stated method. Being the only team in the room with a defensible number is worth more than a bigger one nobody can check."],
  ].forEach(([t, d], i) => {
    const y = 1.96 + i * 1.28;
    card(s, { x: 0.62, y, w: 11.9, h: 1.1, accent: i === 0 });
    s.addText(String(i + 1).padStart(2, "0"), {
      x: 0.98, y: y + 0.34, w: 0.8, h: 0.44, margin: 0, fontFace: F.head, fontSize: 22, bold: true, color: C.yellow,
    });
    h3(s, t, { x: 1.9, y: y + 0.2, w: 2.4, size: 15 });
    body(s, d, { x: 4.4, y: y + 0.18, w: 8.0, h: 0.8, size: 11.5 });
  });

  s.addText("Asked “what would you fix first?” — the retry. It is the one failure observed in practice, not imagined.", {
    x: 0.62, y: 7.04, w: 11.9, h: 0.3, margin: 0, fontFace: F.body, fontSize: 10.5, color: C.muted,
  });
}

/* ═════════════ 16 · CLOSE ═════════════ */
{
  const s = pres.addSlide();
  s.background = { color: C.ground };
  s.addShape(pres.ShapeType.rect, { x: 10.3, y: -1.4, w: 1.6, h: 6.4, fill: { color: C.yellow }, line: { width: 0 }, rotate: 28 });

  s.addText("IN ONE SENTENCE", {
    x: 0.75, y: 2.0, w: 8, h: 0.3, margin: 0, fontFace: F.body, fontSize: 11.5, bold: true, color: C.yellow, charSpacing: 3,
  });
  s.addText(
    "Everyone is building brilliant diagnosticians for companies that already have a platform team — and most " +
    "of them stop short of touching anything.",
    { x: 0.72, y: 2.5, w: 9.0, h: 1.3, margin: 0, fontFace: F.head, fontSize: 22, bold: true, color: C.white, lineSpacing: 32 }
  );
  s.addText(
    "Aurora Ops goes after the same 3am problem for everyone else. It needs nothing but the machine. It shows " +
    "you every step of its reasoning. And on the one kind of problem where acting is safe, it acts — and then " +
    "checks that it worked.",
    { x: 0.75, y: 4.06, w: 9.0, h: 1.2, margin: 0, fontFace: F.body, fontSize: 15, color: C.body, lineSpacing: 24 }
  );
  s.addShape(pres.ShapeType.rect, { x: 0.75, y: 5.62, w: 3.4, h: 0.035, fill: { color: C.yellow }, line: { width: 0 } });
  s.addText("Thank you", { x: 0.75, y: 5.84, w: 6, h: 0.4, margin: 0, fontFace: F.head, fontSize: 18, bold: true, color: C.white });

  s.addNotes("Two claims. Both defensible. Both narrow enough to survive questions. Resist widening them.");
}

/* Windows locks a .pptx while PowerPoint has it open, so a rebuild during a working session
   fails with EBUSY and loses the whole build. Write beside it instead of dying — the deck is
   still produced, and the message says exactly what to do about it. */
const OUT = resolve(HERE, "Aurora-Ops-Overview.pptx");
try {
  await pres.writeFile({ fileName: OUT });
  console.log("wrote", OUT);
} catch (err) {
  if (err?.code !== "EBUSY") throw err;
  const ALT = resolve(HERE, "Aurora-Ops-Overview-new.pptx");
  await pres.writeFile({ fileName: ALT });
  console.log(
    `\nThe deck is open in PowerPoint, so Windows would not let the file be replaced.\n` +
    `Wrote ${ALT} instead — close the original and rename, or just open this one.\n`
  );
}
