"use client";

import { PageHeader } from "@/components/aurora/page-header";
import { ActivityTable } from "@/components/activity/activity-table";
import { useActivityStore } from "@/lib/activity-store";

export default function ActivityPage() {
  const entries = useActivityStore((s) => s.entries);

  return (
    <div>
      <PageHeader
        eyebrow="Records"
        title="Activity & audit log"
        subtitle="Every run is recorded — who triggered it, which agent acted, what it did, and the outcome."
      />
      <div className="panel-deep overflow-hidden rounded-2xl border">
        <ActivityTable entries={entries} variant="full" />
      </div>
    </div>
  );
}
