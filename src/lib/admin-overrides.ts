import { supabase } from "@/integrations/supabase/client";

export interface CollegeOverride {
  college_id: string;
  tier: string | null;
  rankings: Record<string, number | null>;
  known_programs: string[];
  cds_url: string | null;
  official_url: string | null;
  notes: string | null;
}

let cache: Map<string, CollegeOverride> | null = null;
let pending: Promise<Map<string, CollegeOverride>> | null = null;

export async function getCollegeOverrides(): Promise<Map<string, CollegeOverride>> {
  if (cache) return cache;
  if (pending) return pending;
  pending = (async () => {
    const { data } = await supabase.from("college_overrides").select("*");
    const m = new Map<string, CollegeOverride>();
    (data ?? []).forEach((row: any) => {
      const id = String(row.college_id ?? "").toLowerCase();
      m.set(id, row);
    });
    cache = m;
    pending = null;
    return m;
  })();
  return pending;
}

export function clearOverrideCache() { cache = null; }

export function applyOverride<T extends { id?: string | number; name?: string }>(college: T, overrides: Map<string, CollegeOverride>): T & Partial<CollegeOverride> {
  const keys = [
    String(college.id ?? "").toLowerCase(),
    String(college.name ?? "").toLowerCase(),
    String(college.name ?? "").toLowerCase().replace(/\s+/g, "-"),
  ];
  for (const k of keys) {
    const o = overrides.get(k);
    if (o) return { ...college, ...o };
  }
  return college;
}

export interface SiteSettings {
  logo_url: string | null;
  homepage_hero: { headline?: string; sub?: string };
  dropdown_links: { label: string; url: string }[];
  mobile_spacing: Record<string, any>;
}

let settingsCache: SiteSettings | null = null;
export async function getSiteSettings(): Promise<SiteSettings> {
  if (settingsCache) return settingsCache;
  const { data } = await supabase.from("site_settings").select("*").eq("id", "global").maybeSingle();
  settingsCache = {
    logo_url: data?.logo_url ?? null,
    homepage_hero: (data?.homepage_hero as any) ?? {},
    dropdown_links: (data?.dropdown_links as any) ?? [],
    mobile_spacing: (data?.mobile_spacing as any) ?? {},
  };
  return settingsCache;
}
export function clearSettingsCache() { settingsCache = null; }
