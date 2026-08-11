/** Builds the Aurora Ops overview deck, in EY's visual language.
 *
 * EY's identity is two things doing all the work: a charcoal ground (#2E2E38) and a single
 * saturated yellow (#FFE600) spent sparingly. Everything else is white and grey. The deck
 * follows that discipline — yellow marks exactly one thing per slide and never decorates.
 *
 * Typeface is Arial, which is EY's own sanctioned fallback for EY Interstate. A brand font we
 * do not have would silently fall back anyway; choosing the fallback deliberately means the
 * deck looks the same on every machine it opens on.
 *
 * Structure follows the argument, not the product tour: the problem, why it got worse, what we
 * built, how it works, how it reaches machines, how it is secured, who else is in the market,
 * where we win and lose, what comes next.
 */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const pptxgen = require("pptxgenjs");
const HERE = dirname(fileURLToPath(import.meta.url));

/* EY palette. Yellow is the only saturated colour in the deck — everything else is the
   charcoal/grey ramp, which is what keeps the yellow meaning something. */
const C = {
  yellow:   "FFE600",
  charcoal: "2E2E38",
  charcoal2:"3C3C48",
  white:    "FFFFFF",
  surface:  "F6F6F8",
  line:     "E1E1E6",
  lineDark: "4A4A57",
  grey:     "747480",
  greyLite: "C4C4CD",
  ink:      "2E2E38",
  // Used only where a table must encode good/bad. Desaturated to sit inside the EY ramp.
  good:     "168736",
  bad:      "B12A2A",
};

const F = { head: "Arial", body: "Arial" };
const img = (n) => ({ data: "image/png;base64," + readFileSync(resolve(HERE, "img", n + ".png")).toString("base64") });

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pres.author = "Gourav Kumar Bathwal";
pres.company = "Aurora Ops";
pres.title = "Aurora Ops — Agentic IT Operations";

/* ── Slide furniture ────────────────────────────────────────────────────────────────────── */

/** Light slide: white ground, charcoal type, a short yellow rule above the eyebrow.
 *  The rule is the only yellow most slides get. */
function slide(eyebrow, title, opts = {}) {
  const s = pres.addSlide();
  s.background = { color: C.white };
  s.addShape(pres.ShapeType.rect, {
    x: 0.62, y: 0.44, w: 0.46, h: 0.09, fill: { color: C.yellow }, line: { width: 0 },
  });
  s.addText(eyebrow.toUpperCase(), {
    x: 0.62, y: 0.62, w: 9, h: 0.26, margin: 0,
    fontFace: F.body, fontSize: 10.5, bold: true, color: C.grey, charSpacing: 2.2,
  });
  s.addText(title, {
    x: 0.6, y: 0.92, w: opts.titleW ?? 11.6, h: opts.titleH ?? 0.78, margin: 0,
    fontFace: F.head, fontSize: opts.titleSize ?? 31, bold: true, color: C.ink,
  });
  return s;
}

/** Dark slide, for the moments that should land harder. */
function slideDark(eyebrow, title, opts = {}) {
  const s = pres.addSlide();
  s.background = { color: C.charcoal };
  s.addShape(pres.ShapeType.rect, {
    x: 0.62, y: 0.44, w: 0.46, h: 0.09, fill: { color: C.yellow }, line: { width: 0 },
  });
  s.addText(eyebrow.toUpperCase(), {
    x: 0.62, y: 0.62, w: 9, h: 0.26, margin: 0,
    fontFace: F.body, fontSize: 10.5, bold: true, color: C.yellow, charSpacing: 2.2,
  });
  s.addText(title, {
    x: 0.6, y: 0.92, w: opts.titleW ?? 11.6, h: opts.titleH ?? 0.78, margin: 0,
    fontFace: F.head, fontSize: opts.titleSize ?? 31, bold: true, color: C.white,
  });
  return s;
}

function card(s, { x, y, w, h, dark = false }) {
  s.addShape(pres.ShapeType.rect, {
    x, y, w, h,
    fill: { color: dark ? C.charcoal2 : C.surface },
    line: { color: dark ? C.lineDark : C.line, width: 1 },
  });
}

function body(s, text, { x, y, w, h = 0.9, size = 13.5, color = C.grey, dark = false }) {
  s.addText(text, {
    x, y, w, h, margin: 0,
    fontFace: F.body, fontSize: size, color: dark ? C.greyLite : color, lineSpacing: size * 1.5,
  });
}

function h3(s, text, { x, y, w = 4, size = 15, dark = false }) {
  s.addText(text, {
    x, y, w, h: 0.3, margin: 0,
    fontFace: F.head, fontSize: size, bold: true, color: dark ? C.white : C.ink,
  });
}

