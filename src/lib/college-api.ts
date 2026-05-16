import { localeToSetting, topPrograms, classifyAthletics, classifyTier } from "@/lib/college-tiers";
import { fetchIntlColleges, intlToCollegeResult } from "@/lib/international-colleges";

const API_KEY = 'T1nIiVJanrQqJgS1OmJ7UKh0NpxJdzX9bzCeFpXo';
const ERHS_COORDS = { lat: 38.9925, lon: -76.8743 };

// Canonical AANAPISI institutions (fallback when Scorecard's flag isn't set)
const AANAPISI_NAMES = new Set<string>([
  "san francisco state university",
  "university of california-irvine",
  "university of california, irvine",
  "california state university-long beach",
  "california state university, long beach",
  "san jose state university",
  "university of hawaii at manoa",
  "cuny city college",
  "city college of new york",
  "university of illinois chicago",
  "university of illinois at chicago",
  "the university of texas at arlington",
  "university of texas at arlington",
  "de anza college",
  "university of nevada-las vegas",
  "university of nevada, las vegas",
  "santa monica college",
  "city college of san francisco",
  "borough of manhattan community college",
  "hostos community college",
  "eugenio maria de hostos community college",
  // Newly added canonical AANAPISI institutions
  "university of california-davis",
  "university of california, davis",
  "california state university-fullerton",
  "california state university, fullerton",
  "california state polytechnic university-pomona",
  "california state polytechnic university, pomona",
  "california state university-northridge",
  "california state university, northridge",
  "california state university-sacramento",
  "california state university, sacramento",
  "university of washington-tacoma",
  "university of washington, tacoma",
  "university of washington-bothell",
  "university of washington, bothell",
  "portland state university",
  "georgia state university",
  "university of houston",
  "the university of texas at dallas",
  "university of texas at dallas",
  "the university of texas at san antonio",
  "university of texas at san antonio",
  "university of massachusetts-boston",
  "university of massachusetts boston",
  "temple university",
  "rutgers university-newark",
  "rutgers university–newark",
  "university of illinois springfield",
  "university of illinois at springfield",
  "queens college",
  "cuny queens college",
  "hunter college",
  "cuny hunter college",
  "kapiolani community college",
  "kapi'olani community college",
  "kapiʻolani community college",
  "university of hawaii-west oahu",
  "university of hawaii at west oahu",
  "university of hawaiʻi-west oʻahu",
  "northern virginia community college",
  "montgomery college",
  "miami dade college",
  "seattle central college",
]);

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const toRad = (deg: number) => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function geocodeAddress(address: string, city: string, state: string, zipcode: string): Promise<{ lat: number; lon: number } | null> {
  const query = [address, city, state, zipcode].filter(Boolean).join(', ');
  if (!query.trim()) return null;
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=us`,
      { headers: { 'User-Agent': 'RaidersMatch/1.0' } }
    );
    const data = await resp.json();
    if (data.length > 0) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch (e) { console.warn('Geocoding failed:', e); }
  return null;
}

function hashSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getMajorField(major: string): string {
  const m = major.toLowerCase();
  if (m.includes("nurse") || m.includes("health") || m.includes("med") || m.includes("pharm") || m.includes("dental")) return "latest.academics.program_percentage.health";
  if (m.includes("bus") || m.includes("financ") || m.includes("account") || m.includes("market") || m.includes("econ") || m.includes("entrepreneur") || m.includes("supply chain") || m.includes("real estate")) return "latest.academics.program_percentage.business_marketing";
  if (m.includes("engineer") || m.includes("aerospace")) return "latest.academics.program_percentage.engineering";
  if (m.includes("education") || m.includes("teach") || m.includes("counsel")) return "latest.academics.program_percentage.education";
  if (m.includes("art") || m.includes("design") || m.includes("music") || m.includes("theater") || m.includes("film") || m.includes("animation") || m.includes("graphic")) return "latest.academics.program_percentage.visual_performing";
  if (m.includes("bio") || m.includes("chem") || m.includes("phys") || m.includes("science") || m.includes("enviro") || m.includes("marine") || m.includes("geol") || m.includes("climate") || m.includes("sustain") || m.includes("agri") || m.includes("forest")) return "latest.academics.program_percentage.biological";
  if (m.includes("math") || m.includes("stat") || m.includes("data")) return "latest.academics.program_percentage.mathematics";
  if (m.includes("psych")) return "latest.academics.program_percentage.psychology";
  if (m.includes("law") || m.includes("legal") || m.includes("politic") || m.includes("gov") || m.includes("international rel") || m.includes("urban plan")) return "latest.academics.program_percentage.legal";
  if (m.includes("social") || m.includes("socio") || m.includes("history") || m.includes("anthro") || m.includes("criminal")) return "latest.academics.program_percentage.social_science";
  if (m.includes("english") || m.includes("writing") || m.includes("commun") || m.includes("journal") || m.includes("public rel") || m.includes("broadcast") || m.includes("advertis")) return "latest.academics.program_percentage.english";
  if (m.includes("architect") || m.includes("interior")) return "latest.academics.program_percentage.architecture";
  if (m.includes("culinary") || m.includes("hospital") || m.includes("hotel") || m.includes("event") || m.includes("food sci")) return "latest.academics.program_percentage.business_marketing";
  if (m.includes("sport") || m.includes("kinesi") || m.includes("athletic") || m.includes("exercise") || m.includes("recreation")) return "latest.academics.program_percentage.parks_recreation_fitness";
  return "latest.academics.program_percentage.computer";
}

function getMajorLabel(major: string): string {
  const m = major.toLowerCase();
  if (m.includes("nurse") || m.includes("health") || m.includes("med") || m.includes("pharm") || m.includes("dental")) return "Health Sciences";
  if (m.includes("bus") || m.includes("financ") || m.includes("account") || m.includes("market") || m.includes("econ") || m.includes("entrepreneur")) return "Business & Marketing";
  if (m.includes("engineer") || m.includes("aerospace")) return "Engineering";
  if (m.includes("education") || m.includes("teach")) return "Education";
  if (m.includes("art") || m.includes("design") || m.includes("music") || m.includes("theater") || m.includes("film")) return "Visual & Performing Arts";
  if (m.includes("bio") || m.includes("chem") || m.includes("phys") || m.includes("science") || m.includes("enviro")) return "Biological Sciences";
  if (m.includes("math") || m.includes("stat") || m.includes("data")) return "Mathematics & Statistics";
  if (m.includes("psych")) return "Psychology";
  if (m.includes("law") || m.includes("legal") || m.includes("politic") || m.includes("gov")) return "Legal Studies & Government";
  if (m.includes("social") || m.includes("socio") || m.includes("history") || m.includes("criminal")) return "Social Sciences";
  if (m.includes("english") || m.includes("writing") || m.includes("commun") || m.includes("journal")) return "English & Communications";
  if (m.includes("architect")) return "Architecture & Design";
  if (m.includes("sport") || m.includes("kinesi") || m.includes("athletic")) return "Sports & Exercise Science";
  return "Computer & Information Sciences";
}

export interface CollegeResult {
  name: string;
  city: string;
  state: string;
  url: string;
  miles: number;
  majorPercentage: number;
  majorLabel: string;
  fitScore: number;
  size: string;
  enrollment: number | null;
  costInState: number | null;
  costOutState: number | null;
  admissionRate: number | null;
  satAvg: number | null;
  tier: "Safety" | "Target" | "Possible Reach" | "Far Reach";
  id: string;
  vibeScore?: number;
  aiReason?: string;
  avgSalary10yr?: number | null;     // College Scorecard median earnings 10yr after entry
  testPolicy?: "required" | "optional" | "blind" | "unknown";
  // NEW fields
  setting?: string;                 // Urban / Suburban / Small Town / Rural / Unknown
  bestKnownPrograms?: string[];     // top 2-3 programs
  athleticDivision?: "D1" | "D2" | "D3" | "NAIA" | "None" | "Unknown";
  country?: string;                 // "USA" or country name for intl
  isInternational?: boolean;        // true if from international_colleges table
  chancePct?: number | null;        // 0-100 estimated admit chance for this user
  classification?: "tier1" | "tier2" | "tier3" | "tier4";
  womenOnly?: boolean;              // Women's college flag
  menOnly?: boolean;
  institutionalClassification?: string[]; // ["HBCU","HSI","AANAPISI","TCU","ANNH","NANTI","PBI","Women's College","PWI"]
  demographics?: {
    white: number;
    black: number;
    hispanic: number;
    asian: number;
    other: number;
  };
}

function getSchoolSize(enrollment: number | null): string {
  if (!enrollment) return "Unknown";
  if (enrollment < 2000) return "Small";
  if (enrollment < 10000) return "Medium";
  if (enrollment < 25000) return "Large";
  return "Very Large";
}

// Two-tier reach system: "Far Reach" (very selective) and "Possible Reach" (achievable stretch)
function getTier(
  satAvg: number | null,
  admRate: number | null,
  userSat: number,
  userGpa: number,
  apCount: number,
  testOptional: boolean
): "Safety" | "Target" | "Possible Reach" | "Far Reach" {
  let safetyScore = 0;
  let totalWeight = 0;

  // Admission rate factor (weight: 35)
  if (admRate) {
    totalWeight += 35;
    if (admRate > 0.6) safetyScore += 35;
    else if (admRate > 0.45) safetyScore += 28;
    else if (admRate > 0.3) safetyScore += 20;
    else if (admRate > 0.2) safetyScore += 12;
    else if (admRate > 0.1) safetyScore += 5;
    else safetyScore += 0;
  }

  // GPA factor (weight: 30)
  totalWeight += 30;
  if (userGpa >= 3.9) safetyScore += 30;
  else if (userGpa >= 3.7) safetyScore += 25;
  else if (userGpa >= 3.5) safetyScore += 20;
  else if (userGpa >= 3.0) safetyScore += 14;
  else if (userGpa >= 2.5) safetyScore += 8;
  else safetyScore += 3;

  // SAT factor (weight: 20) — skip if test-optional
  if (!testOptional && userSat > 0 && satAvg) {
    totalWeight += 20;
    const satDiff = userSat - satAvg;
    if (satDiff >= 100) safetyScore += 20;
    else if (satDiff >= 50) safetyScore += 16;
    else if (satDiff >= 0) safetyScore += 12;
    else if (satDiff >= -50) safetyScore += 8;
    else if (satDiff >= -100) safetyScore += 4;
    else safetyScore += 0;
  }

  // AP rigor (weight: 15)
  totalWeight += 15;
  if (apCount >= 8) safetyScore += 15;
  else if (apCount >= 6) safetyScore += 12;
  else if (apCount >= 4) safetyScore += 9;
  else if (apCount >= 2) safetyScore += 6;
  else if (apCount >= 1) safetyScore += 3;

  const normalizedScore = totalWeight > 0 ? (safetyScore / totalWeight) * 100 : 50;

  if (normalizedScore >= 70) return "Safety";
  if (normalizedScore >= 50) return "Target";
  if (normalizedScore >= 30) return "Possible Reach";
  return "Far Reach";
}

// Revamped fit score: weights GPA, test, AP rigor, major program, vibe, clubs, ECs,
// achievements, service hours, sport/athletic-division match, distance, AND chance%.
function calculateFitScore(
  college: any,
  queryField: string,
  gpa: number,
  apCount: number,
  major: string,
  userClubs: string[],
  userExtracurriculars: string[],
  userSports: string[],
  miles: number,
  vibeAnswers: Record<string, string>,
  testOptional: boolean,
  userSat: number,
  userInterests: string[],
  userAchievements: string[] = [],
  serviceHours: number = 0,
  athleticDivision: string = "Unknown"
): number {
  let score = 0;

  // 1. Academic Profile (max 25 pts)
  const admRate = college['latest.admissions.admission_rate.overall'] || null;
  const satAvg = college['latest.admissions.sat_scores.average.overall'] || null;

  // GPA vs selectivity (max 13)
  if (admRate) {
    if (admRate > 0.6) score += gpa >= 3.0 ? 13 : gpa >= 2.5 ? 9 : 4;
    else if (admRate > 0.3) score += gpa >= 3.5 ? 13 : gpa >= 3.2 ? 10 : gpa >= 3.0 ? 6 : 2;
    else if (admRate > 0.15) score += gpa >= 3.8 ? 13 : gpa >= 3.5 ? 9 : gpa >= 3.2 ? 5 : 2;
    else score += gpa >= 3.9 ? 12 : gpa >= 3.7 ? 7 : gpa >= 3.5 ? 4 : 1;
  } else {
    score += gpa >= 3.5 ? 10 : gpa >= 3.0 ? 7 : 4;
  }

  // Test score match (max 8)
  if (!testOptional && satAvg && userSat > 0) {
    const ratio = (userSat / 1600) / (satAvg / 1600);
    if (ratio >= 1.1) score += 8;
    else if (ratio >= 1.03) score += 6;
    else if (ratio >= 0.97) score += 5;
    else if (ratio >= 0.9) score += 3;
    else if (ratio >= 0.82) score += 2;
    else score += 1;
  } else {
    score += gpa >= 3.7 ? 6 : gpa >= 3.3 ? 4 : 2;
  }

  // AP rigor (max 4) — scaled higher for selective schools
  const rigorMult = admRate && admRate < 0.3 ? 1.0 : 0.75;
  if (apCount >= 6) score += 4 * rigorMult;
  else if (apCount >= 4) score += 3 * rigorMult;
  else if (apCount >= 2) score += 2 * rigorMult;
  else if (apCount >= 1) score += 1 * rigorMult;

  // 2. Major Program Match (max 22 pts) — biggest single fit driver
  const programPct = college[queryField] || 0;
  if (programPct > 0.30) score += 22;
  else if (programPct > 0.20) score += 19;
  else if (programPct > 0.12) score += 15;
  else if (programPct > 0.06) score += 10;
  else if (programPct > 0.02) score += 5;
  else if (programPct > 0) score += 2;

  // 3. Vibe matching (max 15 pts) — uses every vibe answer the user provided
  if (vibeAnswers && Object.keys(vibeAnswers).length > 0) {
    const enrollment = college['latest.student.size'] || 0;
    const schoolState = college['school.state'] || '';
    const cost = college['latest.cost.tuition.in_state'] || 0;
    const locale = Number(college['school.locale']);            // 11-13 city, 21-23 suburb, 31-33 town, 41-43 rural
    const isCityLocale = locale >= 11 && locale <= 13;
    const isRuralLocale = locale >= 41 && locale <= 43;
    const coastalStates = ['CA','OR','WA','HI','AK','FL','NC','SC','GA','VA','MA','RI','CT','NJ','NY','ME','MD','DE'];
    const mountainStates = ['CO','UT','MT','WY','ID','NV','NM','AZ','VT','NH','WV'];
    const collegeTownStates = ['IN','MI','IA','OH','PA','VA','NC','TX','MA','CT'];
    let vibeMatch = 0;
    // Setting (urban vs rural) — prefer locale code, fall back to enrollment
    if (vibeAnswers.setting === 'urban' && (isCityLocale || enrollment > 12000)) vibeMatch += 2;
    else if (vibeAnswers.setting === 'rural' && (isRuralLocale || enrollment < 6000)) vibeMatch += 2;
    // Class size proxy (small school = small classes)
    if (vibeAnswers.classsize === 'small_class' && enrollment > 0 && enrollment < 5000) vibeMatch += 2;
    else if (vibeAnswers.classsize === 'large_class' && enrollment > 15000) vibeMatch += 2;
    // Priority — value vs prestige
    if (vibeAnswers.priority === 'value' && cost && cost < 20000) vibeMatch += 3;
    else if (vibeAnswers.priority === 'value' && cost && cost < 35000) vibeMatch += 1;
    if (vibeAnswers.priority === 'prestige' && admRate && admRate < 0.2) vibeMatch += 3;
    else if (vibeAnswers.priority === 'prestige' && admRate && admRate < 0.35) vibeMatch += 1;
    // Weekend — big-sports vs local-culture
    if (vibeAnswers.weekend === 'big_sports' && enrollment > 18000) vibeMatch += 2;
    else if (vibeAnswers.weekend === 'local_culture' && (collegeTownStates.includes(schoolState) || (enrollment > 0 && enrollment < 12000))) vibeMatch += 2;
    // Climate
    const coldStates = ['ME','VT','NH','MN','WI','MI','MT','ND','SD','WY','AK'];
    const warmStates = ['FL','CA','AZ','TX','HI','NM','LA','MS','AL','GA','SC'];
    if (vibeAnswers.climate === 'cold_ok' && coldStates.includes(schoolState)) vibeMatch += 2;
    if (vibeAnswers.climate === 'warm_pref' && warmStates.includes(schoolState)) vibeMatch += 2;
    // Social vibe
    if (vibeAnswers.social === 'large_social' && enrollment > 18000) vibeMatch += 1;
    if (vibeAnswers.social === 'small_social' && enrollment > 0 && enrollment < 5000) vibeMatch += 1;
    // Aesthetic — modern (newer/larger urban) vs traditional (small selective LACs)
    if (vibeAnswers.aesthetic === 'modern' && (isCityLocale || enrollment > 15000)) vibeMatch += 1;
    else if (vibeAnswers.aesthetic === 'traditional' && enrollment < 6000 && admRate && admRate < 0.4) vibeMatch += 1;
    // Study style — quiet (smaller, library-heavy) vs social (urban/large)
    if (vibeAnswers.study === 'quiet_study' && enrollment > 0 && enrollment < 8000) vibeMatch += 1;
    else if (vibeAnswers.study === 'social_study' && (isCityLocale || enrollment > 12000)) vibeMatch += 1;
    // Career support — structured (big career centers at large research U) vs independent (LACs)
    if (vibeAnswers.career_support === 'structured_career' && enrollment > 10000) vibeMatch += 1;
    else if (vibeAnswers.career_support === 'independent_career' && enrollment > 0 && enrollment < 6000) vibeMatch += 1;
    // Quickfire — mountain vs ocean geography
    if (vibeAnswers.quickfire === 'mountain' && mountainStates.includes(schoolState)) vibeMatch += 1;
    else if (vibeAnswers.quickfire === 'ocean' && coastalStates.includes(schoolState)) vibeMatch += 1;
    score += Math.min(vibeMatch, 15);
  } else {
    score += 6;
  }

  // 4. Club-to-major alignment (max 8 pts)
  const clubStr = userClubs.join(" ").toLowerCase();
  const m = major.toLowerCase();
  let clubMatch = 0;
  if ((m.includes("computer") || m.includes("tech") || m.includes("data") || m.includes("cyber") || m.includes("software")) && (clubStr.includes("programming") || clubStr.includes("robotics") || clubStr.includes("stem"))) clubMatch += 4;
  if ((m.includes("bus") || m.includes("financ") || m.includes("econ") || m.includes("market")) && (clubStr.includes("fbla") || clubStr.includes("business") || clubStr.includes("investment"))) clubMatch += 4;
  if ((m.includes("health") || m.includes("med") || m.includes("nurse")) && (clubStr.includes("healthcare") || clubStr.includes("red cross"))) clubMatch += 4;
  if ((m.includes("law") || m.includes("politic")) && (clubStr.includes("mock trial") || clubStr.includes("debate") || clubStr.includes("model united nations"))) clubMatch += 4;
  if (m.includes("engineer") && (clubStr.includes("robotics") || clubStr.includes("stem"))) clubMatch += 4;
  if ((m.includes("art") || m.includes("music") || m.includes("theater") || m.includes("film")) && (clubStr.includes("art") || clubStr.includes("theatre") || clubStr.includes("music"))) clubMatch += 4;
  if ((m.includes("english") || m.includes("journal")) && (clubStr.includes("creative writing") || clubStr.includes("journalism"))) clubMatch += 4;
  score += Math.min(clubMatch, 8);

  // 5. Extracurricular depth + leadership (max 8 pts)
  const ecCount = userExtracurriculars.length + userSports.length + userClubs.length;
  let ecScore = 0;
  if (ecCount >= 8) ecScore += 5;
  else if (ecCount >= 5) ecScore += 4;
  else if (ecCount >= 3) ecScore += 3;
  else if (ecCount >= 1) ecScore += 1;
  const leadStr = (userClubs.join(" ") + " " + userExtracurriculars.join(" ") + " " + userAchievements.join(" ")).toLowerCase();
  if (/\b(president|captain|founder|leader|director|chair)\b/.test(leadStr)) ecScore += 3;
  // Selective schools care more about EC depth
  if (admRate && admRate < 0.25) ecScore = Math.min(8, ecScore * 1.2);
  score += Math.min(ecScore, 8);

  // 6. Achievements signal (max 4 pts)
  if (userAchievements.length >= 5) score += 4;
  else if (userAchievements.length >= 3) score += 3;
  else if (userAchievements.length >= 1) score += 2;

  // 7. Service hours civic-fit (max 3 pts)
  if (serviceHours >= 100) score += 3;
  else if (serviceHours >= 50) score += 2;
  else if (serviceHours >= 24) score += 1;

  // 8. Sport / athletic-division alignment (max 4 pts)
  if (userSports.length > 0 && athleticDivision && athleticDivision !== "Unknown" && athleticDivision !== "None") {
    score += athleticDivision === "D1" ? 4 : athleticDivision === "D2" ? 3 : athleticDivision === "D3" ? 2 : 2;
  }

  // 9. Interests alignment (max 5 pts) — keyword match against college name + major label
  if (userInterests.length > 0) {
    const interestTokens = userInterests
      .join(" ")
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter(t => t.length >= 4);
    const haystack = (
      (college["school.name"] || "") + " " + (college["school.alias"] || "") + " " + m
    ).toLowerCase();
    let hits = 0;
    for (const t of interestTokens) if (haystack.includes(t)) hits++;
    if (hits >= 3) score += 5;
    else if (hits === 2) score += 3;
    else if (hits === 1) score += 2;
    if (programPct > 0.05 && interestTokens.some(t => m.includes(t))) score += 1;
    if (userInterests.length >= 3) score += 1;
  }

  // 10. Distance proximity (max 5 pts)
  if (miles < 50) score += 5;
  else if (miles < 200) score += 4;
  else if (miles < 500) score += 3;
  else if (miles < 1000) score += 2;
  else score += 1;

  // 11. Chance-of-admission multiplier — far-reach schools get demoted (not removed)
  const chance = estimateChancePct(admRate, satAvg, userSat, gpa, testOptional);
  if (chance !== null) {
    if (chance >= 50) score *= 1.0;
    else if (chance >= 25) score *= 0.95;
    else if (chance >= 10) score *= 0.85;
    else if (chance >= 3) score *= 0.75;
    else score *= 0.6;
  }

  // Total max ≈ 100
  return Math.min(99, Math.max(1, Math.round(score)));
}

export interface SearchFilters {
  distance: number;
  minDistance: number;
  sizeFilter: string;
  maxCost: number;
  stateFilter: string;
  tierFilter?: string;            // Fit tier: safety/target/reach/etc
  classificationFilter?: string;  // tier1/tier2/tier3/tier4 (prestige class)
  athleticFilter?: string;        // d1/d2/d3/naia/none
  countryFilter?: string;         // us/intl/all
  testPolicyFilter?: string;      // required/optional/blind/all
  msiFilter?: string;             // hbcu/hsi/aanapisi/tcu/womens/pwi/all
  searchQuery?: string;
}

// Logistic admission-chance model.
// Inputs: school selectivity, user GPA, test score (skipped if test-optional),
// AP rigor, EC depth, leadership signal, achievements, service hours.
// Output: 1..99 percent.
export function estimateChanceAdvanced(opts: {
  admRate: number | null;
  schoolSat: number | null;
  userSat: number;
  userGpa: number;
  testOptional: boolean;
  apCount?: number;
  ecCount?: number;
  hasLeadership?: boolean;
  achievementsCount?: number;
  serviceHours?: number;
}): number | null {
  const {
    admRate, schoolSat, userSat, userGpa, testOptional,
    apCount = 0, ecCount = 0, hasLeadership = false,
    achievementsCount = 0, serviceHours = 0,
  } = opts;
  if (admRate === null || admRate === undefined) return null;

  // Baseline log-odds from admit rate (clamp to avoid -Infinity)
  const p0 = Math.max(0.01, Math.min(0.99, admRate));
  const baseLogit = Math.log(p0 / (1 - p0));

  // Coefficients tuned so a 3.9 GPA / 1500 SAT / 6 APs / strong ECs at a 14% admit
  // school lands around 30-40% chance — realistic, not the old <5%.
  const gpaTerm = 1.6 * (userGpa - 3.5);

  let satTerm = 0;
  if (!testOptional && schoolSat && userSat > 0) {
    satTerm = 1.0 * ((userSat - schoolSat) / 100);
  }

  const apTerm = 0.12 * Math.min(apCount, 10);
  const ecTerm = 0.08 * Math.min(ecCount, 12);
  const leadTerm = hasLeadership ? 0.35 : 0;
  const achTerm = 0.12 * Math.min(achievementsCount, 8);
  const svcTerm = serviceHours >= 100 ? 0.25 : serviceHours >= 50 ? 0.15 : serviceHours >= 24 ? 0.08 : 0;

  const z = baseLogit + gpaTerm + satTerm + apTerm + ecTerm + leadTerm + achTerm + svcTerm;
  const p = 1 / (1 + Math.exp(-z));
  return Math.max(1, Math.min(99, Math.round(p * 100)));
}

// Backwards-compat thin wrapper used by older call sites.
function estimateChancePct(admRate: number | null, schoolSat: number | null, userSat: number, userGpa: number, testOptional: boolean): number | null {
  return estimateChanceAdvanced({ admRate, schoolSat, userSat, userGpa, testOptional });
}

// Curated lists of "Hidden Ivies" (highly regarded liberal arts/research universities outside the Ivy League)
// and US Service Academies. These match against the College Scorecard `school.name` field.
export const HIDDEN_IVIES = new Set<string>([
  "Amherst College", "Williams College", "Pomona College", "Swarthmore College",
  "Wesleyan University", "Bowdoin College", "Carleton College", "Middlebury College",
  "Vassar College", "Haverford College", "Davidson College", "Colgate University",
  "Hamilton College", "Bates College", "Colby College", "Reed College", "Kenyon College",
  "Oberlin College", "Smith College", "Mount Holyoke College", "Bryn Mawr College",
  "Wellesley College", "Barnard College", "Claremont McKenna College",
  "Harvey Mudd College", "Scripps College", "Pitzer College", "Trinity College",
  "Skidmore College", "Connecticut College", "Bucknell University", "Lafayette College",
  "Lehigh University", "University of Rochester", "Tufts University", "Emory University",
  "Vanderbilt University", "Washington University in St Louis", "Rice University",
  "Tulane University of Louisiana", "Boston College", "Georgetown University",
  "University of Notre Dame", "University of Chicago",
]);

export const SERVICE_ACADEMIES = new Set<string>([
  "United States Military Academy", "United States Naval Academy",
  "United States Air Force Academy", "United States Coast Guard Academy",
  "United States Merchant Marine Academy",
]);


export async function searchColleges(
  major: string,
  filters: SearchFilters,
  email: string,
  gpa: string,
  aps: string[],
  clubs: string[],
  sat: string,
  act: string,
  extracurriculars: string[] = [],
  sports: string[] = [],
  vibeAnswers: Record<string, string> = {},
  userLat?: number,
  userLon?: number,
  testOptional: boolean = false,
  interests: string[] = []
): Promise<CollegeResult[]> {
  const queryField = getMajorField(major);
  const majorLabel = getMajorLabel(major);
  const originLat = userLat ?? ERHS_COORDS.lat;
  const originLon = userLon ?? ERHS_COORDS.lon;

  const fields = [
    "id",
    "school.name", "school.city", "school.state", "school.school_url",
    "school.locale",
    "location.lat", "location.lon", queryField,
    "latest.student.size",
    "latest.cost.tuition.in_state", "latest.cost.tuition.out_of_state",
    "latest.admissions.admission_rate.overall",
    "latest.admissions.sat_scores.average.overall",
    "latest.admissions.test_requirements",
    // Salary fields removed per product decision (no median earnings shown)

    "latest.student.demographics.race_ethnicity.white",
    "latest.student.demographics.race_ethnicity.black",
    "latest.student.demographics.race_ethnicity.hispanic",
    "latest.student.demographics.race_ethnicity.asian",
    // Institutional classification flags
    "school.women_only", "school.men_only",
    "school.minority_serving.historically_black",
    "school.minority_serving.hispanic",
    "school.minority_serving.annh",
    "school.minority_serving.aanapii",
    "school.minority_serving.tribal",
    "school.minority_serving.nant",
    "school.minority_serving.predominantly_black",
    // Top-program fields for "Best known for"
    "latest.academics.program_percentage.computer",
    "latest.academics.program_percentage.engineering",
    "latest.academics.program_percentage.business_marketing",
    "latest.academics.program_percentage.health",
    "latest.academics.program_percentage.biological",
    "latest.academics.program_percentage.psychology",
    "latest.academics.program_percentage.social_science",
    "latest.academics.program_percentage.education",
    "latest.academics.program_percentage.visual_performing",
    "latest.academics.program_percentage.english",
    "latest.academics.program_percentage.mathematics",
    "latest.academics.program_percentage.legal",
    "latest.academics.program_percentage.communication",
    "latest.academics.program_percentage.architecture",
    "latest.academics.program_percentage.parks_recreation_fitness",
    "latest.academics.program_percentage.history",
    "latest.academics.program_percentage.philosophy_religious",
  ].join(",");

  const hasSearchQuery = !!(filters.searchQuery && filters.searchQuery.trim().length > 1);

  // When an MSI/Women's filter is active, query Scorecard directly with that flag
  // so we surface schools that wouldn't make the top-100-by-admit-rate cut.
  const msiQueryParam: Record<string, string> = {
    hbcu: "school.minority_serving.historically_black=1",
    hsi: "school.minority_serving.hispanic=1",
    aanapisi: "school.minority_serving.aanapii=1",
    tcu: "school.minority_serving.tribal=1",
    womens: "school.women_only=1",
  };
  const msiFlag = filters.msiFilter && filters.msiFilter !== "all" && filters.msiFilter !== "pwi"
    ? msiQueryParam[filters.msiFilter] : undefined;

  const buildUrl = (page: number, perPage: number) => {
    // When searching by name OR filtering by MSI, drop the bachelor's-only restriction.
    const predominant = (hasSearchQuery || msiFlag) ? "" : "&school.degrees_awarded.predominant=3";
    let url = `https://api.data.gov/ed/collegescorecard/v1/schools.json?api_key=${API_KEY}&school.operating=1${predominant}&fields=${fields}&per_page=${perPage}&page=${page}`;
    // Sort by selectivity only when not searching/filtering by MSI; otherwise let API relevance decide.
    if (!hasSearchQuery && !msiFlag) url += `&sort=latest.admissions.admission_rate.overall:asc`;
    if (filters.stateFilter === "maryland" && !hasSearchQuery) url += "&school.state=MD";
    if (hasSearchQuery) {
      url += `&school.search=${encodeURIComponent(filters.searchQuery!.trim())}`;
    }
    if (msiFlag) url += `&${msiFlag}`;
    return url;
  };

  // Fetch US results from Scorecard (skip if user wants intl-only).
  const wantUS = !filters.countryFilter || filters.countryFilter === "all" || filters.countryFilter === "us";
  const wantIntl = !filters.countryFilter || filters.countryFilter === "all" || filters.countryFilter === "intl";

  const pages = (hasSearchQuery || msiFlag) ? [0, 1, 2] : [0];
  const perPage = 100;
  const allResults: any[] = [];
  if (wantUS) {
    for (const p of pages) {
      try {
        const resp = await fetch(buildUrl(p, perPage));
        if (!resp.ok) {
          if (allResults.length === 0 && !wantIntl) throw new Error("API error");
          break;
        }
        const data = await resp.json();
        if (!data.results || data.results.length === 0) break;
        allResults.push(...data.results);
        if (data.results.length < perPage) break;
      } catch (e) {
        console.warn("Scorecard fetch failed:", e);
        break;
      }
    }

    // AANAPISI fallback: the Scorecard `aanapii` flag is unreliable, so when the user
    // filters by AANAPISI we additionally fetch our canonical institutions by name.
    if (filters.msiFilter === "aanapisi") {
      const seenIds = new Set(allResults.map(r => String(r.id)));
      const fetchByName = async (name: string) => {
        try {
          const u = `https://api.data.gov/ed/collegescorecard/v1/schools.json?api_key=${API_KEY}&school.operating=1&fields=${fields}&per_page=5&school.search=${encodeURIComponent(name)}`;
          const r = await fetch(u);
          if (!r.ok) return [];
          const j = await r.json();
          return (j.results || []) as any[];
        } catch { return []; }
      };
      const canonical = Array.from(AANAPISI_NAMES);
      // Limit to 20 parallel fetches to avoid burst limits
      const batches: string[][] = [];
      for (let i = 0; i < canonical.length; i += 8) batches.push(canonical.slice(i, i + 8));
      for (const batch of batches) {
        const results = await Promise.all(batch.map(fetchByName));
        for (const list of results) {
          for (const c of list) {
            const cn = (c['school.name'] || "").toLowerCase();
            if (!AANAPISI_NAMES.has(cn)) continue;
            const id = String(c.id);
            if (seenIds.has(id)) continue;
            seenIds.add(id);
            allResults.push(c);
          }
        }
      }
    }
  }

  const gpaNum = parseFloat(gpa) || 3.0;
  const ACT_TO_SAT: Record<number, number> = { 36: 1590, 35: 1540, 34: 1500, 33: 1460, 32: 1430, 31: 1400, 30: 1370, 29: 1340, 28: 1310, 27: 1280, 26: 1240, 25: 1210, 24: 1180, 23: 1140, 22: 1110, 21: 1080, 20: 1040, 19: 1010, 18: 970, 17: 930, 16: 890, 15: 850, 14: 800, 13: 760, 12: 710, 11: 670, 10: 630 };
  let userSat = parseInt(sat) || 0;
  const userAct = parseInt(act) || 0;
  if (!userSat && userAct && ACT_TO_SAT[userAct]) userSat = ACT_TO_SAT[userAct];

  const usResults: CollegeResult[] = allResults
    .map((c: any): CollegeResult | null => {
      const lat = c['location.lat'];
      const lon = c['location.lon'];
      if (!lat || !lon) return null;

      const miles = haversineDistance(originLat, originLon, lat, lon);
      const enrollment = c['latest.student.size'] || null;
      const size = getSchoolSize(enrollment);
      const costInState = c['latest.cost.tuition.in_state'] || null;
      const costOutState = c['latest.cost.tuition.out_of_state'] || null;
      const admRate = c['latest.admissions.admission_rate.overall'] || null;
      const satAvg = c['latest.admissions.sat_scores.average.overall'] || null;
      const programPct = c[queryField] || 0;
      const name = c['school.name'];
      // Test requirements code: 1=required, 3=considered but not required (optional), 5=not used (blind)
      const trCode = c['latest.admissions.test_requirements'];
      const testPolicy: "required" | "optional" | "blind" | "unknown" =
        trCode === 1 ? "required" : trCode === 3 ? "optional" : trCode === 5 ? "blind" : "unknown";

      const demographics = {
        white: Math.round((c['latest.student.demographics.race_ethnicity.white'] || 0) * 100),
        black: Math.round((c['latest.student.demographics.race_ethnicity.black'] || 0) * 100),
        hispanic: Math.round((c['latest.student.demographics.race_ethnicity.hispanic'] || 0) * 100),
        asian: Math.round((c['latest.student.demographics.race_ethnicity.asian'] || 0) * 100),
        other: 0,
      };
      demographics.other = Math.max(0, 100 - demographics.white - demographics.black - demographics.hispanic - demographics.asian);

      // Institutional classification (MSI / Women's / PWI)
      const womenOnly = c['school.women_only'] === 1 || c['school.women_only'] === true;
      const menOnly = c['school.men_only'] === 1 || c['school.men_only'] === true;
      const msi: string[] = [];
      if (c['school.minority_serving.historically_black'] === 1) msi.push("HBCU");
      if (c['school.minority_serving.hispanic'] === 1) msi.push("HSI");
      if (c['school.minority_serving.aanapii'] === 1) msi.push("AANAPISI");
      if (c['school.minority_serving.tribal'] === 1) msi.push("TCU");
      // Hardcoded AANAPISI fallback for canonical institutions (in case Scorecard flag is stale)
      if (!msi.includes("AANAPISI") && AANAPISI_NAMES.has(name?.toLowerCase?.() || "")) {
        msi.push("AANAPISI");
      }
      // ANNH and PBI intentionally excluded per product decision
      if (womenOnly) msi.push("Women's College");
      if (menOnly) msi.push("Men's College");
      if (msi.length === 0) msi.push("PWI");

      return {
        name,
        city: c['school.city'],
        state: c['school.state'],
        url: c['school.school_url']?.includes('http') ? c['school.school_url'] : 'https://' + c['school.school_url'],
        miles,
        majorPercentage: programPct,
        majorLabel,
        fitScore: calculateFitScore(c, queryField, gpaNum, aps.length, major, clubs, extracurriculars, sports, miles, vibeAnswers, testOptional, userSat, interests, [], 0, classifyAthletics(name)),
        size,
        enrollment,
        costInState,
        costOutState,
        admissionRate: admRate,
        satAvg,
        tier: getTier(satAvg, admRate, userSat, gpaNum, aps.length, testOptional),
        id: String(c['id'] || name),
        country: "USA",
        isInternational: false,
        setting: localeToSetting(c['school.locale'] ?? null),
        bestKnownPrograms: topPrograms(c, 3),
        athleticDivision: classifyAthletics(name),
        classification: classifyTier(name, enrollment, admRate),
        chancePct: estimateChanceAdvanced({
          admRate, schoolSat: satAvg, userSat, userGpa: gpaNum, testOptional,
          apCount: aps.length,
          ecCount: (clubs?.length || 0) + (extracurriculars?.length || 0) + (sports?.length || 0),
          hasLeadership: /\b(president|captain|founder|leader|director|chair)\b/i.test(
            (clubs.join(" ") + " " + extracurriculars.join(" ")).toLowerCase()
          ),
          achievementsCount: 0,
          serviceHours: 0,
        }),
        testPolicy,
        womenOnly,
        menOnly,
        institutionalClassification: msi,
        demographics,
      };
    })
    .filter((c): c is CollegeResult => c !== null);

  // Merge in international colleges (no live API — comes from international_colleges table)
  let intlResults: CollegeResult[] = [];
  if (wantIntl) {
    try {
      const intl = await fetchIntlColleges();
      intlResults = intl.map(row => {
        const cr = intlToCollegeResult(row, originLat, originLon);
        const ecCountIntl = (clubs?.length || 0) + (extracurriculars?.length || 0) + (sports?.length || 0);
        const hasLeadIntl = /\b(president|captain|founder|leader|director|chair)\b/i.test(
          (clubs.join(" ") + " " + extracurriculars.join(" ")).toLowerCase()
        );
        cr.chancePct = estimateChanceAdvanced({
          admRate: cr.admissionRate, schoolSat: cr.satAvg, userSat,
          userGpa: gpaNum, testOptional,
          apCount: aps.length, ecCount: ecCountIntl,
          hasLeadership: hasLeadIntl,
          achievementsCount: 0,
          serviceHours: 0,
        });
        if (cr.chancePct != null) {
          // ±2% per-school nudge so similar schools don't collide.
          const cn = (hashSeed(row.name + "_c") % 5) - 2;
          cr.chancePct = Math.max(1, Math.min(99, cr.chancePct + cn));
        }
        // Build a Scorecard-shaped pseudo-object so we can reuse calculateFitScore
        // and get a UNIQUE score per intl school (no more 75/55 clustering).
        const matchesMajor = row.programs.some(p =>
          p.toLowerCase().includes(major.toLowerCase()) ||
          major.toLowerCase().includes(p.toLowerCase().split(/[\s&]/)[0])
        );
        const pseudo: any = {
          'latest.admissions.admission_rate.overall': cr.admissionRate,
          'latest.admissions.sat_scores.average.overall': cr.satAvg,
          'latest.student.size': cr.enrollment || 15000,
          'latest.cost.tuition.in_state': cr.costOutState,
          'school.state': '',
          [queryField]: matchesMajor ? 0.12 : 0.02,
        };
        const baseFit = calculateFitScore(
          pseudo, queryField, gpaNum, aps.length, major,
          clubs, extracurriculars, sports,
          0, // distance neutral for intl
          vibeAnswers, testOptional, userSat, interests,
          [], 0, "None"
        );
        // Deterministic per-school nudge (±3) so two intl schools with similar
        // profiles never collide on the exact same fitScore — keeps numbers unique
        // without breaking ordering.
        const nudge = (hashSeed(row.name) % 7) - 3;
        cr.fitScore = Math.max(1, Math.min(99, baseFit + nudge));
        // Use the same user-aware tier function as US schools.
        cr.tier = getTier(cr.satAvg, cr.admissionRate, userSat, gpaNum, aps.length, testOptional);
        return cr;
      });
      // If user is searching by name, filter intl results by query too
      if (hasSearchQuery) {
        const q = filters.searchQuery!.trim().toLowerCase();
        intlResults = intlResults.filter(c => c.name.toLowerCase().includes(q));
      }
    } catch (e) {
      console.warn("Intl fetch failed:", e);
    }
  }

  const merged = [...usResults, ...intlResults];

  return merged
    .filter((c) => {
      // When searching by name, RELAX geo filters but keep classification/athletic/cost active
      const skipGeoFilters = hasSearchQuery;
      const isIntl = c.isInternational;
      if (!skipGeoFilters && !isIntl && filters.distance > 0 && c.miles > filters.distance) return false;
      if (!skipGeoFilters && !isIntl && filters.minDistance > 0 && c.miles < filters.minDistance) return false;
      if (filters.sizeFilter !== "all") {
        const sizeKey = c.size.toLowerCase().replace(" ", "");
        if (sizeKey !== filters.sizeFilter) return false;
      }
      if (filters.maxCost > 0) {
        // Use out-of-state cost as default reference; in-state for MD residents
        const cost = c.costOutState ?? c.costInState;
        if (cost && cost > filters.maxCost) return false;
      }
      if (!skipGeoFilters && !isIntl && filters.stateFilter === "out_of_state" && c.state === "MD") return false;

      // Fit-tier filter (Safety / Target / Reach / etc) — with safety fallback
      if (filters.tierFilter && filters.tierFilter !== "all") {
        if (filters.tierFilter === "safety_target" && (c.tier === "Far Reach" || c.tier === "Possible Reach")) return false;
        if (filters.tierFilter === "safety" && c.tier !== "Safety") return false;
        if (filters.tierFilter === "target" && c.tier !== "Target") return false;
        if (filters.tierFilter === "possible_reach" && c.tier !== "Possible Reach") return false;
        if (filters.tierFilter === "far_reach" && c.tier !== "Far Reach") return false;
        if (filters.tierFilter === "reach" && c.tier !== "Possible Reach" && c.tier !== "Far Reach") return false;
        if (filters.tierFilter === "hidden_ivies" && !HIDDEN_IVIES.has(c.name)) return false;
        if (filters.tierFilter === "service_academies" && !SERVICE_ACADEMIES.has(c.name)) return false;
      }

      // NEW: classification (prestige tier)
      if (filters.classificationFilter && filters.classificationFilter !== "all") {
        if (c.classification !== filters.classificationFilter) return false;
      }

      // NEW: athletic division
      if (filters.athleticFilter && filters.athleticFilter !== "all") {
        const want = filters.athleticFilter.toUpperCase();
        if ((c.athleticDivision || "").toUpperCase() !== want) return false;
      }

      // NEW: country / out-of-country
      if (filters.countryFilter === "us" && c.isInternational) return false;
      if (filters.countryFilter === "intl" && !c.isInternational) return false;

      // NEW: test-policy filter (required / optional / blind)
      if (filters.testPolicyFilter && filters.testPolicyFilter !== "all") {
        if ((c.testPolicy || "unknown") !== filters.testPolicyFilter) return false;
      }

      // NEW: institutional classification (HBCU / HSI / AANAPISI / TCU / Women's / PWI)
      if (filters.msiFilter && filters.msiFilter !== "all") {
        const list = (c.institutionalClassification || []).map(s => s.toLowerCase());
        const f = filters.msiFilter.toLowerCase();
        const wantWomen = f === "womens";
        const matchHit = wantWomen
          ? list.includes("women's college")
          : list.some(s => s === f);
        if (!matchHit) return false;
      }

      // When searching by name, require the query to actually match the college name
      // (token-overlap). Prevents the API from returning unrelated schools.
      if (hasSearchQuery) {
        const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
        const q = norm(filters.searchQuery!);
        const n = norm(c.name);
        if (q.length >= 2) {
          const qTokens = q.split(" ").filter(t => t.length >= 2);
          // Pass if any meaningful token from the query appears in the college name,
          // OR the whole query substring matches.
          const ok = n.includes(q) || qTokens.some(t => n.includes(t));
          if (!ok) return false;
        }
      }

      return true;
    })
    // Dedupe by id (preserve first occurrence)
    .filter((c, i, arr) => arr.findIndex(x => String(x.id) === String(c.id)) === i)
    .sort((a, b) => {
      // When user is searching by name, prioritize EXACT name matches first regardless of fit.
      if (hasSearchQuery) {
        const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
        const q = norm(filters.searchQuery!);
        const an = norm(a.name), bn = norm(b.name);
        // 0=exact, 1=starts with, 2=token starts with, 3=substring, 4=other
        const rank = (n: string) => {
          if (n === q) return 0;
          if (n.startsWith(q + " ") || n === q) return 1;
          if (n.startsWith(q)) return 1;
          const tokens = n.split(" ");
          if (tokens.some(t => t === q)) return 2;
          if (tokens.some(t => t.startsWith(q))) return 2;
          if (n.includes(q)) return 3;
          return 4;
        };
        const aRank = rank(an), bRank = rank(bn);
        if (aRank !== bRank) return aRank - bRank;
      }
      return b.fitScore - a.fitScore;
    });
}

