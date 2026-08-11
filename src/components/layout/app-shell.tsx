"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Navbar } from "@/components/layout/navbar";
import { SearchOverlay } from "@/components/layout/search-overlay";
import { Footer } from "@/components/layout/footer";
import { useSpotlight } from "@/hooks/use-spotlight";

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

  // No sitewide WebGL wash any more. It was a second, animated, cyan-tinted atmosphere
  // sitting behind every section's own backdrop — on the hero it showed through as a drift
  // of cyan specks that had nothing to do with the star field in front of it. Sections own
  // their own background now.
  return (
    <div className="relative flex min-h-screen flex-col">
      <Navbar onOpenSearch={() => setSearchOpen(true)} />
      {/* pb-36 is the whole gap above the footer now that the footer carries none itself —
          the 64px this used to be plus the 80px that lived on the footer. Band-based pages
          cancel it with a matching -mb-36 on their last band. */}
      <main className="relative z-1 mx-auto w-full max-w-screen-2xl flex-1 px-7 py-8 pb-36">
        {children}
      </main>
      <Footer />
      <SearchOverlay key={searchOpen ? "open" : "closed"} open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
