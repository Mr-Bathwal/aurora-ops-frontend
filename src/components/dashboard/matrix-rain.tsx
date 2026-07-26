"use client";

import { useEffect, useRef } from "react";

const CHARS = "01アイウエオカキクケコサシスセソタチツテトナニヌネノ0110101アカサタナハ><{}[]|/\\;:?!@#$%^&*()".split("");

interface MatrixRainProps {
  height?: number;
  opacity?: number;
  /** Color theme — "green" for classic, "iris" for purple/cyan aurora palette */
  theme?: "green" | "iris";
  className?: string;
}

export function MatrixRain({ height = 180, opacity = 0.7, theme = "green", className = "" }: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctxRaw = canvas.getContext("2d");
    if (!ctxRaw) return;
    const ctx: CanvasRenderingContext2D = ctxRaw;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();

    const fontSize = 12;
    const W = canvas.offsetWidth;
    const H = height;
    const cols = Math.ceil(W / fontSize);
    const drops: number[] = Array.from({ length: cols }, () => Math.random() * -(H / fontSize));

    // Column hue variation for aurora theme
    const colHues = Array.from({ length: cols }, (_, i) => i % 3);

    let raf: number;
    let frame = 0;

    function draw() {
      frame++;
      if (frame % 3 !== 0) { raf = requestAnimationFrame(draw); return; } // ~20fps

      // Fade trail
      ctx.fillStyle = "rgba(8, 8, 14, 0.18)";
      ctx.fillRect(0, 0, W, H);
      ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;

      for (let i = 0; i < cols; i++) {
        const y = drops[i] * fontSize;
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        const bright = Math.random() > 0.92;

        if (theme === "green") {
          ctx.fillStyle = bright
            ? `rgba(160,255,180,${opacity})`
            : `rgba(46,224,160,${opacity * (0.3 + Math.random() * 0.4)})`;
        } else {
          const hue = colHues[i];
          if (hue === 0) ctx.fillStyle = bright ? `rgba(169,155,255,${opacity})` : `rgba(124,107,255,${opacity * 0.4})`;
          else if (hue === 1) ctx.fillStyle = bright ? `rgba(100,230,240,${opacity})` : `rgba(63,208,224,${opacity * 0.4})`;
          else ctx.fillStyle = bright ? `rgba(120,255,190,${opacity})` : `rgba(46,224,160,${opacity * 0.35})`;
        }

        ctx.fillText(char, i * fontSize, y);

        if (y > H && Math.random() > 0.975) drops[i] = 0;
        else drops[i] += 0.5;
      }

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [height, opacity, theme]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full ${className}`}
      style={{ height, display: "block" }}
      aria-hidden
    />
  );
}