// AI re-rank wrapper: given the user's full profile and a list of CollegeResults,
// call the ai-rank-colleges edge function to get personalized scores + reasons.
// Falls back to the rule-based fitScore on any error.
import { supabase } from "@/integrations/supabase/client";

export async function aiRankColleges(
  results: CollegeResult[],
  profileSnapshot: Record<string, any>,
  topN: number = 30
): Promise<CollegeResult[]> {
  if (results.length === 0) return results;
  const candidates = results.slice(0, topN);
  try {
    const { data, error } = await supabase.functions.invoke("ai-rank-colleges", {
      body: { profile: profileSnapshot, candidates },
    });
    if (error || !data?.rankings || !Array.isArray(data.rankings)) {
      return results;
    }
    const rankMap = new Map<string, { score: number; reason: string }>();
    for (const r of data.rankings) {
      rankMap.set(String(r.college_id), {
        score: Math.max(1, Math.min(100, Math.round(r.ai_fit_score))),
        reason: r.reason || "",
      });
    }
    const updated = results.map(c => {
      const ai = rankMap.get(String(c.id));
      if (!ai) return c;
      return { ...c, fitScore: ai.score, aiReason: ai.reason };
    });
    return updated.sort((a, b) => b.fitScore - a.fitScore);
  } catch (e) {
    console.warn("AI rank failed, falling back to rule-based scores:", e);
    return results;
  }
}

