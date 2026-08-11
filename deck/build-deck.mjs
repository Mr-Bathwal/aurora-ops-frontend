/** Builds the Aurora Ops overview deck.
 *
 * Dark throughout, in the product's own palette — a deck about a console that is near-black
 * with mint and blue accents should not arrive as white slides with stock blue.
 *
 * Motif: rounded panel cards on the page floor, mint for the live/primary signal and blue for
 * structure. Repeated on every slide. No accent stripes, no rules under titles.
 */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const pptxgen = require("pptxgenjs");
const HERE = dirname(fileURLToPath(import.meta.url));

const C = {
  bg: "05070A",
  panel: "0E141C",
  panel2: "121A24",
  line: "223040",
  mint: "34F5C5",
  blue: "3E9CFF",
  text: "E9EFF6",
  body: "A9B7C6",
  muted: "76869A",
  warn: "FFC56B",
  crit: "FF6B81",
};

const F = { head: "Calibri", body: "Calibri" };
const img = (n) => ({ data: "image/png;base64," + readFileSync(resolve(HERE, "img", n + ".png")).toString("base64") });

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
pres.author = "Aurora Ops";
pres.title = "Aurora Ops — Agentic IT Operations";

/** Every slide opens the same way: floor colour, a small mint eyebrow, a large title. */
function slide(eyebrow, title, opts = {}) {
  const s = pres.addSlide();
  s.background = { color: C.bg };
  s.addText(eyebrow.toUpperCase(), {
    x: 0.62, y: 0.46, w: 8, h: 0.26, margin: 0,
    fontFace: F.body, fontSize: 11, bold: true, color: C.mint, charSpacing: 2.4,
  });
  s.addText(title, {
    x: 0.6, y: 0.72, w: opts.titleW ?? 11.4, h: opts.titleH ?? 0.72, margin: 0,
    fontFace: F.head, fontSize: opts.titleSize ?? 34, bold: true, color: C.text,
  });
  return s;
}

/** The repeated card. Subtle tint + hairline, never an edge stripe. */
function card(s, { x, y, w, h, fill = C.panel, line = C.line }) {
  s.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.12,
    fill: { color: fill }, line: { color: line, width: 1 },
  });
}

/* ══════════════ 1 — PROBLEM STATEMENT ══════════════ */
{
  const s = slide("Problem statement", "Monitoring solved detection.\nNobody automated the judgement.", {
    titleH: 1.24, titleSize: 32,
  });

  s.addText(
    "Alerting told us something broke twenty years ago. Scripting runs fixed steps. The reasoning " +
    "in between — read the evidence, work out what it means, decide what to do — is still a person, " +
    "at 2am, every single time.",
    { x: 0.6, y: 2.02, w: 6.35, h: 1.1, margin: 0, fontFace: F.body, fontSize: 14.5, color: C.body, lineSpacing: 22 }
  );

  // The scenario, as the slide's one loud object.
  card(s, { x: 7.35, y: 1.86, w: 5.35, h: 2.5, fill: C.panel2 });
  s.addText("A REAL INCIDENT", {
    x: 7.7, y: 2.08, w: 4.6, h: 0.24, margin: 0,
    fontFace: F.body, fontSize: 10, bold: true, color: C.mint, charSpacing: 2,
  });
  s.addText(
    "02:14 — “disk 91% on prod-db-04”. Engineer wakes, connects, runs df, finds /var full, checks " +
    "what is growing, finds log rotation failed, checks last night’s backup, fixes, verifies.",
    { x: 7.7, y: 2.42, w: 4.65, h: 1.0, margin: 0, fontFace: F.body, fontSize: 12.5, color: C.body, lineSpacing: 17 }
  );
  s.addText("35 min", {
    x: 7.7, y: 3.42, w: 1.9, h: 0.62, margin: 0,
    fontFace: F.head, fontSize: 34, bold: true, color: C.mint,
  });
  s.addText("≈30 of them identical\nto the last time", {
    x: 9.6, y: 3.5, w: 2.8, h: 0.6, margin: 0,
    fontFace: F.body, fontSize: 11.5, color: C.muted, lineSpacing: 15,
  });

  const costs = [
    ["It does not scale", "Every new server multiplies the same manual checking. Headcount is the only lever anyone has."],
    ["It is knowledge-gated", "The senior engineer knows which six things to check. The junior does not, so the ticket escalates."],
    ["Tools stop one step short", "Datadog says CPU is 94%. It cannot say which process, why, or whether it matters."],
  ];
  costs.forEach(([h, b], i) => {
    const x = 0.6 + i * 4.15;
    card(s, { x, y: 4.72, w: 3.85, h: 2.1 });
    s.addShape(pres.ShapeType.ellipse, {
      x: x + 0.32, y: 5.0, w: 0.26, h: 0.26, fill: { color: i === 2 ? C.blue : C.mint }, line: { color: C.bg, width: 0 },
    });
    s.addText(h, {
      x: x + 0.72, y: 4.96, w: 3.0, h: 0.32, margin: 0,
      fontFace: F.head, fontSize: 15, bold: true, color: C.text,
    });
    s.addText(b, {
      x: x + 0.32, y: 5.44, w: 3.25, h: 1.3, margin: 0,
      fontFace: F.body, fontSize: 12, color: C.body, lineSpacing: 16.5,
    });
  });

  s.addNotes(
    "Open here. The point is not 'IT is manual and slow' — every deck says that and a bash script fixes it. " +
    "The point is that the judgement step was never automated, which is exactly what an agent can do and a script cannot."
  );
}

