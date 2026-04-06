interface HomePageProps {
  username: string;
}

const HomePage = ({ username }: HomePageProps) => {
  return (
    <div>
      <div className="home-bg text-primary-foreground py-16 px-5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-2">Welcome, {username}!</h2>
          <div className="bg-card/10 backdrop-blur-sm border-l-4 border-secondary rounded-r-xl p-6 mt-6">
            <h3 className="text-xl font-semibold text-secondary mb-2">ERHS Students for Success</h3>
            <p className="text-primary-foreground/90 leading-relaxed">
              "ERHS Students for Success is a student-run group that helps other students succeed in school and plan for their future.
              Our goal is simple: Make sure every student has access to what they need to succeed."
            </p>
          </div>
          <div className="flex flex-wrap gap-3 mt-8">
            <a href="https://www.instagram.com/erhsstudentsforsuccess/" target="_blank" rel="noopener noreferrer"
              className="bg-[hsl(340,75%,55%)] text-primary-foreground px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity">
              ERHS Instagram 📸
            </a>
            <a href="https://www.pgcps.org/eleanorroosevelthighschool/" target="_blank" rel="noopener noreferrer"
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