// AI-powered career matches — fully personalized using the user's profile.
// Falls back to rule-based getCareerMatches() on any error.
export async function aiGetCareerMatches(
  profileSnapshot: Record<string, any>
): Promise<CareerMatch[] | null> {
  try {
    const { data, error } = await supabase.functions.invoke("ai-rank-careers", {
      body: { profile: profileSnapshot },
    });
    if (error || !data?.careers || !Array.isArray(data.careers)) return null;
    return data.careers.map((c: any) => ({
      title: c.title,
      description: c.description,
      salaryRange: c.salaryRange || "—",
      growth: c.growth || "—",
      searchLink: `https://www.indeed.com/jobs?q=${encodeURIComponent(c.title)}`,
      relatedClubs: c.relatedClubs || [],
      whyForYou: c.whyForYou || "",
      skills: c.skills || [],
      workType: c.workType || "—",
      conditions: c.conditions || "—",
    })).sort((a: any, b: any) => (b.fit_score ?? 0) - (a.fit_score ?? 0));
  } catch (e) {
    console.warn("AI career match failed:", e);
    return null;
  }
}

// Live clubs fetch — pulls from the synced `clubs` table (kept up-to-date by sync-clubs cron).
export async function fetchLiveClubs(): Promise<string[] | null> {
  try {
    const { data, error } = await supabase.from("clubs").select("name").order("name");
    if (error || !data) return null;
    return data.map(c => c.name).filter(Boolean);
  } catch {
    return null;
  }
}

