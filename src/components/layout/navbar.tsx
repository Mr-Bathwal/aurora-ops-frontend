"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Activity, LayoutDashboard, RefreshCw, Sparkles, Settings2 } from "lucide-react";
import { useBackendStatus } from "@/hooks/use-backend-status";
import { BrandEgg } from "@/components/layout/brand-egg";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/",               label: "Dashboard",        icon: LayoutDashboard },
  { href: "/run",            label: "Run an agent",     icon: Settings2 },
  { href: "/orchestrator",   label: "Orchestrator",     icon: Sparkles },
  { href: "/auto-remediate", label: "Auto-remediate",   icon: RefreshCw },
  { href: "/activity",       label: "Activity",         icon: Activity },
] as const;

const SEARCH_HINTS = [
  "search agents...",
  "run system health...",
  "check disk usage...",
  "analyze recent logs...",
  "auto-diagnose system...",
  "describe a problem...",
];

function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: typeof LayoutDashboard }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13.5px] font-medium transition-colors duration-150",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {active && (
        <motion.span
          layoutId="nav-active-pill"
          className="absolute inset-0 rounded-lg border border-white/12 bg-white/8"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <Icon className={cn("relative z-10 size-[15px]", active && "text-iris-2")} />
      <span className="relative z-10 hidden xl:inline">{label}</span>
      <span className="relative z-10 inline xl:hidden">{label.split(" ")[0]}</span>
    </Link>
  );
}

/* Tiny robot face SVG for the brand mark square */
function RobotFaceMark() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden>
      {/* Antenna */}
      <line x1="12" y1="2" x2="12" y2="5.5" stroke="#0a0b14" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="2" r="1.3" fill="#0a0b14" opacity="0.85" />
      {/* Head */}
      <rect x="3.5" y="5.5" width="17" height="13" rx="4.5" fill="rgba(8,8,20,0.82)" />
      {/* Left eye — ellipse so we can animate ry for a blink */}
      <ellipse cx="9" cy="11.5" rx="2.6" ry="2.6" fill="#0a0b14">
        <animate attributeName="ry" values="2.6;0.15;2.6" dur="3.6s" begin="0s" repeatCount="indefinite" />
      </ellipse>
      {/* Right eye */}
      <ellipse cx="15" cy="11.5" rx="2.6" ry="2.6" fill="#0a0b14">
        <animate attributeName="ry" values="2.6;0.15;2.6" dur="3.6s" begin="0.1s" repeatCount="indefinite" />
      </ellipse>
      {/* Mouth grill */}
      <rect x="8.5"  y="16" width="2" height="1.2" rx="0.5" fill="#0a0b14" opacity="0.6" />
      <rect x="11"   y="16" width="2" height="1.2" rx="0.5" fill="#0a0b14" opacity="0.6" />
      <rect x="13.5" y="16" width="2" height="1.2" rx="0.5" fill="#0a0b14" opacity="0.6" />
    </svg>
  );
}

export function Navbar({ onOpenSearch }: { onOpenSearch: () => void }) {
  const online = useBackendStatus();
  const [placeholder, setPlaceholder] = useState("");
  const hintIdx = useRef(0);
  const charIdx = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function typeNext() {
      const hint = SEARCH_HINTS[hintIdx.current];
      if (charIdx.current <= hint.length) {
        setPlaceholder(hint.slice(0, charIdx.current));
        charIdx.current++;
        timer.current = setTimeout(typeNext, charIdx.current === 1 ? 600 : 50);
      } else {
        timer.current = setTimeout(() => {
          hintIdx.current = (hintIdx.current + 1) % SEARCH_HINTS.length;
          charIdx.current = 0;
          typeNext();
        }, 1400);
      }
    }
    typeNext();
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);

  return (
    <header className="relative sticky top-0 z-50 border-b border-white/8 bg-[rgba(6,6,16,0.82)] backdrop-blur-2xl">
      <div className="navbar-flow-line" />
      <div className="mx-auto flex h-[100px] max-w-screen-2xl items-center gap-5 px-6">

        {/* Brand with easter egg */}
        <BrandEgg>
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <div className="grid size-[42px] place-items-center rounded-[12px] bg-grad shadow-[0_6px_22px_-6px_var(--iris)]">
              <RobotFaceMark />
            </div>
            <div className="hidden min-[520px]:block">
              <div className="font-heading text-[15px] font-semibold leading-none tracking-tight">IT Ops Hub</div>
              <div className="mt-0.5 text-[9.5px] uppercase tracking-[0.12em] text-faint">Agentic Console</div>
            </div>
          </Link>
        </BrandEgg>

        <div className="mx-1 h-6 w-px bg-border/60" />

        {/* Nav */}
        <nav className="flex items-center gap-0.5">
          {NAV_ITEMS.map((item) => <NavLink key={item.href} {...item} />)}
        </nav>

        {/* Right */}
        <div className="ml-auto flex shrink-0 items-center gap-3">
          {/* Status */}
          <div className="hidden items-center gap-2 text-[12.5px] text-muted-foreground md:flex">
            <span className={cn("dot", online === false ? "dot-crit" : online === null ? "size-2 rounded-full bg-faint" : "dot-ok dot-live")} />
            {online === false ? "Backend offline" : online === null ? "Connecting…" : "All systems operational"}
          </div>

          {/* Animated search button */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex w-[310px] items-center gap-2.5 rounded-xl border border-border/80 bg-card/80 px-3.5 py-2.5 text-left text-[13px] text-faint transition-all hover:border-iris/50 hover:bg-secondary hover:shadow-[0_0_14px_rgba(124,107,255,0.14)] xl:w-[440px]"
          >
            <span className="text-iris/70">⌘</span>
            <span className="flex-1 font-mono text-[12px]">
              {placeholder}<span style={{ animation: "blink-cursor 0.9s infinite" }}>▌</span>
            </span>
            <kbd className="rounded-[5px] border border-border/60 bg-ink-2 px-1.5 py-0.5 font-mono text-[10px]">K</kbd>
          </button>

          {/* Avatar */}
          <div className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-grad text-[12px] font-bold text-[#0b0c14] shadow-[0_4px_14px_-4px_var(--iris)]">
            GB
          </div>
        </div>
      </div>
    </header>
  );
}
