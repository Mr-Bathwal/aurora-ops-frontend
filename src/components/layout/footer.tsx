"use client";

import Link from "next/link";
import { Orbit } from "lucide-react";
import { useBackendStatus } from "@/hooks/use-backend-status";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/run", label: "Run an agent" },
  { href: "/run?tab=orchestrator", label: "Orchestrator" },
  { href: "/activity", label: "Dashboard" },
] as const;

export function Footer() {
  const online = useBackendStatus();

  // No top margin here. The gap above the footer belongs to the content that ends above it,
  // not to the footer itself — with the margin on this element there were two separate values
  // to cancel before a full-bleed band could meet the rule, and the home page's last band
  // cancelled one of them and left an 80px strip of page floor showing. `main` owns that
  // spacing alone now, so a single negative margin closes it.
  return (
    <footer className="relative z-1 border-t border-white/8">
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-6 px-7 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-8 place-items-center rounded-[8px] bg-grad">
            <Orbit className="text-[#0a0b14]" size={16} />
          </div>
          <div>
            <div className="font-heading text-[13px] font-semibold leading-none">Aurora Ops</div>
            <div className="mt-1 text-[11px] text-faint">Agentic IT operations console</div>
          </div>
        </div>

        <nav className="flex items-center gap-6 text-[13px] text-muted-foreground">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 text-[12px] text-faint">
          <span className={cn("dot", online === false ? "dot-crit" : online === null ? "size-2 rounded-full bg-faint" : "dot-ok")} />
          {online === false ? "Backend offline" : online === null ? "Connecting…" : "Backend online"}
        </div>
      </div>
    </footer>
  );
}
