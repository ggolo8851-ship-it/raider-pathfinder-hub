const API_KEY = 'MjIqpoVwxvMuwmdz8GOBsPxFaf0CuZCobY8weKPt';
const ERHS_COORDS = { lat: 38.9928, lon: -76.8770 };

function getDist(lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = (lat2 - ERHS_COORDS.lat) * Math.PI / 180;
  const dLon = (lon2 - ERHS_COORDS.lon) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(ERHS_COORDS.lat * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getMajorField(major: string): string {
  const m = major.toLowerCase();
  if (m.includes("nurse") || m.includes("health") || m.includes("med")) return "latest.academics.program_percentage.health";
  if (m.includes("bus") || m.includes("financ") || m.includes("account")) return "latest.academics.program_percentage.business_marketing";
  if (m.includes("engineer")) return "latest.academics.program_percentage.engineering";
  if (m.includes("education") || m.includes("teach")) return "latest.academics.program_percentage.education";
  if (m.includes("art") || m.includes("design") || m.includes("music")) return "latest.academics.program_percentage.visual_performing";
  if (m.includes("bio") || m.includes("chem") || m.includes("phys") || m.includes("science")) return "latest.academics.program_percentage.biological";
  if (m.includes("math") || m.includes("stat")) return "latest.academics.program_percentage.mathematics";
  if (m.includes("psych")) return "latest.academics.program_percentage.psychology";
  if (m.includes("law") || m.includes("legal")) return "latest.academics.program_percentage.legal";
  if (m.includes("social") || m.includes("socio") || m.includes("politic")) return "latest.academics.program_percentage.social_science";
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
}

export async function searchColleges(major: string, distLimit: number): Promise<CollegeResult[]> {
  const queryField = getMajorField(major);
  const fieldName = queryField.split('.').pop() || '';
  const url = `https://api.data.gov/ed/collegescorecard/v1/schools.json?api_key=${API_KEY}&${queryField}__range=0.01..1&school.operating=1&fields=school.name,school.city,school.state,school.school_url,location.lat,location.lon,${queryField}&per_page=100`;

  const resp = await fetch(url);
  const data = await resp.json();

  if (!data.results) return [];

  return data.results
    .map((c: any) => ({
      name: c['school.name'],
      city: c['school.city'],
      state: c['school.state'],
      url: c['school.school_url']?.includes('http') ? c['school.school_url'] : 'https://' + c['school.school_url'],
      miles: getDist(c['location.lat'], c['location.lon']),
      majorPercentage: c[queryField] || 0,
    }))
    .filter((c: CollegeResult) => c.miles <= distLimit)
    .sort((a: CollegeResult, b: CollegeResult) => b.majorPercentage - a.majorPercentage);
}

export interface CareerMatch {
  title: string;
  description: string;
  salaryRange: string;
  growth: string;
}

export function getCareerMatches(major: string, aps: string[]): CareerMatch[] {
  const m = major.toLowerCase();
  const careers: CareerMatch[] = [];

  if (m.includes("computer") || m.includes("tech") || m.includes("software") || m.includes("it") || aps.includes("AP Computer Science")) {
    careers.push(
      { title: "Software Engineer", description: "Design and build applications and systems", salaryRange: "$85K - $150K+", growth: "25% (Much faster than avg)" },
      { title: "Data Scientist", description: "Analyze complex data to help organizations make decisions", salaryRange: "$95K - $140K", growth: "35% (Much faster than avg)" },
      { title: "Cybersecurity Analyst", description: "Protect computer systems and networks", salaryRange: "$75K - $120K", growth: "33% (Much faster than avg)" },
    );
  }
  if (m.includes("nurse") || m.includes("health") || m.includes("med") || m.includes("bio") || aps.includes("AP Biology")) {
    careers.push(
      { title: "Registered Nurse", description: "Provide patient care in hospitals and clinics", salaryRange: "$60K - $95K", growth: "6% (Faster than avg)" },
      { title: "Physician Assistant", description: "Diagnose illness and develop treatment plans", salaryRange: "$95K - $130K", growth: "28% (Much faster than avg)" },
      { title: "Biomedical Engineer", description: "Design medical devices and equipment", salaryRange: "$70K - $110K", growth: "10% (Faster than avg)" },
    );
  }
  if (m.includes("bus") || m.includes("financ") || m.includes("account") || m.includes("econ")) {
    careers.push(
      { title: "Financial Analyst", description: "Guide businesses and individuals on investment decisions", salaryRange: "$65K - $110K", growth: "9% (Faster than avg)" },
      { title: "Marketing Manager", description: "Plan campaigns to generate interest in products", salaryRange: "$70K - $130K", growth: "10% (Faster than avg)" },
      { title: "Accountant", description: "Prepare and examine financial records", salaryRange: "$55K - $90K", growth: "6% (As fast as avg)" },
    );
  }
  if (m.includes("engineer") || aps.includes("AP Physics") || aps.includes("AP Calculus")) {
    careers.push(
      { title: "Mechanical Engineer", description: "Design and build mechanical systems", salaryRange: "$70K - $115K", growth: "7% (As fast as avg)" },
      { title: "Civil Engineer", description: "Design infrastructure projects", salaryRange: "$65K - $105K", growth: "7% (As fast as avg)" },
      { title: "Electrical Engineer", description: "Design electrical systems and equipment", salaryRange: "$75K - $120K", growth: "7% (As fast as avg)" },
    );
  }
  if (m.includes("psych") || aps.includes("AP Psychology")) {
    careers.push(
      { title: "Clinical Psychologist", description: "Assess and treat mental health disorders", salaryRange: "$60K - $105K", growth: "6% (As fast as avg)" },
      { title: "School Counselor", description: "Help students develop social and academic skills", salaryRange: "$50K - $80K", growth: "10% (Faster than avg)" },
    );
  }
  if (m.includes("education") || m.includes("teach")) {
    careers.push(
      { title: "High School Teacher", description: "Instruct students in specific subject areas", salaryRange: "$45K - $75K", growth: "5% (Average)" },
      { title: "Instructional Designer", description: "Create educational materials and curricula", salaryRange: "$55K - $85K", growth: "11% (Faster than avg)" },
    );
  }
  if (m.includes("law") || m.includes("legal") || aps.includes("AP US History")) {
    careers.push(
      { title: "Paralegal", description: "Assist lawyers with case preparation", salaryRange: "$45K - $70K", growth: "12% (Faster than avg)" },
      { title: "Attorney", description: "Advise and represent clients in legal matters", salaryRange: "$80K - $160K+", growth: "10% (Faster than avg)" },
    );
  }

  // Default careers
  if (careers.length === 0) {
    careers.push(
      { title: "Project Manager", description: "Lead teams and coordinate projects across industries", salaryRange: "$60K - $110K", growth: "7% (As fast as avg)" },
      { title: "Research Analyst", description: "Collect and analyze data for decision-making", salaryRange: "$50K - $85K", growth: "13% (Faster than avg)" },
      { title: "Technical Writer", description: "Create documentation for complex topics", salaryRange: "$55K - $90K", growth: "7% (As fast as avg)" },
    );
  }

  return careers;
}
