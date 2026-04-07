export interface UserProfile {
  major: string;
  gpa: string;
  sat: string;
  act: string;
  aps: string[];
  apScores: Record<string, number>; // AP exam scores (1-5)
  gradYear: string;
  clubs: string[];
  extracurriculars: string[];
  achievements: string[];
  serviceHours: number;
  isST: boolean;
  testOptional: boolean;
  sports: string[];
}

export interface User {
  name: string;
  username: string;
  pass: string;
  securityPhrase: string;
  setupComplete: boolean;
  profile: UserProfile;
  isNewSignup?: boolean;
  bookmarks: string[];
}

export type UsersDB = Record<string, User>;

const DB_KEY = 'raider_db';
const SESSION_KEY = 'raider_session';

export const AP_LIST = [
  "AP Art & Design",
  "AP Biology",
  "AP Calculus AB",
  "AP Calculus BC",
  "AP Chemistry",
  "AP Comparative Government and Politics",
  "AP Computer Science A",
  "AP Computer Science Principles",
  "AP English Language and Composition",
  "AP English Literature and Composition",
  "AP Environmental Science",
  "AP French",
  "AP Japanese",
  "AP Physics",
  "AP Precalculus",
  "AP Research",
  "AP Seminar",
  "AP Spanish Language and Culture",
  "AP Statistics",
  "AP US Government and Politics",
  "AP US History",
  "AP World History",
];

export const GRAD_YEARS = ["2026", "2027", "2028", "2029"];

export const ERHS_CLUBS = [
  "African Student Union",
  "Art Club",
  "Asian Student Organization",
  "ASL Club & Peer Tutoring",
  "Badminton Club",
  "Baking Club",
  "Cards4Kindness",
  "Class of 2027",
  "Class of 2028",
  "Chess Club",
  "Cosmetology Club",
  "Creative Writing Club",
  "Crochet Club",
  "Debate Club",
  "Do Something Club",
  "East African Club",
  "Environmental Defense Club",
  "ERHS Mock Trial",
  "ERHS Pep Band",
  "ERHS Theatre Club",
  "Fashion Club",
  "FBLA - Future Business Leaders of America",
  "Fiber Arts Club",
  "French Club",
  "French Honor Society",
  "Future Healthcare Professionals",
  "Game Development Club",
  "Get Into Tech Club (GIT)",
  "Girls Lacrosse Team",
  "Guitar/RecTech Lab",
  "History Honor Society (Rho Kappa)",
  "Homegrown Heroes",
  "International Club",
  "Investment Club",
  "Italian Club and Honor Society",
  "Japanese National Honor Society",
  "Jazz Club",
  "Journalism",
  "Korean Club",
  "Latin Student Association/Latin Dance",
  "Math Club",
  "Math Honor Society",
  "Media Club",
  "Media Production Team",
  "Model United Nations (MUN)",
  "Music Club",
  "Muslim Student Association",
  "National English Honor Society",
  "National Honor Society",
  "National STEM Honor Society (NSTEM)",
  "Origami Club",
  "Outdoor Volleyball Club",
  "POMS",
  "Programming Club",
  "Raider Book Club",
  "Red Cross Club",
  "Science National Honor Society",
  "Science Olympiad Team",
  "Seminar Club",
  "South Asian Student Association (SASA)",
  "Spanish Honor Society",
  "Tennis Club",
  "The Lady Raiders Step Squad",
  "Thee Black & Bluezz",
  "TLC",
  "Trac Bridge Club",
  "Tri-M Music Honor Society",
  "Ultimate Frisbee Club",
  "UNICEF Club",
  "VEX Robotics",
  "WErSTEM",
  "West Indian Dance Team",
  "Women in Business",
  "Youth Climate Institute / Green Schools",
];

export const ERHS_SPORTS = [
  "Baseball (Varsity/JV)",
  "Basketball (Boys Varsity/JV)",
  "Basketball (Girls Varsity/JV)",
  "Cheerleading",
  "Cross Country",
  "Football (Varsity/JV)",
  "Golf",
  "Gymnastics",
  "Indoor Track",
  "Lacrosse (Boys)",
  "Lacrosse (Girls)",
  "Outdoor Track & Field",
  "Soccer (Boys)",
  "Soccer (Girls)",
  "Softball",
  "Swimming & Diving",
  "Tennis (Boys)",
  "Tennis (Girls)",
  "Volleyball (Girls)",
  "Wrestling",
];

