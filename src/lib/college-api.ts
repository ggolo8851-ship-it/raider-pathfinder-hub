const API_KEY = 'T1nIiVJanrQqJgS1OmJ7UKh0NpxJdzX9bzCeFpXo';
const ERHS_COORDS = { lat: 38.9925, lon: -76.8743 };

// Haversine formula for accurate distance in miles
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
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    }
  } catch (e) {
    console.warn('Geocoding failed:', e);
  }
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

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function getMajorField(major: string): string {
  const m = major.toLowerCase();
  if (m.includes("nurse") || m.includes("health") || m.includes("med")) return "latest.academics.program_percentage.health";
  if (m.includes("bus") || m.includes("financ") || m.includes("account") || m.includes("market")) return "latest.academics.program_percentage.business_marketing";
  if (m.includes("engineer")) return "latest.academics.program_percentage.engineering";
  if (m.includes("education") || m.includes("teach")) return "latest.academics.program_percentage.education";
  if (m.includes("art") || m.includes("design") || m.includes("music")) return "latest.academics.program_percentage.visual_performing";
  if (m.includes("bio") || m.includes("chem") || m.includes("phys") || m.includes("science") || m.includes("enviro")) return "latest.academics.program_percentage.biological";
  if (m.includes("math") || m.includes("stat")) return "latest.academics.program_percentage.mathematics";
  if (m.includes("psych")) return "latest.academics.program_percentage.psychology";
  if (m.includes("law") || m.includes("legal") || m.includes("politic") || m.includes("gov")) return "latest.academics.program_percentage.legal";
  if (m.includes("social") || m.includes("socio") || m.includes("history")) return "latest.academics.program_percentage.social_science";
  if (m.includes("english") || m.includes("writing") || m.includes("commun") || m.includes("journal")) return "latest.academics.program_percentage.english";
  return "latest.academics.program_percentage.computer";
}

