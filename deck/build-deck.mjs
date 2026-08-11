/** Builds the Aurora Ops deck.
 *
 * ── The organising idea ──────────────────────────────────────────────────────────────────────
 * EY's brand device reads left to right as Input → Inflection Point → Output. That is also,
 * exactly, what this product does: a symptom goes in, judgement happens, a verified answer comes
 * out. So the device is not decoration here — it is the spine. It opens the deck, it structures
 * the solution slide, and it recurs as a rule between sections.
 *
 * It is drawn as an abstraction — thin bar, marked inflection, thick bar — rather than as a copy
 * of the EY logo, which is trademarked and not ours to reproduce.
 *
 * ── Rules this is written against, all of them corrections from review ───────────────────────
 *   1. Short copy. Fragments, not paragraphs. A deck is spoken over, not read.
 *   2. Yellow means one thing: the eyebrow, a measured number, and the Aurora path. Never a
 *      highlighted phrase mid-sentence — doing that on one slide and not the next is what made
 *      the theming look accidental.
 *   3. Diagrams are drawn; screenshots are the product, at size, on their own slides.
 *   4. Every figure is measured or sourced. The single assumption is labelled as one, on the slide.
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
  bg: "2E2E38",       // EY off-black — the ground for every slide
  panel: "3A3A46",
  panel2: "45454F",
  line: "56565F",
  yellow: "FFE600",   // EY yellow
  white: "FFFFFF",
  grey: "C7C7D0",
  muted: "9494A2",
  dim: "6E6E7C",
};
const F = { head: "Arial", body: "Arial", mono: "Consolas" };

/** True aspect ratios, measured when each image was captured. Images are fitted inside a box by
 *  these, so nothing is ever stretched. */
const AR = {
  "ss-console": 1.8356,
  "ss-graph": 1.8148,
  "ss-dashboard": 1.8399,
  "ss-scene": 1.6252,
  "ss-hosts": 2.9537,
  "ss-run": 1.8407,
  chart: 1.9608,
  fleetgrid: 3.7742,
};

const img = (n) => ({ data: "image/png;base64," + readFileSync(resolve(HERE, "img", n + ".png")).toString("base64") });

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.author = "Gourav Kumar Bathwal";
pres.title = "Aurora Ops — Agentic IT Operations";

/* ── The beam ─────────────────────────────────────────────────────────────────────────────── */

/** Input, inflection, output — thin bar, marked point, thick bar. The deck's recurring device. */
function beam(s, { x, y, w, scale = 1 }) {
  const thin = 0.045 * scale;
  const thick = 0.16 * scale;
  const knot = 0.15 * scale;
  const inflect = x + w * 0.36;

  s.addShape(pres.ShapeType.rect, {
    x, y: y + (thick - thin) / 2, w: w * 0.36 - knot * 0.9, h: thin,
    fill: { color: C.dim }, line: { width: 0 },
  });
  s.addShape(pres.ShapeType.rect, {
    x: inflect - knot / 2, y: y + (thick - knot) / 2, w: knot, h: knot,
    fill: { color: C.yellow }, line: { width: 0 },
  });
  s.addShape(pres.ShapeType.rect, {
    x: inflect + knot * 0.7, y, w: x + w - (inflect + knot * 0.7), h: thick,
    fill: { color: C.yellow }, line: { width: 0 },
  });
}

/* ── Shared chrome ────────────────────────────────────────────────────────────────────────── */

let page = 1; // the title slide is 01 and carries no footer