export interface CareerMatch {
  title: string;
  description: string;
  salaryRange: string;
  growth: string;
  searchLink: string;
  relatedClubs: string[];
  whyForYou: string;
  skills: string[];
  workType: string;
  conditions: string;
}

// Massively expanded career matches using ALL portfolio data
export function getCareerMatches(
  major: string,
  aps: string[],
  clubs: string[],
  sports: string[],
  isST: boolean,
  extracurriculars: string[] = [],
  gpa: string = "",
  achievements: string[] = [],
  interests: string[] = []
): CareerMatch[] {
  const m = major.toLowerCase();
  const clubStr = clubs.join(" ").toLowerCase();
  const ecStr = extracurriculars.join(" ").toLowerCase();
  const sportStr = sports.join(" ").toLowerCase();
  const apStr = aps.join(" ").toLowerCase();
  const interestStr = interests.join(" ").toLowerCase();
  const careers: CareerMatch[] = [];

  const filterRelated = (related: string[]) => related.filter(r => clubs.some(c => c.toLowerCase().includes(r.toLowerCase()) || r.toLowerCase().includes(c.toLowerCase())));
  const buildWhy = (reasons: string[]) => reasons.filter(Boolean).join(". ") + ".";

  // CS / Tech
  if (m.includes("computer") || m.includes("tech") || m.includes("software") || m.includes("it") || m.includes("data") || m.includes("cyber") || m.includes("ai") ||
      aps.includes("AP Computer Science A") || aps.includes("AP Computer Science Principles") ||
      clubStr.includes("programming") || clubStr.includes("git") || clubStr.includes("game development") ||
      interestStr.includes("coding") || interestStr.includes("tech") || interestStr.includes("computer")) {
    const why: string[] = [];
    if (m.includes("computer") || m.includes("tech") || m.includes("software")) why.push(`Your major interest in ${major} aligns directly`);
    if (aps.includes("AP Computer Science A")) why.push("Your AP CS A background shows coding readiness");
    if (clubStr.includes("programming")) why.push("Programming Club builds real project experience");
    if (clubStr.includes("robotics")) why.push("VEX Robotics gives you hardware+software skills");
    if (interestStr.includes("coding") || interestStr.includes("tech")) why.push("Your interest in technology is a strong signal");
    
    careers.push(
      { title: "Software Engineer", description: "Design, develop, and maintain applications and systems used by millions", salaryRange: "$85K - $150K+", growth: "25% (Much faster)", searchLink: "https://www.indeed.com/jobs?q=software+engineer", relatedClubs: filterRelated(["Programming Club", "Get Into Tech Club (GIT)", "Game Development Club"]), whyForYou: buildWhy(why), skills: ["Python", "JavaScript", "Git", "Problem Solving", "System Design"], workType: "Office/Remote", conditions: "Mostly desk work, flexible hours, collaborative team environment" },
      { title: "Data Scientist", description: "Analyze complex datasets using statistics and machine learning to drive decisions", salaryRange: "$95K - $140K", growth: "35% (Much faster)", searchLink: "https://www.indeed.com/jobs?q=data+scientist", relatedClubs: filterRelated(["Math Club", "Programming Club", "Science Olympiad Team"]), whyForYou: buildWhy([...why, aps.includes("AP Statistics") ? "AP Statistics gives you a strong data foundation" : ""]), skills: ["Python", "SQL", "Machine Learning", "Statistics", "Data Visualization"], workType: "Office/Remote", conditions: "Analytical work, collaborative, often remote-friendly" },
      { title: "Cybersecurity Analyst", description: "Protect organizations from cyber threats and data breaches", salaryRange: "$75K - $120K", growth: "33% (Much faster)", searchLink: "https://www.indeed.com/jobs?q=cybersecurity+analyst", relatedClubs: filterRelated(["Programming Club", "Get Into Tech Club (GIT)"]), whyForYou: buildWhy(why), skills: ["Network Security", "Ethical Hacking", "Risk Assessment", "Firewalls"], workType: "Office/Remote/Hybrid", conditions: "May involve on-call shifts, critical thinking under pressure" },
      { title: "UX/UI Designer", description: "Design intuitive and beautiful digital interfaces", salaryRange: "$70K - $120K", growth: "16% (Much faster)", searchLink: "https://www.indeed.com/jobs?q=ux+designer", relatedClubs: filterRelated(["Art Club", "Programming Club", "Media Club"]), whyForYou: buildWhy([...why, "Combines tech with creativity"]), skills: ["Figma", "User Research", "Prototyping", "Visual Design"], workType: "Office/Remote", conditions: "Creative collaborative environment" },
      { title: "Cloud Engineer", description: "Build and maintain cloud computing infrastructure", salaryRange: "$90K - $140K", growth: "20% (Much faster)", searchLink: "https://www.indeed.com/jobs?q=cloud+engineer", relatedClubs: filterRelated(["Programming Club", "Get Into Tech Club (GIT)"]), whyForYou: buildWhy(why), skills: ["AWS/Azure", "DevOps", "Linux", "Networking"], workType: "Office/Remote", conditions: "May involve on-call, fast-paced" },
      { title: "AI/ML Engineer", description: "Build intelligent systems that learn from data", salaryRange: "$100K - $170K+", growth: "40% (Much faster)", searchLink: "https://www.indeed.com/jobs?q=machine+learning+engineer", relatedClubs: filterRelated(["Programming Club", "Math Club", "Science Olympiad Team"]), whyForYou: buildWhy([...why, "AI is the fastest-growing field in tech"]), skills: ["Python", "TensorFlow", "Deep Learning", "Mathematics"], workType: "Office/Remote", conditions: "Research-oriented, cutting edge" },
    );
  }

  // Healthcare / Bio
  if (m.includes("nurse") || m.includes("health") || m.includes("med") || m.includes("bio") || m.includes("pharm") || m.includes("dental") ||
      aps.includes("AP Biology") || aps.includes("AP Chemistry") || aps.includes("AP Environmental Science") ||
      clubStr.includes("healthcare") || clubStr.includes("red cross") ||
      interestStr.includes("medicine") || interestStr.includes("health") || interestStr.includes("hospital")) {
    const why: string[] = [];
    if (m.includes("health") || m.includes("med") || m.includes("nurse")) why.push(`Your interest in ${major} is a direct match`);
    if (aps.includes("AP Biology")) why.push("AP Biology provides essential pre-med knowledge");
    if (aps.includes("AP Chemistry")) why.push("AP Chemistry strengthens your science foundation");
    if (clubStr.includes("healthcare")) why.push("Future Healthcare Professionals gives you field exposure");

    careers.push(
      { title: "Registered Nurse", description: "Provide direct patient care in hospitals, clinics, and community settings", salaryRange: "$60K - $95K", growth: "6% (Faster)", searchLink: "https://www.indeed.com/jobs?q=registered+nurse", relatedClubs: filterRelated(["Future Healthcare Professionals", "Red Cross Club"]), whyForYou: buildWhy(why), skills: ["Patient Care", "Clinical Skills", "Communication", "Critical Thinking"], workType: "Hospital/Clinic", conditions: "Shift work (12-hour shifts common), physically demanding, emotionally rewarding" },
      { title: "Physician Assistant", description: "Diagnose illness, develop treatment plans, and prescribe medication", salaryRange: "$95K - $130K", growth: "28% (Much faster)", searchLink: "https://www.indeed.com/jobs?q=physician+assistant", relatedClubs: filterRelated(["Future Healthcare Professionals", "Science National Honor Society"]), whyForYou: buildWhy(why), skills: ["Medical Knowledge", "Diagnostics", "Patient Communication"], workType: "Hospital/Clinic/Office", conditions: "Regular hours possible, fast-paced clinical environment" },
      { title: "Biomedical Engineer", description: "Design medical devices, prosthetics, and healthcare technology", salaryRange: "$70K - $110K", growth: "10% (Faster)", searchLink: "https://www.indeed.com/jobs?q=biomedical+engineer", relatedClubs: filterRelated(["VEX Robotics", "WErSTEM", "Science Olympiad Team"]), whyForYou: buildWhy([...why, isST ? "Your S/T program background is ideal" : ""]), skills: ["Engineering Design", "Biology", "CAD", "Problem Solving"], workType: "Lab/Office", conditions: "Lab and office work, collaborative" },
      { title: "Pharmacist", description: "Dispense medications and advise patients on drug interactions", salaryRange: "$120K - $150K", growth: "3%", searchLink: "https://www.indeed.com/jobs?q=pharmacist", relatedClubs: filterRelated(["Future Healthcare Professionals"]), whyForYou: buildWhy(why), skills: ["Pharmacology", "Chemistry", "Patient Counseling"], workType: "Pharmacy/Hospital", conditions: "Standing for long periods, attention to detail critical" },
      { title: "Physical Therapist", description: "Help patients recover mobility and manage pain through exercise", salaryRange: "$75K - $100K", growth: "15% (Much faster)", searchLink: "https://www.indeed.com/jobs?q=physical+therapist", relatedClubs: filterRelated(["Future Healthcare Professionals"]), whyForYou: buildWhy(why), skills: ["Anatomy", "Exercise Science", "Patient Care"], workType: "Clinic/Hospital", conditions: "Active work, helping patients directly" },
    );
  }

  // Business
  if (m.includes("bus") || m.includes("financ") || m.includes("account") || m.includes("econ") || m.includes("market") || m.includes("entrepreneur") ||
      clubStr.includes("fbla") || clubStr.includes("women in business") || clubStr.includes("investment") ||
      interestStr.includes("business") || interestStr.includes("money") || interestStr.includes("entrepreneur")) {
    const why: string[] = [];
    if (m.includes("bus") || m.includes("financ")) why.push(`Your interest in ${major} maps directly to this career`);
    if (clubStr.includes("fbla")) why.push("FBLA competitions build real business skills");
    if (clubStr.includes("investment")) why.push("Investment Club shows financial market interest");
    if (clubStr.includes("women in business")) why.push("Women in Business expands your professional network");

    careers.push(
      { title: "Financial Analyst", description: "Guide businesses and individuals on investment decisions using data", salaryRange: "$65K - $110K", growth: "9% (Faster)", searchLink: "https://www.indeed.com/jobs?q=financial+analyst", relatedClubs: filterRelated(["FBLA - Future Business Leaders of America", "Women in Business", "Investment Club"]), whyForYou: buildWhy(why), skills: ["Excel", "Financial Modeling", "Analytical Thinking", "Presentations"], workType: "Office", conditions: "Standard business hours, may be fast-paced during earnings season" },
      { title: "Marketing Manager", description: "Plan and execute campaigns to generate interest in products/services", salaryRange: "$70K - $130K", growth: "10% (Faster)", searchLink: "https://www.indeed.com/jobs?q=marketing+manager", relatedClubs: filterRelated(["FBLA - Future Business Leaders of America", "Women in Business", "Media Club"]), whyForYou: buildWhy(why), skills: ["Digital Marketing", "Analytics", "Communication", "Creativity"], workType: "Office/Remote", conditions: "Creative environment, deadline-driven" },
      { title: "Investment Banker", description: "Help companies raise capital, manage mergers and acquisitions", salaryRange: "$85K - $200K+", growth: "7%", searchLink: "https://www.indeed.com/jobs?q=investment+banking+analyst", relatedClubs: filterRelated(["Investment Club", "FBLA - Future Business Leaders of America", "Math Honor Society"]), whyForYou: buildWhy(why), skills: ["Financial Analysis", "Valuation", "Excel", "Communication"], workType: "Office", conditions: "Long hours (60-80+/week), high stress, high reward" },
      { title: "Accountant / CPA", description: "Manage financial records, taxes, and audits for organizations", salaryRange: "$55K - $95K", growth: "6%", searchLink: "https://www.indeed.com/jobs?q=accountant", relatedClubs: filterRelated(["FBLA - Future Business Leaders of America", "Math Honor Society"]), whyForYou: buildWhy(why), skills: ["Accounting Software", "Tax Law", "Attention to Detail"], workType: "Office/Remote", conditions: "Seasonal busy periods (tax season), detail-oriented" },
      { title: "Entrepreneur / Startup Founder", description: "Build and grow your own business from the ground up", salaryRange: "Variable ($0 - Unlimited)", growth: "N/A", searchLink: "https://www.indeed.com/jobs?q=startup", relatedClubs: filterRelated(["FBLA - Future Business Leaders of America", "Women in Business", "Investment Club"]), whyForYou: buildWhy([...why, "Your initiative shows entrepreneurial spirit"]), skills: ["Leadership", "Risk Management", "Networking", "Adaptability"], workType: "Variable", conditions: "High risk/reward, long hours, full ownership" },
      { title: "Supply Chain Manager", description: "Optimize logistics, inventory, and distribution networks", salaryRange: "$65K - $110K", growth: "8%", searchLink: "https://www.indeed.com/jobs?q=supply+chain+manager", relatedClubs: filterRelated(["FBLA - Future Business Leaders of America"]), whyForYou: buildWhy(why), skills: ["Logistics", "Analytics", "Negotiation", "ERP Systems"], workType: "Office/Warehouse", conditions: "May involve travel, fast-paced" },
    );
  }

  // Engineering
  if (m.includes("engineer") || m.includes("aerospace") || aps.includes("AP Physics") || aps.includes("AP Calculus BC") || aps.includes("AP Precalculus") ||
      clubStr.includes("robotics") || clubStr.includes("werstem") ||
      interestStr.includes("building") || interestStr.includes("design") || interestStr.includes("engineer")) {
    const why: string[] = [];
    if (m.includes("engineer")) why.push(`Your ${major} interest is a direct path`);
    if (aps.includes("AP Physics")) why.push("AP Physics builds core engineering knowledge");
    if (aps.includes("AP Calculus BC")) why.push("AP Calc BC demonstrates advanced math readiness");
    if (clubStr.includes("robotics")) why.push("VEX Robotics gives hands-on engineering experience");
    if (isST) why.push("Your S/T program gives you an engineering edge");

    careers.push(
      { title: "Mechanical Engineer", description: "Design and build mechanical systems from HVAC to robotics", salaryRange: "$70K - $115K", growth: "7%", searchLink: "https://www.indeed.com/jobs?q=mechanical+engineer", relatedClubs: filterRelated(["VEX Robotics", "WErSTEM"]), whyForYou: buildWhy(why), skills: ["CAD", "Thermodynamics", "Materials Science", "Problem Solving"], workType: "Office/Lab/Field", conditions: "Mix of desk and hands-on work" },
      { title: "Civil Engineer", description: "Design roads, bridges, buildings, and water systems", salaryRange: "$65K - $105K", growth: "7%", searchLink: "https://www.indeed.com/jobs?q=civil+engineer", relatedClubs: filterRelated(["WErSTEM", "Math Club"]), whyForYou: buildWhy(why), skills: ["AutoCAD", "Project Management", "Structural Analysis"], workType: "Office/Field", conditions: "Field work in various weather, project deadlines" },
      { title: "Electrical Engineer", description: "Design electrical systems, circuits, and power distribution", salaryRange: "$75K - $120K", growth: "7%", searchLink: "https://www.indeed.com/jobs?q=electrical+engineer", relatedClubs: filterRelated(["VEX Robotics", "Get Into Tech Club (GIT)"]), whyForYou: buildWhy(why), skills: ["Circuit Design", "Programming", "Signal Processing"], workType: "Office/Lab", conditions: "Precise work, collaborative teams" },
      { title: "Aerospace Engineer", description: "Design aircraft, spacecraft, and defense systems", salaryRange: "$80K - $130K", growth: "6%", searchLink: "https://www.indeed.com/jobs?q=aerospace+engineer", relatedClubs: filterRelated(["VEX Robotics", "Science Olympiad Team"]), whyForYou: buildWhy(why), skills: ["Aerodynamics", "Propulsion", "MATLAB", "Physics"], workType: "Office/Lab", conditions: "Security clearance may be required" },
      { title: "Chemical Engineer", description: "Design processes for manufacturing chemicals, fuel, and pharmaceuticals", salaryRange: "$75K - $120K", growth: "9%", searchLink: "https://www.indeed.com/jobs?q=chemical+engineer", relatedClubs: filterRelated(["Science Olympiad Team", "WErSTEM"]), whyForYou: buildWhy(why), skills: ["Chemistry", "Process Design", "Thermodynamics"], workType: "Lab/Plant/Office", conditions: "May work in industrial plants, safety-conscious" },
    );
  }

  // Law / Gov
  if (m.includes("law") || m.includes("legal") || m.includes("politic") || m.includes("gov") || m.includes("international rel") ||
      aps.includes("AP US History") || aps.includes("AP Comparative Government and Politics") ||
      aps.includes("AP US Government and Politics") ||
      clubStr.includes("mock trial") || clubStr.includes("debate") || clubStr.includes("model united nations") ||
      interestStr.includes("law") || interestStr.includes("politics") || interestStr.includes("justice")) {
    const why: string[] = [];
    if (m.includes("law")) why.push("Your legal interest directly matches");
    if (clubStr.includes("mock trial")) why.push("Mock Trial gives courtroom simulation experience");
    if (clubStr.includes("debate")) why.push("Debate Club builds argument and persuasion skills");
    if (aps.includes("AP US Government and Politics")) why.push("AP Gov provides civic foundation");

    careers.push(
      { title: "Attorney / Lawyer", description: "Advise and represent clients in legal proceedings", salaryRange: "$80K - $160K+", growth: "10% (Faster)", searchLink: "https://www.indeed.com/jobs?q=attorney", relatedClubs: filterRelated(["ERHS Mock Trial", "Debate Club", "Model United Nations (MUN)"]), whyForYou: buildWhy(why), skills: ["Legal Research", "Argumentation", "Writing", "Critical Thinking"], workType: "Office/Courtroom", conditions: "Long hours, high stress, intellectually demanding" },
      { title: "Diplomat / Foreign Service Officer", description: "Represent US interests abroad and negotiate international agreements", salaryRange: "$60K - $120K", growth: "5%", searchLink: "https://www.indeed.com/jobs?q=foreign+service", relatedClubs: filterRelated(["Model United Nations (MUN)", "International Club"]), whyForYou: buildWhy(why), skills: ["Diplomacy", "Languages", "Cultural Awareness", "Negotiation"], workType: "Embassies/Government", conditions: "Frequent relocation, international travel" },
      { title: "Policy Analyst", description: "Research and analyze policies for government agencies and think tanks", salaryRange: "$55K - $95K", growth: "8%", searchLink: "https://www.indeed.com/jobs?q=policy+analyst", relatedClubs: filterRelated(["Debate Club", "Seminar Club", "UNICEF Club"]), whyForYou: buildWhy(why), skills: ["Research", "Writing", "Statistics", "Policy Analysis"], workType: "Office/Government", conditions: "Research-focused, may influence legislation" },
      { title: "Paralegal", description: "Support attorneys with legal research, drafting, and case preparation", salaryRange: "$45K - $70K", growth: "12%", searchLink: "https://www.indeed.com/jobs?q=paralegal", relatedClubs: filterRelated(["ERHS Mock Trial"]), whyForYou: buildWhy(why), skills: ["Legal Research", "Document Management", "Writing"], workType: "Office", conditions: "Standard office hours, detail-oriented" },
    );
  }

  // Arts
  if (m.includes("art") || m.includes("design") || m.includes("music") || m.includes("theater") || m.includes("film") || m.includes("animation") || m.includes("graphic") ||
      aps.includes("AP Art & Design") || aps.includes("AP Studio Art 2D") ||
      clubStr.includes("art club") || clubStr.includes("theatre") || clubStr.includes("music") || clubStr.includes("media") ||
      interestStr.includes("art") || interestStr.includes("music") || interestStr.includes("creative")) {
    const why: string[] = [];
    if (m.includes("art") || m.includes("design")) why.push(`Your ${major} passion is the foundation`);
    if (aps.includes("AP Art & Design") || aps.includes("AP Studio Art 2D")) why.push("AP Art shows portfolio-level skill");
    if (clubStr.includes("theatre")) why.push("Theatre Club demonstrates creative range");
    if (clubStr.includes("music")) why.push("Music involvement shows artistic depth");

    careers.push(
      { title: "Graphic Designer", description: "Create visual concepts for print, digital media, and branding", salaryRange: "$40K - $75K", growth: "3%", searchLink: "https://www.indeed.com/jobs?q=graphic+designer", relatedClubs: filterRelated(["Art Club", "Fiber Arts Club", "Media Club"]), whyForYou: buildWhy(why), skills: ["Adobe Creative Suite", "Typography", "Color Theory", "Branding"], workType: "Office/Remote/Freelance", conditions: "Creative environment, deadline-driven" },
      { title: "UX Designer", description: "Design user-friendly digital experiences for apps and websites", salaryRange: "$70K - $120K", growth: "16% (Much faster)", searchLink: "https://www.indeed.com/jobs?q=UX+designer", relatedClubs: filterRelated(["Art Club", "Programming Club", "Media Club"]), whyForYou: buildWhy(why), skills: ["Figma", "User Research", "Wireframing", "Prototyping"], workType: "Office/Remote", conditions: "Collaborative, user-centered approach" },
      { title: "Film/Video Producer", description: "Plan, coordinate, and produce video content and films", salaryRange: "$50K - $100K", growth: "7%", searchLink: "https://www.indeed.com/jobs?q=video+producer", relatedClubs: filterRelated(["Media Production Team", "Media Club", "ERHS Theatre Club"]), whyForYou: buildWhy(why), skills: ["Video Editing", "Storytelling", "Project Management", "Camera Work"], workType: "Studio/Field/Remote", conditions: "Irregular hours, creative, project-based" },
      { title: "Animator", description: "Create visual animations for games, film, and digital media", salaryRange: "$55K - $90K", growth: "8%", searchLink: "https://www.indeed.com/jobs?q=animator", relatedClubs: filterRelated(["Art Club", "Game Development Club"]), whyForYou: buildWhy(why), skills: ["Animation Software", "Drawing", "Storytelling", "3D Modeling"], workType: "Studio/Remote", conditions: "Creative, deadline-driven, detail-oriented" },
    );
  }

  // Education
  if (m.includes("education") || m.includes("teach") || m.includes("counsel") ||
      interestStr.includes("teaching") || interestStr.includes("kids") || interestStr.includes("mentor")) {
    const why: string[] = [];
    why.push(`Your ${major || "education"} interest directly aligns with teaching`);
    if (ecStr.includes("tutor")) why.push("Your tutoring experience shows teaching aptitude");

    careers.push(
      { title: "High School Teacher", description: "Educate and inspire the next generation of students", salaryRange: "$45K - $75K", growth: "5%", searchLink: "https://www.indeed.com/jobs?q=high+school+teacher", relatedClubs: filterRelated(["ASL Club & Peer Tutoring", "National Honor Society"]), whyForYou: buildWhy(why), skills: ["Subject Expertise", "Communication", "Patience", "Lesson Planning"], workType: "School", conditions: "Structured schedule, summers off, rewarding" },
      { title: "School Counselor", description: "Guide students through academic and personal challenges", salaryRange: "$50K - $80K", growth: "10% (Faster)", searchLink: "https://www.indeed.com/jobs?q=school+counselor", relatedClubs: filterRelated(["National Honor Society", "Do Something Club"]), whyForYou: buildWhy(why), skills: ["Counseling", "Communication", "Empathy", "College Knowledge"], workType: "School", conditions: "School schedule, emotionally rewarding" },
      { title: "Special Education Teacher", description: "Support students with diverse learning needs", salaryRange: "$45K - $70K", growth: "4%", searchLink: "https://www.indeed.com/jobs?q=special+education+teacher", relatedClubs: filterRelated(["ASL Club & Peer Tutoring"]), whyForYou: buildWhy(why), skills: ["IEP Development", "Patience", "Adaptability"], workType: "School", conditions: "Challenging but deeply fulfilling" },
    );
  }

  // Environment
  if (m.includes("enviro") || m.includes("climate") || m.includes("sustain") || m.includes("marine") || m.includes("geol") || m.includes("forest") || m.includes("agri") ||
      clubStr.includes("environmental") || clubStr.includes("climate") || clubStr.includes("green") ||
      interestStr.includes("environment") || interestStr.includes("nature") || interestStr.includes("climate")) {
    const why: string[] = [];
    if (m.includes("enviro") || m.includes("climate")) why.push("Your environmental interest directly aligns");
    if (clubStr.includes("environmental") || clubStr.includes("climate")) why.push("Your environmental clubs show real commitment");
    if (aps.includes("AP Environmental Science")) why.push("AP Environmental Science provides scientific grounding");

    careers.push(
      { title: "Environmental Scientist", description: "Protect the environment through research and analysis", salaryRange: "$55K - $95K", growth: "6%", searchLink: "https://www.indeed.com/jobs?q=environmental+scientist", relatedClubs: filterRelated(["Environmental Defense Club", "Youth Climate Institute / Green Schools", "Homegrown Heroes"]), whyForYou: buildWhy(why), skills: ["Data Analysis", "Field Research", "GIS", "Environmental Law"], workType: "Lab/Field/Office", conditions: "Field work in various conditions, meaningful impact" },
      { title: "Sustainability Consultant", description: "Help organizations reduce environmental impact", salaryRange: "$60K - $100K", growth: "8%", searchLink: "https://www.indeed.com/jobs?q=sustainability+consultant", relatedClubs: filterRelated(["Environmental Defense Club", "Youth Climate Institute / Green Schools"]), whyForYou: buildWhy(why), skills: ["Sustainability Metrics", "Project Management", "Communication"], workType: "Office/Client Sites", conditions: "Travel possible, growing demand" },
      { title: "Wildlife Biologist", description: "Study and protect animal populations and ecosystems", salaryRange: "$50K - $80K", growth: "5%", searchLink: "https://www.indeed.com/jobs?q=wildlife+biologist", relatedClubs: filterRelated(["Environmental Defense Club", "Homegrown Heroes"]), whyForYou: buildWhy(why), skills: ["Field Research", "Data Collection", "Biology", "GPS/GIS"], workType: "Field/Lab", conditions: "Outdoor work, remote locations possible" },
    );
  }

  // Psychology
  if (m.includes("psych") || aps.includes("AP Psychology") ||
      interestStr.includes("psychology") || interestStr.includes("mental health") || interestStr.includes("therapy")) {
    const why: string[] = [];
    if (m.includes("psych")) why.push("Your psychology interest is the core match");
    if (aps.includes("AP Psychology")) why.push("AP Psychology provides foundational knowledge");

    careers.push(
      { title: "Clinical Psychologist", description: "Diagnose and treat mental health conditions through therapy", salaryRange: "$60K - $110K", growth: "6%", searchLink: "https://www.indeed.com/jobs?q=psychologist", relatedClubs: filterRelated(["Do Something Club", "UNICEF Club"]), whyForYou: buildWhy(why), skills: ["Therapy Techniques", "Diagnosis", "Research", "Empathy"], workType: "Private Practice/Hospital", conditions: "Emotionally demanding but rewarding" },
      { title: "Social Worker", description: "Help individuals and families navigate challenges and access resources", salaryRange: "$45K - $65K", growth: "9%", searchLink: "https://www.indeed.com/jobs?q=social+worker", relatedClubs: filterRelated(["Do Something Club", "UNICEF Club"]), whyForYou: buildWhy(why), skills: ["Case Management", "Advocacy", "Communication"], workType: "Office/Field/Community", conditions: "Emotionally demanding, community-focused" },
      { title: "Human Resources Manager", description: "Manage employee relations, hiring, and workplace culture", salaryRange: "$60K - $110K", growth: "7%", searchLink: "https://www.indeed.com/jobs?q=human+resources+manager", relatedClubs: filterRelated(["National Honor Society"]), whyForYou: buildWhy([...why, "Psychology knowledge helps understand workplace dynamics"]), skills: ["People Management", "Conflict Resolution", "Employment Law"], workType: "Office", conditions: "Standard business hours, people-focused" },
    );
  }

  // Communications / Media / Journalism
  if (m.includes("journal") || m.includes("commun") || m.includes("broadcast") || m.includes("public rel") || m.includes("advertis") || m.includes("digital media") ||
      clubStr.includes("journalism") || clubStr.includes("media") ||
      interestStr.includes("writing") || interestStr.includes("media") || interestStr.includes("news")) {
    const why: string[] = [];
    if (m.includes("journal") || m.includes("commun")) why.push("Your communications interest is a direct match");
    if (clubStr.includes("journalism")) why.push("Journalism experience is invaluable for media careers");
    if (clubStr.includes("media")) why.push("Media club builds real production skills");

    careers.push(
      { title: "Journalist / Reporter", description: "Investigate and report on news stories across platforms", salaryRange: "$35K - $75K", growth: "3%", searchLink: "https://www.indeed.com/jobs?q=journalist", relatedClubs: filterRelated(["Journalism", "Media Club", "Media Production Team"]), whyForYou: buildWhy(why), skills: ["Writing", "Interviewing", "Research", "Deadlines"], workType: "Newsroom/Field/Remote", conditions: "Deadline-driven, may require odd hours for breaking news" },
      { title: "Public Relations Specialist", description: "Manage public image and media relations for organizations", salaryRange: "$50K - $85K", growth: "6%", searchLink: "https://www.indeed.com/jobs?q=public+relations+specialist", relatedClubs: filterRelated(["Media Club", "Journalism"]), whyForYou: buildWhy(why), skills: ["Writing", "Media Relations", "Crisis Management", "Social Media"], workType: "Office/Remote", conditions: "Fast-paced, relationship-building" },
      { title: "Social Media Manager", description: "Create and manage social media presence for brands", salaryRange: "$45K - $80K", growth: "10%", searchLink: "https://www.indeed.com/jobs?q=social+media+manager", relatedClubs: filterRelated(["Media Production Team", "Media Club"]), whyForYou: buildWhy(why), skills: ["Content Creation", "Analytics", "Copywriting", "Visual Design"], workType: "Office/Remote", conditions: "Creative, trend-aware, always-on" },
    );
  }

  // Sports / Athletics
  if (sports.length > 0 && (m.includes("sport") || m.includes("kinesi") || m.includes("athletic") || m.includes("exercise") || m.includes("recreation") ||
      interestStr.includes("sports") || interestStr.includes("fitness") || interestStr.includes("athletics"))) {
    careers.push(
      { title: "Sports Medicine Physician", description: "Treat athletic injuries and promote fitness", salaryRange: "$80K - $150K", growth: "9%", searchLink: "https://www.indeed.com/jobs?q=sports+medicine", relatedClubs: filterRelated(["Future Healthcare Professionals"]), whyForYou: `Your experience in ${sports.length} sport(s) combined with health interest is ideal.`, skills: ["Medical Knowledge", "Anatomy", "Rehabilitation"], workType: "Clinic/Team Facility", conditions: "May travel with teams, active environment" },
      { title: "Athletic Trainer", description: "Prevent, diagnose, and treat muscle/bone injuries for athletes", salaryRange: "$45K - $70K", growth: "17% (Much faster)", searchLink: "https://www.indeed.com/jobs?q=athletic+trainer", relatedClubs: [], whyForYou: `Your ${sports.length} sport(s) background gives you firsthand athletic experience.`, skills: ["First Aid", "Exercise Science", "Rehabilitation", "Taping"], workType: "Gym/Field/Clinic", conditions: "Physical work, game-day hours, rewarding" },
      { title: "Sports Manager / Agent", description: "Manage athletes' careers, contracts, and endorsements", salaryRange: "$50K - $120K+", growth: "10%", searchLink: "https://www.indeed.com/jobs?q=sports+manager", relatedClubs: filterRelated(["FBLA - Future Business Leaders of America"]), whyForYou: `Your sports participation gives you insider understanding of athletic careers.`, skills: ["Negotiation", "Networking", "Contract Law", "Marketing"], workType: "Office/Travel", conditions: "Irregular hours, travel-heavy, relationship-driven" },
      { title: "Fitness Trainer / Coach", description: "Design and lead exercise programs for clients", salaryRange: "$35K - $65K", growth: "14%", searchLink: "https://www.indeed.com/jobs?q=personal+trainer", relatedClubs: [], whyForYou: `Your athletic background translates directly to coaching.`, skills: ["Exercise Programming", "Nutrition", "Motivation", "Anatomy"], workType: "Gym/Outdoors/Client Homes", conditions: "Active, flexible hours, physically demanding" },
    );
  }

  // S/T fallback
  if (isST && careers.length === 0) {
    careers.push(
      { title: "Research Scientist", description: "Conduct research in STEM fields to advance human knowledge", salaryRange: "$65K - $120K", growth: "8%", searchLink: "https://www.indeed.com/jobs?q=research+scientist", relatedClubs: filterRelated(["Science Olympiad Team", "National STEM Honor Society (NSTEM)", "WErSTEM"]), whyForYou: "Your S/T program background makes you well-suited for research careers.", skills: ["Research Methods", "Data Analysis", "Lab Techniques", "Scientific Writing"], workType: "Lab/University", conditions: "Academic environment, publish or perish" },
      { title: "Engineer (General)", description: "Apply science and math to solve real-world problems", salaryRange: "$70K - $130K", growth: "7%", searchLink: "https://www.indeed.com/jobs?q=engineer", relatedClubs: filterRelated(["VEX Robotics", "WErSTEM", "Get Into Tech Club (GIT)"]), whyForYou: "S/T students have advanced STEM skills perfect for engineering.", skills: ["Mathematics", "Problem Solving", "Technical Design", "Teamwork"], workType: "Office/Lab/Field", conditions: "Varies by discipline" },
    );
  }

  // Generic fallback
  if (careers.length === 0) {
    careers.push(
      { title: "Project Manager", description: "Lead teams and coordinate complex projects across industries", salaryRange: "$60K - $110K", growth: "7%", searchLink: "https://www.indeed.com/jobs?q=project+manager", relatedClubs: filterRelated(["National Honor Society"]), whyForYou: "Update your major, interests, and activities in your portfolio for more specific career matches.", skills: ["Leadership", "Organization", "Communication", "Time Management"], workType: "Office/Remote", conditions: "Standard hours, deadline-driven" },
      { title: "Sales Representative", description: "Build relationships and drive revenue for organizations", salaryRange: "$40K - $80K+ (with commission)", growth: "5%", searchLink: "https://www.indeed.com/jobs?q=sales+representative", relatedClubs: [], whyForYou: "Sales skills are valuable in any career path.", skills: ["Communication", "Persuasion", "CRM Tools", "Networking"], workType: "Office/Field/Remote", conditions: "Performance-based, social, can be high-pressure" },
    );
  }

  return careers;
}