/* ══════════════ 2 — SOLUTION OVERVIEW ══════════════ */
{
  const s = slide("Solution overview", "A reasoning layer between machine and operator", { titleSize: 32, titleH: 0.8 });

  s.addText(
    "Aurora Ops gives agents real tools on real machines. They decide which tools to call, hand work " +
    "to each other, and report in plain language — with every tool call shown.",
    { x: 0.6, y: 1.72, w: 8.6, h: 0.8, margin: 0, fontFace: F.body, fontSize: 15, color: C.body, lineSpacing: 22 }
  );

  const proofs = [
    ["01", "Tool choice at runtime", "25 tools over 22 probes. “Which process is eating RAM?” calls different tools than “check my disks” — chosen from what the previous call returned.", C.mint],
    ["02", "A decision, not a branch", "A supervisor reads the diagnosis and decides at runtime whether remediation is needed at all. Nobody pre-wrote that per host.", C.blue],
    ["03", "Handoff between agents", "Log Analyzer → decision → Backup & DR → a supervisor that reads the whole chain back before anything reaches you.", C.mint],
  ];
  proofs.forEach(([n, h, b, col], i) => {
    const x = 0.6 + i * 4.15;
    card(s, { x, y: 2.72, w: 3.85, h: 2.5, fill: C.panel2 });
    s.addText(n, {
      x: x + 0.32, y: 2.98, w: 1, h: 0.44, margin: 0,
      fontFace: F.head, fontSize: 22, bold: true, color: col,
    });
    s.addText(h, {
      x: x + 0.32, y: 3.46, w: 3.25, h: 0.34, margin: 0,
      fontFace: F.head, fontSize: 16, bold: true, color: C.text,
    });
    s.addText(b, {
      x: x + 0.32, y: 3.86, w: 3.25, h: 1.24, margin: 0,
      fontFace: F.body, fontSize: 12, color: C.body, lineSpacing: 16.5,
    });
  });

  // The line that separates this from a chatbot demo.
  card(s, { x: 0.6, y: 5.5, w: 12.1, h: 1.32, fill: C.panel });
  s.addText("NOT A CHATBOT WITH API ACCESS", {
    x: 0.95, y: 5.72, w: 5, h: 0.24, margin: 0,
    fontFace: F.body, fontSize: 10, bold: true, color: C.mint, charSpacing: 2,
  });
  s.addText(
    "These run against customer machines through two connection paths — a one-line agent install, or agentless SSH — " +
    "with per-request host binding, so a run can never report on the wrong server.",
    { x: 0.95, y: 6.04, w: 11.4, h: 0.66, margin: 0, fontFace: F.body, fontSize: 13, color: C.body, lineSpacing: 18 }
  );

  s.addNotes("The three cards are the whole 'why agentic'. All three are demoable live.");
}