function slide(eyebrow, title, opts = {}) {
  const s = pres.addSlide();
  s.background = { color: C.bg };
  beam(s, { x: 0.62, y: 0.44, w: 1.15, scale: 0.62 });
  s.addText(eyebrow.toUpperCase(), {
    x: 0.62, y: 0.66, w: 9, h: 0.26, margin: 0,
    fontFace: F.mono, fontSize: 11, bold: true, color: C.yellow, charSpacing: 2.6,
  });
  page += 1;
  s.addShape(pres.ShapeType.line, { x: 12.06, y: 7.04, w: 0.42, h: 0, line: { color: C.yellow, width: 1.25 } });
  s.addText(String(page).padStart(2, "0"), {
    x: 11.9, y: 7.1, w: 0.75, h: 0.24, margin: 0,
    fontFace: F.mono, fontSize: 10, color: C.muted, align: "right",
  });
  s.addText(title, {
    x: 0.6, y: 0.98, w: opts.titleW ?? 12.1, h: 0.66, margin: 0,
    fontFace: F.head, fontSize: opts.titleSize ?? 31, bold: true, color: C.white,
  });
  return s;
}

function lede(s, text, { x = 0.62, y = 1.78, w = 11.9, h = 0.62, size = 13.5, color = C.grey } = {}) {
  s.addText(text, { x, y, w, h, margin: 0, fontFace: F.body, fontSize: size, color, lineSpacing: size * 1.5 });
}

function card(s, { x, y, w, h, fill = C.panel, accent = false }) {
  s.addShape(pres.ShapeType.rect, { x, y, w, h, fill: { color: fill }, line: { color: C.line, width: 0.75 } });
  if (accent) s.addShape(pres.ShapeType.rect, { x, y, w: 0.055, h, fill: { color: C.yellow }, line: { width: 0 } });
}

function node(s, { x, y, w, h, title, sub, on = false }) {
  s.addShape(pres.ShapeType.rect, {
    x, y, w, h,
    fill: { color: on ? C.yellow : C.panel },
    line: { color: on ? C.yellow : C.line, width: 1 },
  });
  s.addText(title, {
    x: x + 0.12, y: y + (sub ? 0.12 : (h - 0.42) / 2), w: w - 0.24, h: 0.42, margin: 0,
    fontFace: F.head, fontSize: 12, bold: true, color: on ? C.bg : C.white, align: "center",
  });
  if (sub) {
    s.addText(sub, {
      x: x + 0.1, y: y + 0.58, w: w - 0.2, h: 0.46, margin: 0,
      fontFace: F.mono, fontSize: 9, color: on ? C.bg : C.muted, align: "center", lineSpacing: 12,
    });
  }
}

function arrow(s, { x, y, w, color = C.muted }) {
  s.addShape(pres.ShapeType.line, { x, y, w, h: 0, line: { color, width: 1.5, endArrowType: "triangle" } });
}

function stat(s, { x, y, w, value, label, size = 40 }) {
  s.addText(value, {
    x, y, w, h: 0.64, margin: 0,
    fontFace: F.head, fontSize: size, bold: true, color: C.yellow,
  });
  s.addText(label, {
    x, y: y + 0.68, w, h: 0.52, margin: 0,
    fontFace: F.body, fontSize: 11, color: C.grey, lineSpacing: 14,
  });
}

/** A screenshot in an EY mount: yellow top rule, charcoal surround, mono label beneath. The
 *  product is near-black, so an unframed capture on a charcoal slide reads as a hole rather
 *  than an exhibit. Fitted and centred, never stretched. */
function shot(s, name, { x, y, w, h, label }) {
  const boxW = w - 0.24;
  const boxH = h - 0.06 - 0.18 - (label ? 0.36 : 0.12);
  const iw = Math.min(boxW, boxH * AR[name]);
  const ih = iw / AR[name];

  s.addShape(pres.ShapeType.rect, { x, y, w, h, fill: { color: C.panel }, line: { color: C.line, width: 0.75 } });
  s.addShape(pres.ShapeType.rect, { x, y, w, h: 0.06, fill: { color: C.yellow }, line: { width: 0 } });
  s.addImage({ ...img(name), x: x + (w - iw) / 2, y: y + 0.18 + (boxH - ih) / 2, w: iw, h: ih });
  if (label) {
    s.addText(label.toUpperCase(), {
      x: x + 0.16, y: y + h - 0.34, w: w - 0.32, h: 0.24, margin: 0,
      fontFace: F.mono, fontSize: 9, bold: true, color: C.muted, charSpacing: 1.2,
    });
  }
}

