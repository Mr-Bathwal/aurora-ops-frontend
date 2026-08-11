"use client";

import { useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ScanSearch, Split } from "lucide-react";

/** The opening chapter: the workflow explained on the left, and the chain itself as one
 * instrument panel on the right.
 *
 * The reference for this section carried a red wash across the card and a red scanning lens.
 * Red is not in this palette and it means something specific everywhere else in the product —
 * `--crit` is the colour of a failing check. A card that glows red while describing a healthy
 * process would be reading as an alarm. The wash is mint into blue instead, which is the same
 * composition doing the same job in a colour the rest of the console already speaks.
 *
 * Borders are `white/6` at rest — barely a hairline, which is what lets the plexus backdrop
 * come through the card rather than stopping at its edge. They earn their colour on hover.
 */

/* Fixed, not generated. A `Math.random()` at render is impure under the React Compiler's
   purity rule, and a data stream that reshuffles on every re-render is worse anyway — the eye
   catches the change and reads it as a glitch. */
const BITS = "01001011100101101001110100101100101101001011100110";

/* ── Phase 1 scene: the log sweep ────────────────────────────────────────────────────────
 * Lines of log, a beam passing down them, and the two lines it catches turning critical.
 * `read_log_file` and `count_errors`, drawn small. */
function LogSweepScene() {
  const reduced = useReducedMotion();
  const rows = [
    { w: 78, bad: false }, { w: 54, bad: false }, { w: 92, bad: true },
    { w: 63, bad: false }, { w: 71, bad: false }, { w: 58, bad: true },
    { w: 80, bad: false }, { w: 66, bad: false },
  ];
  return (
    <div className="relative h-full overflow-hidden rounded-[14px] border border-white/[0.07] bg-[rgba(5,8,13,0.78)] p-3.5">
      <div className="mb-2.5 flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-crit/70" />
        <span className="size-1.5 rounded-full bg-warn/70" />
        <span className="size-1.5 rounded-full bg-ok/70" />
        <span className="ml-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-faint">sample.log</span>
      </div>
      <div className="space-y-[9px]">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="font-mono text-[8px] text-faint">{String(i + 1).padStart(2, "0")}</span>
            <motion.span
              className="h-[3px] rounded-full"
              style={{ width: `${r.w}%` }}
              initial={{ backgroundColor: "rgba(125,142,164,0.3)" }}
              animate={
                reduced
                  ? { backgroundColor: r.bad ? "rgba(255,107,129,0.85)" : "rgba(125,142,164,0.3)" }
                  : {
                      backgroundColor: r.bad
                        ? ["rgba(125,142,164,0.3)", "rgba(125,142,164,0.3)", "rgba(255,107,129,0.85)", "rgba(255,107,129,0.85)"]
                        : ["rgba(125,142,164,0.3)", "rgba(125,142,164,0.3)"],
                    }
              }
              transition={{
                duration: 4.4,
                times: r.bad ? [0, 0.1 + i * 0.05, 0.17 + i * 0.05, 1] : [0, 1],
                repeat: Infinity,
                repeatDelay: 0.7,
              }}
            />
          </div>
        ))}
      </div>

      {!reduced && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-11"
          style={{ background: "linear-gradient(180deg, transparent, rgba(52,245,197,0.15), transparent)" }}
          initial={{ top: "6%" }}
          animate={{ top: ["6%", "86%"] }}
          transition={{ duration: 4.4, repeat: Infinity, repeatDelay: 0.7, ease: "easeInOut" }}
        />
      )}

      <div className="absolute bottom-3 right-3.5 rounded-full border border-crit/35 bg-crit-soft px-2 py-0.5 font-mono text-[9px] text-crit">
        2 errors
      </div>
    </div>
  );
}

/* ── Phase 2 scene: the conditional edge ─────────────────────────────────────────────────
 * The router choosing. One lane takes the current, the other stays dark — the whole point of
 * the middle stage, and the thing a static diagram cannot say. */
