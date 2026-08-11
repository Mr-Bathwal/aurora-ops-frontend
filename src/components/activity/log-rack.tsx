"use client";

import Image from "next/image";
import { ChevronRight, FileDown, Settings, User } from "lucide-react";
import { AGENT_LABELS, AGENT_COLOR, type ActivityEntry } from "@/lib/activity-store";
import { formatTimestamp } from "@/lib/format";

/** The run history, built as a physical equipment rack.
 *
 * Every element here is doing one job: making a list of records read as a machine you could
 * put your hands on. A closed unit is a drawer face with a polished chrome pull across it.
 * Hovering pulls it out — a real translateZ/rotateX inside a perspective, so the top edge
 * foreshortens the way a drawer does — and as it opens the chrome pull cross-fades into a lit
 * instrument bar, which is what a drawer that is *live* rather than *shut* should look like.
 *
 * The materials (chrome, chassis, drawer face) live in globals.css as custom properties.
 * Each is a long multi-stop gradient that has to read as one continuous lit surface, and
 * keeping them together is the only way to tune them against each other.
 */

const AGENT_IMAGE: Record<ActivityEntry["agentKey"], string> = {
  health: "/media/images/cards/health.jpg",
  log: "/media/images/cards/log.jpg",
  backup: "/media/images/cards/backup.jpg",
  orchestrator: "/media/images/hero/circuit-macro.jpg",
  auto: "/media/images/cards/health.jpg",
};

/** Pulled from the report the same way `inferOutcome` reads it, so the rail agrees with the
 * badge rather than offering a second opinion. Null when the report never mentions a count. */
function errorCount(report: string): string | null {
  const m = report?.toLowerCase().match(/(\d+)\s+errors?/);
  return m ? m[1] : null;
}

/* ── Chassis parts ──────────────────────────────────────────────────────── */

/** The angular clamps over the top bezel corners — a wedge that tapers inward, so the frame
 * reads as fabricated from plates rather than drawn as one rounded rectangle. Mirrored, not
 * rotated: both catch light from the same direction, which rotation would break. */
