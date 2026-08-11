import { SkyBackdrop } from "@/components/aurora/sky-backdrop";

/** The constellation field behind /run.
 *
 * The console's right half has a hairline and no fill so this reads straight through it, which
 * is the whole reason the robot looks like it is standing in the page rather than on a plate.
 * That only works if the sky survives the middle of the viewport, so the scrim is far lighter
 * than it started: everything on this page that carries small text — the chat rail, the
 * reasoning trace, the report — brings its own opaque surface and does not need the backdrop
 * dimmed underneath it as well.
 *
 * What the scrim is still for is the page heading, which sits on nothing. Hence the bias up
 * and to the left rather than a disc in the middle, held off the right side where the robot
 * stands in the open half of the console.
 */
export function RunBackdrop() {
  return (
    <SkyBackdrop
      src="/media/images/hero/constellation-field.webp"
      opacity={0.5}
      scrim="radial-gradient(58% 50% at 40% 40%, rgba(3,5,7,0.78), rgba(3,5,7,0.32) 62%, transparent 100%)"
    />
  );
}
