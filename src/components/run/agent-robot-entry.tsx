"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { RobotSvg } from "@/components/dashboard/robot-svg";

/* ── Per-agent config ─────────────────────────────────────── */
const CFG = {
  health: {
    tag: "SYS_HEALTH_BOT",
    accentColor: "#46E0A0",
    eyeColor: "#3FD0E0",
    lines: [
      "Welcome! So you finally came here...",
      "I inspect CPU, memory & disk in real-time.",
      "I flag anything above 85% threshold.",
      "Drag my tail below to start the scan!",
    ] as const,
  },
  log: {
    tag: "LOG_ANALYZER_BOT",
    accentColor: "#FF6B81",
    eyeColor: "#FF6B81",
    lines: [
      "Welcome! So you finally came here...",
      "I read logs so you don't have to.",
      "I count errors, warnings & anomalies.",
      "Drag my tail below to start analysis!",
    ] as const,
  },
  backup: {
    tag: "BACKUP_DR_BOT",
    accentColor: "#7C6BFF",
    eyeColor: "#A99BFF",
    lines: [
      "Welcome! So you finally came here...",
      "I create timestamped backups on demand.",
      "Checking disaster-recovery status.",
      "Drag my tail below to protect your data!",
    ] as const,
  },
} as const;

type AgentKey = keyof typeof CFG;

/* ── Accumulated terminal-style cloud (lines stay once typed) ── */
function RobotCloud({
  tag,
  lines,
  color,
}: {
  tag: string;
  lines: readonly string[];
  color: string;
}) {
  const [completed, setCompleted] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (lineIdx >= lines.length) return;
    const line = lines[lineIdx] ?? "";
    if (charIdx < line.length) {
      timer.current = setTimeout(() => {
        setCurrent(line.slice(0, charIdx + 1));
        setCharIdx((n) => n + 1);
      }, 26);
    } else {
      timer.current = setTimeout(() => {
        setCompleted((prev) => [...prev, line]);
        setCurrent("");
        setCharIdx(0);
        setLineIdx((i) => i + 1);
      }, 340);
    }
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [lineIdx, charIdx, lines]);

  const done = lineIdx >= lines.length;

  return (
    <div
      className="panel-deep relative rounded-xl border px-5 py-4"
      style={{
        minWidth: 300,
        maxWidth: 420,
        boxShadow: `0 0 48px ${color}38, 0 0 100px rgba(0,0,0,0.85)`,
        borderColor: `${color}70`,
      }}
    >
      {/* Down-tail pointing to robot below */}
      <div
        className="absolute -bottom-[10px] left-1/2 -translate-x-1/2"
        style={{
          borderTop: `10px solid ${color}70`,
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
        }}
      />
      <div
        className="mb-2 font-mono text-[9.5px] uppercase tracking-widest"
        style={{ color }}
      >
        [{tag}]
      </div>
      <div className="space-y-0.5">
        {completed.map((line, i) => (
          <div key={i} className="font-mono text-[12.5px] leading-[1.75]" style={{ color }}>
            {line}
          </div>
        ))}
        {current && (
          <div className="font-mono text-[12.5px] leading-[1.75]" style={{ color }}>
            {current}
            <span style={{ animation: "blink-cursor 0.8s infinite" }}>_</span>
          </div>
        )}
      </div>
      {done && (
        <div
          className="mt-2 font-mono text-[10px]"
          style={{ color: `${color}70` }}
        >
          ↓ drag the tail below to activate
        </div>
      )}
    </div>
  );
}

/* ── Elastic draggable tail ──────────────────────────────── */
export function DraggableTail({
  color,
  onPull,
  disabled,
}: {
  color: string;
  onPull: () => void;
  disabled?: boolean;
}) {
  const tailY = useMotionValue(0);
  // Cord stretches from 72px to 160px as user drags
  const cordH = useTransform(tailY, [0, 120], [72, 160]);
  // Handle glows brighter as pulled
  const handleGlow = useTransform(tailY, [0, 80], [8, 28]);

  return (
    <div className="flex flex-col items-center">
      <motion.div
        drag={disabled ? false : "y"}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.45 }}
        style={{ y: tailY }}
        whileDrag={{ scale: 1.06 }}
        onDragEnd={(_, info) => {
          if (!disabled && info.offset.y > 55) onPull();
        }}
        className={`flex flex-col items-center touch-none select-none ${disabled ? "cursor-not-allowed opacity-50" : "cursor-grab active:cursor-grabbing"}`}
      >
        {/* Elastic cord */}
        <motion.div
          style={{ height: cordH }}
          className="flex flex-col items-center overflow-visible"
        >
          {/* Dashed cord */}
          <div
            className="w-0.5 flex-1"
            style={{
              background: `repeating-linear-gradient(180deg, ${color} 0px, ${color} 7px, transparent 7px, transparent 14px)`,
              filter: `drop-shadow(0 0 5px ${color})`,
            }}
          />
          {/* Pull handle ring */}
          <motion.div
            style={{
              background: color,
              boxShadow: useTransform(
                handleGlow,
                (g) => `0 0 ${g}px ${color}, 0 0 ${g * 2}px ${color}60`
              ),
            }}
            className="mt-1 grid size-8 shrink-0 place-items-center rounded-full"
          >
            <div className="size-3.5 rounded-full bg-[#050510]" />
          </motion.div>
        </motion.div>
      </motion.div>
      <div
        className="mt-2.5 font-mono text-[9px] uppercase tracking-widest"
        style={{ color, animation: "wire-spark 1.6s ease-in-out infinite" }}
      >
        drag to start ↓
      </div>
    </div>
  );
}

/* ── Main entry component ───────────────────────────────────── */
export function AgentRobotEntry({
  agentKey,
  onRun,
  disabled = false,
}: {
  agentKey: AgentKey;
  onRun: () => void;
  disabled?: boolean;
}) {
  const cfg = CFG[agentKey];
  const [settled, setSettled] = useState(false);
  const [pulled, setPulled] = useState(false);

  function handlePull() {
    if (disabled || pulled) return;
    setPulled(true);
    onRun();
  }

  return (
    <div className="flex flex-col items-center py-10">
      {/* Cloud — appears after robot slides in */}
      <AnimatePresence>
        {settled && (
          <motion.div
            key={`cloud-${agentKey}`}
            initial={{ opacity: 0, scale: 0.85, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 14 }}
            transition={{ duration: 0.45 }}
            className="mb-6"
          >
            <RobotCloud tag={cfg.tag} lines={cfg.lines} color={cfg.accentColor} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Robot slides in from LEFT on mount / agentKey change */}
      <AnimatePresence mode="wait">
        <motion.div
          key={agentKey}
          initial={{ x: "-110vw", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "110vw", opacity: 0 }}
          transition={{ type: "spring", stiffness: 52, damping: 14 }}
          onAnimationComplete={() => setSettled(true)}
          className="flex flex-col items-center"
        >
          <RobotSvg
            accentColor={cfg.accentColor}
            eyeColor={cfg.eyeColor}
            size={148}
            animated
            waveArm={settled && !pulled}
          />

          {/* Elastic draggable tail */}
          <AnimatePresence>
            {settled && !pulled && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.6 }}
              >
                <DraggableTail
                  color={cfg.accentColor}
                  onPull={handlePull}
                  disabled={disabled}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pulled state feedback */}
          {pulled && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-3 font-mono text-[11px] uppercase tracking-widest"
              style={{ color: cfg.accentColor }}
            >
              ⚡ Activating...
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