function ForkScene() {
  const reduced = useReducedMotion();
  return (
    <div className="relative h-full overflow-hidden rounded-[14px] border border-white/[0.07] bg-[rgba(5,8,13,0.78)]">
      <svg viewBox="0 0 260 150" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="pi-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        <path d="M 26 75 L 76 75" stroke="#22303e" strokeWidth={2.5} strokeLinecap="round" fill="none" />
        <path d="M 76 75 C 114 75, 120 38, 160 38" stroke="#22303e" strokeWidth={2.5} strokeLinecap="round" fill="none" />
        <path d="M 76 75 C 114 75, 120 114, 160 114" stroke="#22303e" strokeWidth={2.5} strokeLinecap="round" fill="none" />

        {!reduced && (
          <>
            <motion.path
              d="M 26 75 L 76 75 C 114 75, 120 38, 160 38"
              pathLength={1} fill="none" stroke="#34f5c5" strokeWidth={2.5} strokeLinecap="round"
              strokeDasharray="0.24 0.76"
              initial={{ strokeDashoffset: 0.24 }}
              animate={{ strokeDashoffset: -0.76 }}
              transition={{ duration: 1.9, repeat: Infinity, repeatDelay: 1.3, ease: "easeInOut" }}
            />
            <motion.rect
              x={168} y={22} width={74} height={32} rx={10} fill="#34f5c5" filter="url(#pi-glow)"
              initial={{ opacity: 0.1 }}
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 1.9, repeat: Infinity, repeatDelay: 1.3, times: [0, 0.62, 1] }}
            />
          </>
        )}

        <circle cx={26} cy={75} r={9} fill="#0c1820" stroke="#34f5c5" strokeWidth={1.6} />
        <rect x={168} y={22} width={74} height={32} rx={10} fill="#0b1a1c" stroke="#2f8f7f" strokeWidth={1.3} />
        <text x={205} y={42} textAnchor="middle" className="font-mono" fontSize={10.5} fill="#8ff0d9">REMEDIATE</text>
        <rect x={168} y={98} width={74} height={32} rx={10} fill="#0a0e14" stroke="#212a36" strokeWidth={1.3} />
        <text x={205} y={118} textAnchor="middle" className="font-mono" fontSize={10.5} fill="#4a5769">SKIPPED</text>

        <text x={96} y={66} className="font-mono" fontSize={10} fill="#7d8ea4">if backup</text>
        <text x={96} y={106} className="font-mono" fontSize={10} fill="#4a5769">else</text>
      </svg>
    </div>
  );
}

/** The scanning ring that heads Phase 1 — the reference's camera lens, rebuilt as an aperture
 * that actually sweeps. Two counter-rotating arcs, so it reads as looking rather than spinning. */
function ScanRing() {
  const reduced = useReducedMotion();
  return (
    <div className="relative grid size-9 shrink-0 place-items-center">
      <div className="absolute inset-0 rounded-full bg-brand-2/10 blur-[6px]" />
      <svg viewBox="0 0 40 40" className="size-9">
        <circle cx={20} cy={20} r={15} fill="none" stroke="#1e3a3c" strokeWidth={1.2} />
        <motion.g
          style={{ originX: "20px", originY: "20px" }}
          animate={reduced ? undefined : { rotate: 360 }}
          transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
        >
          <path d="M 20 5 A 15 15 0 0 1 32 12" fill="none" stroke="#34f5c5" strokeWidth={1.6} strokeLinecap="round" />
        </motion.g>
        <motion.g
          style={{ originX: "20px", originY: "20px" }}
          animate={reduced ? undefined : { rotate: -360 }}
          transition={{ duration: 11, repeat: Infinity, ease: "linear" }}
        >
          <path d="M 20 11 A 9 9 0 0 1 27 16" fill="none" stroke="#3e9cff" strokeWidth={1.4} strokeLinecap="round" />
        </motion.g>
        <circle cx={20} cy={20} r={3.4} fill="#34f5c5" opacity={0.9} />
      </svg>
    </div>
  );
}

/** The branch glyph heading Phase 2 — one input arriving, two outputs leaving. */
function BranchGlyph() {
  return (
    <div className="relative grid size-9 shrink-0 place-items-center">
      <div className="absolute inset-0 rounded-full bg-brand/10 blur-[6px]" />
      <svg viewBox="0 0 40 40" className="size-9" fill="none" strokeLinecap="round">
        <path d="M 8 12 L 15 12 M 8 20 L 15 20 M 8 28 L 15 28" stroke="#3e9cff" strokeWidth={1.6} opacity={0.55} />
        <path d="M 15 20 L 24 20" stroke="#7d8ea4" strokeWidth={1.6} />
        <path d="M 24 20 C 28 20, 29 11, 33 11" stroke="#34f5c5" strokeWidth={1.7} />
        <path d="M 24 20 C 28 20, 29 29, 33 29" stroke="#3a4756" strokeWidth={1.7} />
        <circle cx={24} cy={20} r={2.6} fill="#34f5c5" />
      </svg>
    </div>
  );
}