/* ══════════════════════════ 01 — TITLE ══════════════════════════ */
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  beam(s, { x: 0.9, y: 2.28, w: 4.4, scale: 1.5 });
  s.addText("Aurora Ops", {
    x: 0.86, y: 2.84, w: 11, h: 1.12, margin: 0,
    fontFace: F.head, fontSize: 60, bold: true, color: C.white,
  });
  s.addText("Agentic IT Operations", {
    x: 0.9, y: 4.02, w: 11, h: 0.5, margin: 0,
    fontFace: F.head, fontSize: 23, color: C.yellow,
  });
  s.addText("A symptom goes in. Judgement happens. A verified answer comes out.", {
    x: 0.9, y: 4.68, w: 9.6, h: 0.4, margin: 0,
    fontFace: F.body, fontSize: 14, color: C.grey,
  });
  s.addShape(pres.ShapeType.line, { x: 0.9, y: 5.56, w: 3.2, h: 0, line: { color: C.line, width: 1 } });
  s.addText("Gourav Kumar Bathwal", {
    x: 0.9, y: 5.72, w: 6, h: 0.3, margin: 0, fontFace: F.mono, fontSize: 11.5, color: C.muted,
  });
}

/* ══════════════════════════ 02 — PROBLEM STATEMENT ══════════════════════════ */
{
  const s = slide("Problem statement", "Detection is solved. Judgement is not.");
  lede(s, "Alarms have been automated for thirty years. Working out what an alarm means, and what to do about it, is still a person.", { w: 11.4 });

  const stages = [
    ["Detect", "automated since the 1990s", true],
    ["Diagnose", "still a person", false],
    ["Act & verify", "still a person", false],
  ];
  stages.forEach(([t, sub, on], i) => {
    const x = 0.62 + i * 4.05;
    node(s, { x, y: 2.62, w: 3.5, h: 1.12, title: t, sub, on });
    if (i < 2) arrow(s, { x: x + 3.6, y: 3.18, w: 0.35 });
  });

  const stats = [
    ["10,000+", "alerts a day reach\nan average operations team"],
    ["under 5%", "of them actually\nneed a human"],
    ["44%", "of organisations had an outage\nfrom an alert someone ignored"],
  ];
  stats.forEach(([v, l], i) => stat(s, { x: 0.62 + i * 4.05, y: 4.32, w: 3.7, value: v, label: l, size: 36 }));

  s.addText("Source: 2026 State of Production Reliability survey — 1,039 SRE, DevOps and IT operations practitioners.", {
    x: 0.62, y: 6.5, w: 10.5, h: 0.3, margin: 0, fontFace: F.mono, fontSize: 9, color: C.dim,
  });
  s.addNotes("Sit on the third statistic. That outage was not caused by missing information — somebody had already been told, and had learned to stop listening.");
}

/* ══════════════════════════ 03 — WHY IT PERSISTS ══════════════════════════ */
{
  const s = slide("Why it persists", "More monitoring made it worse");
  lede(s, "The industry answered “we cannot see what is happening” with more alerts. It worked, and then it overshot.", { w: 11.4 });

  const chain = [
    ["More monitoring", "every system gains an alarm"],
    ["More alerts", "thousands a day, mostly noise"],
    ["Alerts get muted", "a rational response to noise"],
    ["Outages", "the real one was in the pile"],
  ];
  chain.forEach(([t, sub], i) => {
    const x = 0.62 + i * 3.06;
    node(s, { x, y: 2.6, w: 2.62, h: 1.18, title: t, sub, on: i === 3 });
    if (i < 3) arrow(s, { x: x + 2.68, y: 3.19, w: 0.3 });
  });

  const why = [
    ["It does not scale", "Every new machine multiplies the same manual checking. Headcount is the only lever anyone has."],
    ["It is knowledge-gated", "A senior engineer knows which six things to check. A junior does not, so the ticket escalates."],
    ["Tools stop one step short", "A dashboard says CPU is 94%. It cannot say which process, why, or whether it matters."],
  ];
  why.forEach(([t, b], i) => {
    const x = 0.62 + i * 4.05;
    card(s, { x, y: 4.34, w: 3.72, h: 2.04, accent: true });
    s.addText(t, {
      x: x + 0.34, y: 4.62, w: 3.14, h: 0.34, margin: 0,
      fontFace: F.head, fontSize: 14.5, bold: true, color: C.white,
    });
    s.addText(b, {
      x: x + 0.34, y: 5.08, w: 3.1, h: 1.14, margin: 0,
      fontFace: F.body, fontSize: 11.5, color: C.grey, lineSpacing: 16,
    });
  });
  s.addNotes("The problem is not that IT is slow. It is that the obvious fix — more monitoring — is what produced the current failure mode.");
}

