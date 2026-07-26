"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Database, FileText, LayoutDashboard, RefreshCw, Search, Sparkles, X } from "lucide-react";

interface OverlayItem {
  label: string;
  icon: typeof LayoutDashboard;
  href: string;
  tag?: string;
}

const AGENT_ITEMS: OverlayItem[] = [
  { label: "Run System Health", icon: Activity,  href: "/run?tab=health&autorun=1", tag: "→ cpu·mem·disk" },
  { label: "Run Log Analyzer",  icon: FileText,  href: "/run?tab=log&autorun=1",    tag: "→ error scan" },
  { label: "Run Backup & DR",   icon: Database,  href: "/run?tab=backup&autorun=1", tag: "→ protect data" },
  { label: "Auto-remediate",    icon: RefreshCw, href: "/auto-remediate",           tag: "→ self-heal" },
];

const NAV_ITEMS: OverlayItem[] = [
  { label: "Dashboard",         icon: LayoutDashboard, href: "/" },
  { label: "Smart orchestrator",icon: Sparkles,        href: "/orchestrator" },
  { label: "Activity & audit",  icon: Activity,        href: "/activity" },
];

function GlowItem({ item, onSelect }: { item: OverlayItem; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false);
  const router = useRouter();
  const Icon = item.icon;

  return (
    <button
      type="button"
      className="group relative w-full overflow-hidden rounded-xl px-5 py-3.5 text-left transition-all duration-200"
      style={{
        background: hovered
          ? "linear-gradient(90deg, transparent 0%, rgba(124,107,255,0.18) 30%, rgba(63,208,224,0.14) 70%, transparent 100%)"
          : "transparent",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => { router.push(item.href); onSelect(); }}
    >
      {/* Left gradient fade on hover */}
      {hovered && (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8" style={{ background: "linear-gradient(90deg, transparent, rgba(124,107,255,0.06))" }} />
      )}
      {/* Right gradient fade on hover */}
      {hovered && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8" style={{ background: "linear-gradient(270deg, transparent, rgba(63,208,224,0.06))" }} />
      )}

      <div className="relative flex items-center gap-3">
        <Icon className="size-4 shrink-0 transition-colors" style={{ color: hovered ? "#A99BFF" : "#5C6582" }} />
        <span className="flex-1 font-medium transition-colors" style={{ color: hovered ? "#EDEFF7" : "#969DB4" }}>
          {item.label}
        </span>
        {item.tag && (
          <span className="font-mono text-[10px] transition-colors" style={{ color: hovered ? "#3FD0E0" : "#3a3f55" }}>
            {item.tag}
          </span>
        )}
      </div>
    </button>
  );
}

const TYPING_HINTS = [
  "search system health...",
  "run log analyzer...",
  "check backup status...",
  "auto diagnose & fix...",
  "describe a problem...",
  "view recent activity...",
];

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const hintIdx = useRef(0);
  const charIdx = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function typeNext() {
      const hint = TYPING_HINTS[hintIdx.current];
      if (charIdx.current <= hint.length) {
        setPlaceholder(hint.slice(0, charIdx.current));
        charIdx.current++;
        timer.current = setTimeout(typeNext, charIdx.current === 1 ? 400 : 45);
      } else {
        timer.current = setTimeout(() => {
          hintIdx.current = (hintIdx.current + 1) % TYPING_HINTS.length;
          charIdx.current = 0;
          typeNext();
        }, 1200);
      }
    }
    typeNext();
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);

  useEffect(() => {
    if (!open) return;
    // Focus after mount — no state call, safe in effect
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!open) return null;

  const lq = query.toLowerCase();
  const filteredAgents = AGENT_ITEMS.filter((i) => !lq || i.label.toLowerCase().includes(lq));
  const filteredNav = NAV_ITEMS.filter((i) => !lq || i.label.toLowerCase().includes(lq));

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center pt-[12vh]"
      style={{ background: "rgba(4,4,12,0.82)", backdropFilter: "blur(14px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Search input — floating, no box */}
      <div className="relative w-full max-w-xl px-4">
        <Search className="absolute left-8 top-1/2 size-4 -translate-y-1/2 text-faint" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder + "▌"}
          className="w-full rounded-2xl bg-transparent py-4 pl-12 pr-12 text-[15px] text-foreground placeholder:text-faint focus:outline-none"
          style={{ border: "1px solid rgba(124,107,255,0.4)", boxShadow: "0 0 30px rgba(124,107,255,0.12)" }}
        />
        <button type="button" onClick={onClose} title="Close search" aria-label="Close search" className="absolute right-8 top-1/2 -translate-y-1/2 text-faint hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>

      {/* Two column results — floating, no box */}
      <div className="mt-8 grid w-full max-w-2xl grid-cols-2 gap-2 px-4">
        {/* Column 1: Run agents */}
        <div>
          <div className="mb-2 px-5 font-mono text-[9.5px] uppercase tracking-[0.2em] text-iris/60">Run agents</div>
          {filteredAgents.map((item) => (
            <GlowItem key={item.href} item={item} onSelect={onClose} />
          ))}
        </div>

        {/* Column 2: Navigate */}
        <div>
          <div className="mb-2 px-5 font-mono text-[9.5px] uppercase tracking-[0.2em] text-cyan/60">Navigate</div>
          {filteredNav.map((item) => (
            <GlowItem key={item.href} item={item} onSelect={onClose} />
          ))}
        </div>
      </div>

      {/* Bottom hint */}
      <div className="mt-8 font-mono text-[11px] text-faint">
        <kbd className="rounded border border-border/60 bg-card px-1.5 py-0.5 text-[10px]">↑↓</kbd> navigate &nbsp;
        <kbd className="rounded border border-border/60 bg-card px-1.5 py-0.5 text-[10px]">↵</kbd> select &nbsp;
        <kbd className="rounded border border-border/60 bg-card px-1.5 py-0.5 text-[10px]">esc</kbd> dismiss
      </div>
    </div>
  );
}