export const ERHS_CLUB_INFO: Record<string, { sponsor: string; email: string; schedule: string; purpose: string }> = {
  "African Student Union": { sponsor: "Ms. Janna Ryon", email: "janna.ryon@pgcps.org", schedule: "Weekly", purpose: "African Dancing/Modeling" },
  "Art Club": { sponsor: "Ms. Monique Connealy", email: "monique.king@pgcps.org", schedule: "Weekly", purpose: "Creating art and beautification of the school and surrounding community." },
  "Asian Student Organization": { sponsor: "Ms. Devonne Wood", email: "devonne.wood@pgcps.org", schedule: "Bi-weekly", purpose: "Celebrating Asian culture through events, food, dances, games, and crafts." },
  "ASL Club & Peer Tutoring": { sponsor: "Ms. Karen Bowers", email: "karen1.bowers@pgcps.org", schedule: "Bi-weekly", purpose: "After-school help with ASL and promoting awareness." },
  "Badminton Club": { sponsor: "Mr. Laurent Rigal", email: "laurent.rigal@pgcps.org", schedule: "Monthly", purpose: "Non-competitive badminton in a safe space." },
  "Baking Club": { sponsor: "Ms. Rebecca Burton", email: "rebecca.burton@pgcps.org", schedule: "Bi-weekly", purpose: "Interactive baking and decorating environment." },
  "Cards4Kindness": { sponsor: "Ms. Kathryn Komar", email: "kathryn.komar@pgcps.org", schedule: "Bi-weekly", purpose: "Creating cards to spread smiles and joy." },
  "Class of 2027": { sponsor: "Ms. Atika Saeed", email: "atika.saeed@pgcps.org", schedule: "Weekly", purpose: "Fundraising for 2027 seniors." },
  "Class of 2028": { sponsor: "Ms. Glenna Leary", email: "glenna.leary@pgcps.org", schedule: "Monthly", purpose: "Class of 2028 student government." },
  "Chess Club": { sponsor: "Ms. Rebecca Burton", email: "rebecca.burton@pgcps.org", schedule: "Weekly", purpose: "Developing analytical, problem-solving, and abstract reasoning skills through chess." },
  "Cosmetology Club": { sponsor: "Ms. Judi Barrera", email: "judith.barrera@pgcps.org", schedule: "Monthly", purpose: "Beauty, hair, and skin care skills and career exploration." },
  "Creative Writing Club": { sponsor: "Ms. Lilan Miller", email: "lilan.miller@pgcps.org", schedule: "Bi-weekly", purpose: "Engaging in creative writing and sharing for feedback." },
  "Crochet Club": { sponsor: "Ms. Shobha Narayanasundaram", email: "shobha.rani@pgcps.org", schedule: "Bi-weekly", purpose: "Making crochet items for the community." },
  "Debate Club": { sponsor: "Ms. Judi Barrera", email: "judith.barrera@pgcps.org", schedule: "Weekly", purpose: "Critical thinking, persuasive speaking, and civil discourse." },
  "Do Something Club": { sponsor: "Ms. Shobha Narayanasundaram", email: "shobha.rani@pgcps.org", schedule: "Weekly", purpose: "Community service in school, Greenbelt, and nationwide." },
  "East African Club": { sponsor: "Mr. David Ellison", email: "david.ellison@pgcps.org", schedule: "Bi-weekly", purpose: "Promote East African Culture and Activities." },
  "Environmental Defense Club": { sponsor: "Mr. Ryan Koch", email: "ryan.koch@pgcps.org", schedule: "Weekly", purpose: "Recycling, composting, and school beautification." },
  "ERHS Mock Trial": { sponsor: "Mr. Alexander Miletich", email: "alexander.miletich@pgcps.org", schedule: "Bi-weekly", purpose: "Academic competition simulating real courtroom trials." },
  "ERHS Pep Band": { sponsor: "Mr. Cullen Waller", email: "cullen.waller@pgcps.org", schedule: "Weekly", purpose: "Performing at ERHS student activities." },
  "ERHS Theatre Club": { sponsor: "Ms. Angelique Sterling", email: "angelique.sterling@pgcps.org", schedule: "Weekly", purpose: "Inclusive space for creating, performing, and producing theatre." },
  "Fashion Club": { sponsor: "Ms. Chinwe Aldridge", email: "chinwe.aldridge@pgcps.org", schedule: "Monthly", purpose: "Discussing and celebrating fashion." },
  "FBLA - Future Business Leaders of America": { sponsor: "Ms. Sherri Ray", email: "sherri.ray@pgcps.org", schedule: "Weekly", purpose: "Business leadership through programs, conferences, and competitions." },
  "Fiber Arts Club": { sponsor: "Mr. Ash Richman", email: "ashleigh.richman@pgcps.org", schedule: "Weekly", purpose: "Arts education through fiber arts." },
  "French Club": { sponsor: "Mr. Laurent Rigal", email: "laurent.rigal@pgcps.org", schedule: "Monthly", purpose: "Learning about French language and culture." },
  "French Honor Society": { sponsor: "Ms. Anna Cherubin", email: "cherubin@pgcps.org", schedule: "Monthly", purpose: "Promoting French language study and community service." },
  "Future Healthcare Professionals": { sponsor: "Ms. Ebony Robinson", email: "ebony2.robinson@pgcps.org", schedule: "Weekly", purpose: "Exploring healthcare careers, resume writing, and networking." },
  "Game Development Club": { sponsor: "Mr. David Ellison", email: "david.ellison@pgcps.org", schedule: "Bi-weekly", purpose: "Promote Game Development." },
  "Get Into Tech Club (GIT)": { sponsor: "Mr. David Eisenberg", email: "david.eisenberg@pgcps.org", schedule: "Weekly", purpose: "Engineering projects and design challenges." },
  "Girls Lacrosse Team": { sponsor: "Mr. Charles Mills", email: "charles.mills@pgcps.org", schedule: "Weekly", purpose: "Varsity Sport." },
  "Guitar/RecTech Lab": { sponsor: "Mr. Kevin Hawk", email: "kevin.hawk@pgcps.org", schedule: "Bi-weekly", purpose: "Extra practice, help, and collaboration on musical projects." },
  "History Honor Society (Rho Kappa)": { sponsor: "Ms. Gabrielle Gee", email: "gabrielle.gee@pgcps.org", schedule: "Bi-weekly", purpose: "Honor society for Social Studies proficiency." },
  "Homegrown Heroes": { sponsor: "Ms. Kathryn Komar", email: "kathryn.komar@pgcps.org", schedule: "Bi-weekly", purpose: "Teaching sustainable gardening and food cultivation." },
  "International Club": { sponsor: "Dr. Victor Tebid", email: "victor.tebid@pgcps.org", schedule: "Bi-weekly", purpose: "Fostering inclusion and showcasing diversity." },
  "Investment Club": { sponsor: "TBD", email: "", schedule: "Weekly", purpose: "Learning about investing, stock markets, and personal finance." },
  "Italian Club and Honor Society": { sponsor: "Ms. Francesca Minisola", email: "francesca.minisola@pgcps.org", schedule: "Bi-weekly", purpose: "Promoting Italian language and culture." },
  "Japanese National Honor Society": { sponsor: "Mr. Tetsuo Ogawa", email: "tetsuo.ogawa@pgcps.org", schedule: "Weekly", purpose: "Promoting Japanese cultural exchanges and partnerships." },
  "Jazz Club": { sponsor: "Mr. Cullen Waller", email: "cullen.waller@pgcps.org", schedule: "Weekly", purpose: "Exploring, learning, and performing Jazz." },
  "Journalism": { sponsor: "Ms. Heather Seyler", email: "heather.seyler@pgcps.org", schedule: "Weekly", purpose: "School Newspaper." },
  "Korean Club": { sponsor: "Mr. Bob Huh", email: "bob.huh@pgcps.org", schedule: "Weekly", purpose: "Korean language learning and cultural appreciation." },
  "Latin Student Association/Latin Dance": { sponsor: "Ms. Kristen Vickery", email: "kristen.vickery@pgcps.org", schedule: "Weekly", purpose: "Sharing and embracing Latin culture and dance." },
  "Math Club": { sponsor: "Mr. Oneil Scott", email: "oneil.scott@pgcps.org", schedule: "Weekly", purpose: "Encouraging math in school." },
  "Math Honor Society": { sponsor: "Mr. Oneil Scott", email: "oneil.scott@pgcps.org", schedule: "Weekly", purpose: "Math practice, tutoring, and competitions." },
  "Media Club": { sponsor: "Ms. Angela Batten", email: "Angela.Batten@pgcps.org", schedule: "Weekly", purpose: "Analyzing media and creating original content." },
  "Media Production Team": { sponsor: "Ms. Angela Batten", email: "Angela.Batten@pgcps.org", schedule: "Weekly", purpose: "Livestreaming school events and social media." },
  "Model United Nations (MUN)": { sponsor: "TBD", email: "", schedule: "Weekly", purpose: "Simulating UN committees to debate global issues and develop diplomacy skills." },
  "Music Club": { sponsor: "Ms. Janna Ryon", email: "janna.ryon@pgcps.org", schedule: "Weekly", purpose: "Creating and performing music together." },
  "Muslim Student Association": { sponsor: "Mr. Troy Bradbury", email: "troy.bradbury@pgcps.org", schedule: "Bi-weekly", purpose: "Connecting through Islam." },
  "National English Honor Society": { sponsor: "Ms. Abigail Holtz", email: "abigail.holtz@pgcps.org", schedule: "Bi-weekly", purpose: "Recognizing top English students and supporting literacy." },
  "National Honor Society": { sponsor: "Ms. Andrea Short", email: "Andrea.Short@pgcps.org", schedule: "Weekly", purpose: "Empowering students to be transformative leaders." },
  "National STEM Honor Society (NSTEM)": { sponsor: "Ms. Karen Bogoski", email: "karen.bogoski@pgcps.org", schedule: "Monthly", purpose: "Recognition of exceptional STEM commitment." },
  "Origami Club": { sponsor: "Ms. Devonne Wood", email: "devonne.wood@pgcps.org", schedule: "Bi-weekly", purpose: "Stress-free origami art environment." },
  "Outdoor Volleyball Club": { sponsor: "Mr. Scott Fifield", email: "scott.fifield@pgcps.org", schedule: "Bi-weekly", purpose: "Boys volleyball opportunity." },
  "POMS": { sponsor: "Ms. Francine Powell", email: "fpowell@pgcps.org", schedule: "Weekly", purpose: "Entertainment and Competitions." },
  "Programming Club": { sponsor: "Ms. Karen Bogoski", email: "karen.bogoski@pgcps.org", schedule: "Weekly", purpose: "Learning and working on programming problems." },
  "Raider Book Club": { sponsor: "Ms. Rachel Hickson", email: "rachel.hickson@pgcps.org", schedule: "Bi-weekly", purpose: "Reading and discussing novels." },
  "Red Cross Club": { sponsor: "Ms. Shobha Narayanasundaram", email: "shobha.rani@pgcps.org", schedule: "Bi-weekly", purpose: "Community service." },
  "Science National Honor Society": { sponsor: "Ms. Rebecca Hammonds", email: "rebecca.howell@pgcps.org", schedule: "Monthly", purpose: "Encouraging excellence in the ERHS science community." },
  "Science Olympiad Team": { sponsor: "Ms. Ebony Robinson", email: "ebony2.robinson@pgcps.org", schedule: "Weekly", purpose: "Competing in science and engineering events." },
  "Seminar Club": { sponsor: "Mr. Troy Bradbury", email: "troy.bradbury@pgcps.org", schedule: "Bi-weekly", purpose: "Discussing current events." },
  "South Asian Student Association (SASA)": { sponsor: "Ms. Jeeva Ashok", email: "jeeva.ashok@pgcps.org", schedule: "Bi-weekly", purpose: "Learning about South Asian culture and traditions." },
  "Spanish Honor Society": { sponsor: "Ms. Rachel Hickson", email: "rachel.hickson@pgcps.org", schedule: "Monthly", purpose: "Promoting interest in Hispanic studies." },
  "Tennis Club": { sponsor: "Mr. David Barnes", email: "Davidb@pgcps.org", schedule: "Weekly", purpose: "Utilizing tennis courts for fun." },
  "The Lady Raiders Step Squad": { sponsor: "Ms. Krystle-Dawn Covington", email: "k.covington@pgcps.org", schedule: "Weekly", purpose: "Fostering unity and sisterhood through stepping." },
  "Thee Black & Bluezz": { sponsor: "Mr. Tramaine Hickson", email: "tramaine.hickson@pgcps.org", schedule: "Weekly", purpose: "Majorette/Dance." },
  "TLC": { sponsor: "Mr. Patrick Gleason", email: "patrick.gleason@pgcps.org", schedule: "Weekly", purpose: "Christian Fellowship." },
  "Trac Bridge Club": { sponsor: "Mr. Thomas Lambright", email: "thomas.lambright@pgcps.org", schedule: "Weekly", purpose: "Bridge game club with CMIT Middle School collaboration." },
  "Tri-M Music Honor Society": { sponsor: "Ms. Janna Ryon", email: "janna.ryon@pgcps.org", schedule: "Bi-weekly", purpose: "Honor Society for Music Students." },
  "Ultimate Frisbee Club": { sponsor: "Mr. Quindy Salomante", email: "quindy.salomante@pgcps.org", schedule: "Bi-weekly", purpose: "Playing, learning, and competing in Ultimate Frisbee." },
  "UNICEF Club": { sponsor: "Mr. Ryan Koch", email: "ryan.koch@pgcps.org", schedule: "Bi-weekly", purpose: "Spreading awareness of issues impacting children worldwide." },
  "VEX Robotics": { sponsor: "Ms. Karen Bogoski", email: "karen.bogoski@pgcps.org", schedule: "Weekly", purpose: "Design, build, and compete with VEX robots." },
  "WErSTEM": { sponsor: "Ms. Karen Bogoski", email: "karen.bogoski@pgcps.org", schedule: "Weekly", purpose: "Engineering concepts and projects." },
  "West Indian Dance Team": { sponsor: "Ms. Tanielle Tye", email: "Tanielle.Tye@pgcps.org", schedule: "Weekly", purpose: "Bonding through dance expression." },
  "Women in Business": { sponsor: "Ms. Kiersten Gregory", email: "kiersten.gregory@pgcps.org", schedule: "Weekly", purpose: "Uplifting women pursuing business careers." },
  "Youth Climate Institute / Green Schools": { sponsor: "Mr. David Eisenberg", email: "david.eisenberg@pgcps.org", schedule: "Monthly", purpose: "Green practices and environmental action." },
};

