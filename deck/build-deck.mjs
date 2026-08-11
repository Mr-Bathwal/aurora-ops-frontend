/** Builds the Aurora Ops deck.
 *
 * Structure follows the five sections asked for, in order, and stops at eight slides:
 * problem, solution, features, snapshots, inside a run, stack and data flow, outcomes, close.
 *
 * Three rules this rebuild is written against, all of them corrections:
 *
 *   1. Short copy. Nothing on a slide is a paragraph. The longest body line is two lines at
 *      13pt, and most slides carry fragments. A deck is spoken over, not read.
 *   2. Yellow means one thing. It marks the eyebrow, a measured number, and the Aurora path in
 *      a diagram. It is never used to emphasise a phrase mid-sentence, because doing that on
 *      one slide and not the next is what made the theming look accidental.
 *   3. Diagrams are drawn, not screenshotted. The flow of a request is shapes and arrows;
 *      screenshots live on exactly one slide, as asked.
 *
 * Numbers on the outcomes slide are measured on this machine (see MEASURED), except the manual
 * baseline, which is an assumption and is labelled as one on the slide itself.
 */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const pptxgen = require("pptxgenjs");
const HERE = dirname(fileURLToPath(import.meta.url));

/* ── EY palette ───────────────────────────────────────────────────────────────────────────── */
const C = {
  bg: "2E2E38",      // EY charcoal, the ground for every slide
  panel: "3A3A46",   // one step up, for cards
  panel2: "44444F",
  line: "55555F",
  yellow: "FFE600",  // EY yellow
  white: "FFFFFF",
  grey: "C7C7D0",
  muted: "9494A2",
};
const F = { head: "Arial", body: "Arial", mono: "Consolas" };

/** True aspect ratios, printed by prep-shots.mjs when it captured each element. Images are
 *  placed by width and the height derived, so nothing is ever squashed. */
const AR = {
  console: 3.3429,
  rail: 0.9519,
  robot: 2.46,
  prompts: 1.4304,
  chart: 1.9608,
  graph: 1.8176,
  fleetgrid: 3.7742,
  run: 5.7667,
  trace: 2.62,
  report: 2.275,
  activity: 4.1714,
};

const img = (n) => ({ data: "image/png;base64," + readFileSync(resolve(HERE, "img", n + ".png")).toString("base64") });

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.author = "Gourav Kumar Bathwal";
pres.title = "Aurora Ops — Agentic IT Operations";

/* ── Shared chrome ────────────────────────────────────────────────────────────────────────── */

/** Identical on every content slide: yellow rule, eyebrow, title. Consistency here is most of
 *  what makes a deck read as designed rather than assembled. */
let page = 1;   // the title slide is 01 and carries no footer
function slide(eyebrow, title, opts = {}) {
  const s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.ShapeType.rect, { x: 0.62, y: 0.44, w: 0.6, h: 0.085, fill: { color: C.yellow }, line: { width: 0 } });
  s.addText(eyebrow.toUpperCase(), {
    x: 0.62, y: 0.62, w: 9, h: 0.26, margin: 0,
    fontFace: F.mono, fontSize: 11, bold: true, color: C.yellow, charSpacing: 2.6,
  });
  // Numbered footer. Mono, hairline, bottom-right — a small recurring mark that says the deck
  // has a system rather than a set of one-off layouts.
  page += 1;
  s.addShape(pres.ShapeType.line, { x: 12.06, y: 7.02, w: 0.42, h: 0, line: { color: C.yellow, width: 1.25 } });
  s.addText(String(page).padStart(2, "0"), {
    x: 11.9, y: 7.08, w: 0.75, h: 0.24, margin: 0,
    fontFace: F.mono, fontSize: 10, color: C.muted, align: "right",
  });
  s.addText(title, {
    x: 0.6, y: 0.94, w: opts.titleW ?? 12.1, h: 0.66, margin: 0,
    fontFace: F.head, fontSize: opts.titleSize ?? 31, bold: true, color: C.white,
  });
  return s;
}

