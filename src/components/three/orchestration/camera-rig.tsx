"use client";

import { useFrame } from "@react-three/fiber";
import { MathUtils } from "three";

const BASE_X = 0;
const BASE_Y = 0;
const BASE_Z = 6.5;

/** Gentle idle orbit + subtle pointer parallax — the "camera drift" that gives the
 * scene a sense of life without any deliberate animation loop to author or maintain. */
export function CameraRig() {
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const driftX = Math.sin(t * 0.15) * 0.4;
    const driftY = Math.cos(t * 0.12) * 0.2;
    const pointerX = state.pointer.x * 0.35;
    const pointerY = state.pointer.y * 0.2;

    const targetX = BASE_X + driftX + pointerX;
    const targetY = BASE_Y + driftY + pointerY;

    state.camera.position.x = MathUtils.damp(state.camera.position.x, targetX, 2, delta);
    state.camera.position.y = MathUtils.damp(state.camera.position.y, targetY, 2, delta);
    state.camera.position.z = BASE_Z;
    state.camera.lookAt(0, -0.2, 0);
  });

  return null;
}
