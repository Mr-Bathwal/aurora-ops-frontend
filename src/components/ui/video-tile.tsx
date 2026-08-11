"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

/** Local video preview tile — muted, plays on hover, shows a caption strip.
 * Shared by the Activity page's Media Audit Trail and the auto-remediate Fix Gallery. */
export function VideoTile({
  src,
  title,
  subtitle,
  className,
}: {
  src: string;
  title: string;
  subtitle: string;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={cn("group relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-black/40", className)}
      onMouseEnter={() => {
        setHovered(true);
        videoRef.current?.play().catch(() => {});
      }}
      onMouseLeave={() => {
        setHovered(false);
        videoRef.current?.pause();
      }}
    >
      <video
        ref={videoRef}
        src={src}
        muted
        loop
        playsInline
        preload="metadata"
        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
      <div
        className="pointer-events-none absolute inset-0 grid place-items-center transition-opacity duration-200"
        style={{ opacity: hovered ? 0 : 1 }}
      >
        <div className="grid size-8 place-items-center rounded-full bg-black/50 backdrop-blur-sm">
          <Play size={14} className="ml-0.5 text-white" fill="currentColor" />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-2.5">
        <div className="text-[11.5px] font-semibold leading-tight text-white">{title}</div>
        <div className="mt-0.5 font-mono text-[9.5px] leading-tight text-white/60">{subtitle}</div>
      </div>
    </div>
  );
}