/** Standing text style, used for the one intro line a slide is allowed. */
function lede(s, text, { x = 0.62, y = 1.74, w = 11.9, h = 0.6, size = 13.5, color = C.grey } = {}) {
  s.addText(text, { x, y, w, h, margin: 0, fontFace: F.body, fontSize: size, color, lineSpacing: size * 1.5 });
}

/** A panel. `accent` draws the yellow left edge — used only where the slide is marking "ours". */
function card(s, { x, y, w, h, fill = C.panel, accent = false }) {
  s.addShape(pres.ShapeType.rect, { x, y, w, h, fill: { color: fill }, line: { color: C.line, width: 0.75 } });
  if (accent) s.addShape(pres.ShapeType.rect, { x, y, w: 0.055, h, fill: { color: C.yellow }, line: { width: 0 } });
}

/** A box in a flow diagram. */
function node(s, { x, y, w, h, title, sub, on = false }) {
  s.addShape(pres.ShapeType.rect, {
    x, y, w, h,
    fill: { color: on ? C.yellow : C.panel },
    line: { color: on ? C.yellow : C.line, width: 1 },
  });
  s.addText(title, {
    x: x + 0.14, y: y + (sub ? 0.12 : (h - 0.42) / 2), w: w - 0.28, h: 0.42, margin: 0,
    fontFace: F.head, fontSize: 12, bold: true, color: on ? C.bg : C.white, align: "center",
  });
  if (sub) {
    s.addText(sub, {
      x: x + 0.1, y: y + 0.58, w: w - 0.2, h: 0.46, margin: 0,
      fontFace: F.mono, fontSize: 9, color: on ? C.bg : C.muted, align: "center", lineSpacing: 12,
    });
  }
}

/** A connector between two flow nodes. */
function arrow(s, { x, y, w, color = C.muted }) {
  s.addShape(pres.ShapeType.line, {
    x, y, w, h: 0,
    line: { color, width: 1.5, endArrowType: "triangle" },
  });
}

/** A measured figure. The number is always yellow; the caption never is. */
function stat(s, { x, y, w, value, label, size = 40 }) {
  s.addText(value, {
    x, y, w, h: 0.62, margin: 0,
    fontFace: F.head, fontSize: size, bold: true, color: C.yellow,
  });
  s.addText(label, {
    x, y: y + 0.66, w, h: 0.5, margin: 0,
    fontFace: F.body, fontSize: 11, color: C.grey, lineSpacing: 14,
  });
}

/** A screenshot in an EY mount: yellow top rule, charcoal surround, small label beneath. The
 *  mount matters — the product is near-black, so an unframed capture on a charcoal slide reads
 *  as a hole rather than an exhibit. */
function shot(s, name, { x, y, w, h, label }) {
  // Fit inside the box rather than filling its width. These four captures range from 3.77:1 to
  // 1.82:1, so sizing them all by width made the tall ones twice the height of the wide ones
  // and pushed two of them off the slide. A fixed box with the image centred inside keeps the
  // grid aligned whatever shape the capture happens to be.
  const boxW = w - 0.24;
  const boxH = h - 0.06 - 0.18 - (label ? 0.36 : 0.12);
  const iw = Math.min(boxW, boxH * AR[name]);
  const ih = iw / AR[name];
  const ix = x + (w - iw) / 2;

  s.addShape(pres.ShapeType.rect, { x, y, w, h, fill: { color: C.panel }, line: { color: C.line, width: 0.75 } });
  s.addShape(pres.ShapeType.rect, { x, y, w, h: 0.06, fill: { color: C.yellow }, line: { width: 0 } });
  s.addImage({ ...img(name), x: ix, y: y + 0.18 + (boxH - ih) / 2, w: iw, h: ih });
  if (label) {
    s.addText(label.toUpperCase(), {
      x: x + 0.16, y: y + h - 0.34, w: w - 0.32, h: 0.24, margin: 0,
      fontFace: F.mono, fontSize: 9, bold: true, color: C.muted, charSpacing: 1.2,
    });
  }
  return h;
}

