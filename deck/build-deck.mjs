/** Builds the Aurora Ops deck.
 *
 * ── The organising idea ──────────────────────────────────────────────────────────────────────
 * EY's brand device reads left to right as Input → Inflection Point → Output. That is also,
 * exactly, what this product does: a symptom goes in, judgement happens, a verified answer comes
 * out. So the device is not decoration here — it is the spine.
 *
 * ── Header system (a review correction) ──────────────────────────────────────────────────────
 * Every slide leads with a plain consulting TITLE — "Problem Statement", "How It Works",
 * "Architecture" — set large. The sharp one-liner is a SUBTITLE beneath it, deliberately smaller.
 * A catchy line as the main heading does not tell the room what the slide is about; a standard
 * title does, and the hook still lands one size down.
 *
 * ── Yellow, used for one thing (a review correction) ─────────────────────────────────────────
 * Yellow marks: the beam, flow arrows, a card's accent edge, a measured number, the Aurora row
 * in the comparison, and the closing thesis. It is NOT used to fill one node among its peers —
 * a single yellow box in a row of grey ones reads as accidental, so every diagram node is grey
 * and the flow is carried by yellow arrows instead.
 *
 * ── Every "title over content" pair keeps the title larger than its body. ────────────────────
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

const AR = {
  "ss-console": 1.8356, "ss-graph": 1.8148, "ss-dashboard": 1.8399,
  "ss-scene": 1.6252, "ss-hosts": 2.9537, "ss-run": 1.8407,
  chart: 1.9608, fleetgrid: 3.7742,
};

const img = (n) => ({ data: "image/png;base64," + readFileSync(resolve(HERE, "img", n + ".png")).toString("base64") });

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.author = "Gourav Kumar Bathwal";
pres.title = "Aurora Ops — Agentic IT Operations";

/* ── The beam ─────────────────────────────────────────────────────────────────────────────── */

function beam(s, { x, y, w, scale = 1 }) {
  const thin = 0.045 * scale;
  const thick = 0.16 * scale;
  const knot = 0.15 * scale;
  const inflect = x + w * 0.36;
  s.addShape(pres.ShapeType.rect, { x, y: y + (thick - thin) / 2, w: w * 0.36 - knot * 0.9, h: thin, fill: { color: C.dim }, line: { width: 0 } });
  s.addShape(pres.ShapeType.rect, { x: inflect - knot / 2, y: y + (thick - knot) / 2, w: knot, h: knot, fill: { color: C.yellow }, line: { width: 0 } });
  s.addShape(pres.ShapeType.rect, { x: inflect + knot * 0.7, y, w: x + w - (inflect + knot * 0.7), h: thick, fill: { color: C.yellow }, line: { width: 0 } });
}

/* ── EY logo ───────────────────────────────────────────────────────────────────────────────────
 * The official EY logo (Beam over wordmark), supplied by the presenter for their own EY deck,
 * placed top-right on every slide. Its ground is EY off-black — the exact #2E2E38 of the deck —
 * so it drops in seamlessly with no cut-out rectangle and needs no transparency. */
const EY_AR = 1522 / 1560; // measured off the trimmed asset
function eyMark(s) {
  const h = 0.66;
  const w = h * EY_AR;
  s.addImage({ ...img("ey-logo"), x: 12.68 - w, y: 0.28, w, h });
}

/* ── Shared chrome ────────────────────────────────────────────────────────────────────────── */

let page = 1;

/** Title big, subtitle smaller. A yellow kicker tick is the recurring accent, identical on every
 *  slide so the theme reads as deliberate rather than per-slide. */
function slide(title, subtitle, opts = {}) {
  const s = pres.addSlide();
  s.background = { color: C.bg };
  eyMark(s);

  s.addShape(pres.ShapeType.rect, { x: 0.62, y: 0.6, w: 0.44, h: 0.055, fill: { color: C.yellow }, line: { width: 0 } });
  s.addText(title, {
    x: 0.6, y: 0.72, w: 10.6, h: 0.56, margin: 0,
    fontFace: F.head, fontSize: opts.titleSize ?? 30, bold: true, color: C.white,
  });
  if (subtitle) {
    s.addText(subtitle, {
      x: 0.62, y: 1.32, w: 11.4, h: 0.4, margin: 0,
      fontFace: F.body, fontSize: 15, color: C.grey,
    });
  }

  page += 1;
  s.addShape(pres.ShapeType.line, { x: 12.06, y: 7.04, w: 0.42, h: 0, line: { color: C.yellow, width: 1.25 } });
  s.addText(String(page).padStart(2, "0"), {
    x: 11.9, y: 7.1, w: 0.75, h: 0.24, margin: 0,
    fontFace: F.mono, fontSize: 10, color: C.muted, align: "right",
  });
  return s;
}

function card(s, { x, y, w, h, fill = C.panel, accent = false }) {
  s.addShape(pres.ShapeType.rect, { x, y, w, h, fill: { color: fill }, line: { color: C.line, width: 0.75 } });
  if (accent) s.addShape(pres.ShapeType.rect, { x, y, w: 0.055, h, fill: { color: C.yellow }, line: { width: 0 } });
}

/** All nodes grey now — see the yellow note in the file header. Titled nodes keep the title
 *  larger than the sub-label. */
function node(s, { x, y, w, h, title, sub }) {
  s.addShape(pres.ShapeType.rect, { x, y, w, h, fill: { color: C.panel }, line: { color: C.line, width: 1 } });
  s.addText(title, {
    x: x + 0.12, y: y + (sub ? 0.12 : (h - 0.42) / 2), w: w - 0.24, h: 0.42, margin: 0,
    fontFace: F.head, fontSize: 12.5, bold: true, color: C.white, align: "center",
  });
  if (sub) {
    s.addText(sub, {
      x: x + 0.1, y: y + 0.58, w: w - 0.2, h: 0.46, margin: 0,
      fontFace: F.mono, fontSize: 9, color: C.muted, align: "center", lineSpacing: 12,
    });
  }
}

