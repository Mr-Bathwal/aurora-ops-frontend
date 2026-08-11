"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh, PointLight, MeshPhysicalMaterial } from "three";

const CYAN = "#5ac8ff";

/** The central orchestrator node — liquid-chrome metal rather than glass: high metalness,
 * low roughness, a clearcoat pass, and a small transmission value so a hint of the inner
 * glow bleeds through without giving up the mirror-like reflectivity. The bright white
 * point light is what produces the sharp specular hotspot chrome needs to read as metal
 * rather than plastic — reflections are what sell this material, not the base color. */
export function OrchestratorCore({ active }: { active: boolean }) {
  const shellRef = useRef<Mesh>(null);
  const shellMatRef = useRef<MeshPhysicalMaterial>(null);
  const coreRef = useRef<Mesh>(null);
  const lightRef = useRef<PointLight>(null);
  const hotspotRef = useRef<PointLight>(null);

  useFrame((state, delta) => {
    if (shellRef.current) shellRef.current.rotation.y += delta * 0.15;
    if (coreRef.current) coreRef.current.rotation.y -= delta * 0.3;
    if (lightRef.current) {
      const target = active ? 2.6 : 1.4;
      lightRef.current.intensity += (target - lightRef.current.intensity) * Math.min(delta * 4, 1);
    }
    if (hotspotRef.current) {
      const target = active ? 4.5 : 3;
      hotspotRef.current.intensity += (target - hotspotRef.current.intensity) * Math.min(delta * 4, 1);
    }
    if (shellMatRef.current) {
      const target = active ? 0.28 : 0.15;
      shellMatRef.current.transmission += (target - shellMatRef.current.transmission) * Math.min(delta * 4, 1);
    }
  });

  return (
    <group>
      <mesh ref={shellRef}>
        <icosahedronGeometry args={[0.9, 4]} />
        <meshPhysicalMaterial
          ref={shellMatRef}
          color="#eef0fb"
          metalness={1}
          roughness={0.16}
          clearcoat={1}
          clearcoatRoughness={0.08}
          transmission={0.15}
          thickness={0.5}
          ior={1.4}
          envMapIntensity={1.8}
        />
      </mesh>
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.3, 1]} />
        <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <pointLight ref={lightRef} color={CYAN} intensity={1.4} distance={4} />
      {/* Bright hotspot — the specular highlight that makes the shell read as chrome, not plastic */}
      <pointLight ref={hotspotRef} position={[1.6, 1.3, 1.4]} color="#ffffff" intensity={3} distance={7} />
    </group>
  );
}
