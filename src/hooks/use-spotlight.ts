"use client";

import { useEffect } from "react";

/** Tracks the cursor over any `.spot` element and exposes it as --mx/--my for the radial-gradient hover glow. */
export function useSpotlight() {
  useEffect(() => {
    function handleMove(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const card = target?.closest(".spot") as HTMLElement | null;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      card.style.setProperty("--my", `${e.clientY - rect.top}px`);
    }
    document.addEventListener("mousemove", handleMove);
    return () => document.removeEventListener("mousemove", handleMove);
  }, []);
}
