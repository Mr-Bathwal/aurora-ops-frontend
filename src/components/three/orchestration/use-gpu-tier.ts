"use client";

import { useEffect, useState } from "react";
import { getGPUTier } from "detect-gpu";

export type GpuTier = "off" | "lite" | "full";

// Resolved once per page load and memoized module-scope, so navigating away and back
// to the dashboard doesn't re-run GPU detection every time.
let cachedTier: GpuTier | null = null;
let pendingTier: Promise<GpuTier> | null = null;

async function resolveTier(): Promise<GpuTier> {
  if (typeof window === "undefined") return "off";
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return "off";

  const canvas = document.createElement("canvas");
  if (!canvas.getContext("webgl2")) return "off";

  try {
    const result = await getGPUTier();
    if (result.isMobile || result.tier <= 0) return "off";
    return result.tier >= 3 ? "full" : "lite";
  } catch {
    return "off";
  }
}

/** GPU capability tier for the 3D orchestration showcase: "off" renders the existing SVG
 * verbatim and never fetches the 3D chunk at all; "lite" mounts the 3D canvas without
 * postprocessing at dpr=1; "full" gets the complete Bloom/ChromaticAberration/Noise stack. */
export function useGpuTier(): GpuTier | null {
  const [tier, setTier] = useState<GpuTier | null>(cachedTier);

  useEffect(() => {
    // Initial state above already covers the cached case (useState(cachedTier)) —
    // nothing to do here except kick off / await resolution when not yet cached.
    if (cachedTier) return;
    if (!pendingTier) {
      pendingTier = resolveTier().then((t) => {
        cachedTier = t;
        return t;
      });
    }
    let active = true;
    pendingTier.then((t) => {
      if (active) setTier(t);
    });
    return () => {
      active = false;
    };
  }, []);

  return tier;
}
