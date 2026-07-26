"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial } from "@react-three/drei";
import type { Mesh, PointLight } from "three";

const IRIS = "#7c6bff";
const CYAN = "#3fd0e0";

/** The central orchestrator node — the one place MeshTransmissionMaterial is used
 * (it's a screen-space refraction technique, expensive per-instance, reserved for
 * exactly one hero object rather than applied to the satellites). */
export function OrchestratorCore({ active }: { active: boolean }) {
  const shellRef = useRef<Mesh>(null);
  const coreRef = useRef<Mesh>(null);
  const lightRef = useRef<PointLight>(null);

  useFrame((state, delta) => {
    if (shellRef.current) shellRef.current.rotation.y += delta * 0.15;
    if (coreRef.current) coreRef.current.rotation.y -= delta * 0.3;
    if (lightRef.current) {
      const target = active ? 2.6 : 1.4;
      lightRef.current.intensity += (target - lightRef.current.intensity) * Math.min(delta * 4, 1);
    }
  });

  return (
    <group>
      <mesh ref={shellRef}>
        <icosahedronGeometry args={[0.9, 2]} />
        <MeshTransmissionMaterial
          color={IRIS}
          thickness={0.6}
          roughness={0.08}
          chromaticAberration={0.04}
          ior={1.2}
          backside
          transmission={1}
          distortionScale={0.1}
          temporalDistortion={0.05}
        />
      </mesh>
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.3, 1]} />
        <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
      <pointLight ref={lightRef} color={CYAN} intensity={1.4} distance={4} />
    </group>
  );
}