/* ══════════════════════════ 04 — SOLUTION OVERVIEW ══════════════════════════ */
{
  const s = slide("Solution overview", "Input. Judgement. Verified output.");
  lede(s, "An agent is given real tools on a real machine. It chooses which to run, reads what comes back, and decides what to do next itself.", { w: 11.4 });

  beam(s, { x: 0.62, y: 2.74, w: 11.9, scale: 1.9 });

  const parts = [
    ["Input", "You describe the symptom", "“Disk is nearly full”, in your own words — not a\ncommand, and not the name of an agent.", 0.62],
    ["Inflection", "Judgement happens here", "Which checks matter, in what order, and what the\nresults mean. This is the part nobody automated.", 4.86],
    ["Output", "A verified answer", "Plain language, a one-word verdict, and the full\nrecord of every step it took to get there.", 9.1],
  ];
  parts.forEach(([tag, head, body, x], i) => {
    s.addText(tag.toUpperCase(), {
      x, y: 3.92, w: 3.6, h: 0.26, margin: 0,
      fontFace: F.mono, fontSize: 10, bold: true, color: i === 1 ? C.yellow : C.muted, charSpacing: 1.8,
    });
    s.addText(head, {
      x, y: 4.26, w: 3.9, h: 0.34, margin: 0,
      fontFace: F.head, fontSize: 15, bold: true, color: C.white,
    });
    s.addText(body, {
      x, y: 4.72, w: 3.86, h: 0.92, margin: 0,
      fontFace: F.body, fontSize: 11.5, color: C.grey, lineSpacing: 16,
    });
  });

  s.addText("The middle block is the product. Everything either side of it already exists.", {
    x: 0.62, y: 6.14, w: 9, h: 0.32, margin: 0,
    fontFace: F.body, fontSize: 12.5, color: C.yellow,
  });
  s.addNotes("Point at the yellow square. Input and output are commodity — a text box and a report. The judgement between them is what had no automation before agents.");
}

