// Randomized adaptive quiz engine.
// Pulls a unique question set per session from a large categorized pool,
// scores answers into a UserVector that is then matched against college vectors.

export type QuizCategory = "academics" | "career" | "campus" | "personality" | "cost" | "location";

export interface UserVector {
  academics: number;       // 0-1 importance of academic rigor
  career: number;          // career outcomes / internships focus
  social: number;          // campus social life intensity
  cost: number;            // cost sensitivity (1 = very price-sensitive)
  independence: number;    // prefers independence vs structure
  prestige: number;        // prestige seeking
  location_urban: number;  // urban (1) vs rural (0) preference
  workload: number;        // tolerates heavy workload
  extracurricular: number; // weight on clubs / EC scene
}

export const ZERO_VECTOR: UserVector = {
  academics: 0.5, career: 0.5, social: 0.5, cost: 0.5,
  independence: 0.5, prestige: 0.5, location_urban: 0.5,
  workload: 0.5, extracurricular: 0.5,
};

export interface QuizQuestion {
  id: string;
  category: QuizCategory;
  text: string;
  optionA: string;
  optionB: string;
  // Each option pushes specific vector dimensions up (+) or down (-) by 0.15-0.3
  vectorA: Partial<Record<keyof UserVector, number>>;
  vectorB: Partial<Record<keyof UserVector, number>>;
  topicTags: string[];
}

