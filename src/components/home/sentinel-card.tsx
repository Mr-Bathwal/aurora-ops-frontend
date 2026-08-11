"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { SentinelGlyph, type SentinelGlyphName } from "@/components/home/sentinel-glyph";
import type { CatalogAgent } from "@/components/agents/agent-catalog";
import { useActivityStore } from "@/lib/activity-store";
import type { AgentKey } from "@/lib/activity-store";

/** Stills pulled from the stock clips by `scripts/extract-posters.mjs`. Each card gets the
 * hardware its agent actually looks after — patch panel for vitals, a drive-labelled rack
 * for logs, hot-swap bays for backups — so the glass has something true behind it rather
 * than three copies of the same stock photo. */
const BACKDROP: Record<SentinelGlyphName, string> = {
  health: "/media/images/cards/health.jpg",
  log: "/media/images/cards/log.jpg",
  backup: "/media/images/cards/backup.jpg",
};

/** Severity decides the badge's colour, not the card's position.
 *
 * The reference shows card one in rose and card two in teal, which looks arbitrary until you
 * read it as a legend: something is on fire versus something merely wants attention. Wiring
 * it to the real severity mix means the two colours in the design are the two colours the
 * data can actually produce. */
function useProblems(agent: CatalogAgent) {
  const key = agent.runnable as AgentKey | null;
  const count = useActivityStore((s) =>
    key ? s.entries.filter((e) => e.agentKey === key && (e.severity === "crit" || e.severity === "warn")).length : 0
  );
  const critical = useActivityStore((s) =>
    key ? s.entries.some((e) => e.agentKey === key && e.severity === "crit") : false
  );
  return { count, critical };
}