/* ══════════════════════════ 05 — HOW IT WORKS ══════════════════════════ */
{
  const s = slide("How it works", "It chooses its own next step");
  lede(s, "Nothing in the code says that high memory means look at processes. It decides that from what the last check returned.", { w: 11.4 });

  card(s, { x: 0.62, y: 2.5, w: 6.1, h: 3.88 });
  s.addText("THE LOOP INSIDE ONE AGENT", {
    x: 0.96, y: 2.78, w: 5.2, h: 0.26, margin: 0,
    fontFace: F.mono, fontSize: 9.5, bold: true, color: C.muted, charSpacing: 1.4,
  });
  node(s, { x: 1.5, y: 3.2, w: 4.3, h: 0.86, title: "The model decides", sub: "which tool to call next", on: true });
  node(s, { x: 1.5, y: 4.74, w: 4.3, h: 0.86, title: "Your code runs it", sub: "a real reading from the machine" });
  s.addShape(pres.ShapeType.line, { x: 2.2, y: 4.06, w: 0, h: 0.68, line: { color: C.yellow, width: 1.5, endArrowType: "triangle" } });
  // Drawn downwards with the arrowhead on the *start*, so it points up. A negative height
  // writes a negative extent into the XML, which PowerPoint rejects outright — the file opens
  // fine in a zip reader and then will not open in PowerPoint at all.
  s.addShape(pres.ShapeType.line, { x: 5.1, y: 4.06, w: 0, h: 1.54, line: { color: C.muted, width: 1.5, beginArrowType: "triangle" } });
  s.addText("repeats until it has seen enough", {
    x: 1.5, y: 5.78, w: 4.3, h: 0.28, margin: 0,
    fontFace: F.mono, fontSize: 9.5, color: C.muted, align: "center",
  });

  card(s, { x: 7.02, y: 2.5, w: 5.7, h: 3.88, accent: true });
  s.addText("ONE REAL RUN, MEASURED", {
    x: 7.36, y: 2.78, w: 5, h: 0.26, margin: 0,
    fontFace: F.mono, fontSize: 9.5, bold: true, color: C.yellow, charSpacing: 1.4,
  });
  const facts = [
    ["11", "tools called, each chosen by the model"],
    ["3.4s", "start to verified report"],
    ["1", "word verdict — healthy, warning or critical"],
  ];
  facts.forEach(([v, l], i) => {
    const y = 3.26 + i * 0.98;
    s.addText(v, {
      x: 7.36, y, w: 1.5, h: 0.56, margin: 0,
      fontFace: F.head, fontSize: 27, bold: true, color: C.yellow,
    });
    s.addText(l, {
      x: 9.0, y: y + 0.12, w: 3.4, h: 0.52, margin: 0,
      fontFace: F.body, fontSize: 11.5, color: C.grey, lineSpacing: 15,
    });
  });
  s.addText("Three specialists exist — health, logs, backup. A router reads your request and picks one.", {
    x: 7.36, y: 5.9, w: 5.0, h: 0.4, margin: 0,
    fontFace: F.body, fontSize: 11, color: C.muted, lineSpacing: 15,
  });
  s.addNotes("If asked whether this is really agentic: nothing in the code says high memory should trigger a process check. The model chose that from what it had just read.");
}

/* ══════════════════════════ 06 — FEATURES ══════════════════════════ */
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
}

/* ══════════════════════════ 07 — APPLICATION SNAPSHOTS ══════════════════════════ */
{
  const s = slide("Application snapshots", "The running product");

  const BW = 5.9, BH = 2.42, GX = 0.3, GY = 0.2, X0 = 0.62, Y0 = 1.9;
  const cell = (c, r) => ({ x: X0 + c * (BW + GX), y: Y0 + r * (BH + GY), w: BW, h: BH });

  shot(s, "ss-console",   { ...cell(0, 0), label: "Run an agent — ask on the left, watch on the right" });
  shot(s, "ss-graph",     { ...cell(1, 0), label: "The remediation chain the backend actually walks" });
  shot(s, "ss-dashboard", { ...cell(0, 1), label: "Every run recorded, scored and broken down" });
  shot(s, "ss-hosts",     { ...cell(1, 1), label: "The fleet — enrolled machines, and pending ones" });
}

/* ══════════════════════════ 08 — INSIDE A RUN ══════════════════════════ */
{
  const s = slide("Inside a run", "Nothing is hidden");
  lede(s, "A real System Health run, captured from the product. Eleven tools chosen by the model, every result shown, and the verdict it reached.", { w: 11.4 });

  shot(s, "ss-run", { x: 1.66, y: 2.5, w: 10.0, h: 4.32, label: "The plan, then every tool call and its result — beside the verdict" });
  s.addNotes("The trust slide. CPU 23.2%, memory 86.3%, disk 59.6% — real readings from this laptop, not a mockup. If anyone asks whether the output is genuine, this is the answer.");
}

