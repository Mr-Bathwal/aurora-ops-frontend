import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mt-6 mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint", className)}>
      {children}
    </div>
  );
}