export function SentinelCard({ agent, index }: { agent: CatalogAgent; index: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { count, critical } = useProblems(agent);

  const live = Boolean(agent.runnable);
  const glyph = agent.key as SentinelGlyphName;
  // "Backup & DR" -> "Backup". The disclosure chip wants the family, not the full title,
  // which is already spelled out three lines below it.
  const shortName = agent.name.replace(/\s*&.*$/, "").split(" ")[0];

  return (
    <motion.article
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.55, delay: Math.min(index, 5) * 0.09, ease: [0.2, 0.7, 0.2, 1] }}
      className="group relative isolate flex flex-col overflow-hidden rounded-[20px] border border-white/10 backdrop-blur-2xl transition-[border-color,transform] duration-500 hover:-translate-y-1 hover:border-white/20"
      style={{ boxShadow: "0 24px 60px -30px rgba(0,0,0,0.9)" }}
    >
      {/* ---- What sits behind the glass ---- */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <Image
          src={BACKDROP[glyph]}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="scale-[1.1] object-cover opacity-[0.55] blur-[1px] transition-[opacity,transform] duration-700 ease-out group-hover:scale-[1.16] group-hover:opacity-[0.7]"
        />
        {/* Legibility, as a gradient rather than a flat wash. The photograph survives at the
            top where only the glyph and the badge sit on it, and has faded to near-solid by
            the time the blurb starts — body copy over a busy image is the fastest way to
            make a card like this look cheap.
            The ramp starts late on purpose: at an even 40% the hardware was technically
            present and effectively invisible, which is the worst of both — you pay for the
            image and the card still looks like a flat panel. */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,8,16,0.18)_0%,rgba(7,8,16,0.42)_30%,rgba(7,8,16,0.86)_58%,rgba(7,8,16,0.95)_78%,rgba(7,8,16,0.97)_100%)]" />
        <div
          className="absolute inset-0 opacity-70 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: `radial-gradient(80% 55% at 12% 0%, ${agent.color}26, transparent 72%)` }}
        />
        {/* Top rim highlight — the same chamfer the glyph tile has, at card scale. */}
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.35)_28%,rgba(255,255,255,0.35)_72%,transparent)]" />
      </div>

      <div className="flex flex-1 flex-col p-5">
        {/* ---- Glyph + status ---- */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div
            className="shrink-0 transition-transform duration-500 ease-out group-hover:scale-[1.06]"
            style={{ filter: `drop-shadow(0 10px 24px ${agent.color}33)` }}
          >
            <SentinelGlyph name={glyph} size={72} />
          </div>

          {live && count > 0 ? (
            <span
              className={
                "inline-flex items-center gap-2 rounded-full px-2.5 py-1 font-mono text-[10.5px] " +
                (critical
                  ? "badge-throb border border-crit/40 bg-crit-soft text-crit"
                  : "border border-brand/40 bg-brand/12 text-brand")
              }
            >
              {count} {count === 1 ? "error" : "errors"}
              <span
                className={
                  "grid size-[16px] place-items-center rounded-full text-[9px] font-bold " +
                  (critical ? "bg-crit text-[#1a0509]" : "bg-brand text-[#04130f]")
                }
              >
                {count}
              </span>
            </span>
          ) : (
            /* The chevron is not decoration. With nothing wrong there is no number worth
               shouting, so the slot becomes the way into the agent's readouts instead. */
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5 font-mono text-[10.5px] text-muted-foreground transition-colors hover:border-white/25 hover:text-foreground"
            >
              {shortName}
              <ChevronDown size={12} className={"transition-transform duration-300 " + (open ? "rotate-180" : "")} />
            </button>
          )}
        </div>

        {/* ---- Title ---- */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <h3 className="font-heading text-[16px] font-semibold tracking-tight">{agent.name}</h3>
          <span
            className="rounded-full px-2 py-[3px] font-mono text-[9.5px] uppercase tracking-[0.08em]"
            style={
              live
                ? { color: agent.color, background: `${agent.color}1a`, boxShadow: `inset 0 0 0 1px ${agent.color}38` }
                : { color: "var(--faint)", background: "rgba(255,255,255,0.04)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }
            }
          >
            {live ? "Activated" : "Queued"}
          </span>
        </div>

        <p className="mt-2.5 text-[12.5px] leading-[1.62] text-muted-foreground">{agent.blurb}</p>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-2.5 border-t border-white/8 pt-4">
                {agent.meters.map((m) => (
                  <div key={m.label}>
                    <div className="mb-1.5 flex justify-between font-mono text-[10px] text-faint">
                      <span>{m.label}</span>
                      <span style={{ color: agent.color }}>{m.value}%</span>
                    </div>
                    <div className="h-[3px] overflow-hidden rounded-full bg-white/8">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${m.value}%` }}
                        transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
                        className="h-full rounded-full"
                        style={{ background: agent.color, boxShadow: `0 0 10px ${agent.color}` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* `mt-auto` rather than a fixed-height blurb: the three blurbs are different lengths
            and the disclosure changes the card's height anyway, so pinning the button to the
            bottom is what keeps the row of CTAs on one line. */}
        <div className="relative mt-auto pt-5">
          <button
            type="button"
            disabled={!live}
            onClick={() => router.push(`/run?tab=${agent.runnable}&autorun=1`)}
            className="relative w-full overflow-hidden rounded-[12px] border border-white/14 bg-white/[0.04] py-2.5 text-[13px] font-medium text-foreground transition-all duration-200 enabled:hover:border-brand/60 enabled:hover:bg-brand/12 enabled:hover:shadow-[0_0_28px_-8px_var(--brand)] disabled:cursor-not-allowed disabled:text-faint"
          >
            {live ? "Run agent" : "Not deployed"}
          </button>
          {/* The pulse the spec asks for, drawn outside the button's own box so the label
              never dims with it. Staggered per card so the row breathes in sequence rather
              than flashing in unison. */}
          {live && (
            <span
              aria-hidden
              className="cta-pulse pointer-events-none absolute inset-x-0 bottom-0 top-5 rounded-[12px] border"
              style={{ borderColor: agent.color, animationDelay: `${index * 0.45}s` }}
            />
          )}
        </div>
      </div>
    </motion.article>
  );
}