/* ══════════════════════════ 09 — TECHNOLOGY STACK AND DATA FLOW ══════════════════════════ */
{
  const s = slide("Technology stack and data flow", "How a request becomes a verified report");

  const chain = [
    ["Browser", "Next.js console"],
    ["API", "FastAPI"],
    ["Route", "LangGraph"],
    ["Agent", "LLM on Groq"],
    ["Tools", "Python on the host"],
  ];
  chain.forEach(([t, sub], i) => {
    const x = 0.62 + i * 2.45;
    node(s, { x, y: 2.16, w: 2.06, h: 1.14, title: t, sub, on: i === 3 });
    if (i < 4) arrow(s, { x: x + 2.12, y: 2.73, w: 0.28, color: C.yellow });
  });

  s.addShape(pres.ShapeType.line, { x: 10.42, y: 3.44, w: 0, h: 0.36, line: { color: C.yellow, width: 1.5 } });
  s.addShape(pres.ShapeType.line, { x: 8.0, y: 3.8, w: 2.42, h: 0, line: { color: C.yellow, width: 1.5 } });
  s.addShape(pres.ShapeType.line, { x: 8.0, y: 3.44, w: 0, h: 0.36, line: { color: C.yellow, width: 1.5, endArrowType: "triangle" } });
  s.addText("repeats until the agent has seen enough", {
    x: 7.4, y: 3.86, w: 3.9, h: 0.28, margin: 0,
    fontFace: F.mono, fontSize: 10, color: C.yellow, align: "center",
  });

  const cols = [
    ["Console", "Next.js 16 · React 19\nTailwind v4\nframer-motion"],
    ["Service", "FastAPI · Python\nSQLite\nlocal / SSH / agent daemon"],
    ["Agents", "LangGraph · LangChain\nGroq llama-3.3-70b\n33 tools, temperature 0"],
  ];
  cols.forEach(([t, b], i) => {
    const x = 0.62 + i * 4.05;
    card(s, { x, y: 4.48, w: 3.72, h: 1.9, accent: true });
    s.addText(t.toUpperCase(), {
      x: x + 0.34, y: 4.74, w: 3.1, h: 0.28, margin: 0,
      fontFace: F.mono, fontSize: 10.5, bold: true, color: C.yellow, charSpacing: 1.8,
    });
    s.addText(b, {
      x: x + 0.34, y: 5.1, w: 3.14, h: 1.06, margin: 0,
      fontFace: F.mono, fontSize: 11.5, color: C.grey, lineSpacing: 17,
    });
  });
}

/* ══════════════════════════ 10 — COMPETITIVE LANDSCAPE ══════════════════════════ */
{
  const s = slide("Competitive landscape", "Everyone stops somewhere");
  lede(s, "The category splits two ways: tools that need a large observability estate before they help, and tools that stop at the diagnosis.", { w: 11.4 });

  const heads = ["", "Needs an estate", "Diagnoses", "Acts on it", "Verifies"];
  const rows = [
    ["Monitoring — Datadog, Zabbix", "Yes", "No", "No", "No"],
    ["RMM — NinjaOne, Atera", "No", "Rules only", "Scripted", "No"],
    ["AI SRE — Cleric", "Yes", "Yes", "No, by design", "No"],
    ["AI SRE — Resolve.ai", "Yes", "Yes", "Yes", "Partial"],
    ["Open source — HolmesGPT", "Kubernetes", "Yes", "No", "No"],
    ["Aurora Ops", "No", "Yes", "Yes", "Yes"],
  ];
  const colX = [0.62, 3.94, 5.62, 7.0, 8.56];
  const colW = [3.24, 1.6, 1.3, 1.48, 1.08];

  heads.forEach((h, i) => {
    if (!h) return;
    s.addText(h.toUpperCase(), {
      x: colX[i], y: 2.66, w: colW[i], h: 0.26, margin: 0,
      fontFace: F.mono, fontSize: 9, bold: true, color: C.muted, charSpacing: 1.2,
    });
  });
  rows.forEach((r, ri) => {
    const y = 3.02 + ri * 0.5;
    const ours = ri === 5;
    if (ours) s.addShape(pres.ShapeType.rect, { x: 0.5, y: y - 0.08, w: 9.26, h: 0.46, fill: { color: C.panel2 }, line: { width: 0 } });
    r.forEach((cell, ci) => {
      s.addText(cell, {
        x: colX[ci], y, w: colW[ci], h: 0.3, margin: 0,
        fontFace: ci === 0 ? F.body : F.mono, fontSize: ci === 0 ? 11.5 : 10.5,
        bold: ours && ci === 0,
        color: ours ? (ci === 0 ? C.white : C.yellow) : (/^No/.test(cell) ? C.dim : C.grey),
      });
    });
  });

  card(s, { x: 10.06, y: 2.58, w: 2.66, h: 3.86, accent: true });
  s.addText("WHERE WE WIN", {
    x: 10.4, y: 2.86, w: 2.1, h: 0.26, margin: 0,
    fontFace: F.mono, fontSize: 9.5, bold: true, color: C.yellow, charSpacing: 1.4,
  });
  const wins = [
    ["No estate needed", "They need Kubernetes or a full observability stack. We need a machine."],
    ["We close the loop", "Cleric is read-only by design — a safety feature, and a ceiling."],
    ["We check our work", "A supervisor states whether it is actually resolved."],
  ];
  wins.forEach(([t, b], i) => {
    const y = 3.28 + i * 1.04;
    s.addText(t, {
      x: 10.4, y, w: 2.14, h: 0.28, margin: 0,
      fontFace: F.head, fontSize: 12, bold: true, color: C.white,
    });
    s.addText(b, {
      x: 10.4, y: y + 0.3, w: 2.1, h: 0.7, margin: 0,
      fontFace: F.body, fontSize: 10, color: C.grey, lineSpacing: 13.5,
    });
  });

  s.addText("Said honestly: correlating findings across many machines is where the funded players are ahead. That is our roadmap, not our claim.", {
    x: 0.62, y: 6.5, w: 11.9, h: 0.32, margin: 0,
    fontFace: F.body, fontSize: 11, color: C.muted,
  });
  s.addNotes("Do not oversell. The strong, true claim is the first column: everyone else needs an estate we do not. Cleric's own positioning — read-only by design — is the cleanest proof that closing the loop is genuinely differentiated.");
}