/* ══════════════ 3 — FEATURES ══════════════ */
{
  const s = slide("Features", "Built as a product, not a prototype");

  const feats = [
    ["Fleet onboarding", "Connect a server two ways: one-line agent install, or agentless SSH. The agent polls outbound — no inbound firewall rule.", C.mint],
    ["Three live specialists", "System Health, Log Analyzer, Backup & DR — each with its own tools and its own report.", C.blue],
    ["Smart orchestrator", "Describe a symptom instead of picking an agent. One router call sends it to the right specialist.", C.mint],
    ["Remediation chain", "Diagnose → decide → remediate → verify, with the middle stage decided at runtime.", C.blue],
    ["Reasoning trace", "Every run shows which tools were called and what came back. Not a black box.", C.mint],
    ["History & dashboard", "Every run recorded — who triggered it, which agent acted, what it did, and the outcome.", C.blue],
  ];
  feats.forEach(([h, b, col], i) => {
    const cx = i % 2, cy = Math.floor(i / 2);
    const x = 0.6 + cx * 6.28;
    const y = 1.66 + cy * 1.70;
    card(s, { x, y, w: 5.95, h: 1.46, fill: cy % 2 ? C.panel2 : C.panel });
    s.addShape(pres.ShapeType.roundRect, {
      x: x + 0.3, y: y + 0.3, w: 0.34, h: 0.34, rectRadius: 0.08,
      fill: { color: col }, line: { color: col, width: 0 },
    });
    s.addText(h, {
      x: x + 0.8, y: y + 0.27, w: 4.9, h: 0.34, margin: 0,
      fontFace: F.head, fontSize: 15.5, bold: true, color: C.text,
    });
    s.addText(b, {
      x: x + 0.8, y: y + 0.68, w: 4.85, h: 0.76, margin: 0,
      fontFace: F.body, fontSize: 12, color: C.body, lineSpacing: 16,
    });
  });

  s.addText("Roadmap — Network Sentinel and Disk Auditor are provisioned in the fleet and marked standby; the router already fans out to their lanes.", {
    x: 0.6, y: 6.72, w: 12.1, h: 0.28, margin: 0, fontFace: F.body, fontSize: 11, italic: true, color: C.muted,
  });

  s.addNotes("If asked what is not live: the two standby agents. The UI already labels them standby, so nothing here overclaims.");
}