/** A number the room should remember. Yellow only on dark grounds, charcoal on light. */
function stat(s, value, label, { x, y, w = 2.6, dark = false, accent = false }) {
  s.addText(value, {
    x, y, w, h: 0.62, margin: 0,
    fontFace: F.head, fontSize: 34, bold: true,
    color: accent ? C.yellow : dark ? C.white : C.ink,
  });
  s.addText(label, {
    x, y: y + 0.62, w, h: 0.5, margin: 0,
    fontFace: F.body, fontSize: 11, color: dark ? C.greyLite : C.grey, lineSpacing: 14,
  });
}

/** Table defaults — hairline rules, charcoal header, generous padding. */
function table(s, rows, { x, y, w, colW, dark = false, fontSize = 11.5 }) {
  s.addTable(rows, {
    x, y, w, colW,
    fontFace: F.body, fontSize,
    color: dark ? C.greyLite : C.grey,
    border: { type: "solid", color: dark ? C.lineDark : C.line, pt: 1 },
    fill: { color: dark ? C.charcoal : C.white },
    margin: [7, 10, 7, 10],
    valign: "top",
  });
}

const hdr = (t) => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.charcoal }, fontSize: 10.5, charSpacing: 1 } });

/* ══════════════════ 1 — TITLE ══════════════════ */
{
  const s = pres.addSlide();
  s.background = { color: C.charcoal };

  // The EY beam, as a motif rather than a logo: a yellow parallelogram cutting the corner.
  s.addShape(pres.ShapeType.rect, {
    x: 10.2, y: -1.4, w: 1.5, h: 6.2, fill: { color: C.yellow }, line: { width: 0 }, rotate: 28,
  });
  s.addShape(pres.ShapeType.rect, {
    x: 11.9, y: -0.6, w: 0.42, h: 6.2, fill: { color: C.yellow }, line: { width: 0 }, rotate: 28,
  });

  s.addText("AURORA OPS", {
    x: 0.75, y: 2.35, w: 8, h: 0.34, margin: 0,
    fontFace: F.body, fontSize: 13, bold: true, color: C.yellow, charSpacing: 4,
  });
  s.addText("Agentic IT operations", {
    x: 0.72, y: 2.82, w: 9.2, h: 1.0, margin: 0,
    fontFace: F.head, fontSize: 46, bold: true, color: C.white,
  });
  s.addText(
    "Detection was solved twenty years ago. The judgement that follows it — read the evidence, " +
    "decide what it means, act, then check the action worked — is still a person at 3am.",
    { x: 0.75, y: 3.98, w: 8.5, h: 0.9, margin: 0, fontFace: F.body, fontSize: 14.5, color: C.greyLite, lineSpacing: 22 }
  );

  s.addShape(pres.ShapeType.rect, { x: 0.75, y: 5.3, w: 3.4, h: 0.035, fill: { color: C.yellow }, line: { width: 0 } });
  s.addText("Gourav Kumar Bathwal", {
    x: 0.75, y: 5.5, w: 6, h: 0.3, margin: 0, fontFace: F.body, fontSize: 13, bold: true, color: C.white,
  });
  s.addText("FastAPI · LangGraph · LangChain · Groq · Next.js 16", {
    x: 0.75, y: 5.82, w: 7, h: 0.3, margin: 0, fontFace: F.body, fontSize: 11.5, color: C.grey,
  });

  s.addNotes(
    "One sentence to open with: monitoring tells you something is wrong, and that has been solved for thirty " +
    "years. Everything after the alarm is still manual. That gap is the whole product."
  );
}

