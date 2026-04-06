export interface UserProfile {
  major: string;
  gpa: string;
  sat: string;
  act: string;
  aps: string[];
  gradYear: string;
  clubs: string[];
  extracurriculars: string[];
  achievements: string[];
  serviceHours: number;
  isST: boolean;
}

export interface User {
  name: string;
  username: string;
  pass: string;
  setupComplete: boolean;
  profile: UserProfile;
  isNewSignup?: boolean;
  bookmarks: string[];
}

export type UsersDB = Record<string, User>;

const DB_KEY = 'raider_db';
const SESSION_KEY = 'raider_session';

export const AP_LIST = [
  "AP Seminar", "AP Research",
  "AP Calculus AB", "AP Calculus BC", "AP Statistics",
  "AP Biology", "AP Chemistry", "AP Environmental Science", "AP Physics",
  "AP English Language and Composition", "AP English Literature and Composition",
  "AP US History", "AP Comparative Government and Politics", "AP World History",
  "AP Spanish Language and Culture", "AP Japanese", "AP French",
  "AP Computer Science A", "AP Computer Science Principles", "AP Art & Design",
];

export const GRAD_YEARS = ["2026", "2027", "2028", "2029"];

export const ERHS_CLUBS = [
  "African Student Union", "Art Club", "Asian Student Organization", "ASL Club & Peer Tutoring",
  "Badminton Club", "Baking Club", "Cards4Kindness", "Class of 2027", "Class of 2028",
  "Cosmetology Club", "Creative Writing Club", "Crochet Club", "Debate Club",
  "Do Something Club", "East African Club", "Chess Club", "Environmental Defense Club",
  "ERHS Mock Trial", "ERHS Pep Band", "ERHS Theatre Club", "Fashion Club",
  "FBLA - Future Business Leaders of America", "Fiber Arts Club", "French Club",
  "French Honor Society", "Future Healthcare Professionals", "Game Development Club",
  "Get Into Tech Club (GIT)", "Girls Lacrosse Team", "Guitar/RecTech Lab",
  "History Honor Society (Rho Kappa)", "Homegrown Heroes", "International Club",
  "Italian Club and Honor Society", "Japanese National Honor Society", "Jazz Club",
  "Journalism", "Korean Club", "Latin Student Association/Latin Dance", "Math Club",
  "Math Honor Society", "Media Club", "Media Production Team", "Music Club",
  "Muslim Student Association", "National English Honor Society", "National Honor Society",
  "National STEM Honor Society (NSTEM)", "Origami Club", "Outdoor Volleyball Club",
  "POMS", "Programming Club", "Raider Book Club", "Red Cross Club",
  "Science National Honor Society", "Science Olympiad Team", "Seminar Club",
  "South Asian Student Association (SASA)", "Spanish Honor Society", "Tennis Club",
  "The Lady Raiders Step Squad", "Thee Black & Bluezz", "TLC", "Trac Bridge Club",
  "Tri-M Music Honor Society", "Ultimate Frisbee Club", "UNICEF Club",
  "VEX Robotics", "WErSTEM", "West Indian Dance Team", "Women in Business",
  "Youth Climate Institute / Green Schools",
];

export const ROADMAP_ITEMS: Record<string, { label: string; deadline: string }[]> = {
  "2026": [
    { label: "FAFSA Opens", deadline: "October 1, 2025" },
    { label: "MHEC MD State Aid Priority Deadline", deadline: "March 1, 2026" },
    { label: "Common App Deadline (most schools)", deadline: "January 15, 2026" },
    { label: "SRAR Submission", deadline: "February 15, 2026" },
    { label: "AP Exam Registration", deadline: "November 15, 2025" },
    { label: "Graduation", deadline: "June 2026" },
  ],
  "2027": [
    { label: "Start SAT/ACT Prep", deadline: "Spring 2026" },
    { label: "FAFSA Opens", deadline: "October 1, 2026" },
    { label: "MHEC MD State Aid Priority Deadline", deadline: "March 1, 2027" },
    { label: "Common App Opens", deadline: "August 1, 2026" },
    { label: "Graduation", deadline: "June 2027" },
  ],
  "2028": [
    { label: "Begin College Research", deadline: "Fall 2026" },
    { label: "Take PSAT", deadline: "October 2026" },
    { label: "Start SAT/ACT Prep", deadline: "Spring 2027" },
    { label: "Graduation", deadline: "June 2028" },
  ],
  "2029": [
    { label: "Explore Interests & Clubs", deadline: "Fall 2025" },
    { label: "Take PSAT 8/9", deadline: "October 2026" },
    { label: "Graduation", deadline: "June 2029" },
  ],
};

export function getDefaultProfile(): UserProfile {
  return { major: "", gpa: "", sat: "", act: "", aps: [], gradYear: "2027", clubs: [], extracurriculars: [], achievements: [], serviceHours: 0, isST: false };
}

export function getUsers(): UsersDB {
  return JSON.parse(localStorage.getItem(DB_KEY) || '{}');
}

export function saveUsers(users: UsersDB) {
  localStorage.setItem(DB_KEY, JSON.stringify(users));
}

export function getSession(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function setSession(email: string) {
  localStorage.setItem(SESSION_KEY, email);
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.clear();
}
