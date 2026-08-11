import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /* WebP only, deliberately — not the AVIF-then-WebP pair.
     *
     * Next picks the output format from the browser's Accept header, and browsers advertise
     * AVIF first. Encoding these photographic JPEGs to AVIF on this machine does not finish:
     * a single 256px-wide thumbnail did not return after five minutes, so the request simply
     * hangs and the <img> never paints. It looked like a broken image path; it was the
     * encoder. Requesting the same URL without an Accept header returned JPEG instantly,
     * which is what made it hard to see.
     *
     * WebP encodes in milliseconds here and is supported everywhere we care about. If AVIF
     * is wanted later, generate it ahead of time in the build rather than on request. */
    formats: ["image/webp"],
  },
};

export default nextConfig;
