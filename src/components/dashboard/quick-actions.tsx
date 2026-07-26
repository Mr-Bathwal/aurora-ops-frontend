"use client";

import { useRouter } from "next/navigation";
import { Sparkles, RefreshCw, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuickActions() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-2.5">
      <Button variant="outline" className="justify-start gap-2.5 bg-card" onClick={() => router.push("/orchestrator")}>
        <Sparkles className="size-4" /> Describe a problem
      </Button>
      <Button variant="outline" className="justify-start gap-2.5 bg-card" onClick={() => router.push("/auto-remediate")}>
        <RefreshCw className="size-4" /> Auto diagnose &amp; fix
      </Button>
      <Button variant="outline" className="justify-start gap-2.5 bg-card" onClick={() => router.push("/run?tab=backup&autorun=1")}>
        <Database className="size-4" /> Back up now
      </Button>
    </div>
  );
}