function getMajorLabel(major: string): string {
  const m = major.toLowerCase();
  if (m.includes("nurse") || m.includes("health") || m.includes("med")) return "Health Sciences";
  if (m.includes("bus") || m.includes("financ") || m.includes("account") || m.includes("market")) return "Business & Marketing";
  if (m.includes("engineer")) return "Engineering";
  if (m.includes("education") || m.includes("teach")) return "Education";
  if (m.includes("art") || m.includes("design") || m.includes("music")) return "Visual & Performing Arts";
  if (m.includes("bio") || m.includes("chem") || m.includes("phys") || m.includes("science") || m.includes("enviro")) return "Biological Sciences";
  if (m.includes("math") || m.includes("stat")) return "Mathematics";
  if (m.includes("psych")) return "Psychology";
  if (m.includes("law") || m.includes("legal") || m.includes("politic") || m.includes("gov")) return "Legal Studies";
  if (m.includes("social") || m.includes("socio") || m.includes("history")) return "Social Sciences";
  if (m.includes("english") || m.includes("writing") || m.includes("commun") || m.includes("journal")) return "English & Communications";
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
  tier: "Safety" | "Target" | "Reach";
  id: string;
  vibeScore?: number;
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

// IMPROVED TIER: Multi-factor, NOT strictly SAT-based
// Weight: GPA (30%), SAT optional (20%), Admission Rate (30%), AP rigor (20%)
function getTier(
  satAvg: number | null,
  admRate: number | null,
  userSat: number,
  userGpa: number,
  apCount: number,
  testOptional: boolean
): "Safety" | "Target" | "Reach" {
  let safetyScore = 0;
  let totalWeight = 0;

  // Admission rate factor (weight: 35%)
  if (admRate) {
    totalWeight += 35;
    if (admRate > 0.6) safetyScore += 35;
    else if (admRate > 0.4) safetyScore += 25;
    else if (admRate > 0.25) safetyScore += 15;
    else if (admRate > 0.15) safetyScore += 8;
    else safetyScore += 0;
  }

  // GPA factor (weight: 30%)
  totalWeight += 30;
  if (userGpa >= 3.8) safetyScore += 30;
  else if (userGpa >= 3.5) safetyScore += 22;
  else if (userGpa >= 3.0) safetyScore += 15;
  else if (userGpa >= 2.5) safetyScore += 8;
  else safetyScore += 3;

  // SAT factor (weight: 20%) — REDUCED from being the sole determinant
  // If test-optional, skip SAT entirely and redistribute weight
  if (!testOptional && userSat > 0 && satAvg) {
    totalWeight += 20;
    const satDiff = userSat - satAvg;
    if (satDiff >= 100) safetyScore += 20;
    else if (satDiff >= 0) safetyScore += 15;
    else if (satDiff >= -50) safetyScore += 10;
    else if (satDiff >= -100) safetyScore += 5;
    else safetyScore += 0;
  }

  // AP rigor factor (weight: 15%)
  totalWeight += 15;
  if (apCount >= 6) safetyScore += 15;
  else if (apCount >= 4) safetyScore += 11;
  else if (apCount >= 2) safetyScore += 7;
  else if (apCount >= 1) safetyScore += 4;

  // Normalize score
  const normalizedScore = totalWeight > 0 ? (safetyScore / totalWeight) * 100 : 50;

  if (normalizedScore >= 65) return "Safety";
  if (normalizedScore >= 40) return "Target";
  return "Reach";
}

// Improved fit score: balanced multi-factor (NOT SAT-dominated)
function calculateFitScore(
  college: any,
  queryField: string,
  gpa: number,
  apCount: number,
  major: string,
  email: string,
  userClubs: string[],
  userExtracurriculars: string[],
  userSports: string[],
  miles: number,
  vibeAnswers: Record<string, string>,
  rand: () => number,
  testOptional: boolean
): number {
  let score = 0;
  const maxScore = 100;

  // 1. Academic Profile (max 25 points)
  // GPA match (max 12)
  if (gpa >= 3.8) score += 12;
  else if (gpa >= 3.5) score += 9;
  else if (gpa >= 3.0) score += 6;
  else if (gpa >= 2.5) score += 3;
  
  // AP rigor (max 13)
  score += Math.min(apCount * 2, 13);

  // 2. Major Program Match (max 15 points)
  const programPct = college[queryField] || 0;
  if (programPct > 0.20) score += 15;
  else if (programPct > 0.10) score += 11;
  else if (programPct > 0.05) score += 7;
  else if (programPct > 0.02) score += 4;
  else score += 1;

  // 3. Distance preference (max 10 points)
  if (miles < 30) score += 10;
  else if (miles < 75) score += 8;
  else if (miles < 150) score += 6;
  else if (miles < 300) score += 4;
  else if (miles < 500) score += 2;
  else score += 1;

  // 4. Club-to-major alignment (max 12 points) — ONLY user's selected clubs
  const clubStr = userClubs.join(" ").toLowerCase();
  const m = major.toLowerCase();
  let clubMatch = 0;
  if ((m.includes("computer") || m.includes("tech")) && (clubStr.includes("programming") || clubStr.includes("robotics") || clubStr.includes("git") || clubStr.includes("stem") || clubStr.includes("game development"))) clubMatch += 4;
  if ((m.includes("bus") || m.includes("financ")) && (clubStr.includes("fbla") || clubStr.includes("women in business") || clubStr.includes("investment"))) clubMatch += 4;
  if ((m.includes("health") || m.includes("med") || m.includes("nurse")) && (clubStr.includes("healthcare") || clubStr.includes("red cross"))) clubMatch += 4;
  if ((m.includes("law") || m.includes("legal")) && (clubStr.includes("mock trial") || clubStr.includes("debate") || clubStr.includes("model united nations"))) clubMatch += 4;
  if (m.includes("engineer") && (clubStr.includes("robotics") || clubStr.includes("stem") || clubStr.includes("olympiad"))) clubMatch += 4;
  if ((m.includes("art") || m.includes("design") || m.includes("music")) && (clubStr.includes("art") || clubStr.includes("theatre") || clubStr.includes("music"))) clubMatch += 4;
  if ((m.includes("enviro") || m.includes("climate")) && (clubStr.includes("environmental") || clubStr.includes("climate") || clubStr.includes("green"))) clubMatch += 4;
  if ((m.includes("psych") || m.includes("social")) && (clubStr.includes("do something") || clubStr.includes("unicef"))) clubMatch += 3;
  if ((m.includes("english") || m.includes("writing") || m.includes("journal")) && (clubStr.includes("creative writing") || clubStr.includes("journalism") || clubStr.includes("english honor"))) clubMatch += 4;
  score += Math.min(clubMatch, 12);

  // 5. Extracurricular depth (max 8 points)
  const ecCount = userExtracurriculars.length + userSports.length;
  if (ecCount >= 6) score += 8;
  else if (ecCount >= 4) score += 6;
  else if (ecCount >= 2) score += 4;
  else if (ecCount >= 1) score += 2;

  // 6. Vibe matching (max 15 points)
  if (vibeAnswers && Object.keys(vibeAnswers).length > 0) {
    const enrollment = college['latest.student.size'] || 0;
    // Class size match
    if (vibeAnswers.classsize === 'small_class' && enrollment < 5000) score += 3;
    else if (vibeAnswers.classsize === 'large_class' && enrollment > 15000) score += 3;
    
    // Setting match
    if (vibeAnswers.setting === 'urban') score += 2;
    else if (vibeAnswers.setting === 'rural' && enrollment < 8000) score += 2;
    
    // Cost/prestige priority
    if (vibeAnswers.priority === 'value') {
      const cost = college['latest.cost.tuition.in_state'];
      if (cost && cost < 15000) score += 4;
      else if (cost && cost < 25000) score += 2;
    }
    if (vibeAnswers.priority === 'prestige') {
      const admRate = college['latest.admissions.admission_rate.overall'];
      if (admRate && admRate < 0.2) score += 4;
      else if (admRate && admRate < 0.4) score += 2;
    }

    // Weekend vibe
    if (vibeAnswers.weekend === 'big_sports' && enrollment > 20000) score += 2;
    if (vibeAnswers.weekend === 'local_culture' && enrollment < 10000) score += 2;

    // Climate
    const coldStates = ['ME','VT','NH','MN','WI','MI','MT','ND','SD','WY','AK'];
    const warmStates = ['FL','CA','AZ','TX','HI','NM','LA','MS','AL','GA','SC'];
    const schoolState = college['school.state'] || '';
    if (vibeAnswers.climate === 'cold_ok' && coldStates.includes(schoolState)) score += 2;
    if (vibeAnswers.climate === 'warm_pref' && warmStates.includes(schoolState)) score += 2;
  } else {
    // No vibe answers: give neutral 7 points
    score += 7;
  }

  // 7. SAT match bonus (max 10 points) — only if not test-optional
  if (!testOptional) {
    const userSat = college._userSat || 0;
    const satAvg = college['latest.admissions.sat_scores.average.overall'] || null;
    if (userSat > 0 && satAvg) {
      const diff = userSat - satAvg;
      if (diff >= 150) score += 10;
      else if (diff >= 50) score += 8;
      else if (diff >= 0) score += 6;
      else if (diff >= -50) score += 4;
      else if (diff >= -100) score += 2;
    } else {
      score += 5; // neutral if no SAT data
    }
  } else {
    score += 5; // neutral for test-optional students
  }

  // 8. Small randomness for variety (max 5)
  score += 1 + rand() * 4;

  // Normalize to percentage, clamp 70-99
  const pct = Math.round((score / maxScore) * 100);
  return Math.min(99, Math.max(70, pct));
}

export interface SearchFilters {
  distance: number;
  sizeFilter: string;
  maxCost: number;
  tuitionType: "out_of_state" | "in_state";
  stateFilter: string;
  tierFilter?: string; // "all" | "safety" | "target" | "reach" | "safety_target"
  searchQuery?: string; // search by college name
}

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
  testOptional: boolean = false
): Promise<CollegeResult[]> {
  const queryField = getMajorField(major);
  const majorLabel = getMajorLabel(major);
  const originLat = userLat ?? ERHS_COORDS.lat;
  const originLon = userLon ?? ERHS_COORDS.lon;

  const fields = [
    "id",
    "school.name", "school.city", "school.state", "school.school_url",
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

  let url = `https://api.data.gov/ed/collegescorecard/v1/schools.json?api_key=${API_KEY}&school.operating=1&school.degrees_awarded.predominant=3&fields=${fields}&per_page=100&sort=latest.admissions.admission_rate.overall:asc`;

  if (filters.stateFilter === "maryland") {
    url += "&school.state=MD";
  }

  // Name search support
  if (filters.searchQuery && filters.searchQuery.trim().length > 1) {
    url += `&school.name=${encodeURIComponent(filters.searchQuery.trim())}`;
  }

  const resp = await fetch(url);
  if (!resp.ok) throw new Error("API error");
  const data = await resp.json();
  if (!data.results) return [];

  const gpaNum = parseFloat(gpa) || 3.0;
  const userSat = parseInt(sat) || 0;
  const seed = hashSeed(email + major + gpa);
  const rand = seededRandom(seed);

  return data.results
    .map((c: any) => {
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

      // Inject userSat for fit score calculation
      c._userSat = userSat;

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
        url: c['school.school_url']?.includes('http') ? c['school.school_url'] : 'https://' + c['school.school_url'],
        miles,
        majorPercentage: programPct,
        majorLabel,
        fitScore: calculateFitScore(c, queryField, gpaNum, aps.length, major, email, clubs, extracurriculars, sports, miles, vibeAnswers, rand, testOptional),
        size,
        enrollment,
        costInState,
        costOutState,
        admissionRate: admRate,
        satAvg,
        tier: getTier(satAvg, admRate, userSat, gpaNum, aps.length, testOptional),
        id: String(c['id'] || c['school.name']),
        demographics,
      };
    })
    .filter((c: CollegeResult | null) => {
      if (!c) return false;
      if (filters.distance > 0 && c.miles > filters.distance) return false;
      if (filters.sizeFilter !== "all") {
        const sizeKey = c.size.toLowerCase().replace(" ", "");
        if (sizeKey !== filters.sizeFilter) return false;
      }
      if (filters.maxCost > 0) {
        const cost = filters.tuitionType === "in_state" ? c.costInState : c.costOutState;
        if (cost && cost > filters.maxCost) return false;
      }
      if (filters.stateFilter === "out_of_state" && c.state === "MD") return false;
      // Tier filter
      if (filters.tierFilter && filters.tierFilter !== "all") {
        if (filters.tierFilter === "safety_target" && c.tier === "Reach") return false;
        if (filters.tierFilter === "safety" && c.tier !== "Safety") return false;
        if (filters.tierFilter === "target" && c.tier !== "Target") return false;
        if (filters.tierFilter === "reach" && c.tier !== "Reach") return false;
      }
      return true;
    })
    .sort((a: CollegeResult, b: CollegeResult) => b.fitScore - a.fitScore);
}

