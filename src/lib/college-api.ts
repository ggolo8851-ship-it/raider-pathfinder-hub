const API_KEY = 'T1nIiVJanrQqJgS1OmJ7UKh0NpxJdzX9bzCeFpXo';
const ERHS_COORDS = { lat: 38.9925, lon: -76.8743 };

function getDist(lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = (lat2 - ERHS_COORDS.lat) * Math.PI / 180;
  const dLon = (lon2 - ERHS_COORDS.lon) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(ERHS_COORDS.lat * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
}

function getSchoolSize(enrollment: number | null): string {
  if (!enrollment) return "Unknown";
  if (enrollment < 2000) return "Small";
  if (enrollment < 10000) return "Medium";
  if (enrollment < 25000) return "Large";
  return "Very Large";
}

function getTier(satAvg: number | null, admRate: number | null, userSat: number): "Safety" | "Target" | "Reach" {
  if (satAvg && userSat > 0) {
    if (userSat >= satAvg + 100) return "Safety";
    if (userSat >= satAvg - 50) return "Target";
    return "Reach";
  }
  if (admRate) {
    if (admRate > 0.6) return "Safety";
    if (admRate > 0.3) return "Target";
    return "Reach";
  }
  return "Target";
}

function calculateFitScore(
  college: any,
  queryField: string,
  gpa: number,
  apCount: number,
  major: string,
  email: string,
  clubs: string[],
  miles: number,
  rand: () => number
): number {
  let score = 75;
  score += Math.min(apCount * 2, 16);
  const programPct = college[queryField] || 0;
  if (programPct > 0.05) score += 3 + Math.min(programPct * 5, 5);
  if (gpa >= 3.5) score += 3;
  else if (gpa >= 3.0) score += 1;

  if (miles < 50) score += 4;
  else if (miles < 100) score += 3;
  else if (miles < 300) score += 2;
  else if (miles < 500) score += 1;

  const clubStr = clubs.join(" ").toLowerCase();
  const m = major.toLowerCase();
  if ((m.includes("computer") || m.includes("tech")) && (clubStr.includes("programming") || clubStr.includes("robotics") || clubStr.includes("git") || clubStr.includes("stem"))) score += 2;
  if ((m.includes("bus") || m.includes("financ")) && (clubStr.includes("fbla") || clubStr.includes("women in business") || clubStr.includes("investment"))) score += 2;
  if ((m.includes("health") || m.includes("med")) && clubStr.includes("healthcare")) score += 2;
  if ((m.includes("law") || m.includes("legal")) && (clubStr.includes("mock trial") || clubStr.includes("debate") || clubStr.includes("model united nations"))) score += 2;
  if (m.includes("engineer") && (clubStr.includes("robotics") || clubStr.includes("stem") || clubStr.includes("olympiad"))) score += 2;

  score += 1 + rand() * 4;
  return Math.min(99, Math.max(70, Math.round(score)));
}

export interface SearchFilters {
  distance: number; // 0 = no limit
  sizeFilter: string;
  maxCost: number;
  tuitionType: "out_of_state" | "in_state";
  stateFilter: string; // "all", "maryland", "out_of_state"
}

export async function searchColleges(
  major: string,
  filters: SearchFilters,
  email: string,
  gpa: string,
  aps: string[],
  clubs: string[],
  sat: string,
  act: string
): Promise<CollegeResult[]> {
  const queryField = getMajorField(major);
  const majorLabel = getMajorLabel(major);

  const fields = [
    "id",
    "school.name", "school.city", "school.state", "school.school_url",
    "location.lat", "location.lon", queryField,
    "latest.student.size",
    "latest.cost.tuition.in_state", "latest.cost.tuition.out_of_state",
    "latest.admissions.admission_rate.overall",
    "latest.admissions.sat_scores.average.overall"
  ].join(",");

  let url = `https://api.data.gov/ed/collegescorecard/v1/schools.json?api_key=${API_KEY}&school.operating=1&school.degrees_awarded.predominant=3&fields=${fields}&per_page=100&sort=latest.admissions.admission_rate.overall:asc`;

  // Add state filter to API query
  if (filters.stateFilter === "maryland") {
    url += "&school.state=MD";
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
      const miles = getDist(lat, lon);
      const enrollment = c['latest.student.size'] || null;
      const size = getSchoolSize(enrollment);
      const costInState = c['latest.cost.tuition.in_state'] || null;
      const costOutState = c['latest.cost.tuition.out_of_state'] || null;
      const admRate = c['latest.admissions.admission_rate.overall'] || null;
      const satAvg = c['latest.admissions.sat_scores.average.overall'] || null;
      const programPct = c[queryField] || 0;

      return {
        name: c['school.name'],
        city: c['school.city'],
        state: c['school.state'],
        url: c['school.school_url']?.includes('http') ? c['school.school_url'] : 'https://' + c['school.school_url'],
        miles,
        majorPercentage: programPct,
        majorLabel,
        fitScore: calculateFitScore(c, queryField, gpaNum, aps.length, major, email, clubs, miles, rand),
        size,
        enrollment,
        costInState,
        costOutState,
        admissionRate: admRate,
        satAvg,
        tier: getTier(satAvg, admRate, userSat),
        id: String(c['id'] || c['school.name']),
      };
    })
    .filter((c: CollegeResult | null) => {
      if (!c) return false;
      // Distance: 0 means no limit
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
}

export function getCareerMatches(major: string, aps: string[], clubs: string[], sports: string[], isST: boolean): CareerMatch[] {
  const m = major.toLowerCase();
  const clubStr = clubs.join(" ").toLowerCase();
  const sportStr = sports.join(" ").toLowerCase();
  const careers: CareerMatch[] = [];

  if (m.includes("computer") || m.includes("tech") || m.includes("software") || m.includes("it") ||
      aps.includes("AP Computer Science A") || aps.includes("AP Computer Science Principles") ||
      clubStr.includes("programming") || clubStr.includes("git") || clubStr.includes("game development")) {
    careers.push(
      { title: "Software Engineer", description: "Design and build applications and systems", salaryRange: "$85K - $150K+", growth: "25% (Much faster than avg)", searchLink: "https://www.linkedin.com/jobs/search/?keywords=software%20engineer", relatedClubs: ["Programming Club", "Get Into Tech Club (GIT)", "Game Development Club"] },
      { title: "Data Scientist", description: "Analyze complex data to help organizations make decisions", salaryRange: "$95K - $140K", growth: "35% (Much faster than avg)", searchLink: "https://www.indeed.com/jobs?q=data+scientist", relatedClubs: ["Math Club", "Programming Club", "Science Olympiad Team"] },
      { title: "Cybersecurity Analyst", description: "Protect computer systems and networks", salaryRange: "$75K - $120K", growth: "33% (Much faster than avg)", searchLink: "https://www.linkedin.com/jobs/search/?keywords=cybersecurity", relatedClubs: ["Programming Club", "Get Into Tech Club (GIT)"] },
    );
  }
  if (m.includes("nurse") || m.includes("health") || m.includes("med") || m.includes("bio") ||
      aps.includes("AP Biology") || aps.includes("AP Chemistry") || aps.includes("AP Environmental Science") ||
      clubStr.includes("healthcare") || clubStr.includes("red cross")) {
    careers.push(
      { title: "Registered Nurse", description: "Provide patient care in hospitals and clinics", salaryRange: "$60K - $95K", growth: "6% (Faster than avg)", searchLink: "https://www.indeed.com/jobs?q=registered+nurse", relatedClubs: ["Future Healthcare Professionals", "Red Cross Club"] },
      { title: "Physician Assistant", description: "Diagnose illness and develop treatment plans", salaryRange: "$95K - $130K", growth: "28% (Much faster than avg)", searchLink: "https://www.glassdoor.com/Job/physician-assistant-jobs-SRCH_KO0,19.htm", relatedClubs: ["Future Healthcare Professionals", "Science National Honor Society"] },
      { title: "Biomedical Engineer", description: "Design medical devices and equipment", salaryRange: "$70K - $110K", growth: "10% (Faster than avg)", searchLink: "https://www.linkedin.com/jobs/search/?keywords=biomedical%20engineer", relatedClubs: ["VEX Robotics", "WErSTEM", "Science Olympiad Team"] },
    );
  }
  if (m.includes("bus") || m.includes("financ") || m.includes("account") || m.includes("econ") ||
      clubStr.includes("fbla") || clubStr.includes("women in business") || clubStr.includes("investment")) {
    careers.push(
      { title: "Financial Analyst", description: "Guide businesses and individuals on investment decisions", salaryRange: "$65K - $110K", growth: "9% (Faster than avg)", searchLink: "https://www.linkedin.com/jobs/search/?keywords=financial%20analyst", relatedClubs: ["FBLA", "Women in Business", "Investment Club"] },
      { title: "Marketing Manager", description: "Plan campaigns to generate interest in products", salaryRange: "$70K - $130K", growth: "10% (Faster than avg)", searchLink: "https://www.indeed.com/jobs?q=marketing+manager", relatedClubs: ["FBLA", "Women in Business", "Media Club"] },
      { title: "Investment Banker", description: "Help companies raise capital and manage mergers", salaryRange: "$85K - $200K+", growth: "7% (As fast as avg)", searchLink: "https://www.linkedin.com/jobs/search/?keywords=investment+banking", relatedClubs: ["Investment Club", "FBLA", "Math Honor Society"] },
    );
  }
  if (m.includes("engineer") || aps.includes("AP Physics") || aps.includes("AP Calculus BC") || aps.includes("AP Precalculus") ||
      clubStr.includes("robotics") || clubStr.includes("werstem")) {
    careers.push(
      { title: "Mechanical Engineer", description: "Design and build mechanical systems", salaryRange: "$70K - $115K", growth: "7% (As fast as avg)", searchLink: "https://www.linkedin.com/jobs/search/?keywords=mechanical%20engineer", relatedClubs: ["VEX Robotics", "WErSTEM"] },
      { title: "Civil Engineer", description: "Design infrastructure projects", salaryRange: "$65K - $105K", growth: "7% (As fast as avg)", searchLink: "https://www.indeed.com/jobs?q=civil+engineer", relatedClubs: ["WErSTEM", "Math Club"] },
      { title: "Electrical Engineer", description: "Design electrical systems and equipment", salaryRange: "$75K - $120K", growth: "7% (As fast as avg)", searchLink: "https://www.linkedin.com/jobs/search/?keywords=electrical%20engineer", relatedClubs: ["VEX Robotics", "Get Into Tech Club (GIT)"] },
    );
  }
  if (m.includes("law") || m.includes("legal") || aps.includes("AP US History") || aps.includes("AP Comparative Government and Politics") ||
      aps.includes("AP US Government and Politics") ||
      clubStr.includes("mock trial") || clubStr.includes("debate") || clubStr.includes("model united nations")) {
    careers.push(
      { title: "Attorney", description: "Advise and represent clients in legal matters", salaryRange: "$80K - $160K+", growth: "10% (Faster than avg)", searchLink: "https://www.linkedin.com/jobs/search/?keywords=attorney", relatedClubs: ["ERHS Mock Trial", "Debate Club", "Model United Nations (MUN)"] },
      { title: "Diplomat / Foreign Service", description: "Represent national interests abroad", salaryRange: "$60K - $120K", growth: "5% (Average)", searchLink: "https://www.indeed.com/jobs?q=foreign+service", relatedClubs: ["Model United Nations (MUN)", "International Club"] },
      { title: "Policy Analyst", description: "Research and analyze policies for government", salaryRange: "$55K - $95K", growth: "8% (Faster than avg)", searchLink: "https://www.indeed.com/jobs?q=policy+analyst", relatedClubs: ["Debate Club", "Seminar Club", "UNICEF Club"] },
    );
  }
  if (m.includes("art") || m.includes("design") || m.includes("music") || aps.includes("AP Art & Design") ||
      clubStr.includes("art club") || clubStr.includes("theatre") || clubStr.includes("music")) {
    careers.push(
      { title: "Graphic Designer", description: "Create visual concepts for media", salaryRange: "$40K - $75K", growth: "3% (Slower than avg)", searchLink: "https://www.indeed.com/jobs?q=graphic+designer", relatedClubs: ["Art Club", "Fiber Arts Club", "Media Club"] },
      { title: "UX Designer", description: "Design user experiences for digital products", salaryRange: "$70K - $120K", growth: "16% (Much faster than avg)", searchLink: "https://www.linkedin.com/jobs/search/?keywords=UX%20designer", relatedClubs: ["Art Club", "Programming Club", "Media Club"] },
    );
  }
  if (m.includes("enviro") || m.includes("climate") || m.includes("sustain") ||
      clubStr.includes("environmental") || clubStr.includes("climate") || clubStr.includes("green")) {
    careers.push(
      { title: "Environmental Scientist", description: "Protect the environment through research", salaryRange: "$55K - $95K", growth: "6% (As fast as avg)", searchLink: "https://www.indeed.com/jobs?q=environmental+scientist", relatedClubs: ["Environmental Defense Club", "Youth Climate Institute / Green Schools", "Homegrown Heroes"] },
    );
  }
  // S/T program boost
  if (isST && careers.length === 0) {
    careers.push(
      { title: "Research Scientist", description: "Conduct research in STEM fields", salaryRange: "$65K - $120K", growth: "8% (Faster than avg)", searchLink: "https://www.linkedin.com/jobs/search/?keywords=research+scientist", relatedClubs: ["Science Olympiad Team", "National STEM Honor Society (NSTEM)", "WErSTEM"] },
      { title: "Engineer (General)", description: "Apply science and math to solve problems", salaryRange: "$70K - $130K", growth: "7% (As fast as avg)", searchLink: "https://www.indeed.com/jobs?q=engineer", relatedClubs: ["VEX Robotics", "WErSTEM", "Get Into Tech Club (GIT)"] },
    );
  }
  // Sports-related careers
  if (sportStr.length > 0 && (m.includes("sport") || m.includes("kinesi") || m.includes("athletic"))) {
    careers.push(
      { title: "Sports Medicine Physician", description: "Treat athletic injuries and promote fitness", salaryRange: "$80K - $150K", growth: "9% (Faster than avg)", searchLink: "https://www.indeed.com/jobs?q=sports+medicine", relatedClubs: ["Future Healthcare Professionals"] },
      { title: "Athletic Trainer", description: "Prevent and treat injuries for athletes", salaryRange: "$45K - $70K", growth: "17% (Much faster than avg)", searchLink: "https://www.indeed.com/jobs?q=athletic+trainer", relatedClubs: [] },
    );
  }

  return careers;
}
