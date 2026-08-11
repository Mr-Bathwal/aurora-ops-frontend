"use client";

import { PageHeader } from "@/components/aurora/page-header";
import { ActivityKpis } from "@/components/activity/activity-kpis";
import { ActivityTimelineChart, TimelineStatus } from "@/components/activity/activity-timeline-chart";
import { LogRack } from "@/components/activity/log-rack";
import {
  ActivityTiles,
  OperationalRhythms,
  OutcomeBreakdown,
  PanelShell,
} from "@/components/activity/activity-panels";
import { useActivityStore } from "@/lib/activity-store";

/** Activity & audit log.
 *
 * The panels sit *directly on the field* — there is no outer card. An earlier version
 * wrapped the whole dashboard in one big bordered panel, which put a frame inside a frame
 * and, worse, covered the backdrop it was supposed to be sitting on. Cards on open space is
 * what makes a dashboard feel like instruments laid out on a surface rather than a document.
 *
 * The backdrop is fixed rather than scrolling with the content: the field is the room, and
 * a room does not slide upward when you read further down the page.
 */
export default function ActivityPage() {
  const entries = useActivityStore((s) => s.entries);

  return (
    <>
      {/* The field. Fixed, full-bleed, behind everything on this route. Scrimmed only enough
          to keep text legible — the whole point of the image is that it is visible. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/media/images/hero/activity-field.webp)" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(5,7,7,0.36), rgba(5,7,7,0.58) 55%, rgba(5,7,7,0.8))",
          }}
        />
      </div>

      <PageHeader
        eyebrow="Operations"
        title="Dashboard"
        subtitle="Every run is recorded — who triggered it, which agent acted, what it did, and the outcome."
      />

      {/* Summary, as two rows rather than three independent stacks.
       *
       * Stacking each column separately left the shortest one dead-ending halfway down the
       * section while another ran on — a ragged bottom edge with a hole in it. Rows keep the
       * panels aligned: three equal questions across the top (when, how much, how it went),
       * then the trend given the width it needs with the derived readouts beside it. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <OperationalRhythms entries={entries} />

        <PanelShell title="Fleet overview" sub="Across the whole log">
          <ActivityKpis entries={entries} />
        </PanelShell>

        <OutcomeBreakdown entries={entries} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PanelShell
          title="Event activity"
          sub="Last 14 days"
          action={<TimelineStatus entries={entries} />}
          className="lg:col-span-2"
        >
          {/* The wrapper owns the height — see the note in the chart about ResponsiveContainer. */}
          <div className="h-[210px]">
            <ActivityTimelineChart entries={entries} title="" />
          </div>
        </PanelShell>

        <ActivityTiles entries={entries} />
      </div>

      {/* The record, as a rack of drawers in its own chassis — it carries its own frame and
          header, so it is deliberately not wrapped in a PanelShell. */}
      <div className="mt-4">
        <LogRack entries={entries} />
      </div>
    </>
  );
}