function arrow(s, { x, y, w, color = C.muted }) {
  s.addShape(pres.ShapeType.line, { x, y, w, h: 0, line: { color, width: 1.5, endArrowType: "triangle" } });
}

function stat(s, { x, y, w, value, label, size = 40 }) {
  s.addText(value, { x, y, w, h: 0.64, margin: 0, fontFace: F.head, fontSize: size, bold: true, color: C.yellow });
  s.addText(label, { x, y: y + 0.68, w, h: 0.6, margin: 0, fontFace: F.body, fontSize: 11.5, color: C.grey, lineSpacing: 15 });
}

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

/* ── Icons ────────────────────────────────────────────────────────────────────────────────────
 * Drawn from primitive shapes rather than a font, so nothing depends on a glyph being installed.
 * A yellow ring, and a simple white mark inside it. `seg` draws a line between any two points by
 * placing its bounding box at the min corner and flipping to get the direction. */
function seg(s, x1, y1, x2, y2, w = 2, col = C.white) {
  s.addShape(pres.ShapeType.line, {
    x: Math.min(x1, x2), y: Math.min(y1, y2),
    w: Math.abs(x2 - x1) || 0.001, h: Math.abs(y2 - y1) || 0.001,
    line: { color: col, width: w, capType: "rnd" },
    flipH: x2 < x1, flipV: y2 < y1,
  });
}

function icon(s, kind, cx, cy, r = 0.28) {
  s.addShape(pres.ShapeType.ellipse, { x: cx - r, y: cy - r, w: 2 * r, h: 2 * r, fill: { type: "none" }, line: { color: C.yellow, width: 1.75 } });
  const sq = (x, y) => s.addShape(pres.ShapeType.rect, { x, y, w: 0.07, h: 0.07, fill: { color: C.white }, line: { width: 0 } });
  switch (kind) {
    case "input": // a terminal prompt  ›_
      seg(s, cx - 0.08, cy - 0.08, cx - 0.005, cy);
      seg(s, cx - 0.005, cy, cx - 0.08, cy + 0.08);
      seg(s, cx + 0.02, cy + 0.09, cx + 0.11, cy + 0.09);
      break;
    case "decision": // a decision diamond
      s.addShape(pres.ShapeType.diamond, { x: cx - 0.1, y: cy - 0.1, w: 0.2, h: 0.2, fill: { type: "none" }, line: { color: C.white, width: 2 } });
      break;
    case "output": // a checkmark
      seg(s, cx - 0.11, cy + 0.0, cx - 0.03, cy + 0.09, 2.5);
      seg(s, cx - 0.03, cy + 0.09, cx + 0.12, cy - 0.1, 2.5);
      break;
    case "grid": // three-plus specialists — a 2×2 grid
      sq(cx - 0.09, cy - 0.09); sq(cx + 0.02, cy - 0.09); sq(cx - 0.09, cy + 0.02); sq(cx + 0.02, cy + 0.02);
      break;
    case "branch": // routing — one line forking to two
      seg(s, cx - 0.11, cy, cx - 0.01, cy);
      seg(s, cx - 0.01, cy, cx + 0.1, cy - 0.08);
      seg(s, cx - 0.01, cy, cx + 0.1, cy + 0.08);
      break;
    case "check": // acts then verifies
      seg(s, cx - 0.1, cy + 0.0, cx - 0.03, cy + 0.08, 2.4);
      seg(s, cx - 0.03, cy + 0.08, cx + 0.11, cy - 0.09, 2.4);
      break;
    case "eye": // every step visible
      s.addShape(pres.ShapeType.ellipse, { x: cx - 0.13, y: cy - 0.08, w: 0.26, h: 0.16, fill: { type: "none" }, line: { color: C.white, width: 1.6 } });
      s.addShape(pres.ShapeType.ellipse, { x: cx - 0.032, y: cy - 0.032, w: 0.064, h: 0.064, fill: { color: C.yellow }, line: { width: 0 } });
      break;
    case "shield": // works behind firewalls
      seg(s, cx - 0.1, cy - 0.09, cx + 0.1, cy - 0.09, 1.9);
      seg(s, cx - 0.1, cy - 0.09, cx, cy + 0.12, 1.9);
      seg(s, cx + 0.1, cy - 0.09, cx, cy + 0.12, 1.9);
      break;
    case "lock": // read-only by default
      s.addShape(pres.ShapeType.rect, { x: cx - 0.09, y: cy - 0.01, w: 0.18, h: 0.12, fill: { type: "none" }, line: { color: C.white, width: 1.6 } });
      seg(s, cx - 0.05, cy - 0.01, cx - 0.05, cy - 0.07, 1.6);
      seg(s, cx - 0.05, cy - 0.07, cx + 0.05, cy - 0.07, 1.6);
      seg(s, cx + 0.05, cy - 0.07, cx + 0.05, cy - 0.01, 1.6);
      break;
    case "network": { // correlate across machines — a centre node linked to three satellites
      const dot = (x, y, fill = C.white) => s.addShape(pres.ShapeType.ellipse, { x: x - 0.028, y: y - 0.028, w: 0.056, h: 0.056, fill: { color: fill }, line: { width: 0 } });
      const pts = [[cx - 0.12, cy - 0.09], [cx + 0.12, cy - 0.09], [cx, cy + 0.12]];
      pts.forEach(([px, py]) => seg(s, cx, cy, px, py, 1.5, C.white));
      pts.forEach(([px, py]) => dot(px, py, C.yellow));
      dot(cx, cy);
      break;
    }
    case "layers": // read logs from many platforms — three stacked records
      [-0.09, 0.0, 0.09].forEach((dy) => s.addShape(pres.ShapeType.rect, { x: cx - 0.11, y: cy + dy - 0.018, w: 0.22, h: 0.036, fill: { color: dy === -0.09 ? C.yellow : C.white }, line: { width: 0 } }));
      break;
    case "expand": // widen safe action — four arrowheads pushing outward
      seg(s, cx, cy, cx - 0.11, cy - 0.11, 1.7); seg(s, cx - 0.11, cy - 0.11, cx - 0.04, cy - 0.11, 1.7); seg(s, cx - 0.11, cy - 0.11, cx - 0.11, cy - 0.04, 1.7);
      seg(s, cx, cy, cx + 0.11, cy - 0.11, 1.7); seg(s, cx + 0.11, cy - 0.11, cx + 0.04, cy - 0.11, 1.7); seg(s, cx + 0.11, cy - 0.11, cx + 0.11, cy - 0.04, 1.7);
      seg(s, cx, cy, cx - 0.11, cy + 0.11, 1.7); seg(s, cx - 0.11, cy + 0.11, cx - 0.04, cy + 0.11, 1.7); seg(s, cx - 0.11, cy + 0.11, cx - 0.11, cy + 0.04, 1.7);
      seg(s, cx, cy, cx + 0.11, cy + 0.11, 1.7); seg(s, cx + 0.11, cy + 0.11, cx + 0.04, cy + 0.11, 1.7); seg(s, cx + 0.11, cy + 0.11, cx + 0.11, cy + 0.04, 1.7);
      break;
  }
}