export const UNDECIDED_CAREER_EXPLORATIONS = [
  { field: "STEM & Technology", majors: ["Computer Science", "Engineering", "Biology", "Mathematics"], description: "Build, discover, and innovate through science and technology." },
  { field: "Business & Finance", majors: ["Business Administration", "Accounting", "Economics", "Marketing"], description: "Lead organizations, manage money, and drive economic growth." },
  { field: "Healthcare & Medicine", majors: ["Nursing", "Pre-Med", "Public Health", "Kinesiology"], description: "Heal, care for, and improve people's health and wellbeing." },
  { field: "Arts & Humanities", majors: ["English", "History", "Art & Design", "Music"], description: "Express, create, and interpret the human experience." },
  { field: "Social Sciences & Law", majors: ["Political Science", "Psychology", "Sociology", "Criminal Justice"], description: "Understand society, advocate for justice, and shape policy." },
  { field: "Education & Public Service", majors: ["Education", "Social Work", "Public Administration"], description: "Teach, serve communities, and make a difference in people's lives." },
];

export const ERHS_COUNSELORS = [
  { name: "Ms. Johnson", alpha: "A-D", email: "counselor.ad@pgcps.org", phone: "(301) 513-5400" },
  { name: "Ms. Williams", alpha: "E-K", email: "counselor.ek@pgcps.org", phone: "(301) 513-5400" },
  { name: "Mr. Davis", alpha: "L-R", email: "counselor.lr@pgcps.org", phone: "(301) 513-5400" },
  { name: "Ms. Martinez", alpha: "S-Z", email: "counselor.sz@pgcps.org", phone: "(301) 513-5400" },
];