/** The rail between the phases — the reference's data conduit, carrying a packet from the
 * diagnosis into the decision, with the bit stream drifting alongside it. */
function Conduit() {
  const reduced = useReducedMotion();
  return (
    <div aria-hidden className="pointer-events-none relative hidden w-full md:block">
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/12 to-transparent" />

      {!reduced && (
        <>
          {/* The packet. */}
          <motion.div
            className="absolute left-1/2 h-14 w-px -translate-x-1/2"
            style={{ background: "linear-gradient(180deg, transparent, #34f5c5, transparent)" }}
            initial={{ top: "-10%", opacity: 0 }}
            animate={{ top: ["-10%", "100%"], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 0.9, ease: "easeInOut", opacity: { duration: 2.6, repeat: Infinity, repeatDelay: 0.9, times: [0, 0.12, 0.8, 1] } }}
          />
          {/* The bit stream, drifting at its own pace so the two never lock into step.
              Masked to nothing at both ends: unmasked it runs edge to edge and stops being a
              stream at all — it reads as one dense bar down the gutter, louder than the
              packet it is supposed to be background for. */}
          <div
            className="absolute inset-y-0 left-1/2 w-8 -translate-x-1/2 overflow-hidden"
            style={{
              maskImage: "linear-gradient(180deg, transparent, #000 22%, #000 74%, transparent)",
              WebkitMaskImage: "linear-gradient(180deg, transparent, #000 22%, #000 74%, transparent)",
            }}
          >
            <motion.div
              className="font-mono text-[7px] leading-[15px] tracking-[0.3em] text-brand-2/15"
              style={{ writingMode: "vertical-rl" }}
              animate={{ y: ["-38%", "8%"] }}
              transition={{ duration: 19, repeat: Infinity, ease: "linear" }}
            >
              {BITS}
              {BITS}
            </motion.div>
          </div>
        </>
      )}

      {/* The junction — where the diagnosis becomes the decision's input. */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="absolute -inset-2 rounded-full bg-brand-2/20 blur-[7px]" />
        <div className="relative size-2 rounded-full bg-brand-2" />
      </div>
    </div>
  );
}

const PHASES = [
  {
    n: 1,
    name: "Log Diagnosis",
    glyph: ScanRing,
    icon: ScanSearch,
    scene: LogSweepScene,
    body: "Nothing is touched until the Log Analyzer has been through the logs and written a diagnosis in plain language. The chain starts with evidence, not with a guess.",
  },
  {
    n: 2,
    name: "Supervisor Decision",
    glyph: BranchGlyph,
    icon: Split,
    scene: ForkScene,
    body: "A supervisor reads that diagnosis and decides whether it points at a backup or DR failure. If it does not, remediation is skipped entirely and the run goes straight to verification.",
  },
] as const;

function PhaseColumn({ phase, delay }: { phase: (typeof PHASES)[number]; delay: number }) {
  const Glyph = phase.glyph;
  const Icon = phase.icon;
  const Scene = phase.scene;
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, delay, ease: [0.2, 0.7, 0.2, 1] }}
      className="group/phase flex min-w-0 flex-col"
    >
      <div className="mb-4 flex items-center gap-3">
        <Glyph />
        <span className="font-heading text-[15px] font-semibold tracking-[-0.01em] text-foreground sm:text-[16px]">
          Phase {phase.n}: {phase.name}
        </span>
      </div>

      <div className="h-[236px] transition-transform duration-500 group-hover/phase:-translate-y-0.5">
        <Scene />
      </div>

      <div className="mt-5">
        <Icon size={19} className="text-brand-2 transition-colors duration-300 group-hover/phase:text-brand" />
        <h3 className="mt-2.5 font-heading text-[16px] font-semibold tracking-[-0.01em]">
          Phase {phase.n}: {phase.name}
        </h3>
        <p className="mt-2 text-[13px] leading-[1.66] text-muted-foreground">{phase.body}</p>
      </div>
    </motion.div>
  );
}