/* ══════════════════════════ 01 — TITLE ══════════════════════════ */
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  eyMark(s);
  beam(s, { x: 0.9, y: 2.28, w: 4.4, scale: 1.5 });
  s.addText("Aurora Ops", { x: 0.86, y: 2.84, w: 11, h: 1.12, margin: 0, fontFace: F.head, fontSize: 60, bold: true, color: C.white });
  s.addText("Agentic IT Operations", { x: 0.9, y: 4.02, w: 11, h: 0.5, margin: 0, fontFace: F.head, fontSize: 23, color: C.yellow });
  s.addText("A symptom goes in. Judgement happens. A verified answer comes out.", { x: 0.9, y: 4.68, w: 9.6, h: 0.4, margin: 0, fontFace: F.body, fontSize: 14, color: C.grey });
  s.addShape(pres.ShapeType.line, { x: 0.9, y: 5.56, w: 3.2, h: 0, line: { color: C.line, width: 1 } });
  s.addText("Gourav Kumar Bathwal", { x: 0.9, y: 5.72, w: 6, h: 0.3, margin: 0, fontFace: F.mono, fontSize: 11.5, color: C.muted });
}

/* ══════════════════════════ 02 — PROBLEM STATEMENT ══════════════════════════ */
{
  const s = slide("Problem Statement", "Detection is solved — judgement is not.");

  const stages = [
    ["Detect", "automated since the 1990s"],
    ["Diagnose", "still done by a person"],
    ["Act & verify", "still done by a person"],
  ];
  stages.forEach(([t, sub], i) => {
    const x = 0.62 + i * 4.05;
    node(s, { x, y: 2.34, w: 3.5, h: 1.12, title: t, sub });
    if (i < 2) arrow(s, { x: x + 3.6, y: 2.9, w: 0.35 });
  });

  // Proofread: each label now reads as a complete sentence with its number, so "under 5%"
  // is never left dangling next to an incomplete phrase.
  const stats = [
    ["10,000+", "alerts reach the average\noperations team every day"],
    ["Under 5%", "of those alerts actually\nneed a human to act"],
    ["44%", "of organisations had an outage\nfrom an alert they had ignored"],
  ];
  stats.forEach(([v, l], i) => stat(s, { x: 0.62 + i * 4.05, y: 4.2, w: 3.75, value: v, label: l, size: 34 }));

  s.addText("Source: 2026 State of Production Reliability survey — 1,039 SRE, DevOps and IT operations practitioners.", {
    x: 0.62, y: 6.56, w: 10.5, h: 0.3, margin: 0, fontFace: F.mono, fontSize: 9, color: C.dim,
  });
  s.addNotes("Sit on the third statistic. That outage was not caused by missing information — somebody had already been told, and had learned to stop listening.");
}

/* ══════════════════════════ 03 — WHY IT PERSISTS ══════════════════════════ */
{
  const s = slide("Why It Persists", "More monitoring made the problem worse.");

  const chain = [
    ["More monitoring", "every system gains an alarm"],
    ["More alerts", "thousands a day, mostly noise"],
    ["Alerts get muted", "a rational response to noise"],
    ["Outages", "the real one was in the pile"],
  ];
  chain.forEach(([t, sub], i) => {
    const x = 0.62 + i * 3.06;
    node(s, { x, y: 2.32, w: 2.62, h: 1.18, title: t, sub });
    if (i < 3) arrow(s, { x: x + 2.68, y: 2.91, w: 0.3 });
  });

  const why = [
    ["It does not scale", "Every new machine multiplies the same manual checking. Headcount is the only lever anyone has."],
    ["It is knowledge-gated", "A senior engineer knows which six things to check. A junior does not, so the ticket escalates."],
    ["Tools stop one step short", "A dashboard says CPU is 94%. It cannot say which process, why, or whether it matters."],
  ];
  why.forEach(([t, b], i) => {
    const x = 0.62 + i * 4.05;
    card(s, { x, y: 4.16, w: 3.72, h: 2.14, accent: true });
    s.addText(t, { x: x + 0.34, y: 4.44, w: 3.14, h: 0.34, margin: 0, fontFace: F.head, fontSize: 15, bold: true, color: C.white });
    s.addText(b, { x: x + 0.34, y: 4.92, w: 3.1, h: 1.24, margin: 0, fontFace: F.body, fontSize: 11.5, color: C.grey, lineSpacing: 16 });
  });
  s.addNotes("The problem is not that IT is slow. It is that the obvious fix — more monitoring — is what produced the current failure mode.");
}