/* ══════════════════ 2 — THE PROBLEM ══════════════════ */
{
  const s = slide("The problem", "Three problems get called one problem", { titleSize: 31 });

  body(s,
    "An alarm fires at 03:00. Someone wakes, logs in, types commands, forms a theory, tests it, fixes it, " +
    "checks the fix held, goes back to bed. Waking them has been automated since the 1990s. Everything after " +
    "that is still a person typing.",
    { x: 0.62, y: 1.92, w: 11.9, h: 0.85, size: 14 });

  table(s, [
    [hdr(""), hdr("The question it answers"), hdr("State of the world")],
    [{ text: "Detection", options: { bold: true, color: C.ink } },
     "“Is something wrong?”",
     { text: "Solved for thirty years. Commoditised.", options: { color: C.grey } }],
    [{ text: "Diagnosis", options: { bold: true, color: C.ink } },
     "“Why is it wrong?”",
     { text: "Expensive, manual. The current battleground.", options: { color: C.ink, bold: true } }],
    [{ text: "Remediation", options: { bold: true, color: C.ink } },
     "“Make it not wrong.”",
     { text: "Rare. Mostly still human.", options: { color: C.ink, bold: true } }],
  ], { x: 0.62, y: 3.0, w: 11.9, colW: [2.2, 4.2, 5.5] });

  card(s, { x: 0.62, y: 5.15, w: 11.9, h: 1.62 });
  s.addShape(pres.ShapeType.rect, { x: 0.62, y: 5.15, w: 0.07, h: 1.62, fill: { color: C.yellow }, line: { width: 0 } });
  h3(s, "Aurora Ops attacks rows two and three", { x: 0.95, y: 5.42, w: 8 });
  body(s,
    "This matters for positioning as much as for engineering. Presented as monitoring, it competes with Datadog " +
    "and loses. Presented as what happens after the alarm, it enters a market that is barely two years old.",
    { x: 0.95, y: 5.8, w: 11.2, h: 0.8, size: 12.5 });

  s.addNotes(
    "Do not let the room collapse these three into 'IT is slow'. The distinction is the pitch: detection is a " +
    "commodity, judgement is not, and judgement is exactly what an agent can do that a script cannot."
  );
}

/* ══════════════════ 3 — WHY IT GOT WORSE ══════════════════ */
{
  const s = slideDark("Why now", "More monitoring made it worse, not better", { titleSize: 31 });

  body(s,
    "The industry's answer to “we cannot see what is happening” was more instrumentation. It worked, and then " +
    "it overshot. The bottleneck moved from information to attention.",
    { x: 0.62, y: 1.9, w: 8.4, h: 0.8, size: 14, dark: true });

  stat(s, "44%", "of organisations had an outage in the past year\ncaused by an alert that was ignored or muted", { x: 0.62, y: 3.0, w: 3.7, dark: true, accent: true });
  stat(s, "10,000+", "alerts a day reaching the average\noperations team", { x: 4.7, y: 3.0, w: 3.7, dark: true });
  stat(s, "<5%", "of those alerts actually require\na human being", { x: 8.8, y: 3.0, w: 3.7, dark: true });

  card(s, { x: 0.62, y: 4.72, w: 11.9, h: 1.62, dark: true });
  s.addShape(pres.ShapeType.rect, { x: 0.62, y: 4.72, w: 0.07, h: 1.62, fill: { color: C.yellow }, line: { width: 0 } });
  h3(s, "Read the first number again", { x: 0.95, y: 5.0, w: 8, dark: true });
  body(s,
    "The outage was not caused by missing information. It was caused by too much of it. Someone had already been " +
    "told, and had learned to stop listening. Adding another dashboard makes that worse.",
    { x: 0.95, y: 5.38, w: 11.2, h: 0.8, size: 12.5, dark: true });

  s.addText("Source: 2026 State of Production Reliability report, n = 1,039 practitioners", {
    x: 0.62, y: 6.62, w: 9, h: 0.24, margin: 0, fontFace: F.body, fontSize: 9.5, color: C.grey,
  });

  s.addNotes("This is the strongest slide in the deck. Pause on 44%.");
}

