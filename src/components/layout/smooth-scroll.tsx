"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/** Momentum scrolling.
 *
 * Easy to dismiss as decoration, but it is load-bearing for a page built out of full-height
 * sections that reveal on scroll: with native scrolling a trackpad flick jumps three
 * sections and skips their entrances entirely, so the reveals fire off-screen and the work
 * is never seen. Damped scrolling keeps a flick inside one section.
 *
 * Disabled outright under `prefers-reduced-motion` — hijacking the scroll is precisely the
 * kind of thing that setting exists to opt out of, and a damped scroll cannot be made
 * vestibular-safe by tuning it.
 */
export function SmoothScroll() {
  // Publishes the scrollbar's width as --sbw.
  //
  // Full-bleed sections escape their padded container with `width: 100vw`, but 100vw counts
  // the classic scrollbar and the body's width does not — so every such section is a
  // scrollbar too wide and the whole page gains a horizontal scroll. It is invisible on a
  // trackpad and glaring on a phone. CSS cannot measure this, so one line of JS does, and
  // the sections subtract it.
  useEffect(() => {
    const publish = () => {
      const sbw = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.setProperty("--sbw", `${Math.max(0, sbw)}px`);
    };
    publish();
    window.addEventListener("resize", publish);
    return () => window.removeEventListener("resize", publish);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      // ~1.05s to settle. Slower reads as syrup and makes the page feel unresponsive to a
      // deliberate scroll; faster stops damping the flick this exists to catch.
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      // Touch devices already have momentum from the OS; layering ours on top double-damps
      // and feels broken.
      smoothWheel: true,
      touchMultiplier: 1.6,
    });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return null;
}