/* ══════════════════════════ 04 — SOLUTION ══════════════════════════ */
{
  const s = slide("Our Solution", "Input · Judgement · Verified output.");

  beam(s, { x: 0.62, y: 2.5, w: 11.9, scale: 1.9 });

  const parts = [
    ["input", "Input", "You describe the symptom", "“Disk is nearly full”, in your own words —\nnot a command, not the name of an agent.", 0.62],
    ["decision", "Inflection", "Judgement happens here", "Which checks matter, in what order, and what\nthe results mean. The part nobody automated.", 4.86],
    ["output", "Output", "A verified answer", "Plain language, a one-word verdict, and the full\nrecord of every step it took to get there.", 9.1],
  ];
  parts.forEach(([ic, tag, head, body, x], i) => {
    icon(s, ic, x + 0.31, 3.42, 0.3);
    s.addText(tag.toUpperCase(), {
      x: x + 0.78, y: 3.22, w: 3.0, h: 0.26, margin: 0,
      fontFace: F.mono, fontSize: 10, bold: true, color: i === 1 ? C.yellow : C.muted, charSpacing: 1.8,
    });
    s.addText(head, { x: x + 0.78, y: 3.47, w: 3.4, h: 0.32, margin: 0, fontFace: F.head, fontSize: 15, bold: true, color: C.white });
    s.addText(body, { x, y: 4.28, w: 3.9, h: 0.9, margin: 0, fontFace: F.body, fontSize: 11.5, color: C.grey, lineSpacing: 16 });
  });

  s.addText("The middle block is the product. Everything either side of it already exists.", {
    x: 0.62, y: 5.94, w: 10, h: 0.34, margin: 0, fontFace: F.head, fontSize: 14, bold: true, color: C.yellow,
  });
  s.addNotes("Point at the yellow square. Input and output are commodity — a text box and a report. The judgement between them is what had no automation before agents.");
}

/* ══════════════════════════ 05 — HOW IT WORKS ══════════════════════════ */
{
  const s = slide("How It Works", "The agent chooses its own next step.");

  card(s, { x: 0.62, y: 2.16, w: 6.1, h: 4.16, accent: true });
  s.addText("THE LOOP INSIDE ONE AGENT", { x: 0.96, y: 2.44, w: 5.2, h: 0.26, margin: 0, fontFace: F.mono, fontSize: 9.5, bold: true, color: C.muted, charSpacing: 1.4 });
  node(s, { x: 1.5, y: 2.94, w: 4.3, h: 0.9, title: "The model decides", sub: "which tool to call next" });
  node(s, { x: 1.5, y: 4.62, w: 4.3, h: 0.9, title: "Your code runs it", sub: "a real reading from the machine" });
  s.addShape(pres.ShapeType.line, { x: 2.2, y: 3.84, w: 0, h: 0.78, line: { color: C.yellow, width: 1.5, endArrowType: "triangle" } });
  s.addShape(pres.ShapeType.line, { x: 5.1, y: 3.84, w: 0, h: 0.78, line: { color: C.yellow, width: 1.5, beginArrowType: "triangle" } });
  s.addText("repeats until it has seen enough", { x: 1.5, y: 5.68, w: 4.3, h: 0.28, margin: 0, fontFace: F.mono, fontSize: 9.5, color: C.muted, align: "center" });

  card(s, { x: 7.02, y: 2.16, w: 5.7, h: 4.16, accent: true });
  s.addText("ONE REAL RUN, MEASURED", { x: 7.36, y: 2.44, w: 5, h: 0.26, margin: 0, fontFace: F.mono, fontSize: 9.5, bold: true, color: C.yellow, charSpacing: 1.4 });
  const facts = [
    ["11", "tools called, each chosen by the model"],
    ["3.4s", "start to a verified report"],
    ["1", "word verdict — healthy, warning or critical"],
  ];
  facts.forEach(([v, l], i) => {
    const y = 2.98 + i * 1.02;
    s.addText(v, { x: 7.36, y, w: 1.5, h: 0.56, margin: 0, fontFace: F.head, fontSize: 27, bold: true, color: C.yellow });
    s.addText(l, { x: 9.0, y: y + 0.12, w: 3.4, h: 0.52, margin: 0, fontFace: F.body, fontSize: 11.5, color: C.grey, lineSpacing: 15 });
  });
  s.addText("Three specialists exist — health, logs, backup. A router reads your request and picks one.", {
    x: 7.36, y: 5.94, w: 5.0, h: 0.4, margin: 0, fontFace: F.body, fontSize: 11, color: C.muted, lineSpacing: 15,
  });
  s.addNotes("If asked whether this is really agentic: nothing in the code says high memory should trigger a process check. The model chose that from what it had just read.");
}

