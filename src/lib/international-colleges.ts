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
  "epfl": 1470,
  "university of toronto": 1430,
  "mcgill university": 1410,
  "national university of singapore": 1480,
  "nanyang technological university": 1470,
  "university of british columbia": 1390,
  "london school of economics": 1470,
  "london school of economics and political science": 1470,
  "university college london": 1450,
  "university of edinburgh": 1420,
  "king's college london": 1430,
  "university of manchester": 1380,
  "university of warwick": 1430,
  "university of bristol": 1400,
  "university of melbourne": 1410,
  "university of sydney": 1400,
  "australian national university": 1420,
  "tsinghua university": 1500,
  "peking university": 1490,
  "fudan university": 1470,
  "university of hong kong": 1450,
  "hong kong university of science and technology": 1440,
  "the chinese university of hong kong": 1430,
  "seoul national university": 1460,
  "kaist": 1470,
  "yonsei university": 1410,
  "university of tokyo": 1480,
  "kyoto university": 1450,
  "osaka university": 1420,
  "tu munich": 1430,
  "technical university of munich": 1430,
  "heidelberg university": 1420,
  "ku leuven": 1410,
  "tu delft": 1430,
  "university of amsterdam": 1410,
  "sorbonne university": 1400,
  "lund university": 1390,
  "university of copenhagen": 1410,
};

// Realistic admission-rate fallback so chance% varies per school.
const INTL_ADMIT_FALLBACK: Record<string, number> = {
  "imperial college london": 0.14,
  "university of oxford": 0.17,
  "university of cambridge": 0.18,
  "eth zurich": 0.27,
  "epfl": 0.30,
  "university of toronto": 0.43,
  "mcgill university": 0.46,
  "national university of singapore": 0.10,
  "nanyang technological university": 0.36,
  "university of british columbia": 0.52,
  "london school of economics": 0.09,
  "london school of economics and political science": 0.09,
  "university college london": 0.16,
  "university of edinburgh": 0.40,
  "king's college london": 0.13,
  "university of manchester": 0.56,
  "university of warwick": 0.14,
  "university of bristol": 0.68,
  "university of melbourne": 0.70,
  "university of sydney": 0.30,
  "australian national university": 0.35,
  "tsinghua university": 0.02,
  "peking university": 0.02,
  "fudan university": 0.05,
  "university of hong kong": 0.10,
  "hong kong university of science and technology": 0.30,
  "the chinese university of hong kong": 0.10,
  "seoul national university": 0.08,
  "kaist": 0.20,
  "yonsei university": 0.30,
  "university of tokyo": 0.34,
  "kyoto university": 0.36,
  "osaka university": 0.40,
  "tu munich": 0.08,
  "technical university of munich": 0.08,
  "heidelberg university": 0.18,
  "ku leuven": 0.36,
  "tu delft": 0.30,
  "university of amsterdam": 0.42,
  "sorbonne university": 0.40,
  "lund university": 0.20,
  "university of copenhagen": 0.45,
};

// Convert an international college row into the CollegeResult shape used by MatchesPage.
export function intlToCollegeResult(row: IntlCollegeRow, originLat: number, originLon: number): CollegeResult {
  const key = row.name.toLowerCase();
  const fallbackSat = INTL_SAT_FALLBACK[key] ?? null;
  const fallbackAdmit = INTL_ADMIT_FALLBACK[key] ?? null;
  const admissionRate = row.admit_rate ?? fallbackAdmit;
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
    admissionRate,
    satAvg: fallbackSat,
    tier: "Target",
    setting: row.setting || "Unknown",
    bestKnownPrograms: row.programs.slice(0, 3),
    athleticDivision: (row.athletic_division as any) || "Unknown",
    country: row.country,
    isInternational: true,
    chancePct: admissionRate != null ? Math.round(admissionRate * 100) : null,
  };
}

