import EditableText from "@/components/EditableText";

interface Opportunity {
  name: string;
  url: string;
  area: string;
  description: string;
  category: "Service" | "Environment" | "Education" | "Health" | "Community" | "Animals";
}

// Curated Greenbelt / Prince George's County / DMV-area volunteer orgs that
// reliably award SSL hours for ERHS students.
const OPPORTUNITIES: Opportunity[] = [
  { name: "Greenbelt CARES Youth Services", url: "https://www.greenbeltmd.gov/government/departments-services/cares", area: "Greenbelt, MD", description: "Youth tutoring, mentoring, and family support programs.", category: "Community" },
  { name: "Greenbelt Park (NPS)", url: "https://www.nps.gov/gree/getinvolved/volunteer.htm", area: "Greenbelt, MD", description: "Trail maintenance, invasive plant removal, visitor outreach.", category: "Environment" },
  { name: "Prince George's County Memorial Library System", url: "https://www.pgcmls.info/teen-volunteer", area: "PG County, MD", description: "Summer reading helpers, shelving, tech tutoring.", category: "Education" },
  { name: "Capital Area Food Bank", url: "https://www.capitalareafoodbank.org/get-involved/volunteer/", area: "Hyattsville, MD", description: "Sort and pack groceries for DMV families in need.", category: "Service" },
  { name: "Doctors Community Hospital Volunteer Program", url: "https://www.luminis.health/locations/luminis-health-doctors-community-medical-center/give-and-volunteer/", area: "Lanham, MD", description: "Volunteer in patient transport, gift shop, and front desk.", category: "Health" },
  { name: "Anacostia Watershed Society", url: "https://www.anacostiaws.org/volunteer", area: "Bladensburg, MD", description: "River cleanups, tree plantings, water quality monitoring.", category: "Environment" },
  { name: "City of Greenbelt Recreation", url: "https://www.greenbeltmd.gov/government/departments-services/recreation/volunteer", area: "Greenbelt, MD", description: "Help run camps, sports clinics, festivals, and city events.", category: "Community" },
  { name: "Beltsville Community Center", url: "https://www.pgparks.com/3115/Beltsville-Community-Center", area: "Beltsville, MD", description: "Youth program assistants, event setup, after-school helpers.", category: "Community" },
  { name: "Prince George's SPCA", url: "https://pgspca.org/volunteer/", area: "Bowie, MD", description: "Care for shelter animals, adoption events, kennel work.", category: "Animals" },
  { name: "Habitat for Humanity Metro Maryland", url: "https://habitatmm.org/get-involved/volunteer/", area: "Silver Spring, MD", description: "Build and renovate homes; ages 16+ on the build site.", category: "Service" },
  { name: "American Red Cross — National Capital Region", url: "https://www.redcross.org/local/dc/volunteer.html", area: "Washington, DC", description: "Disaster response, blood drive support, youth leadership.", category: "Service" },
  { name: "Smithsonian Visitor Information & Associates", url: "https://www.si.edu/volunteer", area: "Washington, DC", description: "Visitor services and behind-the-scenes museum support.", category: "Education" },
  { name: "DC Central Kitchen", url: "https://dccentralkitchen.org/volunteer/", area: "Washington, DC", description: "Meal prep that fights hunger and trains job-seekers.", category: "Service" },
  { name: "Patuxent Research Refuge", url: "https://www.fws.gov/refuge/patuxent-research/get-involved", area: "Laurel, MD", description: "Wildlife habitat work and nature center education.", category: "Environment" },
  { name: "PGCPS Service Learning Portal", url: "https://www.pgcps.org/offices/student-engagement-and-school-support/student-service-learning", area: "PG County, MD", description: "Official PGCPS list of approved SSL opportunities.", category: "Education" },
];

const CATEGORY_COLORS: Record<Opportunity["category"], string> = {
  Service: "bg-primary/10 text-primary",
  Environment: "bg-green-500/15 text-green-700 dark:text-green-400",
  Education: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  Health: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  Community: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  Animals: "bg-purple-500/15 text-purple-700 dark:text-purple-400",
};

const VolunteerPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-5">
      <div className="bg-card rounded-2xl shadow-lg p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">
          <EditableText textKey="volunteer.title" defaultValue="🤝 Local Volunteer Opportunities" />
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          <EditableText
            textKey="volunteer.subtitle"
            defaultValue="Verified Greenbelt-area orgs that count toward your 24 SSL hours and look great on college apps."
          />
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {OPPORTUNITIES.map(o => (
            <a
              key={o.name}
              href={o.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-border rounded-xl p-4 hover:border-primary hover:shadow-md transition-all bg-card"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-foreground text-sm leading-snug">{o.name}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${CATEGORY_COLORS[o.category]}`}>
                  {o.category}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">📍 {o.area}</p>
              <p className="text-xs text-foreground/80 leading-relaxed">{o.description}</p>
            </a>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border text-xs text-muted-foreground">
          💡 Always confirm SSL credit with your school counselor before starting. Most orgs require an SSL Verification Form signed by your supervisor.
        </div>
      </div>
    </div>
  );
};

export default VolunteerPage;