/* ══════════════════════════ 06 — ORCHESTRATION ══════════════════════════ */
{
  const s = slide("Orchestration", "Inside, the AI decides — between, we do.");

  card(s, { x: 0.62, y: 2.16, w: 5.86, h: 4.22, accent: true });
  s.addText("PICKING ONE SPECIALIST", { x: 0.96, y: 2.44, w: 5, h: 0.26, margin: 0, fontFace: F.mono, fontSize: 9.5, bold: true, color: C.muted, charSpacing: 1.4 });
  node(s, { x: 1.0, y: 3.7, w: 1.9, h: 1.1, title: "Router", sub: "reads your words" });
  s.addShape(pres.ShapeType.line, { x: 2.9, y: 4.25, w: 0.45, h: 0, line: { color: C.yellow, width: 1.5 } });
  s.addShape(pres.ShapeType.line, { x: 3.35, y: 3.29, w: 0, h: 1.92, line: { color: C.yellow, width: 1.5 } });
  ["System Health", "Log Analyzer", "Backup & DR"].forEach((t, i) => {
    const cy = 3.29 + i * 0.96;
    arrow(s, { x: 3.35, y: cy, w: 0.5, color: C.yellow });
    node(s, { x: 3.85, y: cy - 0.38, w: 2.25, h: 0.76, title: t });
  });

  card(s, { x: 6.86, y: 2.16, w: 5.86, h: 4.22, accent: true });
  s.addText("DIAGNOSE · DECIDE · ACT · VERIFY", { x: 7.2, y: 2.44, w: 5, h: 0.26, margin: 0, fontFace: F.mono, fontSize: 9.5, bold: true, color: C.yellow, charSpacing: 1.4 });
  const steps = ["Read the evidence", "Does it need a fix?", "Take the fix", "Check it actually worked"];
  steps.forEach((t, i) => {
    node(s, { x: 7.3, y: 2.86 + i * 0.8, w: 5.0, h: 0.58, title: t });
    if (i < 3) s.addShape(pres.ShapeType.line, { x: 9.8, y: 3.44 + i * 0.8, w: 0, h: 0.22, line: { color: C.yellow, width: 1.4, endArrowType: "triangle" } });
  });
  s.addText("No fix needed? It skips straight to verifying.", {
    x: 7.3, y: 6.14, w: 5.0, h: 0.24, margin: 0, fontFace: F.mono, fontSize: 9.5, color: C.dim, align: "center",
  });
  s.addNotes("Left: you do not need to know which specialist owns your problem. Right: the fix is skipped when the diagnosis does not call for it — and the last step checks the work rather than assuming it.");
}

/* ══════════════════════════ 07 — FEATURES ══════════════════════════ */
{
  const s = slide("Features", "Built as a product, not a prototype.");

  const feats = [
    ["grid", "Three specialists", "Health, logs, backup — each holds only its own tools."],
    ["branch", "Plain-English routing", "Describe a symptom; it picks the right agent for you."],
    ["check", "Acts, then verifies", "Takes the fix and confirms it actually worked."],
    ["eye", "Every step visible", "The full record of what it ran and what came back."],
    ["shield", "Works behind firewalls", "The machine calls out; nothing inbound is opened."],
    ["lock", "Read-only by default", "Only one agent can change anything, and only backups."],
  ];
  feats.forEach(([ic, t, b], i) => {
    const x = 0.62 + (i % 3) * 4.05;
    const y = 2.12 + Math.floor(i / 3) * 2.2;
    card(s, { x, y, w: 3.72, h: 1.94, accent: true });
    icon(s, ic, x + 0.55, y + 0.5, 0.24);
    s.addText(t, { x: x + 0.34, y: y + 0.88, w: 3.14, h: 0.34, margin: 0, fontFace: F.head, fontSize: 14, bold: true, color: C.white });
    s.addText(b, { x: x + 0.34, y: y + 1.26, w: 3.1, h: 0.56, margin: 0, fontFace: F.body, fontSize: 11, color: C.grey, lineSpacing: 15 });
  });
}

/* ══════════════════════════ 08 — FLEET CONNECTIVITY ══════════════════════════ */
{
  const s = slide("Fleet Connectivity", "They call us — we never call them.");

  card(s, { x: 0.62, y: 2.4, w: 4.3, h: 2.72, accent: true });
  s.addText("OUR SERVER", { x: 0.96, y: 2.64, w: 3.6, h: 0.3, margin: 0, fontFace: F.head, fontSize: 15, bold: true, color: C.white });
  s.addText("Pins a job to a list, then waits.\n\nNever leaves the building.", { x: 0.96, y: 3.18, w: 3.6, h: 1.6, margin: 0, fontFace: F.body, fontSize: 12, color: C.grey, lineSpacing: 18 });

  card(s, { x: 8.42, y: 2.4, w: 4.3, h: 2.72, accent: true });
  s.addText("THEIR MACHINE", { x: 8.76, y: 2.64, w: 3.6, h: 0.3, margin: 0, fontFace: F.head, fontSize: 15, bold: true, color: C.white });
  s.addText("A small program asks every 3 seconds.\n\nDoes the work locally.", { x: 8.76, y: 3.18, w: 3.6, h: 1.6, margin: 0, fontFace: F.body, fontSize: 12, color: C.grey, lineSpacing: 18 });

  const hops = [
    ["Enrol — once, with a one-time pass", 2.86],
    ["Anything for me? — every 3 seconds", 3.6],
    ["Here is the answer", 4.34],
  ];
  hops.forEach(([label, y]) => {
    s.addShape(pres.ShapeType.line, { x: 5.08, y, w: 3.26, h: 0, line: { color: C.yellow, width: 1.6, beginArrowType: "triangle" } });
    s.addText(label, { x: 5.08, y: y - 0.34, w: 3.26, h: 0.28, margin: 0, fontFace: F.mono, fontSize: 9.5, color: C.yellow, align: "center" });
  });

  s.addShape(pres.ShapeType.line, { x: 5.6, y: 5.46, w: 2.2, h: 0, line: { color: C.line, width: 1.4, dashType: "dash" } });
  seg(s, 6.56, 5.34, 6.8, 5.58, 1.8, C.dim);
  seg(s, 6.8, 5.34, 6.56, 5.58, 1.8, C.dim);
  s.addText("No connection ever runs this way — nothing inbound is opened on their network.", {
    x: 0.62, y: 5.86, w: 11.9, h: 0.32, margin: 0, fontFace: F.body, fontSize: 12.5, color: C.grey, align: "center",
  });
  s.addNotes("This answers 'how would you ever get into a customer's network?'. You do not. They come to you, and that is why no firewall change is needed.");
}

