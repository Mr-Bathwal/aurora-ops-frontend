"use client";

import { useRouter } from "next/navigation";
import { Activity, Database, FileText, LayoutDashboard, RefreshCw, Sparkles } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();

  function go(path: string) {
    router.push(path);
    onOpenChange(false);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Command palette" description="Run an agent or jump to a screen">
      <Command>
        <CommandInput placeholder="Type a command or search…" />
        <CommandList>
          <CommandEmpty>No matches.</CommandEmpty>
          <CommandGroup heading="Run agents">
            <CommandItem onSelect={() => go("/run?tab=health&autorun=1")}>
              <Activity /> Run System Health
              <CommandShortcut>⏎</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => go("/run?tab=log&autorun=1")}>
              <FileText /> Run Log Analyzer
            </CommandItem>
            <CommandItem onSelect={() => go("/run?tab=backup&autorun=1")}>
              <Database /> Run Backup &amp; DR
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Navigate">
            <CommandItem onSelect={() => go("/")}>
              <LayoutDashboard /> Dashboard
            </CommandItem>
            <CommandItem onSelect={() => go("/orchestrator")}>
              <Sparkles /> Smart orchestrator
            </CommandItem>
            <CommandItem onSelect={() => go("/auto-remediate")}>
              <RefreshCw /> Auto-remediate
            </CommandItem>
            <CommandItem onSelect={() => go("/activity")}>
              <Activity /> Activity &amp; audit
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
