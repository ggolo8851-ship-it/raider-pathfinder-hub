// Curated classification tiers used by the College Matches "Classification" filter.
// These are matched against the College Scorecard `school.name` field.

export const TIER_1_ELITE = new Set<string>([
  "Harvard University", "Yale University", "Princeton University",
  "Columbia University in the City of New York", "University of Pennsylvania",
  "Brown University", "Dartmouth College", "Cornell University",
  "Stanford University", "Massachusetts Institute of Technology",
  "California Institute of Technology", "University of Chicago",
  "Duke University", "Johns Hopkins University", "Northwestern University",
]);

export const TIER_2_TOP_RESEARCH_LAC = new Set<string>([
  "Vanderbilt University", "Rice University", "Washington University in St Louis",
  "Emory University", "University of Notre Dame", "Georgetown University",
  "Carnegie Mellon University", "University of Southern California",
  "New York University", "Tufts University", "Boston College",
  "Wake Forest University", "University of Rochester",
  "Amherst College", "Williams College", "Pomona College", "Swarthmore College",
  "Wesleyan University", "Bowdoin College", "Carleton College", "Middlebury College",
  "Vassar College", "Haverford College", "Davidson College", "Colgate University",
  "Hamilton College", "Bates College", "Colby College", "Reed College",
  "Kenyon College", "Oberlin College", "Smith College", "Wellesley College",
  "Barnard College", "Claremont McKenna College", "Harvey Mudd College",
  "Scripps College", "Pitzer College", "Bryn Mawr College",
]);

export const TIER_3_HIGHLY_SELECTIVE_PUBLICS = new Set<string>([
  "University of California-Berkeley", "University of California-Los Angeles",
  "University of Michigan-Ann Arbor", "University of Virginia-Main Campus",
  "University of North Carolina at Chapel Hill", "Georgia Institute of Technology-Main Campus",
  "University of California-San Diego", "University of California-Santa Barbara",
  "University of Florida", "University of Texas at Austin", "University of Washington-Seattle Campus",
  "University of Wisconsin-Madison", "University of Illinois Urbana-Champaign",
  "Ohio State University-Main Campus", "Pennsylvania State University-Main Campus",
  "University of Maryland-College Park", "University of California-Davis",
  "University of California-Irvine", "Purdue University-Main Campus",
  "Boston University", "Brandeis University", "Case Western Reserve University",
  "Lehigh University", "Tulane University of Louisiana", "University of Miami",
  "Northeastern University", "University of Notre Dame",
]);

// Anything else that's a reasonable 4-year regional or large public falls in Tier 4.
// (We treat "not in tier 1-3" + 4-year + enrollment > 3k OR public as Tier 4 in code.)

export type CollegeTier = "tier1" | "tier2" | "tier3" | "tier4";

export function classifyTier(name: string, enrollment: number | null, admitRate: number | null): CollegeTier {
  if (TIER_1_ELITE.has(name)) return "tier1";
  if (TIER_2_TOP_RESEARCH_LAC.has(name)) return "tier2";
  if (TIER_3_HIGHLY_SELECTIVE_PUBLICS.has(name)) return "tier3";
  // Heuristic fallback for tier-3 by selectivity
  if (admitRate !== null && admitRate < 0.25) return "tier3";
  return "tier4";
}

export const TIER_LABELS: Record<CollegeTier, string> = {
  tier1: "Tier 1 — Elite/Ivy",
  tier2: "Tier 2 — Top Research/LAC",
  tier3: "Tier 3 — Highly Selective/Top Publics",
  tier4: "Tier 4 — Strong Regional/Large Public",
};

