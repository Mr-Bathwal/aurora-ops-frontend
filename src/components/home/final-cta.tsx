"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/aurora/section-heading";

/** The closing invitation, mirroring the reference's final "Start your best day — every
 * day." beat: the same heading treatment as every section above it, then one filled pill.
 * A landing page that has spent its length making a claim earns the right to end on the
 * plainest possible ask, and the reference ends on exactly that. */
export function FinalCta() {
  const router = useRouter();

  return (
    <div className="text-center">
      <SectionHeading
        eyebrow="Ready when you are"
        sub="Point Aurora Ops at one box and watch it work. Nothing to install, nothing to configure — it reads what it can reach and starts from there."
      >
        Your first agent is one click away.
      </SectionHeading>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.2, 0.7, 0.2, 1] }}
        className="mt-9 flex justify-center"
      >
        <button
          type="button"
          onClick={() => router.push("/run")}
          className="group inline-flex items-center gap-2.5 rounded-[var(--radius-pill)] px-8 py-4 text-body font-semibold text-[#0c0f14] transition-shadow duration-200 hover:shadow-[0_0_40px_-6px_rgba(62,156,255,0.75)]"
          style={{ backgroundImage: "var(--grad)" }}
        >
          Run your first agent
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </motion.div>
    </div>
  );
}