/* ══════════════════════════ 1 — TITLE ══════════════════════════ */
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  s.addShape(pres.ShapeType.rect, { x: 0.9, y: 2.42, w: 1.5, h: 0.14, fill: { color: C.yellow }, line: { width: 0 } });
  s.addText("Aurora Ops", {
    x: 0.86, y: 2.78, w: 11, h: 1.1, margin: 0,
    fontFace: F.head, fontSize: 60, bold: true, color: C.white,
  });
  s.addText("Agentic IT Operations", {
    x: 0.9, y: 3.96, w: 11, h: 0.5, margin: 0,
    fontFace: F.head, fontSize: 23, color: C.yellow,
  });
  s.addText("Agents that diagnose a machine, act on what they find, and verify the fix.", {
    x: 0.9, y: 4.62, w: 9.4, h: 0.4, margin: 0,
    fontFace: F.body, fontSize: 14, color: C.grey,
  });
  s.addShape(pres.ShapeType.line, { x: 0.9, y: 5.5, w: 3.2, h: 0, line: { color: C.line, width: 1 } });
  s.addText("Gourav Kumar Bathwal", {
    x: 0.9, y: 5.66, w: 6, h: 0.3, margin: 0, fontFace: F.body, fontSize: 12, color: C.muted,
  });
  s.addNotes("One line: this is software that does the part of IT operations nobody automated — the judgement between the alarm and the fix.");
}

/* ══════════════════════════ 2 — PROBLEM STATEMENT ══════════════════════════ */
{
  const s = slide("Problem statement", "Detection is solved. Judgement is not.");
  lede(s, "Alarms have been automated for thirty years. Working out what the alarm means, and what to do about it, is still a person.", { w: 11.4 });

  // The three stages, with only the first one solved. Yellow marks what is already automated,
  // so the two grey blocks are visibly the gap.
  const stages = [
    ["Detect", "Automated since the 1990s", true],
    ["Diagnose", "Still manual", false],
    ["Act & verify", "Still manual", false],
  ];
  stages.forEach(([t, sub, on], i) => {
    const x = 0.62 + i * 4.05;
    node(s, { x, y: 2.62, w: 3.5, h: 1.0, title: t, sub, on });
    if (i < 2) arrow(s, { x: x + 3.6, y: 3.12, w: 0.35 });
  });

  const stats = [
    ["10,000+", "alerts a day reach\nan average operations team"],
    ["under 5%", "of them actually\nneed a human"],
    ["44%", "of organisations had an outage\nfrom an alert someone ignored"],
  ];
  stats.forEach(([v, l], i) => stat(s, { x: 0.62 + i * 4.05, y: 4.28, w: 3.7, value: v, label: l, size: 36 }));

  s.addText("Source: 2026 State of Production Reliability survey, 1,039 practitioners.", {
    x: 0.62, y: 6.62, w: 9, h: 0.3, margin: 0, fontFace: F.body, fontSize: 10, color: C.muted, italic: true,
  });
  s.addNotes("The point is not that IT is slow. It is that more monitoring made it worse — the outage in the third statistic happened because someone had already been told and had stopped listening.");
}