// Athletic divisions — curated map for well-known schools. Anything else defaults to "Unknown".
const D1: string[] = [
  "University of Alabama", "University of Michigan-Ann Arbor", "Ohio State University-Main Campus",
  "University of Notre Dame", "Pennsylvania State University-Main Campus", "University of Texas at Austin",
  "University of Florida", "University of Georgia", "University of Southern California",
  "Stanford University", "Duke University", "University of North Carolina at Chapel Hill",
  "University of California-Los Angeles", "University of California-Berkeley", "University of Maryland-College Park",
  "University of Virginia-Main Campus", "Georgia Institute of Technology-Main Campus", "Vanderbilt University",
  "Northwestern University", "Boston College", "Syracuse University", "Villanova University",
  "Gonzaga University", "University of Connecticut", "University of Kentucky", "University of Kansas",
  "Indiana University-Bloomington", "University of Wisconsin-Madison", "University of Iowa",
  "Michigan State University", "Auburn University", "Louisiana State University and Agricultural & Mechanical College",
  "Clemson University", "University of Tennessee-Knoxville", "University of South Carolina-Columbia",
  "Texas A & M University-College Station", "University of Oklahoma-Norman Campus", "Baylor University",
  "Purdue University-Main Campus", "University of Illinois Urbana-Champaign", "University of Minnesota-Twin Cities",
  "University of Nebraska-Lincoln", "University of Arizona", "Arizona State University-Tempe",
  "University of Oregon", "University of Washington-Seattle Campus", "University of Utah",
  "Brigham Young University", "University of Arkansas", "University of Mississippi",
  "Mississippi State University", "Florida State University", "University of Miami",
  "Wake Forest University", "Virginia Polytechnic Institute and State University",
];
const D3: string[] = [
  "Massachusetts Institute of Technology", "California Institute of Technology", "University of Chicago",
  "Washington University in St Louis", "Emory University", "Carnegie Mellon University",
  "Johns Hopkins University", "New York University", "Tufts University",
  "Amherst College", "Williams College", "Pomona College", "Swarthmore College",
  "Wesleyan University", "Bowdoin College", "Carleton College", "Middlebury College",
  "Vassar College", "Haverford College", "Davidson College", "Colgate University",
  "Hamilton College", "Bates College", "Colby College", "Kenyon College", "Oberlin College",
];

const D1_SET = new Set(D1);
const D3_SET = new Set(D3);

export function classifyAthletics(name: string): "D1" | "D2" | "D3" | "NAIA" | "None" | "Unknown" {
  if (D1_SET.has(name)) return "D1";
  if (D3_SET.has(name)) return "D3";
  return "Unknown";
}

// College Scorecard locale codes → human setting
// 11-13: City, 21-23: Suburb, 31-33: Town, 41-43: Rural
export function localeToSetting(locale: number | null): string {
  if (locale == null) return "Unknown";
  if (locale >= 11 && locale <= 13) return "Urban";
  if (locale >= 21 && locale <= 23) return "Suburban";
  if (locale >= 31 && locale <= 33) return "Small Town";
  if (locale >= 41 && locale <= 43) return "Rural";
  return "Unknown";
}

// Map College Scorecard program-percentage fields → human label
export const PROGRAM_FIELD_TO_LABEL: Record<string, string> = {
  "latest.academics.program_percentage.computer": "Computer Science",
  "latest.academics.program_percentage.engineering": "Engineering",
  "latest.academics.program_percentage.business_marketing": "Business",
  "latest.academics.program_percentage.health": "Health Sciences",
  "latest.academics.program_percentage.biological": "Biology",
  "latest.academics.program_percentage.psychology": "Psychology",
  "latest.academics.program_percentage.social_science": "Social Sciences",
  "latest.academics.program_percentage.education": "Education",
  "latest.academics.program_percentage.visual_performing": "Visual & Performing Arts",
  "latest.academics.program_percentage.english": "English",
  "latest.academics.program_percentage.mathematics": "Mathematics",
  "latest.academics.program_percentage.legal": "Legal/Political",
  "latest.academics.program_percentage.communication": "Communications",
  "latest.academics.program_percentage.architecture": "Architecture",
  "latest.academics.program_percentage.parks_recreation_fitness": "Sports/Kinesiology",
  "latest.academics.program_percentage.history": "History",
  "latest.academics.program_percentage.philosophy_religious": "Philosophy/Religion",
};

export function topPrograms(college: any, n = 3): string[] {
  const pairs: Array<[string, number]> = [];
  for (const field of Object.keys(PROGRAM_FIELD_TO_LABEL)) {
    const v = college[field];
    if (typeof v === "number" && v > 0.02) pairs.push([PROGRAM_FIELD_TO_LABEL[field], v]);
  }
  return pairs.sort((a, b) => b[1] - a[1]).slice(0, n).map(p => p[0]);
}
