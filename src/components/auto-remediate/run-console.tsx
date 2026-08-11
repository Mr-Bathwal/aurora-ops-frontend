"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CornerDownLeft, DatabaseBackup, FileSearch, ShieldCheck, Sparkles, Waypoints } from "lucide-react";
import { Prose } from "@/components/aurora/prose";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AutoRemediateResult } from "@/lib/api";
import type { IconType } from "@/lib/icon-type";

export type Exchange = {
  id: number;
  prompt: string;
  result: AutoRemediateResult | null;
  error: string | null;
};

/** The console you actually drive the chain from.
 *
 * A transcript rather than a form, because the output *is* a conversation between four
 * parties — the operator asks, three agents answer in turn. Rendering that as one report card
 * throws away the thing that makes the chain interesting.
 *
 * What you type now reaches the graph: it briefs the Log Analyzer, and the router weighs it
 * alongside the diagnosis when deciding whether Backup & DR runs. Asking about backups opens
 * that lane even when the log itself is quiet about them.
 */

const SUGGESTIONS = [
  "Run the full remediation chain",
  "Are my backups actually running?",
  "Something is failing — diagnose and fix it",
];

const SPEAKERS: Record<string, { name: string; icon: IconType; accent: string }> = {
  log: { name: "Log Analyzer", icon: FileSearch, accent: "#5ac8ff" },
  router: { name: "Decision Router", icon: Waypoints, accent: "#8fb8ff" },
  backup: { name: "Backup & DR", icon: DatabaseBackup, accent: "#2f7fe0" },
  supervisor: { name: "Chain Supervisor", icon: ShieldCheck, accent: "#34f5c5" },
};

function AgentMessage({ speaker, text, delay }: { speaker: keyof typeof SPEAKERS; text: string; delay: number }) {
  const s = SPEAKERS[speaker];
  const Icon = s.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex gap-3"
    >
      <div
        className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-[10px] border"
        style={{ borderColor: `${s.accent}44`, background: `${s.accent}12`, color: s.accent }}
      >
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1 rounded-[16px] rounded-tl-[6px] border border-white/8 bg-[rgba(10,14,22,0.62)] px-4 py-3">
        <div className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: s.accent }}>
          {s.name}
        </div>
        <Prose text={text} className="text-[13.5px] leading-[1.62] text-muted-foreground" />
      </div>
    </motion.div>
  );
}

function Thinking() {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-[10px] border border-brand/35 bg-brand/10">
        <Sparkles size={15} className="text-brand-2" />
      </div>
      <div className="flex items-center gap-2 rounded-[16px] rounded-tl-[6px] border border-white/8 bg-[rgba(10,14,22,0.62)] px-4 py-3.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-1.5 rounded-full bg-brand-2"
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.16 }}
          />
        ))}
        <span className="ml-1 font-mono text-[11.5px] text-faint">the chain is running…</span>
      </div>
    </div>
  );
}

export function RunConsole({
  history,
  loading,
  onSend,
}: {
  history: Exchange[];
  loading: boolean;
  onSend: (prompt: string) => void;
}) {
  const [text, setText] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);

  /** Keep the newest turn in view as the transcript grows — by moving the transcript's own
   *  scrollTop, never `scrollIntoView`.
   *
   *  `scrollIntoView` walks every scrollable ancestor, and the document is one of them. On
   *  mount, with an empty transcript, it found the end sentinel a page and a half below the
   *  fold and scrolled the *window* down to it — so arriving at /auto-remediate dropped you
   *  at the console with the intro and the graph already behind you. Even `block: "nearest"`
   *  does it, because "nearest" still scrolls when the target is out of view. */
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [history.length, loading]);

  function send(prompt?: string) {
    const value = (prompt ?? text).trim() || SUGGESTIONS[0];
    if (loading) return;
    onSend(value);
    setText("");
  }

  const empty = history.length === 0 && !loading;

  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[rgba(8,11,18,0.6)] backdrop-blur-xl">
      {/* Transcript */}
      <div ref={scrollerRef} className="max-h-[560px] min-h-[320px] space-y-5 overflow-y-auto p-5 sm:p-6">
        <AnimatePresence initial={false}>
          {empty && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid min-h-[260px] place-items-center text-center"
            >
              <div>
                <div className="mx-auto grid size-12 place-items-center rounded-[14px] border border-brand/30 bg-grad-soft">
                  <Sparkles size={20} className="text-brand-2" />
                </div>
                <h3 className="mt-4 font-heading text-[16px] font-semibold">Start the chain</h3>
                <p className="mx-auto mt-1.5 max-w-[42ch] text-[13.5px] leading-[1.6] text-muted-foreground">
                  Four stages, one message. Every answer below comes back from a real agent run.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full border border-white/12 bg-white/[0.03] px-3.5 py-1.5 text-[12.5px] text-muted-foreground transition-colors hover:border-brand/40 hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {history.map((x) => (
          <div key={x.id} className="space-y-4">
            {/* Operator */}
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-[16px] rounded-tr-[6px] border border-brand/25 bg-grad-soft px-4 py-2.5 text-[13.5px] leading-[1.55] text-foreground">
                {x.prompt}
              </div>
            </div>

            {x.error ? (
              <div className="rounded-[16px] border border-crit/40 bg-crit-soft px-4 py-3 text-[13px] text-crit">
                {x.error}
              </div>
            ) : x.result ? (
              <>
                <AgentMessage speaker="log" text={x.result.diagnosis} delay={0} />
                <AgentMessage
                  speaker="router"
                  text={
                    x.result.needs_backup
                      ? "This points at a backup or DR failure. Routing to the Backup & DR agent before verification."
                      : "Nothing here implicates backups. Skipping remediation and going straight to verification."
                  }
                  delay={0.12}
                />
                {x.result.needs_backup && x.result.remediation && (
                  <AgentMessage speaker="backup" text={x.result.remediation} delay={0.24} />
                )}
                <AgentMessage speaker="supervisor" text={x.result.report} delay={x.result.needs_backup ? 0.36 : 0.24} />
              </>
            ) : null}
          </div>
        ))}

        {loading && <Thinking />}
      </div>

      {/* Composer */}
      <div className="border-t border-white/8 bg-[rgba(5,7,12,0.55)] p-4 sm:px-6">
        <div className={cn("flex items-center gap-3 rounded-[16px] border border-white/12 bg-[rgba(10,14,22,0.7)] px-4 transition-colors", !loading && "focus-within:border-brand/45")}>
          <Sparkles size={16} className="shrink-0 text-brand-2" />
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            disabled={loading}
            placeholder="Describe what you are seeing, or just press run…"
            aria-label="Message the remediation chain"
            className="h-12! border-none! bg-transparent! px-0! text-[14px] focus-visible:border-transparent! focus-visible:ring-0! placeholder:text-faint"
          />
          <Button
            onClick={() => send()}
            disabled={loading}
            className="shrink-0 gap-1.5 bg-grad px-4 text-[#0c0f14] hover:brightness-110"
          >
            Run chain
            <CornerDownLeft size={14} />
          </Button>
        </div>
        <p className="mt-2 px-1 font-mono text-[11px] text-faint">
          What you type steers the run — it briefs the Log Analyzer, and can open the
          remediation lane on its own.
        </p>
      </div>
    </div>
  );
}
