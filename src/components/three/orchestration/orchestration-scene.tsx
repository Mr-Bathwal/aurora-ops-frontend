"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useActivityStore } from "@/lib/activity-store";
import { OrchestratorCore } from "./orchestrator-core";
import { SatelliteNode } from "./satellite-node";
import { EdgeFlow } from "./edge-flow";
import { CameraRig } from "./camera-rig";
import { IdleInvalidator } from "./use-idle-invalidator";
import { Postprocessing } from "./postprocessing";
import { useOrchestrationActivity } from "./use-orchestration-activity";

const HEALTH_POS: [number, number, number] = [-2.0, 1.3, 0];
const LOG_POS: [number, number, number] = [2.0, 1.3, 0];
const BACKUP_POS: [number, number, number] = [0, -1.9, 0];
const CORE_POS: [number, number, number] = [0, 0, 0];

/** Subscribes to the activity store directly (not via the React context, which only
 * carries derived per-agent colors) so any run completion invalidates the demand-mode
 * canvas and the new severity is visibly reflected — this is what makes the scene a
 * live data visualization rather than decoration. */
function ActivityInvalidator() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => useActivityStore.subscribe(() => invalidate()), [invalidate]);
  return null;
}

export function OrchestrationScene({ enablePostprocessing }: { enablePostprocessing: boolean }) {
  const { anyActive } = useOrchestrationActivity();

  return (
    <>
      <ActivityInvalidator />
      <IdleInvalidator />
      <CameraRig />
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 4, 5]} intensity={0.6} />

      {/* Fully procedural "studio" lighting rig (colored + white planes, no photographic
          HDRI) — the chrome orchestrator core needs a richer environment to reflect than the
          satellites' softer material did, so this is a fuller rig than before: a big soft key
          light, two brand-colored fills, and a dark "floor" plane underneath for a visible
          horizon line in the reflection (the classic studio-product-shot trick for metal). */}
      <Environment resolution={512}>
        <Lightformer intensity={4} color="#ffffff" position={[0, 4, 2]} scale={[6, 3, 1]} />
        <Lightformer intensity={3} color="#3e9cff" position={[-3, 2, 2]} scale={[3, 3, 1]} />
        <Lightformer intensity={2} color="#5ac8ff" position={[3, -1, 2]} scale={[3, 3, 1]} />
        <Lightformer intensity={1.5} color="#ffffff" position={[0, 3, -3]} scale={[4, 4, 1]} />
        <Lightformer intensity={0.6} color="#0b0b14" position={[0, -3, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[10, 10, 1]} />
      </Environment>

      <OrchestratorCore active={anyActive} />

      <EdgeFlow agentKey="health" start={CORE_POS} end={HEALTH_POS} />
      <EdgeFlow agentKey="log" start={CORE_POS} end={LOG_POS} />
      <EdgeFlow agentKey="backup" start={CORE_POS} end={BACKUP_POS} />

      <SatelliteNode agentKey="health" position={HEALTH_POS} />
      <SatelliteNode agentKey="log" position={LOG_POS} />
      <SatelliteNode agentKey="backup" position={BACKUP_POS} />

      {enablePostprocessing && <Postprocessing />}
    </>
  );
}
