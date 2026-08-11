import { SkyBackdrop } from "@/components/aurora/sky-backdrop";

/** The plexus field behind /auto-remediate.
 *
 * Held further back than the /run sky and scrimmed harder through the middle, because this
 * page's body copy sits directly on the backdrop rather than on panels of its own — a bright
 * node behind a 13px line is the difference between atmosphere and noise. The remediation
 * graph's own glow peaks at 0.34, so the field has to stay well under it or the story it tells
 * stops being the brightest thing on the page.
 */
export function PlexusBackdrop() {
  return (
    <SkyBackdrop
      src="/media/images/hero/plexus-field.webp"
      opacity={0.55}
      scrim="radial-gradient(58% 46% at 50% 52%, rgba(3,5,6,0.86), rgba(3,5,6,0.34) 62%, transparent 100%)"
      vignette="radial-gradient(120% 90% at 50% 50%, transparent 42%, rgba(2,3,4,0.72) 100%)"
    />
  );
}