/* ══════════════════════════ 11 — OUTCOMES AND IMPACT ══════════════════════════ */
{
  const s = slide("Outcomes and impact", "What changes when judgement is automated");

  s.addText("MEASURED ON THIS MACHINE", {
    x: 0.62, y: 2.02, w: 5, h: 0.26, margin: 0,
    fontFace: F.mono, fontSize: 9.5, bold: true, color: C.muted, charSpacing: 1.4,
  });
  const runs = [
    ["1.4s", "targeted question\n2 tool calls"],
    ["3.4s", "full health check\n7 tool calls"],
    ["11.8s", "diagnose, act, verify\n2 agents, 4 stages"],
  ];
  runs.forEach(([v, l], i) => stat(s, { x: 0.62 + i * 2.72, y: 2.4, w: 2.5, value: v, label: l, size: 32 }));

  s.addText("WHAT THAT CHANGES", {
    x: 0.62, y: 4.16, w: 5, h: 0.26, margin: 0,
    fontFace: F.mono, fontSize: 9.5, bold: true, color: C.muted, charSpacing: 1.4,
  });
  const gains = [
    ["Time to a verified answer", "35 min", "11.8 s"],
    ["Checks per investigation", "what you remember", "up to 11, chosen"],
    ["Record of what was done", "a ticket comment", "every tool call"],
  ];
  gains.forEach(([label, before, after], i) => {
    const y = 4.54 + i * 0.6;
    s.addText(label, { x: 0.62, y, w: 3.3, h: 0.3, margin: 0, fontFace: F.body, fontSize: 11.5, color: C.grey });
    s.addText(before, { x: 4.06, y, w: 2.1, h: 0.3, margin: 0, fontFace: F.mono, fontSize: 10.5, color: C.dim });
    s.addShape(pres.ShapeType.line, { x: 6.3, y: y + 0.14, w: 0.3, h: 0, line: { color: C.yellow, width: 1.25, endArrowType: "triangle" } });
    s.addText(after, { x: 6.82, y, w: 2.5, h: 0.3, margin: 0, fontFace: F.mono, fontSize: 10.5, color: C.yellow });
  });

  card(s, { x: 9.6, y: 1.96, w: 3.12, h: 4.46, accent: true });
  s.addText("TIME TO A VERIFIED ANSWER", {
    x: 9.94, y: 2.26, w: 2.6, h: 0.42, margin: 0,
    fontFace: F.mono, fontSize: 9, bold: true, color: C.muted, charSpacing: 1.2,
  });
  s.addText("Manual", { x: 9.94, y: 2.8, w: 1.0, h: 0.26, margin: 0, fontFace: F.body, fontSize: 11, color: C.grey });
  s.addShape(pres.ShapeType.rect, { x: 9.94, y: 3.1, w: 2.44, h: 0.28, fill: { color: C.line }, line: { width: 0 } });
  s.addText("~35 min", { x: 11.06, y: 2.78, w: 1.34, h: 0.26, margin: 0, fontFace: F.mono, fontSize: 10.5, color: C.grey, align: "right" });

  s.addText("Aurora Ops", { x: 9.94, y: 3.54, w: 1.08, h: 0.26, margin: 0, fontFace: F.body, fontSize: 11, color: C.white });
  s.addShape(pres.ShapeType.rect, { x: 9.94, y: 3.84, w: 0.14, h: 0.28, fill: { color: C.yellow }, line: { width: 0 } });
  s.addText("11.8 s", { x: 11.06, y: 3.52, w: 1.34, h: 0.26, margin: 0, fontFace: F.mono, fontSize: 10.5, color: C.yellow, align: "right" });

  s.addShape(pres.ShapeType.line, { x: 9.94, y: 4.4, w: 2.44, h: 0, line: { color: C.line, width: 1 } });
  stat(s, { x: 9.94, y: 4.58, w: 2.5, value: "~11 hrs", label: "saved per week at 20\nroutine investigations", size: 30 });
  s.addText("The 11.8s is measured. The 35 minutes is an estimate, and the saving scales from it.", {
    x: 9.94, y: 5.88, w: 2.56, h: 0.48, margin: 0,
    fontFace: F.body, fontSize: 9.5, color: C.dim, italic: true, lineSpacing: 12.5,
  });
  s.addNotes("Be straight about the arithmetic. Run times are measured; the 35-minute baseline is an assumption printed on the slide. If pushed, offer to recompute with their number.");
}

