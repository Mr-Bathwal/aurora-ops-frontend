"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

/** Reconciles frameloop="demand" with continuous idle motion (camera drift, particle
 * flow, core rotation): caps re-renders at `fps` instead of an uncapped 60fps RAF loop,
 * and fully stops when the tab is backgrounded — the two things that make it safe to
 * run in a dashboard that stays open for hours. Hover/click/store updates still call
 * invalidate() directly elsewhere for instant responsiveness on top of this base cadence. */
export function IdleInvalidator({ fps = 24 }: { fps?: number }) {
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    let raf = 0;
    let last = 0;

    function tick(t: number) {
      if (!document.hidden && t - last >= 1000 / fps) {
        last = t;
        invalidate();
      }
      raf = requestAnimationFrame(tick);
    }

    function onVisibilityChange() {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        raf = requestAnimationFrame(tick);
      }
    }

    if (!document.hidden) raf = requestAnimationFrame(tick);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [invalidate, fps]);

  return null;
}
