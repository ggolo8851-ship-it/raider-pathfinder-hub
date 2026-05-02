export interface ClubRole {
  club: string;
  role: "Member" | "Management" | "Founder";
}

export interface SportRole {
  sport: string;
  role: "Player" | "Captain" | "Manager";
}

export interface UserProfile {
  major: string;
  gpa: string;
  sat: string;
  act: string;
  aps: string[];
  apScores: Record<string, number>;
  gradYear: string;
  clubs: string[];
  clubRoles: ClubRole[];
  extracurriculars: string[];
  achievements: string[];
  serviceHours: number;
  isST: boolean;
  testOptional: boolean;
  sports: string[];
  sportRoles: SportRole[];
  interests: string[];
  address: string;
  city: string;
  state: string;
  zipcode: string;
  lat?: number;
  lon?: number;
  vibeAnswers?: Record<string, string>;
  emailSubscription?: {
    enabled: boolean;
    interests: string[];
  };
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

const STORAGE_VERSION = 'v2';
const DB_KEY = `raider_db_${STORAGE_VERSION}`;
const SESSION_KEY = `raider_session_${STORAGE_VERSION}`;

// One-time cleanup of old cached data from previous versions
if (typeof window !== 'undefined') {
  try {
    const cleanupFlag = `raider_cleanup_${STORAGE_VERSION}`;
    if (!localStorage.getItem(cleanupFlag)) {
      localStorage.removeItem('raider_db');
      localStorage.removeItem('raider_session');
      localStorage.setItem(cleanupFlag, '1');
    }
  } catch {}
}

export const AP_LIST = [
  "AP African American Studies",
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
  "AP Human Geography",
  "AP Japanese",
  "AP Physics",
  "AP Precalculus",
  "AP Psychology",
  "AP Research",
  "AP Seminar",
  "AP Spanish Language and Culture",
  "AP Statistics",
  "AP Studio Art 2D",
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
  "Chess Club",
  "Class of 2027",
  "Class of 2028",
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
  "Baseball (Varsity)",
  "Baseball (JV)",
  "Basketball (Boys Varsity)",
  "Basketball (Boys JV)",
  "Basketball (Girls Varsity)",
  "Basketball (Girls JV)",
  "Cheerleading",
  "Cross Country",
  "Football (Varsity)",
  "Football (JV)",
  "Golf",
  "Gymnastics",
  "Indoor Track",
  "Lacrosse (Boys)",
  "Lacrosse (Girls)",
  "Outdoor Track & Field",
  "Soccer (Boys Varsity)",
  "Soccer (Boys JV)",
  "Soccer (Girls Varsity)",
  "Soccer (Girls JV)",
  "Softball",
  "Swimming & Diving",
  "Tennis (Boys)",
  "Tennis (Girls)",
  "Volleyball (Girls)",
  "Wrestling",
];

export const ERHS_CLUB_INFO: Record<string, { sponsor: string; email: string; schedule: string; meetingDay: string; purpose: string; classification: string }> = {
  "African Student Union": { sponsor: "Ms. Janna Ryon", email: "janna.ryon@pgcps.org", schedule: "Weekly", meetingDay: "Thursday", purpose: "African Dancing/Modeling", classification: "Cultural" },
  "Art Club": { sponsor: "Ms. Monique Connealy", email: "monique.king@pgcps.org", schedule: "Weekly", meetingDay: "Tuesday", purpose: "Creating art and beautification of the school and surrounding community.", classification: "Arts" },
  "Asian Student Organization": { sponsor: "Ms. Devonne Wood", email: "devonne.wood@pgcps.org", schedule: "Bi-weekly", meetingDay: "Wednesday", purpose: "Celebrating Asian culture through events, food, dances, games, and crafts.", classification: "Cultural" },
  "ASL Club & Peer Tutoring": { sponsor: "Ms. Karen Bowers", email: "karen1.bowers@pgcps.org", schedule: "Bi-weekly", meetingDay: "Thursday", purpose: "After-school help with ASL and promoting awareness.", classification: "Academic" },
  "Badminton Club": { sponsor: "Mr. Laurent Rigal", email: "laurent.rigal@pgcps.org", schedule: "Monthly", meetingDay: "Friday", purpose: "Non-competitive badminton in a safe space.", classification: "Sports & Recreation" },
  "Baking Club": { sponsor: "Ms. Rebecca Burton", email: "rebecca.burton@pgcps.org", schedule: "Bi-weekly", meetingDay: "Wednesday", purpose: "Interactive baking and decorating environment.", classification: "Lifestyle" },
  "Cards4Kindness": { sponsor: "Ms. Kathryn Komar", email: "kathryn.komar@pgcps.org", schedule: "Bi-weekly", meetingDay: "Tuesday", purpose: "Creating cards to spread smiles and joy.", classification: "Service" },
  "Class of 2027": { sponsor: "Ms. Atika Saeed", email: "atika.saeed@pgcps.org", schedule: "Weekly", meetingDay: "Monday", purpose: "Fundraising for 2027 seniors.", classification: "Student Government" },
  "Class of 2028": { sponsor: "Ms. Glenna Leary", email: "glenna.leary@pgcps.org", schedule: "Monthly", meetingDay: "Tuesday", purpose: "Class of 2028 student government.", classification: "Student Government" },
  "Chess Club": { sponsor: "Ms. Rebecca Burton", email: "rebecca.burton@pgcps.org", schedule: "Weekly", meetingDay: "Thursday", purpose: "Developing analytical, problem-solving, and abstract reasoning skills through chess.", classification: "Academic" },
  "Cosmetology Club": { sponsor: "Ms. Judi Barrera", email: "judith.barrera@pgcps.org", schedule: "Monthly", meetingDay: "Wednesday", purpose: "Beauty, hair, and skin care skills and career exploration.", classification: "Lifestyle" },
  "Creative Writing Club": { sponsor: "Ms. Lilan Miller", email: "lilan.miller@pgcps.org", schedule: "Bi-weekly", meetingDay: "Tuesday", purpose: "Engaging in creative writing and sharing for feedback.", classification: "Arts" },
  "Crochet Club": { sponsor: "Ms. Shobha Narayanasundaram", email: "shobha.rani@pgcps.org", schedule: "Bi-weekly", meetingDay: "Monday", purpose: "Making crochet items for the community.", classification: "Arts" },
  "Debate Club": { sponsor: "Ms. Judi Barrera", email: "judith.barrera@pgcps.org", schedule: "Weekly", meetingDay: "Wednesday", purpose: "Critical thinking, persuasive speaking, and civil discourse.", classification: "Academic" },
  "Do Something Club": { sponsor: "Ms. Shobha Narayanasundaram", email: "shobha.rani@pgcps.org", schedule: "Weekly", meetingDay: "Monday", purpose: "Community service in school, Greenbelt, and nationwide.", classification: "Service" },
  "East African Club": { sponsor: "Mr. David Ellison", email: "david.ellison@pgcps.org", schedule: "Bi-weekly", meetingDay: "Thursday", purpose: "Promote East African Culture and Activities.", classification: "Cultural" },
  "Environmental Defense Club": { sponsor: "Mr. Ryan Koch", email: "ryan.koch@pgcps.org", schedule: "Weekly", meetingDay: "Tuesday", purpose: "Recycling, composting, and school beautification.", classification: "Service" },
  "ERHS Mock Trial": { sponsor: "Mr. Alexander Miletich", email: "alexander.miletich@pgcps.org", schedule: "Bi-weekly", meetingDay: "Thursday", purpose: "Academic competition simulating real courtroom trials.", classification: "Academic" },
  "ERHS Pep Band": { sponsor: "Mr. Cullen Waller", email: "cullen.waller@pgcps.org", schedule: "Weekly", meetingDay: "Friday", purpose: "Performing at ERHS student activities.", classification: "Arts" },
  "ERHS Theatre Club": { sponsor: "Ms. Angelique Sterling", email: "angelique.sterling@pgcps.org", schedule: "Weekly", meetingDay: "Monday", purpose: "Inclusive space for creating, performing, and producing theatre.", classification: "Arts" },
  "Fashion Club": { sponsor: "Ms. Chinwe Aldridge", email: "chinwe.aldridge@pgcps.org", schedule: "Monthly", meetingDay: "Wednesday", purpose: "Discussing and celebrating fashion.", classification: "Lifestyle" },
  "FBLA - Future Business Leaders of America": { sponsor: "Ms. Sherri Ray", email: "sherri.ray@pgcps.org", schedule: "Weekly", meetingDay: "Tuesday", purpose: "Business leadership through programs, conferences, and competitions.", classification: "Professional" },
  "Fiber Arts Club": { sponsor: "Mr. Ash Richman", email: "ashleigh.richman@pgcps.org", schedule: "Weekly", meetingDay: "Wednesday", purpose: "Arts education through fiber arts.", classification: "Arts" },
  "French Club": { sponsor: "Mr. Laurent Rigal", email: "laurent.rigal@pgcps.org", schedule: "Monthly", meetingDay: "Thursday", purpose: "Learning about French language and culture.", classification: "Cultural" },
  "French Honor Society": { sponsor: "Ms. Anna Cherubin", email: "cherubin@pgcps.org", schedule: "Monthly", meetingDay: "Wednesday", purpose: "Promoting French language study and community service.", classification: "Honor Society" },
  "Future Healthcare Professionals": { sponsor: "Ms. Ebony Robinson", email: "ebony2.robinson@pgcps.org", schedule: "Weekly", meetingDay: "Tuesday", purpose: "Exploring healthcare careers, resume writing, and networking.", classification: "Professional" },
  "Game Development Club": { sponsor: "Mr. David Ellison", email: "david.ellison@pgcps.org", schedule: "Bi-weekly", meetingDay: "Friday", purpose: "Promote Game Development.", classification: "STEM" },
  "Get Into Tech Club (GIT)": { sponsor: "Mr. David Eisenberg", email: "david.eisenberg@pgcps.org", schedule: "Weekly", meetingDay: "Wednesday", purpose: "Engineering projects and design challenges.", classification: "STEM" },
  "Girls Lacrosse Team": { sponsor: "Mr. Charles Mills", email: "charles.mills@pgcps.org", schedule: "Weekly", meetingDay: "Monday", purpose: "Varsity Sport.", classification: "Sports & Recreation" },
  "Guitar/RecTech Lab": { sponsor: "Mr. Kevin Hawk", email: "kevin.hawk@pgcps.org", schedule: "Bi-weekly", meetingDay: "Thursday", purpose: "Extra practice, help, and collaboration on musical projects.", classification: "Arts" },
  "History Honor Society (Rho Kappa)": { sponsor: "Ms. Gabrielle Gee", email: "gabrielle.gee@pgcps.org", schedule: "Bi-weekly", meetingDay: "Tuesday", purpose: "Honor society for Social Studies proficiency.", classification: "Honor Society" },
  "Homegrown Heroes": { sponsor: "Ms. Kathryn Komar", email: "kathryn.komar@pgcps.org", schedule: "Bi-weekly", meetingDay: "Wednesday", purpose: "Teaching sustainable gardening and food cultivation.", classification: "Service" },
  "International Club": { sponsor: "Dr. Victor Tebid", email: "victor.tebid@pgcps.org", schedule: "Bi-weekly", meetingDay: "Thursday", purpose: "Fostering inclusion and showcasing diversity.", classification: "Cultural" },
  "Investment Club": { sponsor: "TBD", email: "", schedule: "Weekly", meetingDay: "Wednesday", purpose: "Learning about investing, stock markets, and personal finance.", classification: "Professional" },
  "Italian Club and Honor Society": { sponsor: "Ms. Francesca Minisola", email: "francesca.minisola@pgcps.org", schedule: "Bi-weekly", meetingDay: "Tuesday", purpose: "Promoting Italian language and culture.", classification: "Cultural" },
  "Japanese National Honor Society": { sponsor: "Mr. Tetsuo Ogawa", email: "tetsuo.ogawa@pgcps.org", schedule: "Weekly", meetingDay: "Friday", purpose: "Promoting Japanese cultural exchanges and partnerships.", classification: "Honor Society" },
  "Jazz Club": { sponsor: "Mr. Cullen Waller", email: "cullen.waller@pgcps.org", schedule: "Weekly", meetingDay: "Monday", purpose: "Exploring, learning, and performing Jazz.", classification: "Arts" },
  "Journalism": { sponsor: "Ms. Heather Seyler", email: "heather.seyler@pgcps.org", schedule: "Weekly", meetingDay: "Tuesday", purpose: "School Newspaper.", classification: "Arts" },
  "Korean Club": { sponsor: "Mr. Bob Huh", email: "bob.huh@pgcps.org", schedule: "Weekly", meetingDay: "Thursday", purpose: "Korean language learning and cultural appreciation.", classification: "Cultural" },
  "Latin Student Association/Latin Dance": { sponsor: "Ms. Kristen Vickery", email: "kristen.vickery@pgcps.org", schedule: "Weekly", meetingDay: "Friday", purpose: "Sharing and embracing Latin culture and dance.", classification: "Cultural" },
  "Math Club": { sponsor: "Mr. Oneil Scott", email: "oneil.scott@pgcps.org", schedule: "Weekly", meetingDay: "Monday", purpose: "Encouraging math in school.", classification: "Academic" },
  "Math Honor Society": { sponsor: "Mr. Oneil Scott", email: "oneil.scott@pgcps.org", schedule: "Weekly", meetingDay: "Monday", purpose: "Math practice, tutoring, and competitions.", classification: "Honor Society" },
  "Media Club": { sponsor: "Ms. Angela Batten", email: "Angela.Batten@pgcps.org", schedule: "Weekly", meetingDay: "Wednesday", purpose: "Analyzing media and creating original content.", classification: "Arts" },
  "Media Production Team": { sponsor: "Ms. Angela Batten", email: "Angela.Batten@pgcps.org", schedule: "Weekly", meetingDay: "Wednesday", purpose: "Livestreaming school events and social media.", classification: "Arts" },
  "Model United Nations (MUN)": { sponsor: "TBD", email: "", schedule: "Weekly", meetingDay: "Thursday", purpose: "Simulating UN committees to debate global issues and develop diplomacy skills.", classification: "Academic" },
  "Music Club": { sponsor: "Ms. Janna Ryon", email: "janna.ryon@pgcps.org", schedule: "Weekly", meetingDay: "Tuesday", purpose: "Creating and performing music together.", classification: "Arts" },
  "Muslim Student Association": { sponsor: "Mr. Troy Bradbury", email: "troy.bradbury@pgcps.org", schedule: "Bi-weekly", meetingDay: "Friday", purpose: "Connecting through Islam.", classification: "Cultural" },
  "National English Honor Society": { sponsor: "Ms. Abigail Holtz", email: "abigail.holtz@pgcps.org", schedule: "Bi-weekly", meetingDay: "Tuesday", purpose: "Recognizing top English students and supporting literacy.", classification: "Honor Society" },
  "National Honor Society": { sponsor: "Ms. Andrea Short", email: "Andrea.Short@pgcps.org", schedule: "Weekly", meetingDay: "Wednesday", purpose: "Empowering students to be transformative leaders.", classification: "Honor Society" },
  "National STEM Honor Society (NSTEM)": { sponsor: "Ms. Karen Bogoski", email: "karen.bogoski@pgcps.org", schedule: "Monthly", meetingDay: "Thursday", purpose: "Recognition of exceptional STEM commitment.", classification: "Honor Society" },
  "Origami Club": { sponsor: "Ms. Devonne Wood", email: "devonne.wood@pgcps.org", schedule: "Bi-weekly", meetingDay: "Monday", purpose: "Stress-free origami art environment.", classification: "Arts" },
  "Outdoor Volleyball Club": { sponsor: "Mr. Scott Fifield", email: "scott.fifield@pgcps.org", schedule: "Bi-weekly", meetingDay: "Thursday", purpose: "Boys volleyball opportunity.", classification: "Sports & Recreation" },
  "POMS": { sponsor: "Ms. Francine Powell", email: "fpowell@pgcps.org", schedule: "Weekly", meetingDay: "Monday", purpose: "Entertainment and Competitions.", classification: "Arts" },
  "Programming Club": { sponsor: "Ms. Karen Bogoski", email: "karen.bogoski@pgcps.org", schedule: "Weekly", meetingDay: "Tuesday", purpose: "Learning and working on programming problems.", classification: "STEM" },
  "Raider Book Club": { sponsor: "Ms. Rachel Hickson", email: "rachel.hickson@pgcps.org", schedule: "Bi-weekly", meetingDay: "Wednesday", purpose: "Reading and discussing novels.", classification: "Academic" },
  "Red Cross Club": { sponsor: "Ms. Shobha Narayanasundaram", email: "shobha.rani@pgcps.org", schedule: "Bi-weekly", meetingDay: "Thursday", purpose: "Community service.", classification: "Service" },
  "Science National Honor Society": { sponsor: "Ms. Rebecca Hammonds", email: "rebecca.howell@pgcps.org", schedule: "Monthly", meetingDay: "Wednesday", purpose: "Encouraging excellence in the ERHS science community.", classification: "Honor Society" },
  "Science Olympiad Team": { sponsor: "Ms. Ebony Robinson", email: "ebony2.robinson@pgcps.org", schedule: "Weekly", meetingDay: "Monday", purpose: "Competing in science and engineering events.", classification: "STEM" },
  "Seminar Club": { sponsor: "Mr. Troy Bradbury", email: "troy.bradbury@pgcps.org", schedule: "Bi-weekly", meetingDay: "Friday", purpose: "Discussing current events.", classification: "Academic" },
  "South Asian Student Association (SASA)": { sponsor: "Ms. Jeeva Ashok", email: "jeeva.ashok@pgcps.org", schedule: "Bi-weekly", meetingDay: "Tuesday", purpose: "Learning about South Asian culture and traditions.", classification: "Cultural" },
  "Spanish Honor Society": { sponsor: "Ms. Rachel Hickson", email: "rachel.hickson@pgcps.org", schedule: "Monthly", meetingDay: "Thursday", purpose: "Promoting interest in Hispanic studies.", classification: "Honor Society" },
  "Tennis Club": { sponsor: "Mr. David Barnes", email: "Davidb@pgcps.org", schedule: "Weekly", meetingDay: "Friday", purpose: "Utilizing tennis courts for fun.", classification: "Sports & Recreation" },
  "The Lady Raiders Step Squad": { sponsor: "Ms. Krystle-Dawn Covington", email: "k.covington@pgcps.org", schedule: "Weekly", meetingDay: "Monday", purpose: "Fostering unity and sisterhood through stepping.", classification: "Arts" },
  "Thee Black & Bluezz": { sponsor: "Mr. Tramaine Hickson", email: "tramaine.hickson@pgcps.org", schedule: "Weekly", meetingDay: "Tuesday", purpose: "Majorette/Dance.", classification: "Arts" },
  "TLC": { sponsor: "Mr. Patrick Gleason", email: "patrick.gleason@pgcps.org", schedule: "Weekly", meetingDay: "Wednesday", purpose: "Christian Fellowship.", classification: "Cultural" },
  "Trac Bridge Club": { sponsor: "Mr. Thomas Lambright", email: "thomas.lambright@pgcps.org", schedule: "Weekly", meetingDay: "Thursday", purpose: "Bridge game club with CMIT Middle School collaboration.", classification: "Academic" },
  "Tri-M Music Honor Society": { sponsor: "Ms. Janna Ryon", email: "janna.ryon@pgcps.org", schedule: "Bi-weekly", meetingDay: "Wednesday", purpose: "Honor Society for Music Students.", classification: "Honor Society" },
  "Ultimate Frisbee Club": { sponsor: "Mr. Quindy Salomante", email: "quindy.salomante@pgcps.org", schedule: "Bi-weekly", meetingDay: "Friday", purpose: "Playing, learning, and competing in Ultimate Frisbee.", classification: "Sports & Recreation" },
  "UNICEF Club": { sponsor: "Mr. Ryan Koch", email: "ryan.koch@pgcps.org", schedule: "Bi-weekly", meetingDay: "Tuesday", purpose: "Spreading awareness of issues impacting children worldwide.", classification: "Service" },
  "VEX Robotics": { sponsor: "Ms. Karen Bogoski", email: "karen.bogoski@pgcps.org", schedule: "Weekly", meetingDay: "Thursday", purpose: "Design, build, and compete with VEX robots.", classification: "STEM" },
  "WErSTEM": { sponsor: "Ms. Karen Bogoski", email: "karen.bogoski@pgcps.org", schedule: "Weekly", meetingDay: "Monday", purpose: "Engineering concepts and projects.", classification: "STEM" },
  "West Indian Dance Team": { sponsor: "Ms. Tanielle Tye", email: "Tanielle.Tye@pgcps.org", schedule: "Weekly", meetingDay: "Wednesday", purpose: "Bonding through dance expression.", classification: "Arts" },
  "Women in Business": { sponsor: "Ms. Kiersten Gregory", email: "kiersten.gregory@pgcps.org", schedule: "Weekly", meetingDay: "Thursday", purpose: "Uplifting women pursuing business careers.", classification: "Professional" },
  "Youth Climate Institute / Green Schools": { sponsor: "Mr. David Eisenberg", email: "david.eisenberg@pgcps.org", schedule: "Monthly", meetingDay: "Friday", purpose: "Green practices and environmental action.", classification: "Service" },
};

export const CLUB_CLASSIFICATIONS = [
  "All",
  "Academic",
  "Arts",
  "Cultural",
  "Honor Society",
  "Lifestyle",
  "Professional",
  "Service",
  "Sports & Recreation",
  "STEM",
  "Student Government",
];

export const UNDECIDED_CAREER_EXPLORATIONS = [
  { field: "STEM & Technology", majors: ["Computer Science", "Information Technology", "Data Science", "Artificial Intelligence", "Cybersecurity", "Software Engineering"], description: "Build, discover, and innovate through science and technology." },
  { field: "Engineering", majors: ["Mechanical Engineering", "Civil Engineering", "Electrical Engineering", "Chemical Engineering", "Biomedical Engineering", "Aerospace Engineering"], description: "Design and build the systems and structures that shape our world." },
  { field: "Business & Finance", majors: ["Business Administration", "Accounting", "Economics", "Marketing", "Finance", "Entrepreneurship", "Supply Chain Management", "Real Estate"], description: "Lead organizations, manage money, and drive economic growth." },
  { field: "Healthcare & Medicine", majors: ["Nursing", "Pre-Med", "Public Health", "Kinesiology", "Pharmacy", "Dental Hygiene", "Health Administration", "Occupational Therapy", "Physical Therapy"], description: "Heal, care for, and improve people's health and wellbeing." },
  { field: "Arts & Humanities", majors: ["English", "History", "Art & Design", "Music", "Philosophy", "Film Studies", "Theater", "Creative Writing", "Graphic Design", "Animation"], description: "Express, create, and interpret the human experience." },
  { field: "Social Sciences & Law", majors: ["Political Science", "Psychology", "Sociology", "Criminal Justice", "Pre-Law", "Anthropology", "International Relations", "Urban Planning"], description: "Understand society, advocate for justice, and shape policy." },
  { field: "Education & Public Service", majors: ["Education", "Social Work", "Public Administration", "Counseling", "Special Education", "Early Childhood Education"], description: "Teach, serve communities, and make a difference in people's lives." },
  { field: "Communications & Media", majors: ["Journalism", "Communications", "Public Relations", "Broadcasting", "Digital Media", "Advertising", "Film Production"], description: "Tell stories, inform the public, and shape media narratives." },
  { field: "Environmental & Earth Sciences", majors: ["Environmental Science", "Sustainability", "Marine Biology", "Geology", "Climate Science", "Agricultural Science", "Forestry"], description: "Protect the planet and study natural systems." },
  { field: "Architecture & Design", majors: ["Architecture", "Interior Design", "Industrial Design", "Landscape Architecture", "Urban Design"], description: "Shape the built environment and create functional spaces." },
  { field: "Culinary & Hospitality", majors: ["Culinary Arts", "Hospitality Management", "Hotel Management", "Event Planning", "Food Science"], description: "Create memorable experiences through food and service." },
  { field: "Sports & Athletics", majors: ["Sports Management", "Exercise Science", "Athletic Training", "Sports Medicine", "Recreation Management"], description: "Turn your passion for sports into a career." },
];

export interface CounselorInfo {
  grade: string;
  alphaRange: string;
  name: string;
  email: string;
  phone: string;
}

export const ERHS_COUNSELORS_BY_GRADE: CounselorInfo[] = [
  { grade: "9", alphaRange: "A-K", name: "Chandrika Ramsey", email: "chandrik.ramsey@pgcps.org", phone: "(301) 513-5400" },
  { grade: "9", alphaRange: "L-Z", name: "Lolethia Lomax-Frazier", email: "Ifrazier@pgcps.org", phone: "(301) 513-5400" },
  { grade: "10", alphaRange: "A-K", name: "Veronica Alston", email: "veronica.alston@pgcps.org", phone: "(301) 513-5400" },
  { grade: "10", alphaRange: "L-Z", name: "Pamela Roberts", email: "pamela.roberts@pgcps.org", phone: "(301) 513-5400" },
  { grade: "11", alphaRange: "A-K", name: "Thea Johnson", email: "thea.johnson@pgcps.org", phone: "(301) 513-5400" },
  { grade: "11", alphaRange: "L-Z", name: "Devonne Wood", email: "devonne.wood@pgcps.org", phone: "(301) 513-5400" },
  { grade: "12", alphaRange: "A-K", name: "Chereka Russell", email: "chereka.russell@pgcps.org", phone: "(301) 513-5400" },
  { grade: "12", alphaRange: "L-Z", name: "Jason Powell", email: "jason.powell@pgcps.org", phone: "(301) 513-5400" },
];

export const ERHS_COUNSELOR_CHAIR = {
  name: "Dr. Marisha Stewart",
  title: "Chairperson",
  email: "marisha.stewart@pgcps.org",
  phone: "(301) 513-5400",
};

export const ERHS_COUNSELORS = ERHS_COUNSELORS_BY_GRADE.map(c => ({
  name: c.name,
  alpha: `Grade ${c.grade} (${c.alphaRange})`,
  email: c.email,
  phone: c.phone,
}));

export const SAT_DEADLINES = [
  { testDate: "August 23, 2025", regDeadline: "August 8, 2025", lateDeadline: "August 12, 2025" },
  { testDate: "September 13, 2025", regDeadline: "August 29, 2025", lateDeadline: "September 2, 2025" },
  { testDate: "October 4, 2025", regDeadline: "September 19, 2025", lateDeadline: "September 23, 2025" },
  { testDate: "November 8, 2025", regDeadline: "October 24, 2025", lateDeadline: "October 28, 2025" },
  { testDate: "December 6, 2025", regDeadline: "November 21, 2025", lateDeadline: "November 25, 2025" },
  { testDate: "March 14, 2026", regDeadline: "February 27, 2026", lateDeadline: "March 3, 2026" },
  { testDate: "May 2, 2026", regDeadline: "April 17, 2026", lateDeadline: "April 21, 2026" },
  { testDate: "June 6, 2026", regDeadline: "May 22, 2026", lateDeadline: "May 26, 2026" },
  { testDate: "August 22, 2026", regDeadline: "TBD", lateDeadline: "TBD" },
  { testDate: "September 12, 2026", regDeadline: "TBD", lateDeadline: "TBD" },
  { testDate: "October 3, 2026", regDeadline: "TBD", lateDeadline: "TBD" },
  { testDate: "November 7, 2026", regDeadline: "TBD", lateDeadline: "TBD" },
  { testDate: "December 5, 2026", regDeadline: "TBD", lateDeadline: "TBD" },
  { testDate: "March 6, 2027", regDeadline: "TBD", lateDeadline: "TBD" },
  { testDate: "May 1, 2027", regDeadline: "TBD", lateDeadline: "TBD" },
  { testDate: "June 5, 2027", regDeadline: "TBD", lateDeadline: "TBD" },
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

export const VIBE_POLL_QUESTIONS = [
  {
    id: "setting",
    category: "Vibe & Atmosphere",
    question: "If you were in a movie, would the background be...",
    optionA: "🏙️ A bustling neon city",
    optionB: "🌲 A quiet, historical forest town",
    tagA: "urban", tagB: "rural",
  },
  {
    id: "social",
    category: "Vibe & Atmosphere",
    question: "Your ideal Friday night?",
    optionA: "🎉 100-person house party",
    optionB: "🎲 4-person board game night",
    tagA: "large_social", tagB: "small_social",
  },
  {
    id: "aesthetic",
    category: "Vibe & Atmosphere",
    question: "Campus aesthetic preference?",
    optionA: "🏢 Modern glass high-rises",
    optionB: "🏰 Hogwarts-style brick & ivy",
    tagA: "modern", tagB: "traditional",
  },
  {
    id: "classsize",
    category: "Academic Style",
    question: "In class, would you rather...",
    optionA: "👥 Be anonymous in a 500-seat lecture",
    optionB: "🙋 Have the professor know your name",
    tagA: "large_class", tagB: "small_class",
  },
  {
    id: "study",
    category: "Academic Style",
    question: "Your ideal study spot?",
    optionA: "📚 Silent library cubicle",
    optionB: "☕ Noisy coffee shop with chatter",
    tagA: "quiet_study", tagB: "social_study",
  },
  {
    id: "climate",
    category: "Lifestyle",
    question: "Could you survive a winter where the sun sets at 4 PM?",
    optionA: "❄️ Bring it on, I love snow!",
    optionB: "☀️ No way, I need sunshine",
    tagA: "cold_ok", tagB: "warm_pref",
  },
  {
    id: "weekend",
    category: "Lifestyle",
    question: "On Saturdays, where are you?",
    optionA: "🏈 At a massive football stadium",
    optionB: "🛍️ Exploring a local thrift shop",
    tagA: "big_sports", tagB: "local_culture",
  },
  {
    id: "priority",
    category: "Post-Grad Ambition",
    question: "Which matters more to you?",
    optionA: "🏛️ A prestigious name on your diploma",
    optionB: "💰 Leaving college with zero debt",
    tagA: "prestige", tagB: "value",
  },
  {
    id: "career_support",
    category: "Post-Grad Ambition",
    question: "Career support style?",
    optionA: "🎁 School hands you an internship",
    optionB: "🔍 School teaches you to find your own",
    tagA: "structured_career", tagB: "independent_career",
  },
  {
    id: "quickfire",
    category: "Quick Fire",
    question: "Mountain view or Ocean breeze?",
    optionA: "⛰️ Mountain view",
    optionB: "🌊 Ocean breeze",
    tagA: "mountain", tagB: "ocean",
  },
];

// Updated for Class of 2026 — PGCPS / Maryland State Department of Education.
// Source: https://www.pgcps.org/offices/curriculum-and-instruction/graduation-requirements
export const MD_GRADUATION_REQUIREMENTS = [
  { subject: "English", credits: "4" },
  { subject: "Mathematics (Algebra I+)", credits: "4" },
  { subject: "Science (incl. Biology & one lab science)", credits: "3" },
  { subject: "Social Studies (US History, World History, Gov)", credits: "3" },
  { subject: "Physical Education", credits: "0.5" },
  { subject: "Health Education", credits: "0.5" },
  { subject: "Fine Arts", credits: "1" },
  { subject: "Technology Education", credits: "1" },
  { subject: "World Language / Advanced Tech Ed", credits: "2" },
  { subject: "Electives", credits: "3" },
  { subject: "Total Credits Required", credits: "22" },
  { subject: "Student Service Learning (SSL)", credits: "24 hours" },
];

export const ROADMAP_ITEMS: Record<string, { label: string; deadline: string }[]> = {
  "2026": [
    { label: "FAFSA Opens for 2026-27", deadline: "October 1, 2025" },
    { label: "AP Exam Registration Deadline", deadline: "November 15, 2025" },
    { label: "Common App Deadline (most schools)", deadline: "January 15, 2026" },
    { label: "SRAR Submission Deadline", deadline: "February 15, 2026" },
    { label: "SAT Test Date", deadline: "March 14, 2026" },
    { label: "MHEC MD State Aid Priority Deadline", deadline: "March 1, 2026" },
    { label: "AP Exams Begin", deadline: "May 4, 2026" },
    { label: "ERHS Graduation", deadline: "June 4, 2026" },
  ],
  "2027": [
    { label: "Start SAT/ACT Prep", deadline: "Spring 2026" },
    { label: "SAT Test Date", deadline: "March 14, 2026" },
    { label: "SAT Registration Deadline", deadline: "February 27, 2026" },
    { label: "Common App Opens", deadline: "August 1, 2026" },
    { label: "FAFSA Opens for 2027-28", deadline: "October 1, 2026" },
    { label: "AP Exam Registration", deadline: "November 2026" },
    { label: "MHEC MD State Aid Priority Deadline", deadline: "March 1, 2027" },
    { label: "AP Exams Begin", deadline: "May 2027" },
    { label: "ERHS Graduation", deadline: "June 2027" },
  ],
  "2028": [
    { label: "Begin College Research", deadline: "Fall 2026" },
    { label: "Take PSAT", deadline: "October 2026" },
    { label: "Start SAT/ACT Prep", deadline: "Spring 2027" },
    { label: "First SAT Opportunity", deadline: "August 2027" },
    { label: "ACT Registration Opens", deadline: "Summer 2027" },
    { label: "ERHS Graduation", deadline: "June 2028" },
  ],
  "2029": [
    { label: "Explore Interests & Clubs", deadline: "Fall 2025" },
    { label: "Take PSAT 8/9", deadline: "October 2026" },
    { label: "Start thinking about SAT/ACT", deadline: "Spring 2028" },
    { label: "ERHS Graduation", deadline: "June 2029" },
  ],
};

export function getDefaultProfile(): UserProfile {
  return {
    major: "", gpa: "", sat: "", act: "",
    aps: [], apScores: {}, gradYear: "2027",
    clubs: [], clubRoles: [],
    extracurriculars: [], achievements: [],
    serviceHours: 0, isST: false, testOptional: false,
    sports: [], sportRoles: [],
    interests: [],
    address: "", city: "", state: "MD", zipcode: "",
    vibeAnswers: {},
    emailSubscription: { enabled: false, interests: [] },
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
