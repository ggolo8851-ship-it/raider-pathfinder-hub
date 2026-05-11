import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ERHS_CLUBS } from "@/lib/store";

/**
 * Merge the hardcoded ERHS_CLUBS list with the live `clubs` table maintained
 * by admins, dedupe (case-insensitive, trimmed), and return a sorted array.
 */
export function useAllClubs(): string[] {
  const [clubs, setClubs] = useState<string[]>(ERHS_CLUBS);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("clubs").select("name");
      if (cancelled) return;
      const dbNames = (data ?? []).map(c => c.name).filter(Boolean) as string[];
      const seen = new Map<string, string>();
      [...ERHS_CLUBS, ...dbNames].forEach(n => {
        const key = n.trim().toLowerCase();
        if (key && !seen.has(key)) seen.set(key, n.trim());
      });
      setClubs([...seen.values()].sort((a, b) => a.localeCompare(b)));
    })();
    return () => { cancelled = true; };
  }, []);
  return clubs;
}