/* ══════════════════ 4 — WHAT WE BUILT ══════════════════ */
{
  const s = slide("The solution", "Three specialists, a router, and a chain that checks itself");

  body(s,
    "Agents with real tools on real machines. They choose which tools to call, hand work along a fixed route, " +
    "and report in plain language — with every tool call shown.",
    { x: 0.62, y: 1.86, w: 11.9, h: 0.6, size: 14 });

  const agents = [
    ["System Health", "18 tools", "CPU, memory, disk, swap, network, processes, services, ports, and a fixed 13-command diagnostic menu", "Read-only"],
    ["Log Analyzer", "7 tools", "Read, tail, count error levels, search patterns, establish the time range covered", "Read-only"],
    ["Backup & DR", "8 tools", "Create, verify integrity, restore, clean up, report disaster-recovery posture", "Acts"],
  ];
  agents.forEach(([name, count, desc, mode], i) => {
    const x = 0.62 + i * 4.02;
    card(s, { x, y: 2.6, w: 3.72, h: 2.12 });
    s.addShape(pres.ShapeType.rect, { x, y: 2.6, w: 3.72, h: 0.06, fill: { color: mode === "Acts" ? C.yellow : C.greyLite }, line: { width: 0 } });
    h3(s, name, { x: x + 0.28, y: 2.86, w: 2.28, size: 14.5 });
    s.addText(count, { x: x + 2.6, y: 2.88, w: 0.9, h: 0.26, margin: 0, fontFace: F.body, fontSize: 10.5, bold: true, color: C.grey, align: "right" });
    body(s, desc, { x: x + 0.28, y: 3.28, w: 3.2, h: 1.0, size: 11.5 });
    s.addText(mode, {
      x: x + 0.28, y: 4.3, w: 2, h: 0.26, margin: 0,
      fontFace: F.body, fontSize: 10, bold: true, color: mode === "Acts" ? C.ink : C.grey, charSpacing: 1.4,
    });
  });

  card(s, { x: 0.62, y: 5.0, w: 5.85, h: 1.78 });
  h3(s, "Orchestrator", { x: 0.9, y: 5.24, w: 4 });
  body(s, "You describe a symptom, not an agent. One LLM call reads the request and routes it to whichever specialist owns it — or answers “no match” rather than forcing a wrong one.",
    { x: 0.9, y: 5.6, w: 5.3, h: 1.0, size: 11.5 });

  card(s, { x: 6.67, y: 5.0, w: 5.85, h: 1.78 });
  s.addShape(pres.ShapeType.rect, { x: 6.67, y: 5.0, w: 0.07, h: 1.78, fill: { color: C.yellow }, line: { width: 0 } });
  h3(s, "Auto-remediation chain", { x: 6.95, y: 5.24, w: 4 });
  body(s, "diagnose → decide whether action is needed → act → verify. The verify step runs no tools; it reviews what happened and states whether the issue is actually resolved.",
    { x: 6.95, y: 5.6, w: 5.3, h: 1.0, size: 11.5 });

  s.addNotes(
    "The verify node is the differentiator. Most demos stop at 'the AI did something'. This one checks. " +
    "Also worth saying: two of the three agents cannot change anything at all — that is deliberate."
  );
}

/* ══════════════════ 5 — ARCHITECTURE, THE CORE IDEA ══════════════════ */
{
  const s = slide("Architecture", "The model decides inside an agent. We decide between them.");

  body(s,
    "Two different things both get called “the flow”, and mixing them up is where most agent systems go wrong.",
    { x: 0.62, y: 1.86, w: 11.9, h: 0.4, size: 14 });

  // Inside
  card(s, { x: 0.62, y: 2.44, w: 5.85, h: 2.5 });
  s.addText("INSIDE ONE AGENT — A LOOP", {
    x: 0.9, y: 2.68, w: 5, h: 0.26, margin: 0, fontFace: F.body, fontSize: 10, bold: true, color: C.grey, charSpacing: 1.8,
  });
  body(s, "The model asks for one tool. Our Python runs it and hands back the result. The model reads it and decides what to ask for next. Nobody knows in advance how many rounds it takes.",
    { x: 0.9, y: 3.04, w: 5.3, h: 1.1, size: 12 });
  s.addText("The model can only ask. It never executes anything.", {
    x: 0.9, y: 4.28, w: 5.3, h: 0.4, margin: 0, fontFace: F.body, fontSize: 12, bold: true, color: C.ink,
  });

  // Between
  card(s, { x: 6.67, y: 2.44, w: 5.85, h: 2.5 });
  s.addShape(pres.ShapeType.rect, { x: 6.67, y: 2.44, w: 0.07, h: 2.5, fill: { color: C.yellow }, line: { width: 0 } });
  s.addText("BETWEEN AGENTS — A FLOWCHART", {
    x: 6.95, y: 2.68, w: 5, h: 0.26, margin: 0, fontFace: F.body, fontSize: 10, bold: true, color: C.grey, charSpacing: 1.8,
  });
  body(s, "A LangGraph state machine we wrote. Fixed nodes, one conditional branch, a typed shared state passed hand to hand. It always runs the same way and can be pointed at.",
    { x: 6.95, y: 3.04, w: 5.3, h: 1.1, size: 12 });
  s.addText("The agents never talk to each other.", {
    x: 6.95, y: 4.28, w: 5.3, h: 0.4, margin: 0, fontFace: F.body, fontSize: 12, bold: true, color: C.ink,
  });

  card(s, { x: 0.62, y: 5.2, w: 11.9, h: 1.6 });
  h3(s, "Why not let them negotiate, like CrewAI or AutoGen?", { x: 0.9, y: 5.46, w: 9 });
  body(s,
    "Because that is non-deterministic, hard to debug, hard to bound, and can loop indefinitely burning tokens. " +
    "In operations, unpredictable is the wrong kind of impressive. A fixed route means the run can be shown, " +
    "in order, and proven.",
    { x: 0.9, y: 5.84, w: 11.2, h: 0.8, size: 12.5 });

  s.addNotes(
    "If asked 'how do your agents communicate?' — they do not. They write to a typed shared state in a fixed " +
    "order. Two LLMs negotiating is not a feature, it is a debugging problem."
  );
}