function CornerBracket({ side }: { side: "left" | "right" }) {
  const left = side === "left";
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute top-[3px] h-[26px] w-[132px] ${
        left ? "left-[3px] rounded-tl-[28px]" : "right-[3px] rounded-tr-[28px]"
      }`}
      style={{
        background: "linear-gradient(180deg, #9aa5b2 0%, #5c6672 38%, #2b323a 72%, #191e24 100%)",
        clipPath: left
          ? "polygon(0 0, 100% 0, calc(100% - 30px) 100%, 0 100%)"
          : "polygon(0 0, 100% 0, 100% 100%, 30px 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45)",
      }}
    />
  );
}

/* ── Drawer parts ───────────────────────────────────────────────────────── */

/** Status as a lit ring rather than a dot — at this scale a dot disappears into the face,
 * and a ring reads as an indicator lamp seated in a bezel. */
function RingLed({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="relative grid size-[30px] shrink-0 place-items-center rounded-full"
      style={{
        background: "radial-gradient(circle, #070b0f 52%, rgba(0,0,0,0) 53%)",
        border: `2.5px solid ${color}`,
        boxShadow: `0 0 14px ${color}59, inset 0 0 10px ${color}40`,
      }}
    >
      <span
        className="absolute inset-[4px] rounded-full"
        style={{ border: `1px solid ${color}3d` }}
      />
      <span
        className="size-[5px] rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
    </span>
  );
}

/** The drawer pull.
 *
 * Geometry is taken from the reference rather than from the space available: a fixed length
 * and a fixed height, so the bar keeps the stubby proportion of a real handle. Sizing it as a
 * percentage of the leftover lane stretched it to whatever the action text left behind, which
 * is what made it read as a thin painted stripe instead of a graspable object.
 *
 * The recess is shallow on purpose. A deep black slot around it drew a hard outline and
 * flattened the bar back out; a hairline seam and a cast shadow are enough to seat it. */
function ChromePull() {
  return (
    <span
      aria-hidden
      className="absolute left-0 top-1/2 h-[30px] w-[356px] -translate-y-1/2 rounded-full"
      style={{
        background: "linear-gradient(180deg, #0b0f14, #141a21)",
        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.8)",
      }}
    >
      <span
        className="absolute inset-x-[4px] top-1/2 h-[22px] -translate-y-1/2 rounded-full"
        style={{
          background: "var(--chrome)",
          boxShadow: "0 3px 8px rgba(0,0,0,0.85), inset 0 0 0 1px rgba(255,255,255,0.10)",
        }}
      />
    </span>
  );
}

/** Etched board traces on the face, right of the pull. Purely material — it is what keeps
 * the empty half of a shut drawer from reading as unfinished space. */
function CircuitTrace() {
  return (
    <svg
      aria-hidden
      className="absolute right-0 top-1/2 h-[36px] w-[168px] -translate-y-1/2 opacity-70"
      viewBox="0 0 300 36"
      preserveAspectRatio="none"
      fill="none"
      stroke="#8b9bb0"
      strokeWidth="1.1"
    >
      <path d="M0 8h58l10-6h74M0 18h40l12 8h96M0 28h30l14-8h52M150 2h44l10 7h96M158 26h52l10-8h80M96 12h38l8 5h60" />
      <path d="M232 9h68M242 25h58M214 17h86M186 32h114" strokeOpacity="0.5" />
      <g fill="#9db0c6" stroke="none">
        <circle cx="150" cy="2" r="2.2" />
        <circle cx="148" cy="26" r="2.2" />
        <circle cx="204" cy="9" r="1.8" />
        <circle cx="134" cy="12" r="1.8" />
        <rect x="246" y="14" width="7" height="6" rx="1" />
        <rect x="268" y="29" width="7" height="6" rx="1" />
      </g>
    </svg>
  );
}

/** Chamfered bezel around the run's still. The cut corners are what make it read as a
 * mounted viewport rather than a rounded-rect thumbnail. */
function NotchedThumb({ src, color }: { src: string; color: string }) {
  const notch = "polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)";
  return (
    <div
      className="relative hidden h-[150px] w-[228px] shrink-0 p-[3px] sm:block"
      style={{ background: "linear-gradient(150deg, #79838f, #2b333c 45%, #161b21)", clipPath: notch }}
    >
      <div className="relative h-full w-full overflow-hidden" style={{ clipPath: notch }}>
        {/* Eager, not lazy. The drawer body is a zero-height grid row until it opens, so an
            IntersectionObserver never fires and the fetch does not begin until you hover —
            leaving an empty frame for the first second of every first open. There are only
            five distinct URLs across the whole rack, so the browser dedupes this to five
            requests no matter how long the log is. */}
        <Image src={src} alt="" fill sizes="228px" loading="eager" className="object-cover" />
        <span
          className="absolute inset-x-0 bottom-0 h-[3px]"
          style={{ background: color, boxShadow: `0 0 12px ${color}` }}
        />
      </div>
    </div>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5 border-b border-white/6 py-[9px] last:border-0">
      <span className="grid size-4 shrink-0 place-items-center text-faint">{icon}</span>
      <dt className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">{label}</dt>
      <dd className="ml-auto truncate font-mono text-[12px] text-foreground">{value}</dd>
    </div>
  );
}

/* Rounded-square alert glyph — lucide has no square variant, and a circle next to the
   squared operator/agent glyphs breaks the set. */
const EventGlyph = (
  <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
    <rect x="2" y="2" width="12" height="12" rx="3" />
    <path d="M8 5v4" strokeLinecap="round" />
    <path d="M8 11.2v.1" strokeLinecap="round" />
  </svg>
);

const AgentGlyph = (
  <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.3">
    <circle cx="8" cy="8" r="2.4" />
    <path d="M8 1.4v2M8 12.6v2M1.4 8h2M12.6 8h2M3.3 3.3l1.4 1.4M11.3 11.3l1.4 1.4M12.7 3.3l-1.4 1.4M4.7 11.3l-1.4 1.4" strokeLinecap="round" />
  </svg>
);

/* ── The unit ───────────────────────────────────────────────────────────── */

function RackUnit({ entry }: { entry: ActivityEntry }) {
  const color = AGENT_COLOR[entry.agentKey];
  const errors = errorCount(entry.report ?? "");

  return (
    <li className="group relative [transform-style:preserve-3d]">
      <div
        tabIndex={0}
        role="button"
        aria-label={`${AGENT_LABELS[entry.agentKey]} — ${entry.action}`}
        className="relative cursor-default rounded-[8px] border border-white/10 outline-none transition-[transform,box-shadow,border-color] duration-300 ease-out [transform-origin:top] group-hover:border-white/25 group-hover:shadow-[0_22px_46px_-14px_rgba(0,0,0,0.95),0_0_30px_-14px_rgba(190,205,225,0.35)] group-hover:[transform:translateZ(28px)_rotateX(-5deg)] group-focus-within:border-white/25 group-focus-within:[transform:translateZ(28px)_rotateX(-5deg)]"
        style={{ background: "var(--drawer-face)" }}
      >
        {/* Lit top edge of the face. */}
        <span aria-hidden className="pointer-events-none absolute inset-x-4 top-0 h-px bg-white/18" />

        <div className="flex h-[54px] items-center gap-3.5 px-3.5">
          {/* Grab bar. */}
          <span
            aria-hidden
            className="h-[30px] w-[5px] shrink-0 rounded-full"
            style={{ background: "linear-gradient(180deg, #c3ccd6, #5a636e 45%, #262d35)" }}
          />

          <RingLed color={color} />

          <span className="shrink-0 font-mono text-[13px] text-muted-foreground">
            {formatTimestamp(entry.timestamp)}
          </span>

          <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-foreground">
            {AGENT_LABELS[entry.agentKey]}
            <span className="ml-2.5 font-mono text-[12.5px] font-normal text-faint">
              {entry.action}
            </span>
          </span>

          {/* The mechanism lane. The pull and the instrument bar occupy the same space and
              cross-fade, so the drawer opening is one object changing rather than a swap. */}
          <span aria-hidden className="relative hidden h-full w-[540px] shrink-0 lg:block">
            <CircuitTrace />
            <ChromePull />
          </span>

          <span className="ml-auto flex w-[86px] shrink-0 justify-end lg:ml-0">
            <span
              className="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold"
              style={{
                color,
                background: `${color}1f`,
                boxShadow: `inset 0 0 0 1px ${color}33`,
              }}
            >
              {entry.outcomeLabel}
            </span>
          </span>

          <ChevronRight
            className="size-4 shrink-0 text-faint transition-transform duration-300 group-hover:rotate-90 group-focus-within:rotate-90"
            aria-hidden
          />
        </div>

        {/* Contents. Zero height until the unit is pulled out. */}
        <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out group-hover:grid-rows-[1fr] group-focus-within:grid-rows-[1fr]">
          <div className="overflow-hidden">
            {/* The cavity: darker than the face, with the face's shadow falling into it. That
                inset is what puts the contents *behind* the front panel rather than below it. */}
            <div
              className="border-t border-white/8 px-3.5 py-4"
              style={{
                background: "linear-gradient(180deg, #05080b, #080c11)",
                boxShadow: "inset 0 14px 22px -14px rgba(0,0,0,1)",
              }}
            >
              <div className="flex items-start gap-5">
                <NotchedThumb src={AGENT_IMAGE[entry.agentKey]} color={color} />

                <div className="min-w-0 flex-1">
                  <div className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-faint">
                    Report
                  </div>
                  <p className="line-clamp-5 text-[14px] leading-[1.55] text-muted-foreground">
                    {entry.report?.trim() || "No report was captured for this run."}
                  </p>
                </div>

                <dl className="hidden w-[300px] shrink-0 self-stretch border-l border-white/8 pl-5 lg:block">
                  <MetaRow icon={<User className="size-4" />} label="Operator" value={entry.operator} />
                  <MetaRow icon={AgentGlyph} label="Agent" value={AGENT_LABELS[entry.agentKey]} />
                  <MetaRow icon={EventGlyph} label="Event" value={entry.id} />
                  {errors && <MetaRow icon={EventGlyph} label="Errors" value={errors} />}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

/* ── The rack ───────────────────────────────────────────────────────────── */

function ChassisButton({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="grid size-[38px] place-items-center rounded-[12px] border border-white/12 text-muted-foreground transition-colors duration-200 hover:border-white/25 hover:text-foreground"
      style={{ background: "linear-gradient(180deg, #232a32, #12171c)" }}
    >
      {children}
    </button>
  );
}

export function LogRack({ entries }: { entries: ActivityEntry[] }) {
  return (
    <section
      className="relative rounded-[28px] p-[2px] shadow-[0_40px_90px_-40px_rgba(0,0,0,1)]"
      style={{ background: "var(--chassis-edge)" }}
    >
      <div className="relative rounded-[28px] p-[15px]" style={{ background: "var(--chassis-face)" }}>
        <div className="relative overflow-hidden rounded-[20px] border border-white/12 bg-[#05080b] px-4 pb-4 pt-4 shadow-[inset_0_2px_6px_rgba(0,0,0,0.9)]">
          {/* Board macro behind everything inside the chassis. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.14]"
            style={{ backgroundImage: "url(/media/images/hero/circuit-macro.jpg)" }}
          />

          <header className="relative mb-3.5 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-heading text-h4 font-semibold tracking-tight text-foreground">
                Run history
              </h2>
              <p className="mt-1 text-[13px] text-faint">
                {entries.length === 0
                  ? "Nothing recorded yet"
                  : `${entries.length} run${entries.length === 1 ? "" : "s"}, newest first — hover a drawer to open it`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ChassisButton label="Export log">
                <FileDown className="size-[17px]" />
              </ChassisButton>
              <ChassisButton label="Log settings">
                <Settings className="size-[17px]" />
              </ChassisButton>
              <span
                /* Same treatment as the navbar avatar — brand gradient, #0c0f14 text — so the
                   two GB chips on screen at once read as the same person, not two widgets. */
                className="grid size-[38px] place-items-center rounded-[12px] border border-white/20 bg-grad text-[13px] font-semibold text-[#0c0f14]"
              >
                GB
              </span>
            </div>
          </header>

          {entries.length === 0 ? (
            <div className="relative px-4 py-14 text-center text-[13px] text-muted-foreground">
              No runs yet — run an agent to see activity here.
            </div>
          ) : (
            /* The last unit fades into the chassis floor instead of being guillotined by the
               scroll edge, which is what tells you the list continues. */
            <div
              className="rack-scroll relative max-h-[470px] overflow-y-auto overscroll-contain pr-2.5"
              style={{
                maskImage: "linear-gradient(to bottom, #000 calc(100% - 44px), transparent)",
                WebkitMaskImage: "linear-gradient(to bottom, #000 calc(100% - 44px), transparent)",
              }}
            >
              <ul className="flex flex-col gap-2.5 py-1 [perspective:1400px]">
                {entries.map((e) => (
                  <RackUnit key={e.id} entry={e} />
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <CornerBracket side="left" />
      <CornerBracket side="right" />
    </section>
  );
}
