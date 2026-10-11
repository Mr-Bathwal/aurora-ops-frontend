"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";

/** A hairline of the brand gradient across the top of the window, filling as the page is
 * read. Sits above the navbar and takes no pointer events. Not rendered at all under
 * `prefers-reduced-motion`. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 180, damping: 30, mass: 0.3 });
  const reduce = useReducedMotion();
  if (reduce) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[2px] origin-left"
      style={{
        scaleX,
        backgroundImage: "var(--grad)",
        boxShadow: "0 0 12px rgba(62,156,255,0.6)",
      }}
    />
  );
}
