"use client";

import { useEffect, useRef, useState } from "react";

const SEQUENCE = [
  "> initializing neural link...",
  "✓ operator identified: Gourav B.",
  "✓ systems nominal: 3 agents online",
  "→ monitor CPU · memory · disk live",
  "→ analyze logs in plain English",
  "→ orchestrate with one sentence",
  "→ auto-diagnose & self-heal",
  "> all systems standing by.",
  "> awaiting your command_",
];

export function BrandEgg({ children }: { children?: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState("");
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function reset() {
    setLines([]);
    setCurrentLine("");
    setLineIdx(0);
    setCharIdx(0);
  }

  function show() {
    if (visible) return;
    setVisible(true);
    reset();
  }

  function hide() {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
    reset();
  }

  useEffect(() => {
    if (!visible) return;
    function tick() {
      if (lineIdx >= SEQUENCE.length) return;
      const line = SEQUENCE[lineIdx];
      if (charIdx < line.length) {
        setCurrentLine(line.slice(0, charIdx + 1));
        setCharIdx((c) => c + 1);
        timer.current = setTimeout(tick, 28);
      } else {
        setLines((prev) => [...prev, line]);
        setCurrentLine("");
        setCharIdx(0);
        setLineIdx((l) => l + 1);
        timer.current = setTimeout(tick, 60);
      }
    }
    timer.current = setTimeout(tick, 20);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [visible, lineIdx, charIdx]);

  return (
    <>
      {/* Screen blur overlay when egg visible */}
      {visible && (
        <div
          className="fixed inset-0 z-40 pointer-events-none"
          style={{ backdropFilter: "blur(6px)", background: "rgba(4,4,12,0.45)" }}
        />
      )}

      <div
        className="relative z-50 flex shrink-0 cursor-pointer items-center gap-2.5"
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        {children}

        {visible && (
          <div
            className="absolute left-0 top-[calc(100%+10px)] z-50 w-[480px]"
            style={{ animation: "egg-in 0.3s cubic-bezier(0.2,0.8,0.2,1) forwards" }}
          >
            {/* Wire extending from brand text */}
            <div className="mb-1.5 ml-4 flex items-center gap-1">
              <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, #7C6BFF, #3FD0E0)" }} />
              <div className="size-1.5 rounded-full" style={{ background: "#3FD0E0", boxShadow: "0 0 6px #3FD0E0" }} />
            </div>
            {/* Main terminal cloud — big */}
            <div
              className="relative overflow-hidden rounded-2xl px-6 py-5"
              style={{
                background: "rgba(4, 4, 16, 0.98)",
                border: "1px solid rgba(124,107,255,0.55)",
                boxShadow: "0 0 60px rgba(124,107,255,0.22), 0 0 120px rgba(63,208,224,0.1), 0 32px 80px rgba(0,0,0,0.8)",
              }}
            >
              {/* Horizontal scan line */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px"
                style={{
                  background: "linear-gradient(90deg, transparent, #7C6BFF, #3FD0E0, transparent)",
                  animation: "scan-line 2.5s linear infinite",
                }}
              />

              <div className="mb-3 font-mono text-[9.5px] uppercase tracking-[0.25em]" style={{ color: "rgba(124,107,255,0.7)" }}>
                [SYSTEM UPLINK ESTABLISHED — IT OPS HUB v2.0]
              </div>

              <div className="space-y-0.5">
                {lines.map((line, i) => (
                  <div
                    key={i}
                    className="font-mono text-[12.5px] leading-[1.8]"
                    style={{
                      color:
                        line.startsWith("✓") ? "#46E0A0"
                        : line.startsWith("→") ? "#A99BFF"
                        : line.startsWith(">") ? "#5C6582"
                        : "#969DB4",
                    }}
                  >
                    {line}
                  </div>
                ))}
                {currentLine && (
                  <div
                    className="font-mono text-[12.5px] leading-[1.8]"
                    style={{
                      color:
                        currentLine.startsWith("✓") ? "#46E0A0"
                        : currentLine.startsWith("→") ? "#A99BFF"
                        : "#5C6582",
                    }}
                  >
                    {currentLine}
                    <span style={{ animation: "blink-cursor 0.6s infinite" }}>█</span>
                  </div>
                )}
              </div>

              <div className="mt-4 font-mono text-[9px] uppercase tracking-widest" style={{ color: "rgba(63,208,224,0.4)" }}>
                move cursor away to dismiss
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
