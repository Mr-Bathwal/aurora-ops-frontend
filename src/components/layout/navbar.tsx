"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, Server, SlidersHorizontal, RefreshCw, Menu, X, Search } from "lucide-react";
import { useBackendStatus } from "@/hooks/use-backend-status";
import { cn } from "@/lib/utils";
import type { IconType } from "@/lib/icon-type";

/** `/` is not here. It is the marketing landing page, not somewhere you navigate *back* to
 * while working — the wordmark already goes there, which is where every site on the web puts
 * that link. Spending a nav slot on it left the product with no item actually called
 * "Dashboard", so the run history had to carry the vaguer "Activity" instead. The real
 * dashboard is /activity: it is the page with the KPIs, the charts and the log.
 *
 * /hosts earns its slot because it is the only route that is not reachable from anywhere
 * else, and it is where a new customer has to start. The agent roster at /agents does not,
 * being one click from the landing page and from every agent name in the app.
 *
 * /orchestrator is gone too, for a different reason: it was never a fifth destination. It
 * asks you to describe a problem so it can pick one of the three agents on /run — which is
 * what the tabs on /run already do, only by name instead of by symptom. It is a tab there
 * now, and two neighbouring nav items that lead to the same three agents have become one. */
const NAV_ITEMS = [
  { href: "/activity",       label: "Dashboard",        icon: LayoutDashboard },
  { href: "/hosts",          label: "Hosts",            icon: Server },
  { href: "/run",            label: "Run an agent",     icon: SlidersHorizontal },
  { href: "/auto-remediate", label: "Auto-remediate",   icon: RefreshCw },
] as const;

/** The wordmark. An angular A cut from the brand gradient — a mark rather than a stock
 * glyph, and the one place the gradient still appears at full strength now that the CTA is
 * an outline. */
function BrandMark() {
  return (
    <svg viewBox="0 0 32 32" className="size-[34px]" aria-hidden>
      <defs>
        <linearGradient id="aurora-mark" x1="0" y1="0" x2="1" y2="1">
          {/* Blue into mint, the same direction as --grad. The sweep ran these the other way
              round, which put the mark out of step with every button on the site. */}
          <stop offset="0%" stopColor="#3e9cff" />
          <stop offset="100%" stopColor="#34f5c5" />
        </linearGradient>
      </defs>
      <path d="M16 3 L28.5 28 L21.8 28 L16 15.4 L10.2 28 L3.5 28 Z" fill="url(#aurora-mark)" />
      {/* The notch is cut in the page floor colour, so it has to track --bg. */}
      <path d="M16 19.5 L19.4 26.6 L12.6 26.6 Z" fill="#050707" />
    </svg>
  );
}

function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: IconType }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      title={label}
      className={cn(
        "relative flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition-colors duration-150 xl:px-3.5",
        "whitespace-nowrap",
        active ? "text-brand" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {active && (
        <motion.span
          layoutId="nav-active-pill"
          className="absolute inset-0 rounded-lg border border-brand/25 bg-brand/10"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <Icon className={cn("relative z-10 shrink-0", active && "text-brand")} size={16} />
      {/* At five items the labels survive a good deal further down; below xl they still
          shed to the first word rather than to bare icons, which is where a nav stops
          being readable. */}
      <span className="relative z-10 hidden xl:inline">{label}</span>
      <span className="relative z-10 hidden lg:inline xl:hidden">{label.split(" ")[0]}</span>
    </Link>
  );
}

function MobileNavLink({ href, label, icon: Icon, onClick }: {
  href: string; label: string; icon: IconType; onClick: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-4 py-3 text-[14px] font-medium transition-colors",
        active ? "bg-white/8 text-foreground" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
      )}
    >
      <Icon className={cn(active && "text-brand-2")} size={18} />
      {label}
    </Link>
  );
}