// ---------------- QUESTION BANK ----------------
export const QUESTION_BANK: QuizQuestion[] = [
  // ===== ACADEMICS =====
  { id: "ac1", category: "academics", text: "Which sounds more like you?", optionA: "Hands-on labs and projects", optionB: "Theoretical lectures and discussion", vectorA: { workload: 0.15 }, vectorB: { academics: 0.15 }, topicTags: ["learning_style"] },
  { id: "ac2", category: "academics", text: "How do you feel about hard classes?", optionA: "Bring it on — I want to be challenged", optionB: "I'd rather have manageable classes and time for life", vectorA: { workload: 0.25, academics: 0.15 }, vectorB: { workload: -0.2, social: 0.1 }, topicTags: ["difficulty"] },
  { id: "ac3", category: "academics", text: "Do you want to be locked into your major early?", optionA: "Yes, focus on it from day one", optionB: "No, explore lots of subjects first", vectorA: { academics: 0.1 }, vectorB: { independence: 0.15 }, topicTags: ["major_flex"] },
  { id: "ac4", category: "academics", text: "Class size you'd thrive in?", optionA: "Small seminars (under 20)", optionB: "Big lectures with options", vectorA: { academics: 0.1, social: -0.1 }, vectorB: { social: 0.15 }, topicTags: ["class_size"] },
  { id: "ac5", category: "academics", text: "Professors should mostly be...", optionA: "Active researchers", optionB: "Great teachers", vectorA: { prestige: 0.15, academics: 0.1 }, vectorB: { academics: 0.1 }, topicTags: ["faculty"] },
  { id: "ac6", category: "academics", text: "How important is undergrad research?", optionA: "Very — I want a lab spot", optionB: "Not really my thing", vectorA: { academics: 0.2, workload: 0.1 }, vectorB: {}, topicTags: ["research"] },
  { id: "ac7", category: "academics", text: "Honors / accelerated programs?", optionA: "I'd apply to them", optionB: "I'd skip them", vectorA: { academics: 0.2, workload: 0.15 }, vectorB: { workload: -0.1 }, topicTags: ["honors"] },
  { id: "ac8", category: "academics", text: "Study abroad?", optionA: "Yes, want it", optionB: "Not interested", vectorA: { independence: 0.15 }, vectorB: {}, topicTags: ["study_abroad"] },
  { id: "ac9", category: "academics", text: "Grading culture?", optionA: "Competitive — keeps me sharp", optionB: "Collaborative — we lift each other up", vectorA: { workload: 0.2, prestige: 0.1 }, vectorB: { social: 0.1 }, topicTags: ["grading"] },
  { id: "ac10", category: "academics", text: "Liberal arts core?", optionA: "Love a broad core", optionB: "Want to skip and specialize", vectorA: { academics: 0.1 }, vectorB: { career: 0.15 }, topicTags: ["core"] },
  { id: "ac11", category: "academics", text: "Library all-nighters?", optionA: "Bring the coffee", optionB: "I value sleep", vectorA: { workload: 0.2 }, vectorB: { workload: -0.15 }, topicTags: ["workload_self"] },
  { id: "ac12", category: "academics", text: "Capstone / thesis?", optionA: "Required is fine", optionB: "Optional only", vectorA: { academics: 0.15, workload: 0.1 }, vectorB: {}, topicTags: ["capstone"] },

  // ===== CAREER =====
  { id: "ca1", category: "career", text: "Internships during the year?", optionA: "Critical — I want a strong pipeline", optionB: "Nice but not required", vectorA: { career: 0.25 }, vectorB: {}, topicTags: ["internships"] },
  { id: "ca2", category: "career", text: "Job placement stats matter?", optionA: "A lot — show me the numbers", optionB: "Not the main factor", vectorA: { career: 0.2, prestige: 0.1 }, vectorB: {}, topicTags: ["placement"] },
  { id: "ca3", category: "career", text: "Salary vs passion?", optionA: "Salary is a real factor", optionB: "Follow the passion", vectorA: { career: 0.2 }, vectorB: { academics: 0.1 }, topicTags: ["salary"] },
  { id: "ca4", category: "career", text: "Alumni network?", optionA: "I want a powerful one", optionB: "I'll build my own", vectorA: { prestige: 0.2, career: 0.15 }, vectorB: { independence: 0.1 }, topicTags: ["alumni"] },
  { id: "ca5", category: "career", text: "Startup vs Fortune 500?", optionA: "Startup energy", optionB: "Established companies", vectorA: { independence: 0.15, career: 0.1 }, vectorB: { career: 0.15, prestige: 0.1 }, topicTags: ["company_type"] },
  { id: "ca6", category: "career", text: "Recruiters on campus?", optionA: "Big career fairs please", optionB: "I'll find my own way", vectorA: { career: 0.2 }, vectorB: { independence: 0.15 }, topicTags: ["recruiting"] },
  { id: "ca7", category: "career", text: "Grad school path?", optionA: "Likely going", optionB: "Probably not", vectorA: { academics: 0.15 }, vectorB: { career: 0.1 }, topicTags: ["grad_school"] },
  { id: "ca8", category: "career", text: "Co-op programs (paid work semesters)?", optionA: "Yes please", optionB: "Skip", vectorA: { career: 0.2, cost: 0.1 }, vectorB: {}, topicTags: ["coop"] },
  { id: "ca9", category: "career", text: "Industry connections in major city?", optionA: "Critical", optionB: "Not needed", vectorA: { career: 0.15, location_urban: 0.2 }, vectorB: {}, topicTags: ["industry_loc"] },
  { id: "ca10", category: "career", text: "Entrepreneurship resources?", optionA: "Want a strong incubator scene", optionB: "Not relevant to me", vectorA: { independence: 0.15, career: 0.1 }, vectorB: {}, topicTags: ["entrepreneur"] },
  { id: "ca11", category: "career", text: "Pre-professional advising (pre-med, pre-law)?", optionA: "I need real support there", optionB: "Not my path", vectorA: { career: 0.15, academics: 0.1 }, vectorB: {}, topicTags: ["preprof"] },
  { id: "ca12", category: "career", text: "Networking events?", optionA: "I'll go to all of them", optionB: "I prefer 1-on-1", vectorA: { social: 0.15, career: 0.1 }, vectorB: { independence: 0.1 }, topicTags: ["networking"] },

  // ===== CAMPUS LIFE =====
  { id: "cp1", category: "campus", text: "Dorm life?", optionA: "Live on campus all 4 years", optionB: "Off-campus apartment ASAP", vectorA: { social: 0.2 }, vectorB: { independence: 0.2 }, topicTags: ["dorms"] },
  { id: "cp2", category: "campus", text: "Greek life?", optionA: "Interested", optionB: "Not for me", vectorA: { social: 0.25 }, vectorB: { social: -0.1 }, topicTags: ["greek"] },
  { id: "cp3", category: "campus", text: "Clubs?", optionA: "I want to join 5+", optionB: "Maybe one or two", vectorA: { extracurricular: 0.25, social: 0.1 }, vectorB: {}, topicTags: ["clubs"] },
  { id: "cp4", category: "campus", text: "School spirit?", optionA: "Game day energy", optionB: "Doesn't matter", vectorA: { social: 0.2 }, vectorB: {}, topicTags: ["spirit"] },
  { id: "cp5", category: "campus", text: "Party scene?", optionA: "I want it lively", optionB: "Quiet weekends preferred", vectorA: { social: 0.25 }, vectorB: { social: -0.15, academics: 0.1 }, topicTags: ["party"] },
  { id: "cp6", category: "campus", text: "Dining hall variety?", optionA: "Huge factor — I love food", optionB: "I'll eat anything", vectorA: { social: 0.05 }, vectorB: { cost: 0.1 }, topicTags: ["food"] },
  { id: "cp7", category: "campus", text: "Athletic scene?", optionA: "I want big-time D1 sports", optionB: "Sports aren't my thing", vectorA: { social: 0.15 }, vectorB: {}, topicTags: ["athletics_pref"] },
  { id: "cp8", category: "campus", text: "Religious / spiritual community?", optionA: "Important", optionB: "Not a factor", vectorA: { social: 0.1 }, vectorB: {}, topicTags: ["religion"] },
  { id: "cp9", category: "campus", text: "Diverse student body?", optionA: "Very important", optionB: "Less important", vectorA: { social: 0.1, academics: 0.05 }, vectorB: {}, topicTags: ["diversity"] },
  { id: "cp10", category: "campus", text: "Arts / music scene?", optionA: "Want a strong one", optionB: "Don't care", vectorA: { extracurricular: 0.15 }, vectorB: {}, topicTags: ["arts"] },
  { id: "cp11", category: "campus", text: "Outdoor activities?", optionA: "Hiking / nature access matters", optionB: "City all the way", vectorA: { location_urban: -0.2 }, vectorB: { location_urban: 0.2 }, topicTags: ["outdoors"] },
  { id: "cp12", category: "campus", text: "Late-night food / 24-hr study spots?", optionA: "Need it", optionB: "Don't care", vectorA: { workload: 0.1, location_urban: 0.1 }, vectorB: {}, topicTags: ["nightlife"] },

  // ===== PERSONALITY =====
  { id: "pe1", category: "personality", text: "Energy comes from...", optionA: "Being around lots of people", optionB: "Smaller close groups", vectorA: { social: 0.2 }, vectorB: { social: -0.1, independence: 0.1 }, topicTags: ["introvert"] },
  { id: "pe2", category: "personality", text: "Structure or freedom?", optionA: "Lots of structure / required courses", optionB: "Build my own path", vectorA: { academics: 0.1 }, vectorB: { independence: 0.25 }, topicTags: ["structure"] },
  { id: "pe3", category: "personality", text: "Stress level you handle well?", optionA: "I thrive under pressure", optionB: "I prefer steady pacing", vectorA: { workload: 0.2 }, vectorB: { workload: -0.15 }, topicTags: ["stress"] },
  { id: "pe4", category: "personality", text: "Competition?", optionA: "Fuel for me", optionB: "Drains me", vectorA: { workload: 0.15, prestige: 0.15 }, vectorB: { social: 0.1 }, topicTags: ["competition"] },
  { id: "pe5", category: "personality", text: "Leadership?", optionA: "I want roles", optionB: "I prefer to contribute quietly", vectorA: { extracurricular: 0.15, career: 0.1 }, vectorB: {}, topicTags: ["leadership"] },
  { id: "pe6", category: "personality", text: "Risk-taking?", optionA: "Take the leap", optionB: "Plan everything carefully", vectorA: { independence: 0.2 }, vectorB: { academics: 0.05 }, topicTags: ["risk"] },
  { id: "pe7", category: "personality", text: "Are you a planner or improviser?", optionA: "Planner", optionB: "Improviser", vectorA: { academics: 0.05 }, vectorB: { independence: 0.15 }, topicTags: ["planning"] },
  { id: "pe8", category: "personality", text: "Brand / prestige?", optionA: "It matters to me", optionB: "Not important", vectorA: { prestige: 0.3 }, vectorB: { prestige: -0.15 }, topicTags: ["brand"] },
  { id: "pe9", category: "personality", text: "How far from home?", optionA: "Want distance to grow", optionB: "Want to stay close", vectorA: { independence: 0.2 }, vectorB: { independence: -0.15 }, topicTags: ["distance"] },
  { id: "pe10", category: "personality", text: "Mentorship style?", optionA: "Hands-on advising", optionB: "Let me figure it out", vectorA: { academics: 0.1 }, vectorB: { independence: 0.15 }, topicTags: ["mentorship"] },

  // ===== COST =====
  { id: "co1", category: "cost", text: "Tuition matters how much?", optionA: "A lot — must be affordable", optionB: "I'll pay for the right fit", vectorA: { cost: 0.3 }, vectorB: { cost: -0.1, prestige: 0.1 }, topicTags: ["tuition"] },
  { id: "co2", category: "cost", text: "Need merit scholarships?", optionA: "Yes, depending on award", optionB: "Not really", vectorA: { cost: 0.25 }, vectorB: {}, topicTags: ["scholarship"] },
  { id: "co3", category: "cost", text: "OK with student loans?", optionA: "Avoid them", optionB: "Some debt is fine", vectorA: { cost: 0.3 }, vectorB: { cost: -0.1 }, topicTags: ["debt"] },
  { id: "co4", category: "cost", text: "In-state vs out-of-state?", optionA: "In-state for the price", optionB: "Anywhere — money is workable", vectorA: { cost: 0.2 }, vectorB: { independence: 0.1 }, topicTags: ["instate"] },
  { id: "co5", category: "cost", text: "Cost of living in city?", optionA: "Cheap city / town", optionB: "I'll pay for the location", vectorA: { cost: 0.2, location_urban: -0.1 }, vectorB: { location_urban: 0.15 }, topicTags: ["col"] },
  { id: "co6", category: "cost", text: "Work-study?", optionA: "I'll work during school", optionB: "Want to focus on classes", vectorA: { cost: 0.15, career: 0.05 }, vectorB: { academics: 0.05 }, topicTags: ["workstudy"] },
  { id: "co7", category: "cost", text: "Public vs private?", optionA: "Public for value", optionB: "Private for resources", vectorA: { cost: 0.15 }, vectorB: { prestige: 0.1, academics: 0.1 }, topicTags: ["public_private"] },
  { id: "co8", category: "cost", text: "ROI matters?", optionA: "Yes, I'll calc earnings vs cost", optionB: "Not how I think about it", vectorA: { cost: 0.15, career: 0.15 }, vectorB: {}, topicTags: ["roi"] },

  // ===== LOCATION =====
  { id: "lo1", category: "location", text: "City vs college town?", optionA: "Big city", optionB: "Quintessential college town", vectorA: { location_urban: 0.3 }, vectorB: { location_urban: -0.1, social: 0.1 }, topicTags: ["urbanity"] },
  { id: "lo2", category: "location", text: "Climate?", optionA: "Warm year-round", optionB: "Real seasons / snow OK", vectorA: {}, vectorB: {}, topicTags: ["climate"] },
  { id: "lo3", category: "location", text: "Coast preference?", optionA: "Near a coast", optionB: "Inland is fine", vectorA: { location_urban: 0.05 }, vectorB: {}, topicTags: ["coast"] },
  { id: "lo4", category: "location", text: "International schools?", optionA: "Open to studying abroad full-time", optionB: "US only", vectorA: { independence: 0.2 }, vectorB: {}, topicTags: ["international"] },
  { id: "lo5", category: "location", text: "Public transit access?", optionA: "Important — I won't have a car", optionB: "I'll have a car / don't need it", vectorA: { location_urban: 0.2 }, vectorB: {}, topicTags: ["transit"] },
  { id: "lo6", category: "location", text: "Food culture in the area?", optionA: "Diverse restaurant scene matters", optionB: "Don't really care", vectorA: { location_urban: 0.15, social: 0.05 }, vectorB: {}, topicTags: ["food_scene"] },
  { id: "lo7", category: "location", text: "Safety perception?", optionA: "Very important", optionB: "I'll roll with it", vectorA: { location_urban: -0.1 }, vectorB: {}, topicTags: ["safety"] },
  { id: "lo8", category: "location", text: "Time zone match with home?", optionA: "Want to stay in same time zone", optionB: "Doesn't matter", vectorA: { independence: -0.1 }, vectorB: { independence: 0.1 }, topicTags: ["timezone"] },
];

