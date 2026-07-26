"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Navbar } from "@/components/layout/navbar";
import { SearchOverlay } from "@/components/layout/search-overlay";
import { CustomCursor } from "@/components/layout/cursor";
import { useSpotlight } from "@/hooks/use-spotlight";
import { GlobalMatrixRain } from "@/components/layout/global-matrix-rain";

export function AppShell({ children }: { children: ReactNode }) {
  useSpotlight();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col">
      <GlobalMatrixRain />
      <CustomCursor />
      <Navbar onOpenSearch={() => setSearchOpen(true)} />
      <main className="relative z-1 mx-auto w-full max-w-screen-2xl flex-1 px-7 py-8 pb-16">
        {children}
      </main>
      <SearchOverlay key={searchOpen ? "open" : "closed"} open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
