"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useBackendStatus } from "@/hooks/use-backend-status";
import { useActivityStore } from "@/lib/activity-store";
import { cn } from "@/lib/utils";

export function Topbar({ onOpenPalette }: { onOpenPalette: () => void }) {
  const online = useBackendStatus();
  const entries = useActivityStore((s) => s.entries);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const recentAdvisories = entries.filter((e) => {
    const isRecent = now - new Date(e.timestamp).getTime() < 1000 * 60 * 60;
    return isRecent && e.severity !== "ok";
  }).length;

  return (
    <header className="sticky top-0 z-6 flex h-[62px] shrink-0 items-center justify-between border-b border-border bg-background/60 px-7 backdrop-blur-md">
      <div className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
        <span
          className={cn(
            "dot",
            online === false ? "dot-crit" : online === null ? "bg-faint" : "dot-ok dot-live"
          )}
        />
        {online === false ? (
          <span>Backend unreachable &middot; check NEXT_PUBLIC_API_URL</span>
        ) : online === null ? (
          <span>Connecting&hellip;</span>
        ) : (
          <span>
            All systems operational
            {recentAdvisories > 0 && (
              <>
                {" "}
                &middot; <span className="text-warn">{recentAdvisories} advisory{recentAdvisories === 1 ? "" : "ies"}</span>
              </>
            )}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onOpenPalette}
          className="flex items-center gap-2.25 rounded-[9px] border border-border bg-card px-2.75 py-1.75 text-[12.5px] text-faint transition-colors hover:border-ring hover:bg-secondary"
        >
          <Search className="size-[13px]" />
          Ask or search
          <kbd className="rounded-[5px] border border-border bg-ink-2 px-1.5 py-0.5 font-mono text-[10.5px]">⌘K</kbd>
        </button>
      </div>
    </header>
  );
}
