"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/** The reference's section heading, and the single biggest thing that makes the page below
 * the hero read as one family with it: every section announces itself the same way — a
 * small accent eyebrow, a large heading in the symmetrical shimmer, an optional muted
 * sub-line, all centred, all fading up on scroll.
 *
 * The shimmer is `--grad-text` clipped to the glyphs, so a centred heading is lit through
 * the middle and falls to slate at both ends. Same mechanism as the hero's headline, one
 * step down the scale — which is what ties the two together rather than leaving each section
 * to invent its own title style, the habit that made the old page feel unrelated to itself.
 */
export function SectionHeading({
  eyebrow,
  children,
  sub,
  className,
}: {
  eyebrow?: string;
  children: ReactNode;
  sub?: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
      className={cn("mx-auto max-w-[760px] text-center", className)}
    >
      {eyebrow && (
        <div className="mb-4 font-mono text-[12px] font-medium uppercase tracking-[0.22em] text-brand">
          {eyebrow}
        </div>
      )}
      <h2
        className="font-heading font-bold"
        style={{
          // One step below the hero's h1, interpolating up to the h2 token so the scale
          // still owns the top end.
          fontSize: "clamp(1.9rem, 3.4vw, var(--text-h2))",
          lineHeight: 1.12,
          letterSpacing: "-0.02em",
          backgroundImage: "var(--grad-text)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {children}
      </h2>
      {/* Sub is 16px, not the 17px one-off this used to carry. The hero sets a 24px sub
          against a 64px headline; at the same ratio a 42px section heading wants 16 — which
          is the body step, so the scale already had the answer. */}
      {sub && (
        <p className="mx-auto mt-4 max-w-[54ch] text-body leading-[1.62] text-muted-foreground">
          {sub}
        </p>
      )}
    </motion.div>
  );
}