/* ══════════════════ 6 — STACK AND WHERE THE MODEL SITS ══════════════════ */
{
  const s = slide("Technology", "Where each layer does its work");

  table(s, [
    [hdr("Layer"), hdr("What it actually does"), hdr("Technology")],
    [{ text: "Decides", options: { bold: true, color: C.ink } },
     "Picks the next tool; writes the diagnosis, the routing decision and the final verdict",
     { text: "Groq · llama-3.3-70b-versatile · temperature 0", options: { color: C.ink } }],
    [{ text: "Routes", options: { bold: true, color: C.ink } },
     "The ReAct loop inside each agent, and the state machines between them",
     "LangGraph"],
    [{ text: "Plumbs", options: { bold: true, color: C.ink } },
     "Model adapter, tool schemas generated from function signatures, typed messages",
     "LangChain"],
    [{ text: "Does", options: { bold: true, color: C.ink } },
     "All 33 tools. Reads the machine, writes the backups, enforces every boundary",
     "Python · FastAPI · psutil · paramiko"],
    [{ text: "Shows", options: { bold: true, color: C.ink } },
     "Reasoning trace, verdict cards, live workflow chart, host enrolment",
     "Next.js 16 · React 19 · Tailwind v4"],
    [{ text: "Stores", options: { bold: true, color: C.ink } },
     "Accounts, orgs, hosts, jobs, metrics, sessions",
     "SQLite"],
  ], { x: 0.62, y: 1.92, w: 11.9, colW: [1.5, 6.2, 4.2] });

  card(s, { x: 0.62, y: 5.05, w: 5.85, h: 1.72 });
  h3(s, "One auto-remediation run", { x: 0.9, y: 5.3, w: 5 });
  body(s, "Log Analyzer loop 3–6 calls · router exactly 1 · Backup loop 3–6 if routed · supervisor exactly 1.",
    { x: 0.9, y: 5.66, w: 5.3, h: 0.6, size: 12 });
  s.addText("8–14 model calls per click", {
    x: 0.9, y: 6.24, w: 5.3, h: 0.34, margin: 0, fontFace: F.head, fontSize: 15, bold: true, color: C.ink,
  });

  card(s, { x: 6.67, y: 5.05, w: 5.85, h: 1.72 });
  s.addShape(pres.ShapeType.rect, { x: 6.67, y: 5.05, w: 0.07, h: 1.72, fill: { color: C.yellow }, line: { width: 0 } });
  h3(s, "Which is why the model choice is architectural", { x: 6.95, y: 5.3, w: 5.4, size: 14 });
  body(s, "Groq is inference hardware, not a model — the same open weights, far faster. A dozen sequential calls is the difference between interactive and a batch job. Open weights also mean it can be self-hosted for anyone who will not send data out.",
    { x: 6.95, y: 5.66, w: 5.3, h: 1.0, size: 11.5 });

  s.addNotes(
    "If asked why a framework at all — concede it. A hand-rolled loop is about 60 lines and would work. " +
    "What LangChain and LangGraph bought was tool schemas from signatures, typed messages, the conditional " +
    "branch for free, and a one-line provider swap. Real benefits, not necessities."
  );
}

/* ══════════════════ 7 — REACHING MACHINES ══════════════════ */
{
  const s = slide("Deployment", "How it reaches a machine that is not this one");

  body(s,
    "One abstraction, three implementations, and the only difference is who opens the connection. Nothing " +
    "upstream ever learns which one answered.",
    { x: 0.62, y: 1.86, w: 11.9, h: 0.5, size: 14 });

  table(s, [
    [hdr("Transport"), hdr("Who connects"), hdr("Install"), hdr("Crosses a firewall?"), hdr("Trade-off")],
    ["local", "Nobody — same machine", "No", { text: "n/a", options: { color: C.grey } }, "Only the host running the API"],
    ["ssh", "We connect out to them", "No", { text: "No — we are a stranger knocking", options: { color: C.bad } }, "We hold a credential that opens a shell"],
    [{ text: "agent", options: { bold: true, color: C.ink } },
     { text: "They connect out to us", options: { bold: true, color: C.ink } },
     "Yes, one daemon",
     { text: "Yes — outbound only", options: { color: C.good, bold: true } },
     { text: "Something must be installed", options: { color: C.ink } }],
  ], { x: 0.62, y: 2.62, w: 11.9, colW: [1.5, 2.9, 1.5, 3.0, 3.0] });

  card(s, { x: 0.62, y: 4.5, w: 11.9, h: 2.28 });
  s.addShape(pres.ShapeType.rect, { x: 0.62, y: 4.5, w: 0.07, h: 2.28, fill: { color: C.yellow }, line: { width: 0 } });
  h3(s, "Enrolment, and why the direction matters", { x: 0.95, y: 4.76, w: 8 });
  body(s,
    "The dashboard issues a single-use token that expires in 60 minutes. The daemon redeems it once for a " +
    "permanent key, and the token is destroyed in the same transaction — so a stolen token is either already " +
    "dead, expired, or announces the theft by making your own install fail. From then on the daemon polls " +
    "outbound every 3 seconds and does the work locally.",
    { x: 0.95, y: 5.14, w: 11.2, h: 1.0, size: 12.5 });
  s.addText(
    "A firewall blocks strangers coming in and permits people inside going out. By flipping who dials, the " +
    "product never has to ask anyone's network team for permission.",
    { x: 0.95, y: 6.16, w: 11.2, h: 0.5, margin: 0, fontFace: F.body, fontSize: 12.5, bold: true, color: C.ink, lineSpacing: 17 }
  );

  s.addNotes(
    "This is the most technically credible slide. Most projects at this stage hard-code 'the machine being " +
    "inspected is the machine running the code'. The outbound-polling daemon is exactly how NinjaOne and Atera " +
    "reach a machine behind a home router."
  );
}

