"use client";

import { useEffect, useRef, useState } from "react";

export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    function tick(now: number) {
      const p = Math.min((now - start) / duration, 1);
      setValue(target * p);
      if (p < 1) frame.current = requestAnimationFrame(tick);
    }
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [target, duration]);

  return value;
}
