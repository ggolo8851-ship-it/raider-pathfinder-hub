import { ROADMAP_ITEMS } from "@/lib/store";

interface HomePageProps {
  username: string;
  gradYear: string;
  profile: {
    serviceHours: number;
    isST: boolean;
    aps: string[];
    clubs: string[];
    extracurriculars: string[];
    achievements: string[];
  };
}

const HomePage = ({ username, gradYear, profile }: HomePageProps) => {
  // Financial aid countdown - March 1 of grad year
  const marchDeadline = new Date(`March 1, ${gradYear}`);
  const now = new Date();
  const daysUntilMarch = Math.max(0, Math.ceil((marchDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const roadmap = ROADMAP_ITEMS[gradYear] || [];

  return (
    <div>
      <div className="home-bg text-primary-foreground py-16 px-5 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="text-4xl font-bold mb-2">Welcome, {username}!</h2>
          <div className="bg-card/10 backdrop-blur-sm border-l-4 border-secondary rounded-r-xl p-6 mt-6">
            <h3 className="text-xl font-semibold text-secondary mb-2">ERHS Students for Success</h3>
            <p className="text-primary-foreground/90 leading-relaxed">
              "ERHS Students for Success is a student-run group that helps other students succeed in school and plan for their future.
              Our goal is simple: Make sure every student has access to what they need to succeed."
            </p>
          </div>

          {/* Financial Aid Countdown */}
          {daysUntilMarch > 0 && (
            <div className="bg-destructive/20 backdrop-blur-sm border-l-4 border-destructive rounded-r-xl p-4 mt-4">
              <p className="font-bold text-lg">⏳ Financial Aid Countdown: <span className="text-secondary">{daysUntilMarch} days</span> until MHEC Priority Deadline (March 1, {gradYear})</p>
              <p className="text-sm text-primary-foreground/80">Howard P. Rawlings Grant & MD state aid require early filing!</p>
            </div>
          )}

          {/* S/T Alert */}
          {profile.isST && (
            <div className="bg-secondary/30 backdrop-blur-sm border-l-4 border-secondary rounded-r-xl p-4 mt-4">
              <p className="font-bold">🔬 S/T Program Student</p>
              <p className="text-sm text-primary-foreground/80">Remember: Math every year through Pre-Calc Honors+, 3-4 advanced STEM credits with at least 1 AP.</p>
            </div>
          )}

          {/* Service Hours Progress */}
          <div className="bg-card/10 backdrop-blur-sm rounded-xl p-4 mt-4">
            <p className="font-semibold mb-2">📋 Student Service Hours: {profile.serviceHours}/24</p>
            <div className="h-3 bg-primary-foreground/20 rounded-full overflow-hidden">
              <div className="h-full bg-secondary rounded-full transition-all" style={{ width: `${Math.min(100, (profile.serviceHours / 24) * 100)}%` }} />
            </div>
            {profile.serviceHours >= 24 && <p className="text-secondary text-sm mt-1 font-bold">✅ Requirement Complete!</p>}
          </div>

          {/* Resource Links */}
          <div className="flex flex-wrap gap-3 mt-8">
            <a href="https://www.instagram.com/erhsstudentsforsuccess/" target="_blank" rel="noopener noreferrer"
              className="bg-[hsl(340,75%,55%)] text-primary-foreground px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity">
              ERHS Instagram 📸
            </a>
            <a href="https://www.pgcps.org/schools/eleanor-roosevelt-high" target="_blank" rel="noopener noreferrer"
              className="bg-secondary text-secondary-foreground px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity">
              School Site
            </a>
            <a href="https://www.collegeboard.org/" target="_blank" rel="noopener noreferrer"
              className="bg-primary-foreground text-primary px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity">
              CollegeBoard
            </a>
            <a href="https://www.pgcps.org/offices/student-services/school-counseling/scholarships" target="_blank" rel="noopener noreferrer"
              className="bg-secondary text-secondary-foreground px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity">
              Scholarships 🎓
            </a>
            <a href="https://pgcpsmd.scriborder.com/" target="_blank" rel="noopener noreferrer"
              className="bg-primary-foreground text-primary px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity">
              Transcript 📄
            </a>
            <a href="https://www.pgcps.org/offices/student-services/school-counseling/schoolinks" target="_blank" rel="noopener noreferrer"
              className="bg-secondary text-secondary-foreground px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity">
              SchooLinks 🔗
            </a>
            <a href="https://studentaid.gov/h/apply-for-aid/fafsa" target="_blank" rel="noopener noreferrer"
              className="bg-primary-foreground text-primary px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity">
              FAFSA 💰
            </a>
            <a href="https://mdcaps.mhec.state.md.us/" target="_blank" rel="noopener noreferrer"
              className="bg-secondary text-secondary-foreground px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity">
              MHEC / MDCAPS 🏛️
            </a>
            <a href="https://marylandsfaa.org/" target="_blank" rel="noopener noreferrer"
              className="bg-primary-foreground text-primary px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity">
              MSFAA (Dream Act) 🌟
            </a>
          </div>
        </div>
      </div>

      {/* Raider Roadmap */}
      <div className="max-w-4xl mx-auto py-10 px-5">
        <h3 className="text-2xl font-bold text-primary mb-6">🗺️ Raider Roadmap — Class of {gradYear}</h3>
        <div className="space-y-3">
          {roadmap.map((item, i) => (
            <div key={i} className="bg-card rounded-xl shadow-sm p-4 border-l-4 border-primary flex justify-between items-center">
              <div>
                <p className="font-semibold text-foreground">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.deadline}</p>
              </div>
              <span className="text-xs bg-muted px-3 py-1 rounded-full text-muted-foreground">Upcoming</span>
            </div>
          ))}
        </div>

        {/* Profile Snapshot */}
        <h3 className="text-2xl font-bold text-primary mt-10 mb-4">📊 Your Profile Snapshot</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl shadow-sm p-4 text-center">
            <p className="text-3xl font-bold text-primary">{profile.aps.length}</p>
            <p className="text-sm text-muted-foreground">AP Courses</p>
          </div>
          <div className="bg-card rounded-xl shadow-sm p-4 text-center">
            <p className="text-3xl font-bold text-secondary">{profile.clubs.length}</p>
            <p className="text-sm text-muted-foreground">Clubs</p>
          </div>
          <div className="bg-card rounded-xl shadow-sm p-4 text-center">
            <p className="text-3xl font-bold text-primary">{profile.extracurriculars.length}</p>
            <p className="text-sm text-muted-foreground">Extracurriculars</p>
          </div>
          <div className="bg-card rounded-xl shadow-sm p-4 text-center">
            <p className="text-3xl font-bold text-secondary">{profile.achievements.length}</p>
            <p className="text-sm text-muted-foreground">Achievements</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
