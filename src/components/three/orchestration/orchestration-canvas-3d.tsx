"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrchestrationScene } from "./orchestration-scene";
import { OrchestrationActivityProvider } from "./use-orchestration-activity";
import type { GpuTier } from "./use-gpu-tier";

export function OrchestrationCanvas3D({
  tier,
  navigate,
}: {
  tier: Extract<GpuTier, "lite" | "full">;
  navigate: (path: string) => void;
}) {
  return (
    <div className="h-[420px] w-full">
      <OrchestrationActivityProvider navigate={navigate}>
        <Canvas
          frameloop="demand"
          dpr={tier === "full" ? [1, 1.5] : 1}
          camera={{ position: [0, 0, 6.5], fov: 40 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        >
          <Suspense fallback={null}>
            <OrchestrationScene enablePostprocessing={tier === "full"} />
          </Suspense>
        </Canvas>
      </OrchestrationActivityProvider>
    </div>
  );
}
