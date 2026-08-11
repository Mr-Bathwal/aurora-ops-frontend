"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityTable } from "@/components/activity/activity-table";
import { useActivityStore } from "@/lib/activity-store";

export function ActivityProof() {
  const router = useRouter();
  const entries = useActivityStore((s) => s.entries).slice(0, 5);

  return (
    <div className="panel-deep rounded-[20px] border p-5">
      <ActivityTable entries={entries} variant="compact" />
      <div className="mt-4 flex justify-end border-t border-border/60 pt-4">
        <Button variant="outline" className="gap-1.5" onClick={() => router.push("/activity")}>
          View full history
          <ArrowRight size={15} />
        </Button>
      </div>
    </div>
  );
}
