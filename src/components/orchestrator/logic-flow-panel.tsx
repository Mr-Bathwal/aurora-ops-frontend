"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";

/** Both clips are cool-toned on purpose. `neural-network-2` is a handsome piece of footage
 * but it is amber end to end, and it sat directly beside the flow canvas — a block of the
 * one hue this palette does not contain, in the frame that gets photographed for the
 * landing page. Blue cabling reads as the same subject and stays in family. */
const CLIPS = [
  { src: "/media/video/library/neural-network-1.mp4", label: "Watch logic flow" },
  { src: "/media/video/library/server-cables-blue.mp4", label: "Routing activity" },
];

function ClipCard({ src, label }: { src: string; label: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  function toggle() {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
    setPlaying((p) => !p);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-white/10 bg-black/40 text-left"
    >
      <video ref={videoRef} src={src} muted loop playsInline preload="metadata" className="size-full object-cover" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />
      <div className="pointer-events-none absolute inset-0 grid place-items-center transition-opacity duration-200" style={{ opacity: playing ? 0 : 1 }}>
        <div className="grid size-9 place-items-center rounded-full bg-black/50 backdrop-blur-sm transition-transform group-hover:scale-110">
          <Play size={15} className="ml-0.5 text-white" fill="currentColor" />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-2.5 font-mono text-[10px] uppercase tracking-widest text-white/80">{label}</div>
    </button>
  );
}

/** Sidebar of local video loops — the "Watch Logic Flow" panels from the reference
 * mockup, playing/pausing on click rather than autoplaying every clip at once. */
export function LogicFlowPanel() {
  return (
    <div className="flex flex-col gap-3">
      {CLIPS.map((c) => (
        <ClipCard key={c.src} {...c} />
      ))}
    </div>
  );
}
