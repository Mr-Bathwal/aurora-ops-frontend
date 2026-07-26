"use client";

import { useEffect, useState } from "react";
import { api, type Vitals } from "@/lib/api";

export function useVitals(intervalMs = 6000) {
  const [vitals, setVitals] = useState<Vitals | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await api.vitals();
        if (active) {
          setVitals(data);
          setError(false);
        }
      } catch {
        if (active) setError(true);
      }
    }
    load();
    const id = setInterval(load, intervalMs);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [intervalMs]);

  return { vitals, error, loading: vitals === null && !error };
}
