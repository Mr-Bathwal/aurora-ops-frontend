import { RunPageClient } from "./run-page-client";

/** Reads the query string on the server and hands it down as props. The docs' alternative —
 * `useSearchParams` inside a Suspense boundary — leaves the boundary unresolved here, and
 * this route needs the tab before first paint anyway. */
export default async function RunPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { tab, autorun } = await searchParams;

  return <RunPageClient initialTab={typeof tab === "string" ? tab : null} autorun={autorun === "1"} />;
}