/* ══════════════════ 8 — SECURITY ══════════════════ */
{
  const s = slideDark("Security", "Bounded by construction, not by instruction");

  body(s,
    "The model produces a request. Our code decides whether to honour it. Every boundary below is enforced in " +
    "Python, not asked for in a prompt.",
    { x: 0.62, y: 1.88, w: 11.9, h: 0.5, size: 14, dark: true });

  const layers = [
    ["Credentials", "scrypt at twice the OWASP floor. Session tokens, enrolment tokens and agent keys are stored only as SHA-256 digests — the server never holds the value it checks. SSH secrets encrypted with Fernet, decrypted only in memory for the length of one connection."],
    ["Blast radius", "Each agent holds only its own domain's tools. Two of the three cannot change anything at all. Diagnostic commands are a fixed 13-item allowlist; anything else is refused by name."],
    ["Generated code", "LLM-written snippets pass an AST validator that denies by default — no imports, no function definitions, no dunder access, and any unrecognised syntax node is rejected. Restricted globals, 10-second timeout."],
    ["Prompt injection", "Log reads are path-guarded: no absolute paths, no directory escapes, and filenames containing env, secret, password, token or key are refused. Without it, read_log_file('.env') would hand the API key to the model."],
  ];
  layers.forEach(([t, d], i) => {
    const y = 2.6 + i * 1.06;
    s.addShape(pres.ShapeType.rect, { x: 0.62, y, w: 0.055, h: 0.92, fill: { color: C.yellow }, line: { width: 0 } });
    h3(s, t, { x: 0.92, y: y + 0.02, w: 2.12, size: 13, dark: true });
    body(s, d, { x: 3.15, y, w: 9.35, h: 0.92, size: 11, dark: true });
  });

  s.addText(
    "Stated openly: if ITOPS_SECRET_KEY is unset, credential encryption falls back to a development key; SSH " +
    "trusts an unknown host on first contact; SQLite is single-process. All three are documented in the README.",
    { x: 0.62, y: 6.86, w: 11.9, h: 0.42, margin: 0, fontFace: F.body, fontSize: 10.5, color: C.grey, lineSpacing: 14 }
  );

  s.addNotes(
    "The path guard is the best story here — it anticipates what the model could be talked into doing, not just " +
    "what it is allowed to do. Naming the three known gaps yourself is far stronger than being asked about them."
  );
}

