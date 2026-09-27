"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

/** A block that swings up out of the page as it scrolls in.
 *
 * It enters tipped back on its bottom edge — a few degrees of rotateX, pushed down and
 * slightly shrunk — and settles flat by the time its top reaches just past the middle of
 * the window. Scroll-linked rather than time-triggered, so it tracks the wheel in both
 * directions instead of playing once and leaving the reader behind.
 *
 * The perspective lives on the element (`transformPerspective`) rather than on a wrapper:
 * once it has settled every value is at identity and framer writes `transform: none`, so a
 * resting section carries no stacking context and its screen-blended art composites against
 * the page exactly as it did before this existed.
 */
export function ScrollDepth({
  children,
  className,
  tilt = 14,
}: {
  children: ReactNode;
  className?: string;
  /** Degrees of rotateX at the moment the block first enters. */
  tilt?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.45"] });
  // A light spring on top of the already-damped Lenis scroll: enough to take the stepping
  // out of a notched mouse wheel without making the block feel like it lags the page.
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.4 });

  const rotateX = useTransform(p, [0, 1], [tilt, 0]);
  const y = useTransform(p, [0, 1], [90, 0]);
  const scale = useTransform(p, [0, 1], [0.94, 1]);
  const opacity = useTransform(p, [0, 0.6], [0.25, 1]);

  return (
    <motion.div
      ref={ref}
      className={cn("origin-bottom will-change-transform", className)}
      style={reduce ? undefined : { rotateX, y, scale, opacity, transformPerspective: 1400 }}
    >
      {children}
    </motion.div>
  );
}
