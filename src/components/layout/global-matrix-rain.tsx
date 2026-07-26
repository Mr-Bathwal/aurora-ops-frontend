"use client";

import { useEffect, useRef } from "react";

const CHARS = "01アイウエオカキクケコサシスセソタチツテトナニヌ><{}[]|/\\;:01101アカサタ".split("");

export function GlobalMatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctxRaw = canvas.getContext("2d");
    if (!ctxRaw) return;
    const ctx: CanvasRenderingContext2D = ctxRaw;

    let W = 0, H = 0, cols = 0;
    let drops: number[] = [];
    const fontSize = 12; // slight step back from 11 — marginally less dense
    const OPACITY = 0.33; // slightly softer — still dense, not overwhelming

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      W = window.innerWidth;
      H = window.innerHeight;
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      cols = Math.ceil(W / fontSize);
      drops = Array.from({ length: cols }, () => Math.random() * -(H / fontSize));
    }
    resize();
    window.addEventListener("resize", resize);

    let raf: number;
    let frame = 0;

    function draw() {
      frame++;
      if (frame % 3 !== 0) { raf = requestAnimationFrame(draw); return; } // ~20 fps

      /* Fade trail — slightly faster than before for clarity */
      ctx.fillStyle = "rgba(8,8,14,0.17)";
      ctx.fillRect(0, 0, W, H);
      ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;

      for (let i = 0; i < cols; i++) {
        const y = drops[i] * fontSize;
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        const bright = Math.random() > 0.88; // more bright heads
        const hue = i % 3;
        if (hue === 0)      ctx.fillStyle = bright ? `rgba(169,155,255,${OPACITY * 1.7})` : `rgba(124,107,255,${OPACITY * 0.6})`;
        else if (hue === 1) ctx.fillStyle = bright ? `rgba(100,230,240,${OPACITY * 1.7})` : `rgba(63,208,224,${OPACITY * 0.6})`;
        else                ctx.fillStyle = bright ? `rgba(140,255,200,${OPACITY * 1.4})` : `rgba(46,224,160,${OPACITY * 0.5})`;

        ctx.fillText(char, i * fontSize, y);
        if (y > H && Math.random() > 0.972) drops[i] = 0;
        else drops[i] += 0.55; // slightly faster fall
      }
      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-10 h-screen w-screen"
      style={{ display: "block" }}
      aria-hidden
    />
  );
}