/* ══════════════════════════ 09 — APPLICATION SNAPSHOTS ══════════════════════════ */
{
  const s = slide("Application Snapshots", "The running product, not mockups.");

  const BW = 5.9, BH = 2.34, GX = 0.3, GY = 0.2, X0 = 0.62, Y0 = 1.94;
  const cell = (c, r) => ({ x: X0 + c * (BW + GX), y: Y0 + r * (BH + GY), w: BW, h: BH });
  shot(s, "ss-console",   { ...cell(0, 0), label: "Run an agent — ask on the left, watch on the right" });
  shot(s, "ss-graph",     { ...cell(1, 0), label: "The remediation chain the backend actually walks" });
  shot(s, "ss-dashboard", { ...cell(0, 1), label: "Every run recorded, scored and broken down" });
  shot(s, "ss-hosts",     { ...cell(1, 1), label: "The fleet — enrolled machines, and pending ones" });
}

/* ══════════════════════════ 10 — INSIDE A RUN ══════════════════════════ */
{
  const s = slide("Inside a Run", "Every step the agent took, in full.");
  shot(s, "ss-run", { x: 1.66, y: 2.0, w: 10.0, h: 4.6, label: "The plan, then every tool call and its result — beside the verdict" });
  s.addNotes("The trust slide. CPU 23.2%, memory 86.3%, disk 59.6% — real readings from this laptop, not a mockup. If anyone asks whether the output is genuine, this is the answer.");
}

/* ══════════════════════════ 11 — ARCHITECTURE ══════════════════════════ */
{
  const s = slide("Architecture", "How a request becomes a verified report.");

  const chain = [
    ["Browser", "Next.js console"],
    ["API", "FastAPI"],
    ["Route", "LangGraph"],
    ["Agent", "LLM on Groq"],
    ["Tools", "Python on the host"],
  ];
  chain.forEach(([t, sub], i) => {
    const x = 0.62 + i * 2.45;
    node(s, { x, y: 2.16, w: 2.06, h: 1.14, title: t, sub });
    if (i < 4) arrow(s, { x: x + 2.12, y: 2.73, w: 0.28, color: C.yellow });
  });

  s.addShape(pres.ShapeType.line, { x: 10.42, y: 3.44, w: 0, h: 0.36, line: { color: C.yellow, width: 1.5 } });
  s.addShape(pres.ShapeType.line, { x: 8.0, y: 3.8, w: 2.42, h: 0, line: { color: C.yellow, width: 1.5 } });
  s.addShape(pres.ShapeType.line, { x: 8.0, y: 3.44, w: 0, h: 0.36, line: { color: C.yellow, width: 1.5, endArrowType: "triangle" } });
  s.addText("repeats until the agent has seen enough", { x: 7.4, y: 3.86, w: 3.9, h: 0.28, margin: 0, fontFace: F.mono, fontSize: 10, color: C.yellow, align: "center" });

  const cols = [
    ["Console", "Next.js 16 · React 19\nTailwind v4\nframer-motion"],
    ["Service", "FastAPI · Python\nSQLite\nlocal / SSH / agent daemon"],
    ["Agents", "LangGraph · LangChain\nGroq llama-3.3-70b\n33 tools, temperature 0"],
  ];
  cols.forEach(([t, b], i) => {
    const x = 0.62 + i * 4.05;
    card(s, { x, y: 4.48, w: 3.72, h: 1.9, accent: true });
    // Title larger than the body beneath it (was smaller — a review correction).
    s.addText(t, { x: x + 0.34, y: 4.72, w: 3.1, h: 0.3, margin: 0, fontFace: F.head, fontSize: 14, bold: true, color: C.white });
    s.addText(b, { x: x + 0.34, y: 5.16, w: 3.14, h: 1.06, margin: 0, fontFace: F.mono, fontSize: 11, color: C.grey, lineSpacing: 16 });
  });
}

