"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

/** The closing "resolution" beat, built on the supplied artwork.
 *
 * The ring and the CTA's plasma are cut straight out of the source render rather than redrawn
 * — several passes at reproducing them in CSS came out either too diffuse or too hot, and the
 * artwork is what was actually wanted. What is *not* taken from it is the type: the render's
 * body copy is garbled ("s hrrgəua od tndlrtinie"), and even if it were clean, baked text is
 * unreadable at phone width, unselectable, and invisible to a screen reader. So the two pieces
 * of art are cut out and the words are laid back over them as real markup.
 *
 * Cutting rather than using the render whole is also what makes the band responsive: the ring,
 * the copy and the CTA each scale on their own, and the text reflows instead of shrinking to
 * five pixels tall.
 *
 * Both assets composite with `mix-blend-mode: screen`, which is why they have no visible box:
 * screen leaves the destination untouched wherever the source is black. The source sat at
 * rgb(5,5,5) rather than true black, which would have lightened the band inside a faint
 * rectangle, so both were floored with a `linear(1, -6)` pass on the way out.
 */

/* The CTA button is drawn into the aura, so the interactive element is laid exactly over it.
 * Measured off the source: the pill occupies x 2586–3286, y 575–700 of the render, which
 * inside the crop is the box below. Percentages, so it tracks the image at any size.
 *
 * The crop starts at x 2470, not at the glow's true left edge — the render's garbled body copy
 * runs out at about x 2455 and the plasma starts at 2377, so the two overlap. Taking the glow
 * from 2470 loses ~90px of its faintest left lobe and brings no stray lettering with it, which
 * is the right trade: the alternative was shipping the word "ne." floating beside the button.
 * The crop is centred on the pill (x 2936), so what remains is symmetric. */
const PILL = { left: "12.53%", top: "42.24%", width: "75.59%", height: "21.55%" };

export function OutcomeRing() {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 items-center gap-x-10 gap-y-8 lg:grid-cols-[auto_1fr_auto]">
      <Image
        src="/media/images/outcome/ring.webp"
        alt=""
        width={440}
        height={440}
        /* Without this next/image assumes the image can fill the viewport and asks the
           optimizer for a 1080w variant of a 440w source — pointless work for a fixed-size
           element. Both assets are capped at roughly twice their rendered width, which is
           what a 2x display actually needs. */
        sizes="220px"
        className="mx-auto w-[190px] shrink-0 mix-blend-screen lg:w-[220px]"
      />

      <div className="text-center lg:text-left">
        <div className="mb-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.22em] text-grad">
          Operational certainty
        </div>
        <h2 className="font-heading text-[24px] font-bold leading-tight">
          Built to pre-empt thousands of incidents before they page anyone.
        </h2>
        <p className="mx-auto mt-3 max-w-[56ch] text-[14px] leading-relaxed text-muted-foreground lg:mx-0">
          Every diagnosis, fix, and verification is logged and auditable — so the platform
          earns trust the same way a good on-call engineer does: by showing its work.
        </p>
      </div>

      {/* The aura carries the button's face; the <button> on top of it carries the behaviour. */}
      <div className="relative mx-auto w-[300px] shrink-0 lg:w-[364px]">
        <Image
          src="/media/images/outcome/cta-glow.webp"
          alt=""
          width={660}
          height={413}
          sizes="364px"
          className="w-full mix-blend-screen"
        />
        {/* Hover lives on the pill and nowhere else. Brightening the whole plate lit the
            plasma too, which made a 364px cloud pulse every time the cursor crossed it —
            far too much answer for the question. A wash and a rim inside the pill's own
            bounds is the entire effect, so the response is where the finger is going. */}
        <button
          type="button"
          onClick={() => router.push("/run")}
          style={PILL}
          className="absolute cursor-pointer rounded-full bg-white/0 outline-none transition-[background-color,box-shadow] duration-200 hover:bg-white/[0.09] hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.28)] active:bg-white/[0.15] focus-visible:ring-2 focus-visible:ring-brand-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          {/* The label is drawn into the artwork, so it must not be painted twice — but it
              still has to exist for assistive tech and for the accessible name. */}
          <span className="sr-only">Initialize your console</span>
        </button>
      </div>
    </div>
  );
}
