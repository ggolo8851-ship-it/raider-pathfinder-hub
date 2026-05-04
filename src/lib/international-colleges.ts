import { supabase } from "@/integrations/supabase/client";
import type { CollegeResult } from "@/lib/college-api";

export interface IntlCollegeRow {
  id: string;
  name: string;
  country: string;
  city: string | null;
  website: string | null;
  programs: string[];
  admit_rate: number | null;
  avg_cost_usd: number | null;
  setting: string | null;
  athletic_division: string | null;
  enrollment: number | null;
  notes: string | null;
}

export async function fetchIntlColleges(): Promise<IntlCollegeRow[]> {
  const { data, error } = await supabase
    .from("international_colleges")
    .select("*")
    .order("order_index");
  if (error || !data) return [];
  return data as IntlCollegeRow[];
}

// Rough SAT-equivalent estimates for top international universities, used only
// when the row's `satAvg` is null. Lets the user-aware tier function produce
// realistic results (e.g., Imperial → ~1480 SAT-equivalent).
const INTL_SAT_FALLBACK: Record<string, number> = {
  "imperial college london": 1480,
  "university of oxford": 1520,
  "university of cambridge": 1520,
  "eth zurich": 1490,
  "university of toronto": 1430,
  "mcgill university": 1410,
  "national university of singapore": 1480,
  "university of british columbia": 1390,
  "london school of economics": 1470,
  "university college london": 1450,
  "university of edinburgh": 1420,
  "university of melbourne": 1410,
  "university of sydney": 1400,
  "tsinghua university": 1500,
  "peking university": 1490,
};

// Convert an international college row into the CollegeResult shape used by MatchesPage.
export function intlToCollegeResult(row: IntlCollegeRow, originLat: number, originLon: number): CollegeResult {
  const fallbackSat = INTL_SAT_FALLBACK[row.name.toLowerCase()] ?? null;
  return {
    id: `intl_${row.id}`,
    name: row.name,
    city: row.city || "",
    state: row.country,
    url: row.website || "",
    miles: 9999, // far — sorting still works, distance label hides for intl
    majorPercentage: 0,
    majorLabel: row.programs[0] || "Various",
    fitScore: 50,
    size: "Unknown",
    enrollment: row.enrollment,
    costInState: null,
    costOutState: row.avg_cost_usd,
    admissionRate: row.admit_rate,
    satAvg: fallbackSat,
    tier: "Target",
    setting: row.setting || "Unknown",
    bestKnownPrograms: row.programs.slice(0, 3),
    athleticDivision: (row.athletic_division as any) || "Unknown",
    country: row.country,
    isInternational: true,
    chancePct: row.admit_rate ? Math.round(row.admit_rate * 100) : null,
  };
}
