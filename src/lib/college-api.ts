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
  if (m.includes("bus") || m.includes("financ") || m.includes("account")) return "latest.academics.program_percentage.business_marketing";
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

export interface CollegeResult {
  name: string;
  city: string;
  state: string;
  url: string;
  miles: number;
  majorPercentage: number;
  fitScore: number;
  size: string;
  costPerYear: number | null;
}

function getSchoolSize(enrollment: number | null): string {
  if (!enrollment) return "Unknown";
  if (enrollment < 2000) return "Small";
  if (enrollment < 10000) return "Medium";
  if (enrollment < 25000) return "Large";
  return "Very Large";
}

function calculateFitScore(
  college: any,
  queryField: string,
  gpa: number,
  apCount: number,
  major: string,
  email: string,
  clubs: string[],
  rand: () => number
): number {
  // Base score 75%
  let score = 75;

  // AP Bonus: +2% per AP
  score += apCount * 2;

  // Subject Alignment: +3-5% if college has program match
  const programPct = college[queryField] || 0;
  if (programPct > 0.05) score += 3 + programPct * 2;

  // GPA scaling (higher GPA = better match with selective schools)
  if (gpa >= 3.5) score += 3;
  else if (gpa >= 3.0) score += 1;

  // Club alignment bonus
  const clubStr = clubs.join(" ").toLowerCase();
  const m = major.toLowerCase();
  if ((m.includes("computer") || m.includes("tech")) && (clubStr.includes("programming") || clubStr.includes("robotics") || clubStr.includes("git") || clubStr.includes("stem"))) score += 2;
  if ((m.includes("bus") || m.includes("financ")) && (clubStr.includes("fbla") || clubStr.includes("women in business"))) score += 2;
  if ((m.includes("health") || m.includes("med")) && clubStr.includes("healthcare")) score += 2;
  if ((m.includes("law") || m.includes("legal")) && (clubStr.includes("mock trial") || clubStr.includes("debate"))) score += 2;
  if ((m.includes("engineer")) && (clubStr.includes("robotics") || clubStr.includes("stem") || clubStr.includes("olympiad"))) score += 2;

  // Random variance 1-5% (seeded per user)
  score += 1 + rand() * 4;

  return Math.min(99, Math.max(70, Math.round(score)));
}

export interface SearchFilters {
  distance: number;
  sizeFilter: string;
  maxCost: number;
}