export function ProcessIntro() {
  const [spot, setSpot] = useState<{ x: number; y: number } | null>(null);
  const strip = useRef<HTMLDivElement>(null);
  const stripInView = useInView(strip, { once: true, margin: "-40px" });

  return (
    <div>
      {/* ── Telemetry strip ───────────────────────────────────────────────────────────── */}
      <div ref={strip} className="mb-12 border-b border-white/[0.07] pb-3.5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={stripInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center gap-x-9 gap-y-2 font-mono text-[11px] uppercase tracking-[0.2em]"
        >
          <span className="text-brand-2/70">
            Active workflow: <span className="text-foreground/85">remediation-int-001</span>
          </span>
          <span className="flex items-center gap-2 text-brand-2/70">
            Status:
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-ok" />
            </span>
            <span className="text-foreground/85">monitoring</span>
          </span>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-x-14 gap-y-12 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.4fr)] lg:items-start">
        {/* ── Left: the explanation ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <h2
            className="font-heading font-bold"
            style={{
              fontSize: "clamp(2rem, 3.2vw, 2.75rem)",
              lineHeight: 1.1,
              letterSpacing: "-0.025em",
              // The reference's mint headline, kept in our two brand stops rather than
              // inventing a third hue for one heading.
              backgroundImage: "linear-gradient(94deg, #6fecd4, #eaf6ff 58%, #9ccdf7)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Automated incident remediation workflow
          </h2>

          <p className="mt-6 text-[14.5px] leading-[1.72] text-muted-foreground">
            <span className="text-foreground/80">Process overview.</span> The Remediation
            Intelligence Chain parses and diagnoses your system logs, then applies a
            supervisor-level decision to run a precise remediation — or a controlled skip — on
            the evidence it found. Nothing runs on a hunch, so nothing runs that did not need to.
          </p>
          <p className="mt-5 text-[14.5px] leading-[1.72] text-muted-foreground">
            {/* Not "the panel alongside" — below `lg` the card stacks underneath this
                paragraph, and copy that points at a position the layout no longer has is
                worse than copy that points at nothing. */}
            That panel is the chain itself, not a picture of it: both phases are stages the
            backend actually walks. Scroll on for the full graph, and for the console you drive
            it from.
          </p>
        </motion.div>

        {/* ── Right: the instrument panel ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.75, delay: 0.08, ease: [0.2, 0.7, 0.2, 1] }}
          /* The lift is a motion value, not `hover:-translate-y-1`. This element is a
             `motion.div`, so framer-motion owns its inline `transform` — and an inline style
             beats a class, which left the Tailwind hover translate silently doing nothing
             while the border and shadow around it animated fine. */
          whileHover={{ y: -5 }}
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setSpot({ x: e.clientX - r.left, y: e.clientY - r.top });
          }}
          onPointerLeave={() => setSpot(null)}
          className="group relative overflow-hidden rounded-[24px] border border-white/[0.06] bg-[rgba(8,12,18,0.62)] p-5 backdrop-blur-xl transition-[border-color,box-shadow] duration-500 hover:border-brand-2/25 hover:shadow-[0_28px_70px_-40px_rgba(52,245,197,0.4)] sm:p-7"
        >
          {/* The wash. Mint into blue where the reference put red — same composition, our
              colours, and low enough that the plexus behind still reads through. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-90 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(58% 46% at 6% 4%, rgba(52,245,197,0.11), transparent 72%)," +
                "radial-gradient(52% 44% at 96% 96%, rgba(62,156,255,0.10), transparent 74%)",
            }}
          />
          {/* Pointer spotlight. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 transition-opacity duration-300"
            style={{
              opacity: spot ? 1 : 0,
              background: spot
                ? `radial-gradient(420px circle at ${spot.x}px ${spot.y}px, rgba(52,245,197,0.07), transparent 68%)`
                : undefined,
            }}
          />

          <div className="relative">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h3 className="font-heading text-[19px] font-semibold tracking-[-0.015em] sm:text-[21px]">
                Remediation Intelligence Chain
              </h3>
              <span className="hidden shrink-0 rounded-full border border-white/[0.08] px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint sm:block">
                2 phases
              </span>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1fr)_44px_minmax(0,1fr)] md:gap-0">
              <PhaseColumn phase={PHASES[0]} delay={0.1} />
              <Conduit />
              <PhaseColumn phase={PHASES[1]} delay={0.2} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Operator badge ────────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-7 flex justify-end"
      >
        <div className="flex items-center gap-3 rounded-full border border-white/[0.07] bg-[rgba(8,12,18,0.6)] py-1.5 pl-1.5 pr-4 backdrop-blur-xl">
          <span className="grid size-8 place-items-center rounded-full bg-grad text-[11px] font-bold text-[#0c0f14]">
            GB
          </span>
          <span className="font-mono text-[9.5px] uppercase leading-[1.5] tracking-[0.14em] text-faint">
            Operator ID: <span className="text-foreground/75">GB</span>
            <br />
            System: <span className="text-foreground/75">Aurora Ops</span>
          </span>
        </div>
      </motion.div>
    </div>
  );
}
