import { redirect } from "next/navigation";

/** The orchestrator lost its own nav slot: it is not a fourth agent, it is a way of reaching
 * the other three, so it now lives as a tab on /run beside them. This route stays because it
 * was linked from the hero, the footer and the search palette, and because anyone who
 * bookmarked it should still land somewhere sensible. */
export default function OrchestratorPage() {
  redirect("/run?tab=orchestrator");
}