export function Navbar({ onOpenSearch }: { onOpenSearch: () => void }) {
  const online = useBackendStatus();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // On the landing page the bar floats over the sky until you scroll. The reference's nav
  // is `static` and simply leaves — but this is a console, not a brochure, so the nav stays
  // put and earns its background instead: transparent while the hero is in frame, opaque
  // the moment there is content behind it to be read against.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const floating = pathname === "/" && !scrolled && !mobileOpen;

  return (
    <header
      className={cn(
        "relative sticky top-0 z-50 transition-colors duration-300",
        floating
          ? "border-b border-transparent bg-transparent"
          : "border-b border-white/8 bg-[rgba(6,6,16,0.82)] backdrop-blur-2xl"
      )}
    >
      {!floating && <div className="navbar-flow-line" />}
      {/* Aurora bleeding in from both ends of the bar. Two wide, very soft washes rather
          than a border glow: it has to read as light in the room behind the chrome, and a
          glow tight to the edge just looks like a stroke somebody left on. Suppressed while
          floating, where the sky behind is already doing this job. */}
      {!floating && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{
            background:
              "radial-gradient(40% 150% at 0% 50%, rgba(62,156,255,0.13), transparent 70%)," +
              "radial-gradient(40% 150% at 100% 50%, rgba(52,245,197,0.11), transparent 70%)",
          }}
        />
      )}
      <div className="relative mx-auto flex h-[76px] max-w-screen-2xl items-center gap-5 px-4 sm:px-6">

        {/* Brand */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <BrandMark />
          <span className="hidden font-heading text-[16px] font-semibold leading-none tracking-tight min-[520px]:block">
            Aurora Ops
          </span>
        </Link>

        {/* Nav — pushed to the right of the bar, desktop only, collapses to a mobile menu
            below lg. */}
        <nav className="ml-auto hidden shrink-0 items-center gap-0.5 lg:flex">
          {NAV_ITEMS.map((item) => <NavLink key={item.href} {...item} />)}
        </nav>

        {/* Right */}
        <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-5 lg:border-l lg:border-white/8 lg:pl-5 sm:gap-3">
          {/* Status — desktop only */}
          <div className="hidden items-center gap-2 whitespace-nowrap text-[12.5px] text-muted-foreground 2xl:flex">
            <span className={cn("dot", online === false ? "dot-crit" : online === null ? "size-2 rounded-full bg-faint" : "dot-ok dot-live")} />
            {online === false ? "Backend offline" : online === null ? "Connecting…" : "All systems operational"}
          </div>

          {/* Search — full control on desktop, icon-only below lg */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="hidden items-center gap-2.5 rounded-xl border border-border/80 bg-card/80 px-3.5 py-2.5 text-left text-[13px] text-faint transition-all hover:border-brand/50 hover:bg-secondary hover:shadow-[0_0_14px_rgba(52,245,197,0.16)] lg:flex lg:w-[180px] xl:w-[220px] 2xl:w-[300px]"
          >
            <span className="text-brand/70">⌘</span>
            <span className="flex-1 truncate font-mono text-[12px]">Search agents, runs, activity…</span>
            <kbd className="rounded-[6px] border border-border/60 bg-ink-2 px-1.5 py-0.5 font-mono text-[10px]">K</kbd>
          </button>
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Search"
            className="grid size-9 shrink-0 place-items-center rounded-[8px] border border-border/80 bg-card/80 text-faint lg:hidden"
          >
            <Search size={18} />
          </button>

          {/* Avatar — desktop only, mobile menu toggle takes its place on small screens */}
          <div className="hidden size-9 shrink-0 place-items-center rounded-[8px] bg-grad text-[12px] font-bold text-[#0c0f14] shadow-[0_4px_14px_-4px_var(--brand)] sm:grid">
            GB
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="grid size-9 shrink-0 place-items-center rounded-[8px] border border-border/80 bg-card/80 text-foreground lg:hidden"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-white/8 bg-[rgba(6,6,16,0.96)] lg:hidden"
          >
            <nav className="flex flex-col gap-1 px-4 py-3">
              {NAV_ITEMS.map((item) => (
                <MobileNavLink key={item.href} {...item} onClick={() => setMobileOpen(false)} />
              ))}
            </nav>
            <div className="flex items-center gap-2 border-t border-white/8 px-5 py-3 text-[12.5px] text-muted-foreground">
              <span className={cn("dot", online === false ? "dot-crit" : online === null ? "size-2 rounded-full bg-faint" : "dot-ok dot-live")} />
              {online === false ? "Backend offline" : online === null ? "Connecting…" : "All systems operational"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
