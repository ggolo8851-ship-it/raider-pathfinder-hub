import { supabase } from "@/integrations/supabase/client";

type OverrideMap = Record<string, string>;
let cache: OverrideMap | null = null;
let inflight: Promise<OverrideMap> | null = null;
const listeners = new Set<() => void>();

async function fetchAll(): Promise<OverrideMap> {
  const { data } = await supabase.from("text_overrides" as any).select("key,value");
  const map: OverrideMap = {};
  (data as any[] | null)?.forEach(r => { map[r.key] = r.value; });
  return map;
}

export function ensureLoaded(): Promise<OverrideMap> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetchAll().then(m => { cache = m; inflight = null; listeners.forEach(l => l()); return m; });
  }
  return inflight;
}

export function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getOverride(key: string): string | undefined {
  return cache?.[key];
}

export async function setOverride(key: string, value: string) {
  const { error } = await supabase.from("text_overrides" as any).upsert({ key, value }, { onConflict: "key" });
  if (error) throw error;
  if (!cache) cache = {};
  cache[key] = value;
  listeners.forEach(l => l());
}