export const SAT_DEADLINES = [
  { testDate: "March 8, 2025", regDeadline: "February 21, 2025", lateDeadline: "March 4, 2025" },
  { testDate: "May 3, 2025", regDeadline: "April 18, 2025", lateDeadline: "April 29, 2025" },
  { testDate: "June 7, 2025", regDeadline: "May 22, 2025", lateDeadline: "June 3, 2025" },
  { testDate: "August 23, 2025", regDeadline: "August 8, 2025", lateDeadline: "August 19, 2025" },
  { testDate: "October 4, 2025", regDeadline: "September 19, 2025", lateDeadline: "September 30, 2025" },
  { testDate: "November 1, 2025", regDeadline: "October 17, 2025", lateDeadline: "October 28, 2025" },
  { testDate: "December 6, 2025", regDeadline: "November 21, 2025", lateDeadline: "December 2, 2025" },
  { testDate: "March 14, 2026", regDeadline: "February 27, 2026", lateDeadline: "March 10, 2026" },
  { testDate: "May 9, 2026", regDeadline: "April 24, 2026", lateDeadline: "May 5, 2026" },
  { testDate: "June 6, 2026", regDeadline: "May 22, 2026", lateDeadline: "June 2, 2026" },
];

export const ACT_DEADLINES = [
  { testDate: "April 5, 2025", regDeadline: "February 28, 2025", lateDeadline: "March 14, 2025" },
  { testDate: "June 14, 2025", regDeadline: "May 9, 2025", lateDeadline: "May 23, 2025" },
  { testDate: "July 12, 2025", regDeadline: "June 6, 2025", lateDeadline: "June 20, 2025" },
  { testDate: "September 13, 2025", regDeadline: "August 8, 2025", lateDeadline: "August 22, 2025" },
  { testDate: "October 25, 2025", regDeadline: "September 19, 2025", lateDeadline: "October 3, 2025" },
  { testDate: "December 13, 2025", regDeadline: "November 7, 2025", lateDeadline: "November 21, 2025" },
  { testDate: "February 7, 2026", regDeadline: "January 2, 2026", lateDeadline: "January 16, 2026" },
  { testDate: "April 4, 2026", regDeadline: "February 27, 2026", lateDeadline: "March 13, 2026" },
];