export interface CareerMatch {
  title: string;
  description: string;
  salaryRange: string;
  growth: string;
  searchLink: string;
  relatedClubs: string[];
  whyForYou: string; // personalized reason
}

// Career matches based on ALL available portfolio data
export function getCareerMatches(
  major: string,
  aps: string[],
  clubs: string[],
  sports: string[],
  isST: boolean,
  extracurriculars: string[] = [],
  gpa: string = "",
  achievements: string[] = []
): CareerMatch[] {
  const m = major.toLowerCase();
  const clubStr = clubs.join(" ").toLowerCase();
  const ecStr = extracurriculars.join(" ").toLowerCase();
  const sportStr = sports.join(" ").toLowerCase();
  const achieveStr = achievements.join(" ").toLowerCase();
  const apStr = aps.join(" ").toLowerCase();
  const careers: CareerMatch[] = [];

  const filterRelated = (related: string[]) => related.filter(r => clubs.some(c => c.toLowerCase().includes(r.toLowerCase()) || r.toLowerCase().includes(c.toLowerCase())));

  const buildWhy = (reasons: string[]) => reasons.filter(Boolean).join(". ") + ".";

  // CS / Tech
  if (m.includes("computer") || m.includes("tech") || m.includes("software") || m.includes("it") ||
      aps.includes("AP Computer Science A") || aps.includes("AP Computer Science Principles") ||
      clubStr.includes("programming") || clubStr.includes("git") || clubStr.includes("game development")) {
    const why: string[] = [];
    if (m.includes("computer") || m.includes("tech")) why.push(`Your major interest in ${major} aligns directly`);
    if (aps.includes("AP Computer Science A")) why.push("Your AP CS A background shows coding readiness");
    if (clubStr.includes("programming")) why.push("Programming Club builds real project experience");
    if (clubStr.includes("robotics")) why.push("VEX Robotics gives you hardware+software skills");
    
    careers.push(
      { title: "Software Engineer", description: "Design and build applications and systems", salaryRange: "$85K - $150K+", growth: "25% (Much faster than avg)", searchLink: "https://www.linkedin.com/jobs/search/?keywords=software%20engineer", relatedClubs: filterRelated(["Programming Club", "Get Into Tech Club (GIT)", "Game Development Club"]), whyForYou: buildWhy(why) },
      { title: "Data Scientist", description: "Analyze complex data to help organizations make decisions", salaryRange: "$95K - $140K", growth: "35% (Much faster than avg)", searchLink: "https://www.indeed.com/jobs?q=data+scientist", relatedClubs: filterRelated(["Math Club", "Programming Club", "Science Olympiad Team"]), whyForYou: buildWhy([...why, aps.includes("AP Statistics") ? "AP Statistics gives you a strong data foundation" : ""]) },
      { title: "Cybersecurity Analyst", description: "Protect computer systems and networks", salaryRange: "$75K - $120K", growth: "33% (Much faster than avg)", searchLink: "https://www.linkedin.com/jobs/search/?keywords=cybersecurity", relatedClubs: filterRelated(["Programming Club", "Get Into Tech Club (GIT)"]), whyForYou: buildWhy(why) },
    );
  }

  // Healthcare / Bio
  if (m.includes("nurse") || m.includes("health") || m.includes("med") || m.includes("bio") ||
      aps.includes("AP Biology") || aps.includes("AP Chemistry") || aps.includes("AP Environmental Science") ||
      clubStr.includes("healthcare") || clubStr.includes("red cross")) {
    const why: string[] = [];
    if (m.includes("health") || m.includes("med") || m.includes("nurse")) why.push(`Your interest in ${major} is a direct match`);
    if (aps.includes("AP Biology")) why.push("AP Biology provides essential pre-med knowledge");
    if (aps.includes("AP Chemistry")) why.push("AP Chemistry strengthens your science foundation");
    if (clubStr.includes("healthcare")) why.push("Future Healthcare Professionals gives you field exposure");
    if (ecStr.includes("volunteer") || ecStr.includes("hospital")) why.push("Your healthcare volunteering shows commitment");

    careers.push(
      { title: "Registered Nurse", description: "Provide patient care in hospitals and clinics", salaryRange: "$60K - $95K", growth: "6% (Faster than avg)", searchLink: "https://www.indeed.com/jobs?q=registered+nurse", relatedClubs: filterRelated(["Future Healthcare Professionals", "Red Cross Club"]), whyForYou: buildWhy(why) },
      { title: "Physician Assistant", description: "Diagnose illness and develop treatment plans", salaryRange: "$95K - $130K", growth: "28% (Much faster than avg)", searchLink: "https://www.glassdoor.com/Job/physician-assistant-jobs-SRCH_KO0,19.htm", relatedClubs: filterRelated(["Future Healthcare Professionals", "Science National Honor Society"]), whyForYou: buildWhy(why) },
      { title: "Biomedical Engineer", description: "Design medical devices and equipment", salaryRange: "$70K - $110K", growth: "10% (Faster than avg)", searchLink: "https://www.linkedin.com/jobs/search/?keywords=biomedical%20engineer", relatedClubs: filterRelated(["VEX Robotics", "WErSTEM", "Science Olympiad Team"]), whyForYou: buildWhy([...why, isST ? "Your S/T program background is ideal for biomedical engineering" : ""]) },
    );
  }

  // Business
  if (m.includes("bus") || m.includes("financ") || m.includes("account") || m.includes("econ") ||
      clubStr.includes("fbla") || clubStr.includes("women in business") || clubStr.includes("investment")) {
    const why: string[] = [];
    if (m.includes("bus") || m.includes("financ")) why.push(`Your interest in ${major} maps directly to this career`);
    if (clubStr.includes("fbla")) why.push("FBLA competitions build real business skills");
    if (clubStr.includes("investment")) why.push("Investment Club shows financial market interest");
    if (clubStr.includes("women in business")) why.push("Women in Business expands your professional network");

    careers.push(
      { title: "Financial Analyst", description: "Guide businesses and individuals on investment decisions", salaryRange: "$65K - $110K", growth: "9% (Faster than avg)", searchLink: "https://www.linkedin.com/jobs/search/?keywords=financial%20analyst", relatedClubs: filterRelated(["FBLA - Future Business Leaders of America", "Women in Business", "Investment Club"]), whyForYou: buildWhy(why) },
      { title: "Marketing Manager", description: "Plan campaigns to generate interest in products", salaryRange: "$70K - $130K", growth: "10% (Faster than avg)", searchLink: "https://www.indeed.com/jobs?q=marketing+manager", relatedClubs: filterRelated(["FBLA - Future Business Leaders of America", "Women in Business", "Media Club"]), whyForYou: buildWhy(why) },
      { title: "Investment Banker", description: "Help companies raise capital and manage mergers", salaryRange: "$85K - $200K+", growth: "7% (As fast as avg)", searchLink: "https://www.linkedin.com/jobs/search/?keywords=investment+banking", relatedClubs: filterRelated(["Investment Club", "FBLA - Future Business Leaders of America", "Math Honor Society"]), whyForYou: buildWhy(why) },
    );
  }

  // Engineering
  if (m.includes("engineer") || aps.includes("AP Physics") || aps.includes("AP Calculus BC") || aps.includes("AP Precalculus") ||
      clubStr.includes("robotics") || clubStr.includes("werstem")) {
    const why: string[] = [];
    if (m.includes("engineer")) why.push(`Your ${major} interest is a direct path`);
    if (aps.includes("AP Physics")) why.push("AP Physics builds core engineering knowledge");
    if (aps.includes("AP Calculus BC")) why.push("AP Calc BC demonstrates advanced math readiness");
    if (clubStr.includes("robotics")) why.push("VEX Robotics gives hands-on engineering experience");
    if (isST) why.push("Your S/T program gives you an engineering edge");

    careers.push(
      { title: "Mechanical Engineer", description: "Design and build mechanical systems", salaryRange: "$70K - $115K", growth: "7% (As fast as avg)", searchLink: "https://www.linkedin.com/jobs/search/?keywords=mechanical%20engineer", relatedClubs: filterRelated(["VEX Robotics", "WErSTEM"]), whyForYou: buildWhy(why) },
      { title: "Civil Engineer", description: "Design infrastructure projects", salaryRange: "$65K - $105K", growth: "7% (As fast as avg)", searchLink: "https://www.indeed.com/jobs?q=civil+engineer", relatedClubs: filterRelated(["WErSTEM", "Math Club"]), whyForYou: buildWhy(why) },
      { title: "Electrical Engineer", description: "Design electrical systems and equipment", salaryRange: "$75K - $120K", growth: "7% (As fast as avg)", searchLink: "https://www.linkedin.com/jobs/search/?keywords=electrical%20engineer", relatedClubs: filterRelated(["VEX Robotics", "Get Into Tech Club (GIT)"]), whyForYou: buildWhy(why) },
    );
  }

  // Law / Gov
  if (m.includes("law") || m.includes("legal") || aps.includes("AP US History") || aps.includes("AP Comparative Government and Politics") ||
      aps.includes("AP US Government and Politics") ||
      clubStr.includes("mock trial") || clubStr.includes("debate") || clubStr.includes("model united nations")) {
    const why: string[] = [];
    if (m.includes("law")) why.push("Your legal interest directly matches");
    if (clubStr.includes("mock trial")) why.push("Mock Trial gives courtroom simulation experience");
    if (clubStr.includes("debate")) why.push("Debate Club builds argument and persuasion skills");
    if (aps.includes("AP US Government and Politics")) why.push("AP Gov provides civic foundation");

    careers.push(
      { title: "Attorney", description: "Advise and represent clients in legal matters", salaryRange: "$80K - $160K+", growth: "10% (Faster than avg)", searchLink: "https://www.linkedin.com/jobs/search/?keywords=attorney", relatedClubs: filterRelated(["ERHS Mock Trial", "Debate Club", "Model United Nations (MUN)"]), whyForYou: buildWhy(why) },
      { title: "Diplomat / Foreign Service", description: "Represent national interests abroad", salaryRange: "$60K - $120K", growth: "5% (Average)", searchLink: "https://www.indeed.com/jobs?q=foreign+service", relatedClubs: filterRelated(["Model United Nations (MUN)", "International Club"]), whyForYou: buildWhy(why) },
      { title: "Policy Analyst", description: "Research and analyze policies for government", salaryRange: "$55K - $95K", growth: "8% (Faster than avg)", searchLink: "https://www.indeed.com/jobs?q=policy+analyst", relatedClubs: filterRelated(["Debate Club", "Seminar Club", "UNICEF Club"]), whyForYou: buildWhy(why) },
    );
  }

  // Arts
  if (m.includes("art") || m.includes("design") || m.includes("music") || aps.includes("AP Art & Design") || aps.includes("AP Studio Art 2D") ||
      clubStr.includes("art club") || clubStr.includes("theatre") || clubStr.includes("music")) {
    const why: string[] = [];
    if (m.includes("art") || m.includes("design")) why.push(`Your ${major} passion is the foundation`);
    if (aps.includes("AP Art & Design") || aps.includes("AP Studio Art 2D")) why.push("AP Art shows portfolio-level skill");
    if (clubStr.includes("theatre")) why.push("Theatre Club demonstrates creative range");
    if (clubStr.includes("music")) why.push("Music involvement shows artistic depth");

    careers.push(
      { title: "Graphic Designer", description: "Create visual concepts for media", salaryRange: "$40K - $75K", growth: "3% (Slower than avg)", searchLink: "https://www.indeed.com/jobs?q=graphic+designer", relatedClubs: filterRelated(["Art Club", "Fiber Arts Club", "Media Club"]), whyForYou: buildWhy(why) },
      { title: "UX Designer", description: "Design user experiences for digital products", salaryRange: "$70K - $120K", growth: "16% (Much faster than avg)", searchLink: "https://www.linkedin.com/jobs/search/?keywords=UX%20designer", relatedClubs: filterRelated(["Art Club", "Programming Club", "Media Club"]), whyForYou: buildWhy(why) },
    );
  }

  // Environment
  if (m.includes("enviro") || m.includes("climate") || m.includes("sustain") ||
      clubStr.includes("environmental") || clubStr.includes("climate") || clubStr.includes("green")) {
    const why: string[] = [];
    if (m.includes("enviro")) why.push("Your environmental interest directly aligns");
    if (clubStr.includes("environmental") || clubStr.includes("climate")) why.push("Your environmental clubs show real commitment");
    if (aps.includes("AP Environmental Science")) why.push("AP Environmental Science provides scientific grounding");

    careers.push(
      { title: "Environmental Scientist", description: "Protect the environment through research", salaryRange: "$55K - $95K", growth: "6% (As fast as avg)", searchLink: "https://www.indeed.com/jobs?q=environmental+scientist", relatedClubs: filterRelated(["Environmental Defense Club", "Youth Climate Institute / Green Schools", "Homegrown Heroes"]), whyForYou: buildWhy(why) },
    );
  }

  // Psychology
  if (m.includes("psych") || aps.includes("AP Psychology")) {
    const why: string[] = [];
    if (m.includes("psych")) why.push("Your psychology interest is the core match");
    if (aps.includes("AP Psychology")) why.push("AP Psychology provides foundational knowledge");

    careers.push(
      { title: "Clinical Psychologist", description: "Diagnose and treat mental health conditions", salaryRange: "$60K - $110K", growth: "6% (Faster than avg)", searchLink: "https://www.linkedin.com/jobs/search/?keywords=psychologist", relatedClubs: filterRelated(["Do Something Club", "UNICEF Club"]), whyForYou: buildWhy(why) },
      { title: "School Counselor", description: "Guide students through academic and personal challenges", salaryRange: "$50K - $80K", growth: "10% (Faster than avg)", searchLink: "https://www.indeed.com/jobs?q=school+counselor", relatedClubs: filterRelated(["National Honor Society", "Do Something Club"]), whyForYou: buildWhy(why) },
    );
  }

  // Education
  if (m.includes("education") || m.includes("teach")) {
    const why: string[] = [];
    why.push(`Your ${major} interest directly aligns with teaching`);
    if (ecStr.includes("tutor")) why.push("Your tutoring experience shows teaching aptitude");

    careers.push(
      { title: "High School Teacher", description: "Educate and inspire the next generation", salaryRange: "$45K - $75K", growth: "5% (Average)", searchLink: "https://www.indeed.com/jobs?q=high+school+teacher", relatedClubs: filterRelated(["ASL Club & Peer Tutoring", "National Honor Society"]), whyForYou: buildWhy(why) },
    );
  }

  // S/T fallback
  if (isST && careers.length === 0) {
    careers.push(
      { title: "Research Scientist", description: "Conduct research in STEM fields", salaryRange: "$65K - $120K", growth: "8% (Faster than avg)", searchLink: "https://www.linkedin.com/jobs/search/?keywords=research+scientist", relatedClubs: filterRelated(["Science Olympiad Team", "National STEM Honor Society (NSTEM)", "WErSTEM"]), whyForYou: "Your S/T program background makes you well-suited for research careers." },
      { title: "Engineer (General)", description: "Apply science and math to solve problems", salaryRange: "$70K - $130K", growth: "7% (As fast as avg)", searchLink: "https://www.indeed.com/jobs?q=engineer", relatedClubs: filterRelated(["VEX Robotics", "WErSTEM", "Get Into Tech Club (GIT)"]), whyForYou: "S/T students have advanced STEM skills perfect for engineering." },
    );
  }

  // Sports-related careers
  if (sports.length > 0 && (m.includes("sport") || m.includes("kinesi") || m.includes("athletic"))) {
    careers.push(
      { title: "Sports Medicine Physician", description: "Treat athletic injuries and promote fitness", salaryRange: "$80K - $150K", growth: "9% (Faster than avg)", searchLink: "https://www.indeed.com/jobs?q=sports+medicine", relatedClubs: filterRelated(["Future Healthcare Professionals"]), whyForYou: `Your experience in ${sports.length} sport(s) combined with health interest is ideal.` },
      { title: "Athletic Trainer", description: "Prevent and treat injuries for athletes", salaryRange: "$45K - $70K", growth: "17% (Much faster than avg)", searchLink: "https://www.indeed.com/jobs?q=athletic+trainer", relatedClubs: [], whyForYou: `Your ${sports.length} sport(s) background gives you firsthand athletic experience.` },
    );
  }

  // Journalism / Media — based on clubs
  if ((clubStr.includes("journalism") || clubStr.includes("media") || m.includes("journal") || m.includes("commun")) && 
      !careers.some(c => c.title.includes("Journalist"))) {
    careers.push(
      { title: "Journalist / Reporter", description: "Investigate and report on news stories", salaryRange: "$35K - $75K", growth: "3% (Slower than avg)", searchLink: "https://www.indeed.com/jobs?q=journalist", relatedClubs: filterRelated(["Journalism", "Media Club", "Media Production Team"]), whyForYou: "Your media and journalism involvement shows storytelling skills." },
    );
  }

  // If still no careers, give general suggestions based on strongest signals
  if (careers.length === 0) {
    careers.push(
      { title: "Project Manager", description: "Lead teams and coordinate complex projects", salaryRange: "$60K - $110K", growth: "7% (As fast as avg)", searchLink: "https://www.linkedin.com/jobs/search/?keywords=project+manager", relatedClubs: filterRelated(["National Honor Society"]), whyForYou: "Update your major and activities in your portfolio for more specific career matches." },
    );
  }

  return careers;
}
