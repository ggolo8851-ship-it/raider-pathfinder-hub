import { supabase } from "@/integrations/supabase/client";

export type FilterKey =
  | "search" | "distance" | "minDistance" | "size" | "cost" | "state"
  | "tier" | "classification" | "athletic" | "country" | "testPolicy" | "msi";

export interface FeatureFlags {
  filters?: Partial<Record<FilterKey, boolean>>;
}

const ALL_FILTERS: FilterKey[] = [
  "search","distance","minDistance","size","cost","state",
  "tier","classification","athletic","country","testPolicy","msi",
];

export const DEFAULT_FILTER_FLAGS: Record<FilterKey, boolean> =
  Object.fromEntries(ALL_FILTERS.map(k => [k, true])) as Record<FilterKey, boolean>;

export const ALL_FILTER_KEYS = ALL_FILTERS;

let cache: { flags: FeatureFlags; sports: string[] } | null = null;
let inflight: Promise<{ flags: FeatureFlags; sports: string[] }> | null = null;

export async function loadSiteSettings(): Promise<{ flags: FeatureFlags; sports: string[] }> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("feature_flags, extra_sports")
      .eq("id", "global")
      .maybeSingle();
    const flags = ((data as any)?.feature_flags || {}) as FeatureFlags;
    const sports = ((data as any)?.extra_sports || []) as string[];
    cache = { flags, sports };
    return cache;
  })();
  return inflight;
}

export function clearSiteSettingsCache() { cache = null; inflight = null; }

export function isFilterVisible(flags: FeatureFlags, key: FilterKey): boolean {
  return flags.filters?.[key] !== false;
}
