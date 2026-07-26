"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crosshair, LayoutDashboard, Settings2, Sparkles, RefreshCw, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const workspaceNav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/run", label: "Run an agent", icon: Settings2 },
  { href: "/orchestrator", label: "Smart orchestrator", icon: Sparkles },
  { href: "/auto-remediate", label: "Auto-remediate", icon: RefreshCw },
];

const recordsNav = [{ href: "/activity", label: "Activity & audit", icon: Activity }];

function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: typeof LayoutDashboard }) {
  const pathname = usePathname();
  const current = pathname === href;

  return (
    <Link
      href={href}
      data-current={current}
      className={cn(
        "group relative flex w-full items-center gap-2.75 rounded-[10px] px-2.5 py-2 text-[13.5px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground",
        current && "bg-grad-soft text-white"
      )}
    >
      {current && <span className="absolute -left-3.5 top-2 bottom-2 w-[3px] rounded-full bg-grad" />}
      <Icon className={cn("size-[17px] shrink-0 opacity-80", current && "text-iris-2 opacity-100")} />
      {label}
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 z-3 flex h-screen w-[242px] shrink-0 flex-col bg-[linear-gradient(180deg,rgba(16,16,28,.72),rgba(8,8,14,.72))] px-3.5 py-5 backdrop-blur-2xl [border-right:1px_solid_var(--border)] max-[720px]:hidden">
      <div className="flex items-center gap-2.75 px-2 pb-5 pt-1.5">
        <div className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-grad shadow-[0_8px_22px_-8px_var(--iris)]">
          <Crosshair className="size-[19px] text-[#0a0b14]" strokeWidth={2.2} />
        </div>
        <div>
          <div className="font-heading text-[14.5px] font-semibold leading-tight tracking-tight">IT Ops Assistant Hub</div>
          <div className="mt-0.5 text-[10.5px] tracking-[0.08em] text-faint uppercase">Agentic Console</div>
        </div>
      </div>

      <div className="px-2.5 pb-1.5 pt-4 text-[10px] tracking-[0.14em] text-faint uppercase">Workspace</div>
      <nav className="flex flex-col gap-0.5">
        {workspaceNav.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>

      <div className="px-2.5 pb-1.5 pt-4 text-[10px] tracking-[0.14em] text-faint uppercase">Records</div>
      <nav className="flex flex-col gap-0.5">
        {recordsNav.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>

      <div className="mt-auto border-t border-border/60 pt-3.5">
        <div className="flex items-center gap-2.5 px-2 py-1">
          <div className="grid size-[30px] shrink-0 place-items-center rounded-[9px] bg-grad text-[12px] font-semibold text-[#0b0c14]">
            GB
          </div>
          <div>
            <div className="text-[12.5px] font-medium">Gourav B.</div>
            <div className="text-[11px] text-faint">Operations &middot; Analyst</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