export const ROADMAP_ITEMS: Record<string, { label: string; deadline: string }[]> = {
  "2026": [
    { label: "FAFSA Opens", deadline: "October 1, 2025" },
    { label: "SAT Test Date", deadline: "March 8, 2025" },
    { label: "SAT Registration Deadline", deadline: "February 21, 2025" },
    { label: "ACT Test Date", deadline: "April 5, 2025" },
    { label: "ACT Registration Deadline", deadline: "February 28, 2025" },
    { label: "MHEC MD State Aid Priority Deadline", deadline: "March 1, 2026" },
    { label: "Common App Deadline (most schools)", deadline: "January 15, 2026" },
    { label: "SRAR Submission", deadline: "February 15, 2026" },
    { label: "AP Exam Registration", deadline: "November 15, 2025" },
    { label: "AP Exams Begin", deadline: "May 5, 2025" },
    { label: "Graduation", deadline: "June 2026" },
  ],
  "2027": [
    { label: "Start SAT/ACT Prep", deadline: "Spring 2026" },
    { label: "SAT Test Date", deadline: "March 14, 2026" },
    { label: "SAT Registration Deadline", deadline: "February 27, 2026" },
    { label: "FAFSA Opens", deadline: "October 1, 2026" },
    { label: "MHEC MD State Aid Priority Deadline", deadline: "March 1, 2027" },
    { label: "Common App Opens", deadline: "August 1, 2026" },
    { label: "AP Exam Registration", deadline: "November 2026" },
    { label: "AP Exams Begin", deadline: "May 2027" },
    { label: "Graduation", deadline: "June 2027" },
  ],
  "2028": [
    { label: "Begin College Research", deadline: "Fall 2026" },
    { label: "Take PSAT", deadline: "October 2026" },
    { label: "Start SAT/ACT Prep", deadline: "Spring 2027" },
    { label: "First SAT Opportunity", deadline: "August 2027" },
    { label: "ACT Registration Opens", deadline: "Summer 2027" },
    { label: "Graduation", deadline: "June 2028" },
  ],
  "2029": [
    { label: "Explore Interests & Clubs", deadline: "Fall 2025" },
    { label: "Take PSAT 8/9", deadline: "October 2026" },
    { label: "Start thinking about SAT/ACT", deadline: "Spring 2028" },
    { label: "Graduation", deadline: "June 2029" },
  ],
};

export function getDefaultProfile(): UserProfile {
  return {
    major: "", gpa: "", sat: "", act: "",
    aps: [], apScores: {}, gradYear: "2027",
    clubs: [], extracurriculars: [], achievements: [],
    serviceHours: 0, isST: false, testOptional: false,
    sports: []
  };
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