/* ══════════════════ 9 — THE MARKET ══════════════════ */
{
  const s = slide("Competitive landscape", "Five layers, and only one of them is a rival");

  table(s, [
    [hdr("Layer"), hdr("Who"), hdr("What they do"), hdr("Relationship")],
    ["Monitoring", "Datadog, Zabbix, Grafana", "Watch numbers, raise alarms", { text: "Upstream — they create the alarm", options: { color: C.grey } }],
    ["Alert grouping", "Moogsoft, BigPanda, PagerDuty", "Turn 10,000 alerts into 12 incidents", { text: "Adjacent — reduces noise, does not diagnose", options: { color: C.grey } }],
    ["AI SRE", "Resolve.ai, Traversal, Cleric", "Investigate an alert, post a diagnosis", { text: "The hype centre — but see below", options: { color: C.ink } }],
    [{ text: "RMM", options: { bold: true, color: C.ink } },
     { text: "NinjaOne, Atera, ConnectWise", options: { bold: true, color: C.ink } },
     "Manage endpoints for IT teams and providers",
     { text: "Our actual neighbourhood", options: { bold: true, color: C.ink } }],
    ["Open source", "HolmesGPT, K8sGPT", "Agentic investigation, Kubernetes-first", { text: "Closest technical relatives", options: { color: C.grey } }],
  ], { x: 0.62, y: 1.92, w: 11.9, colW: [1.9, 3.1, 3.4, 3.5] });

  card(s, { x: 0.62, y: 4.86, w: 11.9, h: 1.9 });
  s.addShape(pres.ShapeType.rect, { x: 0.62, y: 4.86, w: 0.07, h: 1.9, fill: { color: C.yellow }, line: { width: 0 } });
  h3(s, "The AI SRE wave gets the attention. It is not where we compete.", { x: 0.95, y: 5.12, w: 10 });
  body(s,
    "Those tools speak in services, traces, spans and Kubernetes pods, and assume an observability estate that " +
    "costs six figures a year. Our agents look at CPU, memory, disk, log files and backup folders on a machine. " +
    "That is endpoint-management vocabulary — a different world, a different buyer, and a far larger and less " +
    "served one.",
    { x: 0.95, y: 5.5, w: 11.2, h: 1.0, size: 12.5 });

  s.addNotes(
    "Know the names. Resolve.ai reached unicorn valuation in under two years. Traversal claims 90%+ root-cause " +
    "accuracy — a self-reported marketing figure with no independent benchmark. Cleric is deliberately read-only."
  );
}

/* ══════════════════ 10 — EDGE AND LIMITS ══════════════════ */
{
  const s = slide("Position", "What we beat, and where we lose");

  s.addShape(pres.ShapeType.rect, { x: 0.62, y: 1.82, w: 5.85, h: 0.06, fill: { color: C.yellow }, line: { width: 0 } });
  s.addText("WHERE WE WIN", {
    x: 0.62, y: 2.0, w: 5, h: 0.26, margin: 0, fontFace: F.body, fontSize: 10.5, bold: true, color: C.ink, charSpacing: 1.8,
  });

  const wins = [
    ["We act", "Cleric is explicitly read-only by design; most of that tier stops at a diagnosis. Our backup agent creates, verifies and restores — and the chain then checks whether it worked."],
    ["A far lower floor", "The open-source tools need Kubernetes. The commercial ones need a full observability stack. This needs a computer."],
    ["Real fleet architecture", "Local, SSH and outbound-polling daemon behind one abstraction — the hard part of multi-host, already built."],
    ["A glass box", "Every tool call and result is shown. In a category whose whole barrier is trust, showing the working is the mechanism."],
  ];
  wins.forEach(([t, d], i) => {
    const y = 2.36 + i * 1.12;
    h3(s, t, { x: 0.62, y, w: 5.4, size: 13 });
    body(s, d, { x: 0.62, y: y + 0.28, w: 5.6, h: 0.78, size: 11 });
  });

  s.addShape(pres.ShapeType.rect, { x: 6.67, y: 1.82, w: 5.85, h: 0.06, fill: { color: C.greyLite }, line: { width: 0 } });
  s.addText("WHERE WE LOSE — AND THE HONEST ANSWER", {
    x: 6.67, y: 2.0, w: 5.6, h: 0.26, margin: 0, fontFace: F.body, fontSize: 10.5, bold: true, color: C.grey, charSpacing: 1.8,
  });

  const losses = [
    ["No cross-host correlation", "Single-host depth first. The transport layer is already built for multi-host."],
    ["Logs come from a file, not a platform", "It is a tool interface. Swapping the reader for a Splunk or Loki client does not change the agent."],
    ["Only one agent can act", "Said plainly: one domain done properly beats four claimed."],
    ["No accuracy benchmark", "Nor does anyone else, verifiably — rivals' figures are self-reported marketing with no independent test."],
  ];
  losses.forEach(([t, d], i) => {
    const y = 2.36 + i * 1.12;
    h3(s, t, { x: 6.67, y, w: 5.6, size: 13 });
    body(s, d, { x: 6.67, y: y + 0.28, w: 5.6, h: 0.78, size: 11 });
  });

  s.addNotes(
    "Conceding the right-hand column is what makes the left-hand column believable. Never claim an accuracy " +
    "number you cannot defend — say that nobody in this category has a verifiable one."
  );
}

