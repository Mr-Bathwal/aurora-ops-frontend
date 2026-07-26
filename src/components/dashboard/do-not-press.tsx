"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useActivityStore } from "@/lib/activity-store";
import { ActivityTable } from "@/components/activity/activity-table";
import { RobotSvg } from "@/components/dashboard/robot-svg";
import { useInView } from "@/hooks/use-in-view";

/*
  Loop animation (triggered once on scroll-into-view):

  Phase 0 → hidden behind button (translateX away, opacity 0)
  Phase 1 → entering: slides out from behind button to its side
  Phase 2 → visible beside button (slide complete)
  Phase 3 → cloud appears
  Phase 4 → cloud hides  (5 s window)
  Phase 5 → robot slides back behind button
  → 3 s pause → flip side → back to phase 0 → repeat

  LEFT side:  robot to the LEFT of button,  enters via translateX(190px → 0)
  RIGHT side: robot to the RIGHT of button, enters via translateX(-190px → 0)
*/

const ROBOT_SIZE = 64; // px
// button is approx 200 px wide; 190 px shift puts robot fully behind it
const HIDE_TX = 190;

export function DoNotPress() {
  const [open, setOpen] = useState(false);
  const entries = useActivityStore((s) => s.entries);

  const [side, setSide] = useState<"left" | "right">("left");
  const [phase, setPhase] = useState(0);
  const [cloudOn, setCloudOn] = useState(false);

  const { ref: footerRef, inView } = useInView<HTMLDivElement>(0.15);
  const loopActive = useRef(false);
  const loopTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!inView) return;
    loopActive.current = true;

    function doOneCycle(thisSide: "left" | "right") {
      if (!loopActive.current) return;
      loopTimers.current.forEach(clearTimeout);
      loopTimers.current = [];

      setSide(thisSide);
      setPhase(0);
      setCloudOn(false);

      const push = (fn: () => void, ms: number) => {
        loopTimers.current.push(setTimeout(() => { if (loopActive.current) fn(); }, ms));
      };

      push(() => setPhase(1),          150);  // start sliding in
      push(() => setPhase(2),          900);  // fully visible
      push(() => setCloudOn(true),    1350);  // cloud appears
      push(() => setCloudOn(false),   6350);  // cloud hides (5 s)
      push(() => setPhase(5),         6700);  // start sliding back (fast, 0.45 s)
      push(() => setPhase(0),         7150);  // fully hidden
      // 3 s pause, then opposite side
      push(() => doOneCycle(thisSide === "left" ? "right" : "left"), 10150);
    }

    doOneCycle("left");

    return () => {
      loopActive.current = false;
      loopTimers.current.forEach(clearTimeout);
    };
  }, [inView]);

  /* translateX for robot slide — positive = right shift (used for left-side hiding) */
  const robotHidden = phase === 0 || phase >= 5;
  const slideX = robotHidden
    ? (side === "left" ? HIDE_TX : -HIDE_TX)
    : 0;

  return (
    <>
      <div
        ref={footerRef}
        className="flex flex-col items-center gap-10 pb-20 pt-14"
      >
        {/* Section label */}
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-faint">
          [ activity records ]
        </div>

        {/* Button + robot (centered, relative wrapper for z-index stacking) */}
        <div className="relative flex items-end">

          {/* ── Themed gradient button (always visible, z-index 3) ── */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group relative z-[3] overflow-hidden rounded-2xl px-8 py-5 font-heading text-[15px] font-semibold text-[#050510] shadow-[0_0_28px_rgba(124,107,255,0.38),0_4px_22px_rgba(0,0,0,0.45)] transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_0_48px_rgba(124,107,255,0.6),0_6px_40px_rgba(63,208,224,0.4)] active:scale-95"
            style={{ background: "linear-gradient(135deg, #7C6BFF 0%, #3FD0E0 100%)" }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
              style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 55%)" }}
            />
            <div className="relative">
              <div className="mb-0.5 font-mono text-[8.5px] uppercase tracking-[0.22em] text-[#050510]/60">
                [RECORDS]
              </div>
              View History
              <div className="mt-0.5 font-mono text-[10px] text-[#050510]/55">
                {entries.length} run{entries.length !== 1 ? "s" : ""} logged
              </div>
            </div>
          </button>

          {/* ── Robot (absolutely positioned beside button, slides from behind it) ── */}
          <div
            className="absolute bottom-0 z-[1]"
            style={
              side === "left"
                ? { right: "calc(100% + 14px)" }
                : { left: "calc(100% + 14px)" }
            }
          >
            {/* flex-col items-center aligns cloud center with robot head — tail is directly above head */}
            <div
              className="flex flex-col items-center"
              style={{
                transform: `translateX(${slideX}px)`,
                /* Entering: bouncy 0.8 s; hiding (phase 5+): fast 0.45 s */
                transition: phase === 1
                  ? "transform 0.8s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease"
                  : "transform 0.45s ease-in, opacity 0.28s ease",
                opacity: phase === 0 ? 0 : 1,
              }}
            >
              {/* Cloud — appears above robot at phase 3 */}
              <div
                style={{
                  opacity: cloudOn ? 1 : 0,
                  transform: cloudOn ? "translateY(0)" : "translateY(10px)",
                  transition: "opacity 0.45s ease, transform 0.45s ease",
                  marginBottom: 12,
                  pointerEvents: cloudOn ? "auto" : "none",
                }}
              >
                <div
                  className="relative rounded-xl px-4 py-3"
                  style={{
                    background: "rgba(6,6,16,0.97)",
                    border: "1px solid rgba(70,224,160,0.55)",
                    boxShadow: "0 0 22px rgba(70,224,160,0.2)",
                    minWidth: 175,
                    animation: cloudOn ? "egg-in 0.35s ease forwards" : "none",
                  }}
                >
                  {/* Cloud tail — points DOWN toward button/robot below */}
                  <div
                    className="absolute -bottom-[9px] left-1/2 -translate-x-1/2"
                    style={{
                      borderTop: "9px solid rgba(70,224,160,0.55)",
                      borderLeft: "7px solid transparent",
                      borderRight: "7px solid transparent",
                    }}
                  />
                  <div
                    className="mb-1 font-mono text-[9px] uppercase tracking-widest"
                    style={{ color: "#46E0A0" }}
                  >
                    [HISTORY_BOT]
                  </div>
                  <div
                    className="font-mono text-[11.5px] leading-snug"
                    style={{ color: "#46E0A0" }}
                  >
                    Your run history is here!
                  </div>
                  <div
                    className="mt-1.5 font-mono text-[10px]"
                    style={{ color: "rgba(70,224,160,0.5)" }}
                  >
                    ↳ click the button
                  </div>
                </div>
              </div>

              {/* Robot body */}
              <RobotSvg
                accentColor="#46E0A0"
                eyeColor="#3FD0E0"
                size={ROBOT_SIZE}
                animated
              />
            </div>
          </div>
        </div>

        {/* Footer attribution */}
        <div className="mt-4 text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-faint">
            IT Ops Assistant Hub · Agentic Console · Multi-agent AI Platform
          </div>
          <div
            className="mt-1 font-mono text-[9px]"
            style={{ color: "rgba(63,208,224,0.32)" }}
          >
            powered by LangChain · LangGraph · Groq llama-3.3-70b
          </div>
        </div>
      </div>

      {/* Full-screen activity overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(4,4,12,0.88)", backdropFilter: "blur(14px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="relative mx-4 w-full max-w-3xl overflow-hidden rounded-2xl"
            style={{
              background: "rgba(8,8,14,0.98)",
              border: "1px solid rgba(124,107,255,0.35)",
              boxShadow: "0 0 60px rgba(124,107,255,0.12), 0 24px 60px rgba(0,0,0,0.8)",
            }}
          >
            <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
              <div>
                <div
                  className="mb-0.5 font-mono text-[9.5px] uppercase tracking-widest"
                  style={{ color: "rgba(124,107,255,0.6)" }}
                >
                  [AUDIT_LOG_ACCESS_GRANTED]
                </div>
                <div className="font-heading text-[16px] font-semibold">
                  Activity &amp; Audit Log
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Close activity log"
                aria-label="Close activity log"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-card hover:text-foreground"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <div className="max-h-[62vh] overflow-y-auto">
              <ActivityTable entries={entries.slice(0, 50)} variant="full" />
            </div>
            <div
              className="border-t border-border/40 px-6 py-3 font-mono text-[10px]"
              style={{ color: "#5C6582" }}
            >
              {entries.length} total runs recorded · all timestamps in local time
            </div>
          </div>
        </div>
      )}
    </>
  );
}
