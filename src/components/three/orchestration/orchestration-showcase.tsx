"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { OrchestrationCanvas } from "@/components/dashboard/orchestration-canvas";
import { useGpuTier } from "./use-gpu-tier";

const OrchestrationCanvas3D = dynamic(
  () => import("./orchestration-canvas-3d").then((m) => m.OrchestrationCanvas3D),
  { ssr: false }
);

/** Renders the SVG orchestration graph first (zero layout shift, no flash of empty
 * canvas) and swaps to the 3D showcase once the GPU tier resolves to "lite"/"full"
 * (resolved once and cached module-scope in useGpuTier, so this never flips back).
 * At "off" (low-power GPU, no WebGL2, or prefers-reduced-motion), the SVG stays up
 * permanently and the 3D chunk is never fetched at all — verify via the Network tab. */
export function OrchestrationShowcase() {
  const router = useRouter();
  const tier = useGpuTier();

  if (tier !== "lite" && tier !== "full") return <OrchestrationCanvas />;
  return <OrchestrationCanvas3D tier={tier} navigate={(path) => router.push(path)} />;
}