/* ══════════════════════════ 3 — SOLUTION OVERVIEW ══════════════════════════ */
{
  const s = slide("Solution overview", "Describe the symptom. It runs the checks.");
  lede(s, "An agent is given real tools on a real machine. It chooses which to run, reads what comes back, and decides the next step itself.", { w: 11.4 });

  const flow = [
    ["Plain-English\nrequest", "“disk is nearly full”"],
    ["Orchestrator", "picks the specialist"],
    ["Specialist\nagent", "chooses its own checks"],
    ["Tools on the\nmachine", "real readings, not guesses"],
    ["Verified\nreport", "and whether it is resolved"],
  ];
  flow.forEach(([t, sub], i) => {
    const x = 0.62 + i * 2.45;
    node(s, { x, y: 2.62, w: 2.06, h: 1.28, title: t, sub, on: i === 4 });
    if (i < 4) arrow(s, { x: x + 2.12, y: 3.26, w: 0.28, color: C.yellow });
  });

  const pairs = [
    ["Nobody knows which specialist owns a problem", "One model call reads the request and routes it"],
    ["The next check depends on what the last one found", "The agent picks its own next step, every step"],
    ["“Did it actually work?” is never answered", "A supervisor reviews the run and states the verdict"],
  ];
  pairs.forEach(([problem, doing], i) => {
    const y = 4.44 + i * 0.78;
    s.addText(problem, {
      x: 0.62, y, w: 5.3, h: 0.5, margin: 0, fontFace: F.body, fontSize: 12, color: C.muted, lineSpacing: 16,
    });
    s.addShape(pres.ShapeType.rect, { x: 6.12, y: y + 0.09, w: 0.28, h: 0.02, fill: { color: C.yellow }, line: { width: 0 } });
    s.addText(doing, {
      x: 6.62, y, w: 6.0, h: 0.5, margin: 0, fontFace: F.body, fontSize: 12, color: C.white, lineSpacing: 16,
    });
  });
  s.addNotes("Left column is the problem, right column is what the agentic approach actually does about it. Do not read them out — point at the pair you want.");
}

/* ══════════════════════════ 4 — FEATURES ══════════════════════════ */
{
  const s = slide("Features", "What it does");

  const feats = [
    ["Three specialists", "Health, logs, backup. Each holds only its own tools."],
    ["Plain-English routing", "Describe a symptom; it picks the right agent."],
    ["Acts, then verifies", "Takes the fix and confirms it actually worked."],
    ["Every step visible", "The full record of what it ran and what came back."],
    ["Works behind firewalls", "The machine calls out; nothing inbound is opened."],
    ["Read-only by default", "Only one agent can change anything, and only backups."],
  ];
  feats.forEach(([t, b], i) => {
    const x = 0.62 + (i % 3) * 4.05;
    const y = 2.1 + Math.floor(i / 3) * 2.24;
    card(s, { x, y, w: 3.72, h: 1.92, accent: true });
    s.addText(t, {
      x: x + 0.34, y: y + 0.3, w: 3.2, h: 0.34, margin: 0,
      fontFace: F.head, fontSize: 14.5, bold: true, color: C.white,
    });
    s.addText(b, {
      x: x + 0.34, y: y + 0.78, w: 3.14, h: 0.9, margin: 0,
      fontFace: F.body, fontSize: 11.5, color: C.grey, lineSpacing: 16,
    });
  });
  s.addNotes("Six features, one line each. The last two are the ones worth pausing on: firewall traversal is why this deploys without a network conversation, and read-only-by-default is the answer to 'what if it breaks something'.");
}

/* ══════════════════════════ 5 — APPLICATION SNAPSHOTS ══════════════════════════ */
{
  const s = slide("Application snapshots", "The running product");

  const BW = 5.9, BH = 2.42, GX = 0.3, GY = 0.2, X0 = 0.62, Y0 = 1.9;
  const cell = (c, r) => ({ x: X0 + c * (BW + GX), y: Y0 + r * (BH + GY), w: BW, h: BH });

  shot(s, "console",   { ...cell(0, 0), label: "Run an agent — ask on the left, watch on the right" });
  shot(s, "graph",     { ...cell(1, 0), label: "The remediation chain, drawn live" });
  shot(s, "chart",     { ...cell(0, 1), label: "Every stage of a run, in plain language" });
  shot(s, "fleetgrid", { ...cell(1, 1), label: "The fleet — live and standby" });

  s.addNotes("Four screens, no commentary needed. If asked to demo live, open the console one and run System Health — it returns in under four seconds.");
}