/* ══════════════════════════ 12 — COMPETITIVE LANDSCAPE ══════════════════════════ */
{
  const s = slide("Competitive Landscape", "Everyone else stops somewhere.");

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
    s.addText(h.toUpperCase(), { x: colX[i], y: 2.4, w: colW[i], h: 0.26, margin: 0, fontFace: F.mono, fontSize: 9, bold: true, color: C.muted, charSpacing: 1.2 });
  });
  rows.forEach((r, ri) => {
    const y = 2.78 + ri * 0.52;
    const ours = ri === 5;
    if (ours) s.addShape(pres.ShapeType.rect, { x: 0.5, y: y - 0.08, w: 9.26, h: 0.48, fill: { color: C.panel2 }, line: { width: 0 } });
    r.forEach((cell, ci) => {
      s.addText(cell, {
        x: colX[ci], y, w: colW[ci], h: 0.3, margin: 0,
        fontFace: ci === 0 ? F.body : F.mono, fontSize: ci === 0 ? 11.5 : 10.5,
        bold: ours && ci === 0,
        color: ours ? (ci === 0 ? C.white : C.yellow) : (/^No/.test(cell) ? C.dim : C.grey),
      });
    });
  });

  card(s, { x: 10.06, y: 2.3, w: 2.66, h: 4.06, accent: true });
  s.addText("WHERE WE WIN", { x: 10.4, y: 2.58, w: 2.1, h: 0.26, margin: 0, fontFace: F.mono, fontSize: 9.5, bold: true, color: C.yellow, charSpacing: 1.4 });
  const wins = [
    ["No estate needed", "They need Kubernetes or a full observability stack. We need a machine."],
    ["We close the loop", "Cleric is read-only by design — a safety feature, and a ceiling."],
    ["We check our work", "A supervisor states whether it is actually resolved."],
  ];
  wins.forEach(([t, b], i) => {
    const y = 3.02 + i * 1.08;
    s.addText(t, { x: 10.4, y, w: 2.14, h: 0.28, margin: 0, fontFace: F.head, fontSize: 12.5, bold: true, color: C.white });
    s.addText(b, { x: 10.4, y: y + 0.32, w: 2.1, h: 0.72, margin: 0, fontFace: F.body, fontSize: 10, color: C.grey, lineSpacing: 13.5 });
  });

  s.addText("Said honestly: correlating findings across many machines is where the funded players are ahead. That is our roadmap, not our claim.", {
    x: 0.62, y: 6.5, w: 11.9, h: 0.32, margin: 0, fontFace: F.body, fontSize: 11, color: C.muted,
  });
  s.addNotes("Do not oversell. The strong, true claim is the first column: everyone else needs an estate we do not. Cleric's own positioning — read-only by design — is the cleanest proof that closing the loop is genuinely differentiated.");
}

/* ══════════════════════════ 13 — OUTCOMES & IMPACT ══════════════════════════ */
{
  const s = slide("Outcomes & Impact", "What automating judgement actually saves.");

  s.addText("MEASURED ON THIS MACHINE", { x: 0.62, y: 2.02, w: 5, h: 0.26, margin: 0, fontFace: F.mono, fontSize: 9.5, bold: true, color: C.muted, charSpacing: 1.4 });
  const runs = [
    ["1.4s", "for a targeted question\n(2 tool calls)"],
    ["3.4s", "for a full health check\n(7 tool calls)"],
    ["11.8s", "to diagnose, act and verify\n(2 agents, 4 stages)"],
  ];
  runs.forEach(([v, l], i) => stat(s, { x: 0.62 + i * 2.72, y: 2.4, w: 2.55, value: v, label: l, size: 32 }));

  s.addText("WHAT THAT CHANGES", { x: 0.62, y: 4.16, w: 5, h: 0.26, margin: 0, fontFace: F.mono, fontSize: 9.5, bold: true, color: C.muted, charSpacing: 1.4 });
  const gains = [
    ["Time to a verified answer", "about 35 minutes", "11.8 seconds"],
    ["Checks per investigation", "whatever you recall", "up to 11, chosen live"],
    ["Record of what was done", "a ticket comment", "every tool call, logged"],
  ];
  gains.forEach(([label, before, after], i) => {
    const y = 4.54 + i * 0.6;
    s.addText(label, { x: 0.62, y, w: 3.3, h: 0.3, margin: 0, fontFace: F.body, fontSize: 11.5, color: C.grey });
    s.addText(before, { x: 4.06, y, w: 2.2, h: 0.3, margin: 0, fontFace: F.mono, fontSize: 10.5, color: C.dim });
    s.addShape(pres.ShapeType.line, { x: 6.4, y: y + 0.14, w: 0.3, h: 0, line: { color: C.yellow, width: 1.25, endArrowType: "triangle" } });
    s.addText(after, { x: 6.92, y, w: 2.5, h: 0.3, margin: 0, fontFace: F.mono, fontSize: 10.5, color: C.yellow });
  });

  card(s, { x: 9.6, y: 1.96, w: 3.12, h: 4.46, accent: true });
  s.addText("TIME TO A VERIFIED ANSWER", { x: 9.94, y: 2.26, w: 2.6, h: 0.42, margin: 0, fontFace: F.mono, fontSize: 9, bold: true, color: C.muted, charSpacing: 1.2 });
  // A clean number comparison, not a proportional bar. At 11.8s against 35min the yellow bar was
  // a tiny nub that read as broken; the contrast now lives in the numbers and the multiple.
  s.addText("Manual", { x: 9.94, y: 2.76, w: 1.0, h: 0.26, margin: 0, fontFace: F.body, fontSize: 11.5, color: C.grey });
  s.addText("~35 min", { x: 11.0, y: 2.76, w: 1.4, h: 0.26, margin: 0, fontFace: F.mono, fontSize: 11, color: C.grey, align: "right" });
  s.addText("Aurora Ops", { x: 9.94, y: 3.14, w: 1.02, h: 0.26, margin: 0, fontFace: F.body, fontSize: 11.5, color: C.white });
  s.addText("11.8 s", { x: 11.0, y: 3.14, w: 1.4, h: 0.26, margin: 0, fontFace: F.mono, fontSize: 11, bold: true, color: C.yellow, align: "right" });
  s.addText("≈ 180× faster", { x: 9.94, y: 3.64, w: 2.5, h: 0.36, margin: 0, fontFace: F.head, fontSize: 16, bold: true, color: C.yellow });
  s.addShape(pres.ShapeType.line, { x: 9.94, y: 4.4, w: 2.44, h: 0, line: { color: C.line, width: 1 } });
  stat(s, { x: 9.94, y: 4.58, w: 2.5, value: "~11 hrs", label: "saved per week at 20\nroutine investigations", size: 30 });
  s.addText("The 11.8s is measured. The 35 minutes is an estimate, and the saving scales from it.", {
    x: 9.94, y: 5.9, w: 2.56, h: 0.48, margin: 0, fontFace: F.body, fontSize: 9.5, color: C.dim, italic: true, lineSpacing: 12.5,
  });
  s.addNotes("Be straight about the arithmetic. Run times are measured; the 35-minute baseline is an assumption printed on the slide. If pushed, offer to recompute with their number.");
}

