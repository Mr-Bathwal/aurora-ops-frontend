"use client";

import { useEffect, useRef, useState } from "react";

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export function CustomCursor() {
  const glowRef = useRef<HTMLDivElement>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    let rawX = 0;
    let rawY = 0;
    let gx = 0;
    let gy = 0;
    let raf: number;

    function onMove(e: MouseEvent) {
      rawX = e.clientX;
      rawY = e.clientY;
    }

    function onClick(e: MouseEvent) {
      const id = ++nextId.current;
      setRipples((prev) => [...prev, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 750);
    }

    function tick() {
      gx += (rawX - gx) * 0.07;
      gy += (rawY - gy) * 0.07;
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(calc(${gx}px - 50%), calc(${gy}px - 50%))`;
      }
      raf = requestAnimationFrame(tick);
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mousedown", onClick);
    raf = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mousedown", onClick);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      {/* Lagging aurora glow that trails behind the cursor */}
      <div
        ref={glowRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-20 h-[380px] w-[380px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(124,107,255,0.11) 0%, rgba(63,208,224,0.07) 38%, transparent 68%)",
          willChange: "transform",
        }}
      />

      {/* Click ripple rings */}
      {ripples.map((r) => (
        <div
          key={r.id}
          aria-hidden
          className="pointer-events-none fixed z-20 h-7 w-7 rounded-full border border-iris/70"
          style={{
            left: r.x,
            top: r.y,
            animation: "cursor-ripple 0.75s cubic-bezier(0.2,0.8,0.2,1) forwards",
          }}
        />
      ))}
    </>
  );
}