/* ══════════════ 4 — TECH STACK & DATA FLOW ══════════════ */
{
  const s = slide("Technology stack and data flow", "How a request becomes a verified report");

  // Stack, left.
  card(s, { x: 0.6, y: 1.72, w: 5.1, h: 5.1, fill: C.panel2 });
  s.addText("STACK", {
    x: 0.92, y: 1.96, w: 3, h: 0.24, margin: 0,
    fontFace: F.body, fontSize: 10, bold: true, color: C.mint, charSpacing: 2,
  });
  const stack = [
    ["Frontend", "Next.js 16 · React 19 · TypeScript"],
    ["Orchestration", "LangGraph — 2 state graphs"],
    ["Agents", "LangChain ReAct · 25 tools"],
    ["Model", "Groq llama-3.3-70b · temp 0"],
    ["API", "FastAPI — 33 endpoints"],
    ["Storage", "SQLite WAL · 10 tables · 90-day retention"],
    ["Security", "scrypt · opaque sessions · Fernet-encrypted keys"],
    ["Transports", "Local · SSH · installed agent"],
  ];
  stack.forEach(([k, v], i) => {
    const y = 2.34 + i * 0.56;
    s.addText(k, {
      x: 0.92, y, w: 1.6, h: 0.26, margin: 0,
      fontFace: F.head, fontSize: 12, bold: true, color: C.text,
    });
    s.addText(v, {
      x: 2.5, y, w: 2.95, h: 0.44, margin: 0,
      fontFace: F.body, fontSize: 11.5, color: C.body, lineSpacing: 14,
    });
  });

  // Flow, right — one column of stages with connectors.
  card(s, { x: 6.05, y: 1.72, w: 6.65, h: 5.1, fill: C.panel });
  s.addText("DATA FLOW", {
    x: 6.4, y: 1.96, w: 3, h: 0.24, margin: 0,
    fontFace: F.body, fontSize: 10, bold: true, color: C.blue, charSpacing: 2,
  });
  const flow = [
    ["Operator", "types a request in the console", C.blue],
    ["FastAPI → LangGraph", "state graph picks the route", C.blue],
    ["Agent reasons", "chooses which of its tools to call", C.mint],
    ["Host binding", "per request — never a global", C.mint],
    ["Transport", "Local · SSH · installed agent", C.mint],
    ["22 probes run", "on the customer’s machine", C.mint],
    ["Report + trace", "stored, shown with every tool call", C.blue],
  ];
  flow.forEach(([h, b, col], i) => {
    const y = 2.36 + i * 0.63;
    s.addShape(pres.ShapeType.ellipse, {
      x: 6.42, y: y + 0.07, w: 0.2, h: 0.2, fill: { color: col }, line: { color: col, width: 0 },
    });
    if (i < flow.length - 1) {
      s.addShape(pres.ShapeType.line, {
        x: 6.52, y: y + 0.27, w: 0, h: 0.43, line: { color: C.line, width: 1.5 },
      });
    }
    s.addText(h, {
      x: 6.85, y: y - 0.02, w: 2.6, h: 0.28, margin: 0,
      fontFace: F.head, fontSize: 13, bold: true, color: C.text,
    });
    s.addText(b, {
      x: 9.6, y: y - 0.02, w: 2.9, h: 0.34, margin: 0,
      fontFace: F.body, fontSize: 11.5, color: C.muted,
    });
  });

  s.addNotes(
    "Two details a technical reviewer will care about: the installed agent polls outbound, so no inbound firewall rule; " +
    "and host binding is per-request via ContextVar — a module global would leak one tenant's host into another's run."
  );
}

