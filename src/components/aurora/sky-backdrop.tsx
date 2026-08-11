import Image from "next/image";

/** A fixed field of light the page scrolls over.
 *
 * Fixed rather than scrolling on purpose: the page becomes one continuous space that its
 * sections float through, which is what stops a long stack of bands reading as a run of
 * unrelated screens. It sits at a negative z-index inside `main`, whose own `relative z-1`
 * opens the stacking context that keeps it from escaping up behind the navbar.
 *
 * Two things do the readability work, and both are per-page because the artwork and the
 * layout differ. `opacity` decides how much of the image survives against black; `scrim` is a
 * dark pool placed under whatever column carries the small text. The edge vignette is shared,
 * because every page wants the field to fall off rather than be cropped by the viewport.
 *
 * The drift is CSS rather than a motion value: it runs for the life of the page, and there is
 * no reason to pay a JS frame for something the compositor can do on its own.
 *
 * This replaced three near-identical copies that had drifted apart in everything except the
 * two numbers that were actually meant to differ.
 */
export function SkyBackdrop({
  src,
  opacity,
  scrim,
  vignette = "radial-gradient(120% 92% at 50% 50%, transparent 38%, rgba(2,3,4,0.78) 100%)",
}: {
  src: string;
  /** How much of the artwork survives against the black floor. */
  opacity: number;
  /** A CSS radial-gradient, sized and placed under the page's own text column. */
  scrim: string;
  vignette?: string;
}) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-black">
      <div className="plexus-drift absolute inset-0">
        <Image src={src} alt="" fill priority sizes="100vw" className="object-cover" style={{ opacity }} />
      </div>
      <div className="absolute inset-0" style={{ background: `${scrim}, ${vignette}` }} />
    </div>
  );
}
