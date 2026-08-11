"use client";

import type { CSSProperties, HTMLAttributes } from "react";
import { useMousePosition } from "@/hooks/use-mouse-position";
import { cn } from "@/lib/utils";

/** Frosted-glass card whose highlight follows the cursor — the "Glassmorphism 2.0"
 * material: backdrop-blur-2xl, a hairline white border, and a radial spotlight
 * positioned live via CSS custom properties instead of JS-driven style recalculation. */
export function GlassCard({ className, style, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { ref, x, y, onMouseMove } = useMousePosition<HTMLDivElement>();

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      style={{ ...style, "--spot-x": `${x}px`, "--spot-y": `${y}px` } as CSSProperties}
      className={cn("glass-panel", className)}
      {...props}
    >
      {children}
    </div>
  );
}