/* ══════════════════════════ 6 — INSIDE A RUN ══════════════════════════ */
{
  const s = slide("Inside a run", "Nothing is hidden");
  lede(s, "A real System Health run, captured from the product. Every tool it chose, what each returned, and the verdict it reached.", { w: 11.4 });

  const BW = 5.9, BH = 2.14, GX = 0.3, GY = 0.18, X0 = 0.62, Y0 = 2.44;
  const cell = (c, r) => ({ x: X0 + c * (BW + GX), y: Y0 + r * (BH + GY), w: BW, h: BH });

  shot(s, "trace",    { ...cell(0, 0), label: "The plan, then every tool call and its result" });
  shot(s, "report",   { ...cell(1, 0), label: "The verdict — one word, colour-coded" });
  shot(s, "activity", { ...cell(0, 1), label: "Every run recorded and scored" });
  shot(s, "prompts",  { ...cell(1, 1), label: "Symptoms, not agent names" });

  s.addNotes("This is the trust slide. The numbers on it are from a genuine run on this laptop — CPU 92.5%, memory 85.3% — not a mockup. If anyone asks whether the output is real, this is the answer.");
}

/* ══════════════════════════ 7 — TECHNOLOGY STACK AND DATA FLOW ══════════════════════════ */
{
  const s = slide("Technology stack and data flow", "How a request becomes a verified report");

  // The loop is the whole point of the diagram: the agent goes round it as many times as it
  // needs, and only then writes the report.
  const chain = [
    ["Browser", "Next.js console"],
    ["API", "FastAPI"],
    ["Route", "LangGraph"],
    ["Agent", "LLM on Groq"],
    ["Tools", "Python on the host"],
  ];
  chain.forEach(([t, sub], i) => {
    const x = 0.62 + i * 2.45;
    node(s, { x, y: 2.16, w: 2.06, h: 1.0, title: t, sub, on: i === 3 });
    if (i < 4) arrow(s, { x: x + 2.12, y: 2.66, w: 0.28, color: C.yellow });
  });

  // The return path, drawn as a bracket under the two boxes that repeat.
  s.addShape(pres.ShapeType.line, { x: 10.42, y: 3.42, w: 0, h: 0.34, line: { color: C.yellow, width: 1.5 } });
  s.addShape(pres.ShapeType.line, { x: 8.0, y: 3.76, w: 2.42, h: 0, line: { color: C.yellow, width: 1.5 } });
  s.addShape(pres.ShapeType.line, { x: 8.0, y: 3.42, w: 0, h: 0.34, line: { color: C.yellow, width: 1.5, endArrowType: "triangle" } });
  s.addText("repeats until the agent has seen enough", {
    x: 7.4, y: 3.82, w: 3.9, h: 0.28, margin: 0,
    fontFace: F.mono, fontSize: 10, color: C.yellow, align: "center",
  });

  const cols = [
    ["Console", "Next.js 16 · React 19\nTailwind v4\nframer-motion"],
    ["Service", "FastAPI · Python\nSQLite\nlocal / SSH / agent daemon"],
    ["Agents", "LangGraph · LangChain\nGroq llama-3.3-70b\n33 tools, temperature 0"],
  ];
  cols.forEach(([t, b], i) => {
    const x = 0.62 + i * 4.05;
    card(s, { x, y: 4.46, w: 3.72, h: 1.86, accent: true });
    s.addText(t.toUpperCase(), {
      x: x + 0.34, y: y0(4.46) + 0.26, w: 3.1, h: 0.28, margin: 0,
      fontFace: F.mono, fontSize: 10.5, bold: true, color: C.yellow, charSpacing: 1.8,
    });
    s.addText(b, {
      x: x + 0.34, y: y0(4.46) + 0.62, w: 3.14, h: 1.0, margin: 0,
      fontFace: F.mono, fontSize: 11.5, color: C.grey, lineSpacing: 17,
    });
  });
  function y0(v) { return v; }

  s.addNotes("The loop is the part worth explaining: the agent is not a pipeline, it goes round between reasoning and tools until it has what it needs, then writes the report.");
}

