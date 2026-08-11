"use client";

import { useCallback, useRef, useState, type MouseEvent } from "react";

/** Per-element cursor tracking for glassmorphic spotlight cards. Unlike `useSpotlight`
 * (one document-level listener keyed off a shared `.spot` class), this is scoped to a
 * single element via ref — the idiomatic shape for a `<GlassCard onMouseMove>` consumer. */
export function useMousePosition<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const onMouseMove = useCallback((e: MouseEvent<T>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return { ref, x: pos.x, y: pos.y, onMouseMove };
}