/* ══════════════════════════ 12 — CLOSE ══════════════════════════ */
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

  beam(s, { x: 0.62, y: 5.88, w: 4.0, scale: 0.9 });
  s.addText("github.com/Mr-Bathwal/aurora-ops-frontend   ·   github.com/Mr-Bathwal/aurora-ops-hub", {
    x: 0.62, y: 6.3, w: 11.9, h: 0.32, margin: 0,
    fontFace: F.mono, fontSize: 11, color: C.muted,
  });
}

/* Writing over a deck that is open in PowerPoint fails with EBUSY, which used to kill the build
   outright and leave the previous file in place — so a "clean" check could then be reporting on
   a stale deck. Fall back to a side file and say so loudly instead. */
const CANDIDATES = [
  process.argv[2] ?? "Aurora-Ops-Overview.pptx",
  "Aurora-Ops-Overview.new.pptx",
  "Aurora-Ops-Overview.v2.pptx",
  "Aurora-Ops-Overview.v3.pptx",
];

/* A deck open in PowerPoint cannot be replaced — the write fails with EBUSY, which used to kill
   the build and leave the old file in place, so a later "clean" check would be reporting on a
   stale deck. Walk the candidates until one is writable rather than failing on the first. */
let written = null;
for (const name of CANDIDATES) {
  try {
    await pres.writeFile({ fileName: resolve(HERE, name) });
    written = name;
    break;
  } catch (err) {
    if (err?.code !== "EBUSY") throw err;
  }
}
if (!written) {
  console.error("Every candidate filename is open in PowerPoint. Close the decks and re-run.");
  process.exit(1);
}
console.log("wrote", written);
if (written !== CANDIDATES[0]) {
  console.log(`  (${CANDIDATES[0]} is open in PowerPoint — close it and re-run to swap in.)`);
}