// ---------------- SEEDED RNG ----------------
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function newSeed(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function seedToInt(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// ---------------- SELECTOR ----------------
const PER_CATEGORY = 3;

export function selectQuestions(seed: string, avoidIds: Set<string> = new Set()): QuizQuestion[] {
  const rng = mulberry32(seedToInt(seed));
  const cats: QuizCategory[] = ["academics", "career", "campus", "personality", "cost", "location"];
  const picked: QuizQuestion[] = [];
  const usedTopics = new Set<string>();

  for (const cat of cats) {
    // Shuffle this category's pool deterministically
    const pool = QUESTION_BANK.filter(q => q.category === cat).slice();
    // Fisher-Yates with seeded RNG
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    // Prefer questions whose tags aren't yet used and that aren't in avoidIds
    const sorted = pool.sort((a, b) => {
      const aPenalty = (avoidIds.has(a.id) ? 100 : 0) + (a.topicTags.some(t => usedTopics.has(t)) ? 10 : 0);
      const bPenalty = (avoidIds.has(b.id) ? 100 : 0) + (b.topicTags.some(t => usedTopics.has(t)) ? 10 : 0);
      return aPenalty - bPenalty;
    });
    for (const q of sorted.slice(0, PER_CATEGORY)) {
      picked.push(q);
      q.topicTags.forEach(t => usedTopics.add(t));
    }
  }

  // Final shuffle of combined list
  for (let i = picked.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [picked[i], picked[j]] = [picked[j], picked[i]];
  }
  return picked;
}

// ---------------- SCORING ----------------
export function scoreAnswers(
  questions: QuizQuestion[],
  answers: Record<string, "A" | "B">
): UserVector {
  const v: UserVector = { ...ZERO_VECTOR };
  for (const q of questions) {
    const choice = answers[q.id];
    if (!choice) continue;
    const delta = choice === "A" ? q.vectorA : q.vectorB;
    for (const k of Object.keys(delta) as (keyof UserVector)[]) {
      v[k] = Math.max(0, Math.min(1, v[k] + (delta[k] || 0)));
    }
  }
  return v;
}

// Cosine similarity between user vector and a college vector (both 0-1 dim).
export function vectorSimilarity(user: UserVector, college: UserVector): number {
  const keys = Object.keys(user) as (keyof UserVector)[];
  let dot = 0, ua = 0, ca = 0;
  for (const k of keys) {
    dot += user[k] * college[k];
    ua += user[k] * user[k];
    ca += college[k] * college[k];
  }
  if (ua === 0 || ca === 0) return 0;
  return dot / (Math.sqrt(ua) * Math.sqrt(ca));
}

// Persistent seen-question tracking (anti-repeat across sessions).
const SEEN_KEY = "rm_quiz_seen_v1";
export function getSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch { return new Set(); }
}
export function recordSeenIds(ids: string[]) {
  try {
    const cur = getSeenIds();
    ids.forEach(i => cur.add(i));
    // keep last 60
    const arr = Array.from(cur).slice(-60);
    localStorage.setItem(SEEN_KEY, JSON.stringify(arr));
  } catch { }
}

// Derive a college vector from raw Scorecard fields. Each dimension 0-1.
export function deriveCollegeVector(c: {
  enrollment?: number | null;
  admRate?: number | null;
  costOutState?: number | null;
  setting?: string;
  programPct?: number;
}): UserVector {
  const enrollment = c.enrollment || 5000;
  const admRate = c.admRate ?? 0.5;
  const cost = c.costOutState ?? 30000;
  const setting = (c.setting || "").toLowerCase();
  const social = enrollment > 20000 ? 0.85 : enrollment > 10000 ? 0.65 : enrollment > 4000 ? 0.5 : 0.3;
  const prestige = admRate < 0.1 ? 0.95 : admRate < 0.25 ? 0.8 : admRate < 0.45 ? 0.6 : 0.4;
  const academics = admRate < 0.2 ? 0.9 : admRate < 0.4 ? 0.7 : admRate < 0.6 ? 0.55 : 0.4;
  const workload = academics;
  const costScore = cost > 55000 ? 0.2 : cost > 35000 ? 0.45 : cost > 18000 ? 0.7 : 0.9; // higher = better for cost-sensitive user
  const urban = setting.includes("urban") ? 0.9 : setting.includes("suburb") ? 0.55 : setting.includes("town") ? 0.3 : setting.includes("rural") ? 0.1 : 0.5;
  return {
    academics, career: 0.5 + (c.programPct ?? 0) * 0.5, social,
    cost: costScore, independence: 0.5, prestige,
    location_urban: urban, workload, extracurricular: social * 0.8 + 0.1,
  };
}