/* ══════════════════════════ 14 — THE ROAD AHEAD ══════════════════════════
 * A three-phase forward roadmap, drawn as a timeline: an icon node per milestone, connected by
 * a yellow rail, with a phase tag, a title, and a line of detail beneath each. No "today"
 * column, no closing bookend, no links — the future is the whole slide. */
{
  const s = slide("The Road Ahead", "Three moves from a working tool to a platform.");

  const CY = 3.62;                 // the rail, and the centre of every icon node
  const R = 0.46;                  // icon-node radius
  const cols = [2.64, 6.665, 10.69];

  // The rail — drawn in the gaps between nodes so it never crosses an icon.
  for (let i = 0; i < cols.length - 1; i++) {
    s.addShape(pres.ShapeType.line, { x: cols[i] + R + 0.06, y: CY, w: cols[i + 1] - cols[i] - 2 * R - 0.12, h: 0, line: { color: C.yellow, width: 1.75 } });
  }

  const milestones = [
    ["network", "Near-term", "Fleet-wide correlation",
      "See that a failure on one machine caused a failure on another. The transport layer is already built for it."],
    ["layers", "Mid-term", "Real log platforms",
      "Read straight from Splunk, Loki and CloudWatch — swap the file reader for a platform client, no agent change."],
    ["expand", "Horizon", "Wider safe action",
      "Extend autonomous remediation beyond backup and recovery, one reversible action at a time."],
  ];

  milestones.forEach(([ic, phase, title, body], i) => {
    const cx = cols[i];
    // A filled charcoal disc under the ring so the rail cannot show through the node's centre.
    s.addShape(pres.ShapeType.ellipse, { x: cx - R, y: CY - R, w: 2 * R, h: 2 * R, fill: { color: C.bg }, line: { width: 0 } });
    icon(s, ic, cx, CY, R);

    s.addText(phase.toUpperCase(), { x: cx - 1.9, y: CY + R + 0.24, w: 3.8, h: 0.26, margin: 0, fontFace: F.mono, fontSize: 10.5, bold: true, color: C.yellow, charSpacing: 2, align: "center" });
    s.addText(title, { x: cx - 1.9, y: CY + R + 0.56, w: 3.8, h: 0.4, margin: 0, fontFace: F.head, fontSize: 18, bold: true, color: C.white, align: "center" });
    s.addText(body, { x: cx - 1.78, y: CY + R + 1.06, w: 3.56, h: 1.1, margin: 0, fontFace: F.body, fontSize: 11.5, color: C.grey, lineSpacing: 16, align: "center" });
  });
}

/* ══════════════════════════ 15 — THANK YOU ══════════════════════════
 * The finale, and a deliberate rhyme with the title: both the opening and the close sit on the
 * beam above large type, and both are centred with no eyebrow and no page number — so the deck
 * is bookended by the same quiet composition. The beam device carries the whole meaning: input
 * on the left, the inflection, the output on the right — the argument the deck just made,
 * standing wordlessly behind "Thank you". */
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  eyMark(s);

  const MID = 6.665;               // horizontal centre of the wide layout
  const bw = 3.7;
  beam(s, { x: MID - bw / 2, y: 2.24, w: bw, scale: 1.55 });

  s.addText("Thank you.", {
    x: 0, y: 2.72, w: 13.333, h: 1.2, margin: 0, align: "center",
    fontFace: F.head, fontSize: 66, bold: true, color: C.white,
  });

  // The one line to personalise. A warm, true default for an internship close — swap it for
  // your own words.
  s.addText("For an extraordinary chapter with the EY team.", {
    x: 0, y: 4.04, w: 13.333, h: 0.5, margin: 0, align: "center",
    fontFace: F.head, fontSize: 21, color: C.yellow,
  });

  s.addShape(pres.ShapeType.line, { x: MID - 1.35, y: 5.12, w: 2.7, h: 0, line: { color: C.line, width: 1 } });

  s.addText("Gourav Kumar Bathwal", {
    x: 0, y: 5.3, w: 13.333, h: 0.34, margin: 0, align: "center",
    fontFace: F.head, fontSize: 15, bold: true, color: C.white,
  });
  s.addText("Aurora Ops  ·  Agentic IT Operations", {
    x: 0, y: 5.72, w: 13.333, h: 0.3, margin: 0, align: "center",
    fontFace: F.mono, fontSize: 11.5, color: C.muted, charSpacing: 1,
  });
}

/* A deck open in PowerPoint cannot be replaced — the write fails with EBUSY, which used to kill
   the build and leave the old file in place, so a later "clean" check would be reporting on a
   stale deck. Walk the candidates until one is writable rather than failing on the first. */
const CANDIDATES = [
  process.argv[2] ?? "Aurora-Ops-Overview.pptx",
  "Aurora-Ops-Overview.new.pptx",
  "Aurora-Ops-Overview.v2.pptx",
  "Aurora-Ops-Overview.v3.pptx",
];
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