/* ══════════════════ 11 — ROADMAP ══════════════════ */
{
  const s = slideDark("What comes next", "Ordered by what a real deployment would hit first");

  const phases = [
    ["Harden", "Refuse to start without ITOPS_SECRET_KEY rather than falling back to a development key. Pin SSH host keys at enrolment. Retry wrapper around malformed tool calls — the one failure actually observed in testing."],
    ["Connect", "Log-platform clients behind the existing tool interface. Paging and ticketing integrations, so a verdict becomes an incident. Server-sent events, so the workflow chart shows true per-stage progress instead of an estimate."],
    ["Correlate", "Cross-host reasoning: the transport layer already supports a fleet, but each agent still looks at one machine at a time. This is where the market's most valuable claim sits."],
    ["Measure", "A benchmark of synthetic incidents with a stated methodology. Being the only team in the room with a real, defensible number is worth more than a larger one that cannot be shown."],
  ];
  phases.forEach(([t, d], i) => {
    const y = 1.94 + i * 1.24;
    s.addText(String(i + 1).padStart(2, "0"), {
      x: 0.62, y, w: 0.8, h: 0.4, margin: 0, fontFace: F.head, fontSize: 20, bold: true, color: C.yellow,
    });
    h3(s, t, { x: 1.5, y: y + 0.04, w: 2.4, size: 15, dark: true });
    body(s, d, { x: 3.9, y, w: 8.6, h: 1.05, size: 11.5, dark: true });
  });

  s.addNotes(
    "If asked 'what would you fix first' — the retry wrapper. It is the one failure observed in practice, " +
    "rather than one imagined."
  );
}

/* ══════════════════ 12 — SNAPSHOTS ══════════════════ */
{
  const s = slide("The product", "Running, not mocked");

  const shots = [
    ["trace", "Agent console — reasoning trace and verdict", 0.62, 1.9, 6.0, 3.38],
    ["workflow", "Auto-remediation chain", 6.9, 1.9, 5.62, 3.38],
    ["dashboard", "Run history and outcomes", 0.62, 5.52, 3.86, 1.5],
    ["fleet", "The agent fleet", 4.72, 5.52, 3.86, 1.5],
    ["transcript", "Orchestrator — describe a symptom", 8.82, 5.52, 3.7, 1.5],
  ];
  shots.forEach(([n, cap, x, y, w, h]) => {
    s.addImage({ ...img(n), x, y, w, h, sizing: { type: "cover", w, h } });
    s.addShape(pres.ShapeType.rect, { x, y, w, h, fill: { type: "none" }, line: { color: C.line, width: 1 } });
    s.addText(cap, {
      x, y: y + h + 0.04, w, h: 0.24, margin: 0, fontFace: F.body, fontSize: 9.5, color: C.grey,
    });
  });

  s.addNotes("Every screen here is the running application against a live backend, not a design mock.");
}

/* ══════════════════ 13 — CLOSE ══════════════════ */
{
  const s = pres.addSlide();
  s.background = { color: C.charcoal };
  s.addShape(pres.ShapeType.rect, {
    x: 10.2, y: -1.4, w: 1.5, h: 6.2, fill: { color: C.yellow }, line: { width: 0 }, rotate: 28,
  });

  s.addText("IN ONE SENTENCE", {
    x: 0.75, y: 2.1, w: 8, h: 0.3, margin: 0,
    fontFace: F.body, fontSize: 11.5, bold: true, color: C.yellow, charSpacing: 3,
  });
  s.addText(
    "The AI-SRE wave is building brilliant diagnosticians for teams that already have Kubernetes and a " +
    "six-figure observability bill — and most of them deliberately stop short of touching anything.",
    { x: 0.72, y: 2.6, w: 9.0, h: 1.4, margin: 0, fontFace: F.head, fontSize: 21, bold: true, color: C.white, lineSpacing: 30 }
  );
  s.addText(
    "Aurora Ops goes after the same 3am problem for everyone else: it needs nothing but the machine, it shows " +
    "every step of its reasoning, and on the one class of problem where acting is safe, it acts — and then " +
    "verifies it worked.",
    { x: 0.75, y: 4.2, w: 9.0, h: 1.1, margin: 0, fontFace: F.body, fontSize: 15, color: C.greyLite, lineSpacing: 24 }
  );

  s.addShape(pres.ShapeType.rect, { x: 0.75, y: 5.6, w: 3.4, h: 0.035, fill: { color: C.yellow }, line: { width: 0 } });
  s.addText("Thank you", {
    x: 0.75, y: 5.82, w: 6, h: 0.4, margin: 0, fontFace: F.head, fontSize: 17, bold: true, color: C.white,
  });

  s.addNotes("Two claims, both defensible, both narrow enough to survive questions. Resist widening them.");
}

const OUT = resolve(HERE, "Aurora-Ops-Overview.pptx");
await pres.writeFile({ fileName: OUT });
console.log("wrote", OUT);
