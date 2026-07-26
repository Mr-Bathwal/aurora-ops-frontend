"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function useBackendStatus(intervalMs = 15000) {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    async function check() {
      try {
        await api.vitals();
        if (active) setOnline(true);
      } catch {
        if (active) setOnline(false);
      }
    }
    check();
    const id = setInterval(check, intervalMs);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [intervalMs]);

  return online;
}