/* ══════════════════════════ 8 — OUTCOMES AND IMPACT ══════════════════════════ */
{
  const s = slide("Outcomes and impact", "What changes when judgement is automated");

  // Comparison. Only the last row is ours, and it is the only row carrying yellow.
  const rows = [
    ["Monitoring platforms", "Yes", "No", "No", "No"],
    ["RMM / endpoint tools", "Yes", "Rules only", "Scripted", "No"],
    ["AI SRE tools", "Yes", "Yes", "Rarely", "No"],
    ["Aurora Ops", "Yes", "Yes", "Yes", "Yes"],
  ];
  const heads = ["", "Alerts", "Diagnoses", "Acts", "Verifies"];
  const colX = [0.62, 3.5, 4.72, 6.0, 7.1];
  const colW = [2.8, 1.15, 1.22, 1.05, 1.1];

  heads.forEach((h, i) => {
    if (!h) return;
    s.addText(h.toUpperCase(), {
      x: colX[i], y: 2.0, w: colW[i], h: 0.26, margin: 0,
      fontFace: F.mono, fontSize: 9.5, bold: true, color: C.muted, charSpacing: 1.4,
    });
  });
  rows.forEach((r, ri) => {
    const y = 2.36 + ri * 0.56;
    const ours = ri === 3;
    if (ours) s.addShape(pres.ShapeType.rect, { x: 0.5, y: y - 0.08, w: 7.76, h: 0.5, fill: { color: C.panel2 }, line: { width: 0 } });
    r.forEach((cell, ci) => {
      s.addText(cell, {
        x: colX[ci], y, w: colW[ci], h: 0.32, margin: 0,
        fontFace: F.body, fontSize: 11.5, bold: ours && ci === 0,
        color: ours ? (ci === 0 ? C.white : C.yellow) : (cell === "No" ? C.muted : C.grey),
      });
    });
  });

  // Measured on this machine, and said so.
  s.addText("MEASURED ON THIS MACHINE", {
    x: 0.62, y: 4.94, w: 5, h: 0.24, margin: 0,
    fontFace: F.mono, fontSize: 9.5, bold: true, color: C.muted, charSpacing: 1.4,
  });
  const runs = [
    ["1.4s", "targeted question\n2 tool calls"],
    ["3.4s", "full health check\n7 tool calls"],
    ["11.8s", "diagnose, act, verify\n2 agents, 4 stages"],
  ];
  runs.forEach(([v, l], i) => stat(s, { x: 0.62 + i * 2.62, y: 5.28, w: 2.4, value: v, label: l, size: 30 }));

  // The impact figure, with its one assumption on the face of the slide.
  card(s, { x: 8.62, y: 1.94, w: 4.1, h: 4.62, accent: true });
  s.addText("TIME TO A VERIFIED ANSWER", {
    x: 8.96, y: 2.22, w: 3.5, h: 0.26, margin: 0,
    fontFace: F.mono, fontSize: 9.5, bold: true, color: C.muted, charSpacing: 1.4,
  });

  s.addText("Manual", { x: 8.96, y: 2.64, w: 1.6, h: 0.26, margin: 0, fontFace: F.body, fontSize: 11, color: C.grey });
  s.addShape(pres.ShapeType.rect, { x: 8.96, y: 2.94, w: 3.4, h: 0.3, fill: { color: C.line }, line: { width: 0 } });
  s.addText("~35 min", { x: 10.7, y: 2.62, w: 1.7, h: 0.26, margin: 0, fontFace: F.body, fontSize: 11, color: C.grey, align: "right" });

  s.addText("Aurora Ops", { x: 8.96, y: 3.42, w: 1.6, h: 0.26, margin: 0, fontFace: F.body, fontSize: 11, color: C.white });
  s.addShape(pres.ShapeType.rect, { x: 8.96, y: 3.72, w: 0.19, h: 0.3, fill: { color: C.yellow }, line: { width: 0 } });
  s.addText("11.8 s", { x: 10.7, y: 3.4, w: 1.7, h: 0.26, margin: 0, fontFace: F.body, fontSize: 11, color: C.yellow, align: "right" });

  s.addShape(pres.ShapeType.line, { x: 8.96, y: 4.34, w: 3.4, h: 0, line: { color: C.line, width: 1 } });
  stat(s, { x: 8.96, y: 4.52, w: 3.4, value: "~11 hrs", label: "saved per week at 20 routine\ninvestigations", size: 34 });
  s.addText("Assumes 35 minutes of manual triage per investigation.\nThe 11.8s figure is measured; the 35 minutes is an estimate.", {
    x: 8.96, y: 5.86, w: 3.44, h: 0.56, margin: 0,
    fontFace: F.body, fontSize: 9.5, color: C.muted, italic: true, lineSpacing: 12.5,
  });

  s.addNotes("Be straight about the arithmetic: the run times are measured, the 35-minute baseline is an assumption and is printed on the slide as one. If they push, offer to re-run the model with their own number.");
}