/* ══════════════ 5 — OUTCOMES / IMPACT ══════════════ */
{
  const s = slide("Outcomes and impact", "What changes when judgement is automated", { titleSize: 32, titleH: 0.8 });

  // Comparison, left.
  const cols = [
    ["Monitoring", "Datadog, Zabbix", C.muted],
    ["Scripts / RPA", "cron, Ansible", C.muted],
    ["Aurora Ops", "this project", C.mint],
  ];
  const rows = [
    ["Detects a problem", "yes", "—", "yes"],
    ["Diagnoses the cause", "human", "fixed steps", "agent reasons"],
    ["Decides what to do", "—", "pre-written", "at runtime"],
    ["Explains in plain language", "—", "—", "yes"],
    ["Handles a new question", "—", "new script", "same tools"],
    ["Shows its work", "—", "logs", "full trace"],
  ];
  card(s, { x: 0.6, y: 1.72, w: 7.55, h: 4.05, fill: C.panel2 });
  cols.forEach(([h, sub, col], i) => {
    const x = 3.15 + i * 1.62;
    s.addText(h, { x, y: 1.94, w: 1.55, h: 0.24, margin: 0, fontFace: F.head, fontSize: 11.5, bold: true, color: col, align: "center" });
    s.addText(sub, { x, y: 2.16, w: 1.55, h: 0.22, margin: 0, fontFace: F.body, fontSize: 9, color: C.muted, align: "center" });
  });
  rows.forEach((r, i) => {
    const y = 2.58 + i * 0.5;
    s.addText(r[0], { x: 0.92, y, w: 2.2, h: 0.28, margin: 0, fontFace: F.body, fontSize: 11.5, color: C.body });
    for (let c = 1; c <= 3; c++) {
      s.addText(r[c], {
        x: 3.15 + (c - 1) * 1.62, y, w: 1.55, h: 0.28, margin: 0, align: "center",
        fontFace: F.body, fontSize: 11.5, bold: c === 3, color: c === 3 ? C.mint : C.muted,
      });
    }
  });

  // Measured, right.
  card(s, { x: 8.5, y: 1.72, w: 4.2, h: 4.05, fill: C.panel });
  s.addText("MEASURED TODAY", {
    x: 8.82, y: 1.94, w: 3.2, h: 0.24, margin: 0,
    fontFace: F.body, fontSize: 10, bold: true, color: C.mint, charSpacing: 2,
  });
  const measured = [
    ["3.3 s", "full 3-agent remediation chain, end to end"],
    ["20.9 s", "deep health inspection — 22 probes plus reasoning"],
    ["10 → 1", "manual shell commands replaced by one snapshot"],
    ["0", "inbound firewall rules to onboard a server"],
  ];
  measured.forEach(([n, l], i) => {
    const y = 2.4 + i * 0.85;
    s.addText(n, { x: 8.82, y, w: 1.5, h: 0.42, margin: 0, fontFace: F.head, fontSize: 24, bold: true, color: C.mint });
    s.addText(l, { x: 8.82, y: y + 0.42, w: 3.6, h: 0.4, margin: 0, fontFace: F.body, fontSize: 10.5, color: C.body, lineSpacing: 13 });
  });

  // The hours model — assumptions visible on purpose.
  card(s, { x: 0.6, y: 5.98, w: 12.1, h: 0.9, fill: C.panel2 });
  s.addText("ESTIMATED HOURS SAVED", {
    x: 0.92, y: 6.14, w: 3, h: 0.22, margin: 0,
    fontFace: F.body, fontSize: 9.5, bold: true, color: C.blue, charSpacing: 2,
  });
  s.addText(
    "50 servers × 2 events/month × 25 min × 70% agent-sufficient  →  ≈29 hours/month on first-pass triage.",
    { x: 0.92, y: 6.38, w: 8.3, h: 0.36, margin: 0, fontFace: F.body, fontSize: 12, color: C.text }
  );
  s.addText("Assumption model — swap in your own fleet numbers.", {
    x: 9.4, y: 6.4, w: 3.0, h: 0.32, margin: 0, fontFace: F.body, fontSize: 10.5, italic: true, color: C.muted, align: "right",
  });

  s.addNotes(
    "Do not present the 29 hours as a measured result — it is a model, and the inputs are on the slide so anyone can " +
    "challenge them. The four numbers on the right are the ones actually measured on a laptop."
  );
}

/* ══════════════ 6 — APPLICATION SNAPSHOTS ══════════════ */
{
  const s = slide("Application snapshots", "The running product");

  // The reasoning trace leads. It is the only image that settles the question a technical
  // reviewer actually has — does it choose its tools, or is this a scripted sequence — and it
  // does so with seven real calls and their real returns.
  const shots = [
    ["trace", "Seven tool calls the agent chose itself, with what each returned — and memory correctly flagged at 90.2%", 0.6, 1.66, 6.05, 3.42],
    ["graph", "The remediation chain — every wire is an edge the backend walks", 6.9, 1.66, 5.8, 3.42],
    ["transcript", "Four agents answering one request, in sequence", 0.6, 5.32, 3.87, 1.7],
    ["workflow", "Every stage recorded, including the one that was skipped", 4.71, 5.32, 3.87, 1.7],
    ["dashboard", "Dashboard — every run recorded, scored and charted", 8.83, 5.32, 3.87, 1.7],
  ];
  shots.forEach(([name, cap, x, y, w, h]) => {
    s.addImage({ ...img(name), x, y, w, h: h - 0.42, rounding: false });
    s.addShape(pres.ShapeType.rect, {
      x, y, w, h: h - 0.42, fill: { type: "none" }, line: { color: C.line, width: 1 },
    });
    s.addText(cap, {
      x, y: y + h - 0.38, w, h: 0.34, margin: 0,
      fontFace: F.body, fontSize: 10, color: C.muted, lineSpacing: 12,
    });
  });

  s.addNotes("Live demo order if there is time: Hosts → Run an agent (show the trace) → Auto-remediate → Dashboard.");
}

const out = resolve(HERE, "Aurora-Ops-Overview.pptx");
await pres.writeFile({ fileName: out });
console.log("wrote", out);
