"use client";

import { MoreHorizontal } from "lucide-react";

/** Decorative "..." affordance in a bento panel header — matches the reference
 * mockup's widget chrome. Not wired to a real menu (nothing to configure per-panel yet). */
export function PanelMenu() {
  return (
    <button type="button" aria-label="Panel options" className="text-faint transition-colors hover:text-foreground">
      <MoreHorizontal size={16} />
    </button>
  );
}
