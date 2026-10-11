"use client";

import type { PointerEvent } from "react";
import { useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

/** Pointer-driven 3D tilt for a card: the side under the cursor sinks away, and a soft glare
 * follows the pointer across the surface. Springs back flat when the pointer leaves.
 *
 * Returns the style for the card, the background for a glare layer, and the handlers. Under
 * `prefers-reduced-motion` the style is empty, the handlers do nothing and `glare` is
 * undefined, so callers render no glare layer at all. */
export function useTilt(max = 8) {
  const reduce = useReducedMotion();
  // Pointer position across the card, 0..1 on each axis, resting at the centre.
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spring = { stiffness: 220, damping: 22, mass: 0.5 };
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), spring);
  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), spring);

  const gx = useTransform(px, (v) => `${v * 100}%`);
  const gy = useTransform(py, (v) => `${v * 100}%`);
  const glare = useMotionTemplate`radial-gradient(420px circle at ${gx} ${gy}, rgba(255,255,255,0.12), transparent 60%)`;

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const onPointerLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return {
    style: reduce ? {} : { rotateX, rotateY, transformPerspective: 1000 },
    glare: reduce ? undefined : glare,
    handlers: { onPointerMove, onPointerLeave },
  };
}