/* ══════════════════════════ 9 — CLOSE ══════════════════════════ */
{
  const s = slide("Where this goes", "Working today, and what comes next");

  const now = [
    "Three agents on live machine data",
    "Orchestrated routing and auto-remediation",
    "Fleet enrolment over SSH or an agent daemon",
  ];
  const next = [
    "Correlate findings across many machines",
    "Read logs from Splunk, Loki and CloudWatch",
    "Widen safe action beyond backup and recovery",
  ];

  [["Working today", now, true], ["Next", next, false]].forEach(([title, items, on], ci) => {
    const x = 0.62 + ci * 6.15;
    card(s, { x, y: 2.1, w: 5.83, h: 3.3, accent: on });
    s.addText(title.toUpperCase(), {
      x: x + 0.36, y: 2.4, w: 4.9, h: 0.28, margin: 0,
      fontFace: F.mono, fontSize: 10.5, bold: true, color: on ? C.yellow : C.muted, charSpacing: 1.8,
    });
    items.forEach((t, i) => {
      const y = 2.9 + i * 0.72;
      s.addShape(pres.ShapeType.rect, { x: x + 0.36, y: y + 0.13, w: 0.16, h: 0.03, fill: { color: on ? C.yellow : C.line }, line: { width: 0 } });
      s.addText(t, {
        x: x + 0.68, y, w: 4.85, h: 0.56, margin: 0,
        fontFace: F.body, fontSize: 12.5, color: on ? C.white : C.grey, lineSpacing: 17,
      });
    });
  });

  s.addText("github.com/Mr-Bathwal/aurora-ops-frontend   ·   github.com/Mr-Bathwal/aurora-ops-hub", {
    x: 0.62, y: 6.06, w: 11.9, h: 0.32, margin: 0,
    fontFace: F.mono, fontSize: 11, color: C.muted,
  });
  s.addNotes("Close on the 'next' column — correlation across machines is the honest gap, and naming it first is stronger than being asked about it.");
}

/* Writing over a deck that is open in PowerPoint fails with EBUSY, which used to kill the
   build outright and leave the previous file in place — so a "clean" check could then be
   reporting on a stale deck. Fall back to a side file and say so loudly instead. */
const OUT = resolve(HERE, process.argv[2] ?? "Aurora-Ops-Overview.pptx");
try {
  await pres.writeFile({ fileName: OUT });
  console.log("wrote", OUT);
} catch (err) {
  if (err?.code !== "EBUSY") throw err;
  const ALT = resolve(HERE, "Aurora-Ops-Overview.new.pptx");
  await pres.writeFile({ fileName: ALT });
  console.log(`
  ${OUT.split(/[\/]/).pop()} is open in PowerPoint, so it could not be replaced.`);
  console.log(`  Wrote ${ALT.split(/[\/]/).pop()} instead — close the deck and re-run to swap it in.
`);
}
