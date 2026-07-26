"use client";

import { useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Billboard, Text, useCursor } from "@react-three/drei";
import { MathUtils, type Mesh } from "three";
import { useOrchestrationActivity, type SatelliteKey } from "./use-orchestration-activity";

export function SatelliteNode({ agentKey, position }: { agentKey: SatelliteKey; position: [number, number, number] }) {
  const { agents, hoveredAgent, setHoveredAgent, clickedAgent, triggerClick } = useOrchestrationActivity();
  const meshRef = useRef<Mesh>(null);
  const ringRef = useRef<Mesh>(null);

  const agent = agents[agentKey];
  const isHovered = hoveredAgent === agentKey;
  const isClicked = clickedAgent === agentKey;
  const isActive = isHovered || isClicked;

  useCursor(isHovered);

  useFrame((state, delta) => {
    if (meshRef.current) {
      const targetScale = isActive ? 1.22 : 1;
      const s = MathUtils.damp(meshRef.current.scale.x, targetScale, 6, delta);
      meshRef.current.scale.setScalar(s);
      const mat = meshRef.current.material as import("three").MeshPhysicalMaterial;
      mat.emissiveIntensity = MathUtils.damp(mat.emissiveIntensity, isActive ? 1.6 : 0.5, 6, delta);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * (isActive ? 1.4 : 0.3);
      const pulse = isClicked ? 1 + Math.sin(state.clock.elapsedTime * 12) * 0.12 : 1;
      ringRef.current.scale.setScalar(pulse);
    }
  });

  function handlePointerOver(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    setHoveredAgent(agentKey);
  }
  function handlePointerOut(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    if (hoveredAgent === agentKey) setHoveredAgent(null);
  }
  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    triggerClick(agentKey);
  }

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <icosahedronGeometry args={[0.42, 1]} />
        <meshPhysicalMaterial
          color="#161622"
          roughness={0.25}
          metalness={0.1}
          clearcoat={0.6}
          emissive={agent.color}
          emissiveIntensity={0.5}
        />
      </mesh>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.58, 0.02, 8, 48]} />
        <meshBasicMaterial color={agent.color} toneMapped={false} transparent opacity={isActive ? 0.9 : 0.45} />
      </mesh>
      <Billboard position={[0, -0.85, 0]}>
        <Text fontSize={0.16} color="#edeff7" anchorX="center" anchorY="middle">
          {agent.label}
        </Text>
      </Billboard>
    </group>
  );
}