// Fetch colleges by their IDs (used for bookmarks — bypasses all filters)
export async function getCollegesByIds(
  ids: string[],
  major: string,
  gpa: string,
  aps: string[],
  clubs: string[],
  sat: string,
  act: string,
  extracurriculars: string[] = [],
  sports: string[] = [],
  vibeAnswers: Record<string, string> = {},
  userLat?: number,
  userLon?: number,
  testOptional: boolean = false,
  interests: string[] = []
): Promise<CollegeResult[]> {
  if (!ids || ids.length === 0) return [];
  const queryField = getMajorField(major);
  const majorLabel = getMajorLabel(major);
  const originLat = userLat ?? ERHS_COORDS.lat;
  const originLon = userLon ?? ERHS_COORDS.lon;

  const fields = [
    "id", "school.name", "school.city", "school.state", "school.school_url",
    "location.lat", "location.lon", queryField,
    "latest.student.size",
    "latest.cost.tuition.in_state", "latest.cost.tuition.out_of_state",
    "latest.admissions.admission_rate.overall",
    "latest.admissions.sat_scores.average.overall",
    "latest.student.demographics.race_ethnicity.white",
    "latest.student.demographics.race_ethnicity.black",
    "latest.student.demographics.race_ethnicity.hispanic",
    "latest.student.demographics.race_ethnicity.asian",
  ].join(",");

  // Split numeric (real Scorecard IDs) from name-based fallbacks
  const numericIds = ids.filter(i => /^\d+$/.test(i));
  const nameIds = ids.filter(i => !/^\d+$/.test(i));

  const gpaNum = parseFloat(gpa) || 3.0;
  const ACT_TO_SAT: Record<number, number> = { 36:1590,35:1540,34:1500,33:1460,32:1430,31:1400,30:1370,29:1340,28:1310,27:1280,26:1240,25:1210,24:1180,23:1140,22:1110,21:1080,20:1040,19:1010,18:970,17:930,16:890,15:850,14:800,13:760,12:710,11:670,10:630 };
  let userSat = parseInt(sat) || 0;
  const userAct = parseInt(act) || 0;
  if (!userSat && userAct && ACT_TO_SAT[userAct]) userSat = ACT_TO_SAT[userAct];

  const results: any[] = [];

  if (numericIds.length > 0) {
    // Scorecard supports comma-separated id lookup
    const url = `https://api.data.gov/ed/collegescorecard/v1/schools.json?api_key=${API_KEY}&id=${numericIds.join(",")}&fields=${fields}&per_page=${numericIds.length}`;
    try {
      const resp = await fetch(url);
      if (resp.ok) {
        const data = await resp.json();
        if (data.results) results.push(...data.results);
      }
    } catch (e) { console.warn("Bookmark fetch failed", e); }
  }

  // For name-based bookmarks, do per-name searches
  for (const name of nameIds) {
    try {
      const url = `https://api.data.gov/ed/collegescorecard/v1/schools.json?api_key=${API_KEY}&school.name=${encodeURIComponent(name)}&fields=${fields}&per_page=1`;
      const resp = await fetch(url);
      if (resp.ok) {
        const data = await resp.json();
        if (data.results && data.results[0]) results.push(data.results[0]);
      }
    } catch (e) { /* skip */ }
  }

  return results
    .map((c: any) => {
      const lat = c['location.lat'];
      const lon = c['location.lon'];
      if (!lat || !lon) return null;
      const miles = haversineDistance(originLat, originLon, lat, lon);
      const enrollment = c['latest.student.size'] || null;
      const admRate = c['latest.admissions.admission_rate.overall'] || null;
      const satAvg = c['latest.admissions.sat_scores.average.overall'] || null;
      const programPct = c[queryField] || 0;
      const demographics = {
        white: Math.round((c['latest.student.demographics.race_ethnicity.white'] || 0) * 100),
        black: Math.round((c['latest.student.demographics.race_ethnicity.black'] || 0) * 100),
        hispanic: Math.round((c['latest.student.demographics.race_ethnicity.hispanic'] || 0) * 100),
        asian: Math.round((c['latest.student.demographics.race_ethnicity.asian'] || 0) * 100),
        other: 0,
      };
      demographics.other = Math.max(0, 100 - demographics.white - demographics.black - demographics.hispanic - demographics.asian);
      return {
        name: c['school.name'],
        city: c['school.city'],
        state: c['school.state'],
        url: c['school.school_url']?.includes('http') ? c['school.school_url'] : 'https://' + (c['school.school_url'] || ''),
        miles,
        majorPercentage: programPct,
        majorLabel,
        fitScore: calculateFitScore(c, queryField, gpaNum, aps.length, major, clubs, extracurriculars, sports, miles, vibeAnswers, testOptional, userSat, interests, [], 0, classifyAthletics(c['school.name'])),
        size: getSchoolSize(enrollment),
        enrollment,
        costInState: c['latest.cost.tuition.in_state'] || null,
        costOutState: c['latest.cost.tuition.out_of_state'] || null,
        admissionRate: admRate,
        satAvg,
        tier: getTier(satAvg, admRate, userSat, gpaNum, aps.length, testOptional),
        id: String(c['id'] || c['school.name']),
        demographics,
      };
    })
    .filter((c: CollegeResult | null): c is CollegeResult => c !== null)
    .sort((a, b) => b.fitScore - a.fitScore);
}
