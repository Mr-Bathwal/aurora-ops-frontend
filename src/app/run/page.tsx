import { Suspense } from "react";
import { RunPageClient } from "./run-page-client";

export default function RunPage() {
  return (
    <Suspense fallback={null}>
      <RunPageClient />
    </Suspense>
  );
}
