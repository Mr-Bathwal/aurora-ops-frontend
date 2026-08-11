"use client";

import { VideoTile } from "@/components/ui/video-tile";

const MEDIA = [
  { src: "/media/video/library/cpu-rack-blue.mp4", event: "CPU spike diagnosed", agent: "System Health", type: "Diagnostics Viz [Local Video]" },
  { src: "/media/video/library/server-rack-repair.mp4", event: "Service restart executed", agent: "Auto-Remediate", type: "Server Rack Repair [Local Video]" },
  { src: "/media/video/library/drive-bay-hands.mp4", event: "Backup volume swapped", agent: "Backup & DR", type: "Memory & Drive Fix [Local Video]" },
  { src: "/media/video/library/fiber-optic-glow.mp4", event: "Network path reconfigured", agent: "Log Analyzer", type: "Network Reconfiguration [Local Video]" },
];

/** "Media Audit Trail" bento panel — a grid of locally-stored video previews, one per
 * kind of fix/event, muted and playing only on hover to keep the page light by default. */
export function MediaAuditTrail() {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.18em] text-faint">Media audit trail</div>
      <div className="grid flex-1 grid-cols-2 gap-2.5">
        {MEDIA.map((item) => (
          <VideoTile key={item.src} src={item.src} title={item.event} subtitle={`${item.agent} — ${item.type}`} />
        ))}
      </div>
    </div>
  );
}
