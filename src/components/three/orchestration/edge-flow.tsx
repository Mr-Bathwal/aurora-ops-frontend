"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { CatmullRomCurve3, Color, MathUtils, Matrix4, Vector3, type InstancedMesh } from "three";
import { useOrchestrationActivity, type SatelliteKey } from "./use-orchestration-activity";

const MAX_PARTICLES = 32;
const IDLE_COUNT = 10;

export function EdgeFlow({
  agentKey,
  start,
  end,
}: {
  agentKey: SatelliteKey;
  start: [number, number, number];
  end: [number, number, number];
}) {
  const { agents, hoveredAgent, clickedAgent } = useOrchestrationActivity();
  const instRef = useRef<InstancedMesh>(null);
  const lineColorRef = useRef(new Color());

  const isActive = hoveredAgent === agentKey || clickedAgent === agentKey;
  const activeCountRef = useRef(IDLE_COUNT);

  const curve = useMemo(() => {
    const s = new Vector3(...start);
    const e = new Vector3(...end);
    const mid = s.clone().lerp(e, 0.5);
    // perpendicular offset for a gentle arc, mirroring the SVG's asymmetric bezier feel
    const dir = e.clone().sub(s).normalize();
    const perp = new Vector3(-dir.y, dir.x, 0.15).normalize().multiplyScalar(0.5);
    mid.add(perp);
    return new CatmullRomCurve3([s, mid, e]);
  }, [start, end]);

  const linePoints = useMemo(() => curve.getPoints(48), [curve]);

  // useState's lazy initializer (not useMemo) is the correct place for one-time
  // non-deterministic setup — useMemo factories are expected to be pure/idempotent.
  const [particles] = useState(() =>
    Array.from({ length: MAX_PARTICLES }, () => ({
      t: Math.random(),
      speed: 0.15 + Math.random() * 0.1,
    }))
  );

  useFrame((_, delta) => {
    const color = agents[agentKey].color;
    lineColorRef.current.set(color);

    const targetCount = isActive ? MAX_PARTICLES : IDLE_COUNT;
    activeCountRef.current = MathUtils.damp(activeCountRef.current, targetCount, 5, delta);
    const visibleCount = Math.round(activeCountRef.current);

    if (!instRef.current) return;
    const m = new Matrix4();
    const speedMul = isActive ? 2.2 : 1;
    particles.forEach((p, i) => {
      p.t = (p.t + delta * p.speed * speedMul) % 1;
      if (i < visibleCount) {
        const pos = curve.getPointAt(p.t);
        const scale = 0.05 * (isActive ? 1.3 : 1);
        m.makeScale(scale, scale, scale);
        m.setPosition(pos);
      } else {
        m.makeScale(0, 0, 0);
      }
      instRef.current!.setMatrixAt(i, m);
    });
    instRef.current.instanceMatrix.needsUpdate = true;
    (instRef.current.material as import("three").MeshBasicMaterial).color.set(color);
  });

  return (
    <group>
      <Line points={linePoints} color={agents[agentKey].color} transparent opacity={0.35} lineWidth={1} />
      <instancedMesh ref={instRef} args={[undefined, undefined, MAX_PARTICLES]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial toneMapped={false} transparent opacity={0.9} />
      </instancedMesh>
    </group>
  );
}