export async function searchColleges(
  major: string,
  filters: SearchFilters,
  email: string,
  gpa: string,
  aps: string[],
  clubs: string[]
): Promise<CollegeResult[]> {
  const queryField = getMajorField(major);
  const fields = [
    "school.name", "school.city", "school.state", "school.school_url",
    "location.lat", "location.lon", queryField,
    "latest.student.size", "latest.cost.tuition.in_state",
    "latest.cost.tuition.out_of_state"
  ].join(",");

  const url = `https://api.data.gov/ed/collegescorecard/v1/schools.json?api_key=${API_KEY}&${queryField}__range=0.01..1&school.operating=1&fields=${fields}&per_page=100`;

  const resp = await fetch(url);
  const data = await resp.json();

  if (!data.results) return [];

  const gpaNum = parseFloat(gpa) || 3.0;
  const seed = hashSeed(email + major + gpa);
  const rand = seededRandom(seed);

  return data.results
    .map((c: any) => {
      const miles = getDist(c['location.lat'], c['location.lon']);
      const enrollment = c['latest.student.size'] || null;
      const size = getSchoolSize(enrollment);
      const costPerYear = c['latest.cost.tuition.out_of_state'] || c['latest.cost.tuition.in_state'] || null;

      return {
        name: c['school.name'],
        city: c['school.city'],
        state: c['school.state'],
        url: c['school.school_url']?.includes('http') ? c['school.school_url'] : 'https://' + c['school.school_url'],
        miles,
        majorPercentage: c[queryField] || 0,
        fitScore: calculateFitScore(c, queryField, gpaNum, aps.length, major, email, clubs, rand),
        size,
        costPerYear,
      };
    })
    .filter((c: CollegeResult) => {
      if (c.miles > filters.distance) return false;
      if (filters.sizeFilter !== "all" && c.size.toLowerCase().replace(" ", "") !== filters.sizeFilter) return false;
      if (filters.maxCost > 0 && c.costPerYear && c.costPerYear > filters.maxCost) return false;
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
}

export function getCareerMatches(major: string, aps: string[], clubs: string[]): CareerMatch[] {
  const m = major.toLowerCase();
  const clubStr = clubs.join(" ").toLowerCase();
  const careers: CareerMatch[] = [];

  if (m.includes("computer") || m.includes("tech") || m.includes("software") || m.includes("it") ||
      aps.includes("AP Computer Science A") || aps.includes("AP Computer Science Principles") ||
      clubStr.includes("programming") || clubStr.includes("git") || clubStr.includes("game development")) {
    careers.push(
      { title: "Software Engineer", description: "Design and build applications and systems", salaryRange: "$85K - $150K+", growth: "25% (Much faster than avg)", searchLink: "https://www.linkedin.com/jobs/search/?keywords=software%20engineer" },
      { title: "Data Scientist", description: "Analyze complex data to help organizations make decisions", salaryRange: "$95K - $140K", growth: "35% (Much faster than avg)", searchLink: "https://www.indeed.com/jobs?q=data+scientist" },
      { title: "Cybersecurity Analyst", description: "Protect computer systems and networks", salaryRange: "$75K - $120K", growth: "33% (Much faster than avg)", searchLink: "https://www.linkedin.com/jobs/search/?keywords=cybersecurity" },
    );
  }
  if (m.includes("nurse") || m.includes("health") || m.includes("med") || m.includes("bio") ||
      aps.includes("AP Biology") || aps.includes("AP Chemistry") || aps.includes("AP Environmental Science") ||
      clubStr.includes("healthcare") || clubStr.includes("red cross")) {
    careers.push(
      { title: "Registered Nurse", description: "Provide patient care in hospitals and clinics", salaryRange: "$60K - $95K", growth: "6% (Faster than avg)", searchLink: "https://www.indeed.com/jobs?q=registered+nurse" },
      { title: "Physician Assistant", description: "Diagnose illness and develop treatment plans", salaryRange: "$95K - $130K", growth: "28% (Much faster than avg)", searchLink: "https://www.glassdoor.com/Job/physician-assistant-jobs-SRCH_KO0,19.htm" },
      { title: "Biomedical Engineer", description: "Design medical devices and equipment", salaryRange: "$70K - $110K", growth: "10% (Faster than avg)", searchLink: "https://www.linkedin.com/jobs/search/?keywords=biomedical%20engineer" },
    );
  }
  if (m.includes("bus") || m.includes("financ") || m.includes("account") || m.includes("econ") ||
      clubStr.includes("fbla") || clubStr.includes("women in business")) {
    careers.push(
      { title: "Financial Analyst", description: "Guide businesses and individuals on investment decisions", salaryRange: "$65K - $110K", growth: "9% (Faster than avg)", searchLink: "https://www.linkedin.com/jobs/search/?keywords=financial%20analyst" },
      { title: "Marketing Manager", description: "Plan campaigns to generate interest in products", salaryRange: "$70K - $130K", growth: "10% (Faster than avg)", searchLink: "https://www.indeed.com/jobs?q=marketing+manager" },
      { title: "Accountant", description: "Prepare and examine financial records", salaryRange: "$55K - $90K", growth: "6% (As fast as avg)", searchLink: "https://www.indeed.com/jobs?q=accountant" },
    );
  }
  if (m.includes("engineer") || aps.includes("AP Physics") || aps.includes("AP Calculus BC") ||
      clubStr.includes("robotics") || clubStr.includes("werstem")) {
    careers.push(
      { title: "Mechanical Engineer", description: "Design and build mechanical systems", salaryRange: "$70K - $115K", growth: "7% (As fast as avg)", searchLink: "https://www.linkedin.com/jobs/search/?keywords=mechanical%20engineer" },
      { title: "Civil Engineer", description: "Design infrastructure projects", salaryRange: "$65K - $105K", growth: "7% (As fast as avg)", searchLink: "https://www.indeed.com/jobs?q=civil+engineer" },
      { title: "Electrical Engineer", description: "Design electrical systems and equipment", salaryRange: "$75K - $120K", growth: "7% (As fast as avg)", searchLink: "https://www.linkedin.com/jobs/search/?keywords=electrical%20engineer" },
    );
  }
  if (m.includes("psych") || aps.includes("AP Psychology")) {
    careers.push(
      { title: "Clinical Psychologist", description: "Assess and treat mental health disorders", salaryRange: "$60K - $105K", growth: "6% (As fast as avg)", searchLink: "https://www.indeed.com/jobs?q=clinical+psychologist" },
      { title: "School Counselor", description: "Help students develop social and academic skills", salaryRange: "$50K - $80K", growth: "10% (Faster than avg)", searchLink: "https://www.indeed.com/jobs?q=school+counselor" },
    );
  }
  if (m.includes("education") || m.includes("teach")) {
    careers.push(
      { title: "High School Teacher", description: "Instruct students in specific subject areas", salaryRange: "$45K - $75K", growth: "5% (Average)", searchLink: "https://www.indeed.com/jobs?q=high+school+teacher" },
      { title: "Instructional Designer", description: "Create educational materials and curricula", salaryRange: "$55K - $85K", growth: "11% (Faster than avg)", searchLink: "https://www.linkedin.com/jobs/search/?keywords=instructional%20designer" },
    );
  }
  if (m.includes("law") || m.includes("legal") || aps.includes("AP US History") || aps.includes("AP Comparative Government and Politics") ||
      clubStr.includes("mock trial") || clubStr.includes("debate")) {
    careers.push(
      { title: "Paralegal", description: "Assist lawyers with case preparation", salaryRange: "$45K - $70K", growth: "12% (Faster than avg)", searchLink: "https://www.indeed.com/jobs?q=paralegal" },
      { title: "Attorney", description: "Advise and represent clients in legal matters", salaryRange: "$80K - $160K+", growth: "10% (Faster than avg)", searchLink: "https://www.linkedin.com/jobs/search/?keywords=attorney" },
      { title: "Policy Analyst", description: "Research and analyze policies for government and organizations", salaryRange: "$55K - $95K", growth: "8% (Faster than avg)", searchLink: "https://www.indeed.com/jobs?q=policy+analyst" },
    );
  }
  if (m.includes("art") || m.includes("design") || m.includes("music") || aps.includes("AP Art & Design") ||
      clubStr.includes("art club") || clubStr.includes("theatre") || clubStr.includes("music")) {
    careers.push(
      { title: "Graphic Designer", description: "Create visual concepts for media and publications", salaryRange: "$40K - $75K", growth: "3% (Slower than avg)", searchLink: "https://www.indeed.com/jobs?q=graphic+designer" },
      { title: "UX Designer", description: "Design user experiences for digital products", salaryRange: "$70K - $120K", growth: "16% (Much faster than avg)", searchLink: "https://www.linkedin.com/jobs/search/?keywords=UX%20designer" },
    );
  }
  if (m.includes("enviro") || m.includes("climate") || m.includes("sustain") ||
      clubStr.includes("environmental") || clubStr.includes("climate") || clubStr.includes("green")) {
    careers.push(
      { title: "Environmental Scientist", description: "Protect the environment through research and analysis", salaryRange: "$55K - $95K", growth: "6% (As fast as avg)", searchLink: "https://www.indeed.com/jobs?q=environmental+scientist" },
      { title: "Sustainability Consultant", description: "Help organizations reduce environmental impact", salaryRange: "$60K - $100K", growth: "13% (Faster than avg)", searchLink: "https://www.linkedin.com/jobs/search/?keywords=sustainability%20consultant" },
    );
  }

  if (careers.length === 0) {
    careers.push(
      { title: "Project Manager", description: "Lead teams and coordinate projects across industries", salaryRange: "$60K - $110K", growth: "7% (As fast as avg)", searchLink: "https://www.indeed.com/jobs?q=project+manager" },
      { title: "Research Analyst", description: "Collect and analyze data for decision-making", salaryRange: "$50K - $85K", growth: "13% (Faster than avg)", searchLink: "https://www.indeed.com/jobs?q=research+analyst" },
      { title: "Technical Writer", description: "Create documentation for complex topics", salaryRange: "$55K - $90K", growth: "7% (As fast as avg)", searchLink: "https://www.indeed.com/jobs?q=technical+writer" },
    );
  }

  // Deduplicate by title
  const seen = new Set<string>();
  return careers.filter(c => {
    if (seen.has(c.title)) return false;
    seen.add(c.title);
    return true;
  });
}
