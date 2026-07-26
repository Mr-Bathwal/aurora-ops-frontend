"use client";

import { EffectComposer, Bloom, ChromaticAberration, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

/** The scene's one deliberate "showcase moment" — tuned low so only emissive materials
 * (the core, the particle trails) actually bloom, not the whole scene, matching the
 * "one disciplined accent, not smeared everywhere" principle from the design research.
 * Noise opacity is tuned to approximate the existing feTurbulence CSS grain overlay
 * (globals.css, baseFrequency .9 numOctaves 3) so the canvas doesn't read as a separate
 * layer floating over the rest of the page. */
export function Postprocessing() {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom intensity={0.6} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur />
      <ChromaticAberration offset={[0.0006, 0.0006]} radialModulation modulationOffset={0.3} />
      <Noise premultiply opacity={0.035} blendFunction={BlendFunction.OVERLAY} />
    </EffectComposer>
  );
}
