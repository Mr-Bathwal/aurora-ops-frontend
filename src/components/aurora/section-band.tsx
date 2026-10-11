import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ScrollDepth } from "@/components/motion/scroll-depth";

/** A full-bleed section band.
 *
 * The reference builds its page out of alternating blocks — the near-black floor, and
 * raised #0C0F14 sections that carry the feature content — and that alternation is a large
 * part of why it reads as chaptered rather than as one unbroken scroll. A page that is all
 * one shade has no sense of where one idea ends and the next begins.
 *
 * Breaks out of the shell's max-width the same way the hero does: symmetric negative margins
 * tied to the viewport, minus the scrollbar (see SmoothScroll) so it never adds a horizontal
 * scroll. `tone="raised"` paints the surface and gives the band a lit lip top and bottom;
 * `tone="floor"` is transparent, so the page's own near-black shows through.
 *
 * `depth` swings the band's content up out of the page as it scrolls in (see ScrollDepth).
 * Only the content moves — the band's own surface stays put, so the alternating tones
 * still meet edge to edge while the chapter inside them rises into place.
 */
export function SectionBand({
  children,
  tone = "floor",
  className,
  innerClassName,
  depth = false,
}: {
  children: ReactNode;
  tone?: "floor" | "raised";
  className?: string;
  innerClassName?: string;
  depth?: boolean;
}) {
  return (
    <section
      className={cn("relative", tone === "raised" && "bg-[var(--bg-2)]", className)}
      style={{
        marginLeft: "calc(50% - 50vw + var(--sbw, 0px) / 2)",
        marginRight: "calc(50% - 50vw + var(--sbw, 0px) / 2)",
      }}
    >
      {tone === "raised" && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/[0.06]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/[0.06]" />
        </>
      )}
      <div className={cn("mx-auto max-w-screen-xl px-6 py-24 sm:px-8", innerClassName)}>
        {depth ? <ScrollDepth>{children}</ScrollDepth> : children}
      </div>
    </section>
  );
}
