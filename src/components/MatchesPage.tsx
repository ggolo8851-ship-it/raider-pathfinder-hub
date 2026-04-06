import { useState, useEffect } from "react";
import { searchColleges, getCareerMatches, CollegeResult, CareerMatch } from "@/lib/college-api";
import { UserProfile } from "@/lib/store";

interface MatchesPageProps {
  profile: UserProfile;
}

const MatchesPage = ({ profile }: MatchesPageProps) => {
  const [tab, setTab] = useState<"colleges" | "careers">("colleges");
  const [distance, setDistance] = useState(500);
  const [colleges, setColleges] = useState<CollegeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [careers, setCareers] = useState<CareerMatch[]>([]);

  useEffect(() => {
    setCareers(getCareerMatches(profile.major, profile.aps));
  }, [profile.major, profile.aps]);

  useEffect(() => {
    if (tab === "colleges") {
      setLoading(true);
      searchColleges(profile.major, distance)
        .then(setColleges)
        .catch(() => setColleges([]))
        .finally(() => setLoading(false));
    }
  }, [profile.major, distance, tab]);

  return (
    <div className="max-w-4xl mx-auto py-10 px-5">
      <div className="flex gap-2 mb-8">
        <button onClick={() => setTab("colleges")}
          className={`px-6 py-2.5 rounded-lg font-semibold transition-colors ${tab === "colleges" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
          🎓 College Matches
        </button>
        <button onClick={() => setTab("careers")}
          className={`px-6 py-2.5 rounded-lg font-semibold transition-colors ${tab === "careers" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
          💼 Career Matches
        </button>
      </div>

      {tab === "colleges" && (
        <>
          <div className="mb-6">
            <label className="text-sm font-semibold text-foreground">Search Distance: {distance} miles</label>
            <input type="range" min="50" max="2000" step="50" value={distance}
              onChange={e => setDistance(Number(e.target.value))}
              className="w-full mt-2 accent-primary" />
          </div>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Scanning college databases...</p>
          ) : colleges.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No schools found. Try increasing the search distance.</p>
          ) : (
            colleges.map((c, i) => (
              <div key={i} className="bg-card rounded-xl shadow-md p-5 mb-4 flex justify-between items-center border-l-8 border-primary">
                <div>
                  <span className="text-xs font-bold text-secondary">MATCH RANK #{i + 1}</span>
                  <h4 className="text-lg font-bold text-primary">{c.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {c.city}, {c.state} • <b>{c.miles.toFixed(1)} miles away</b>
                    {c.majorPercentage > 0 && <> • {(c.majorPercentage * 100).toFixed(0)}% in your field</>}
                  </p>
                </div>
                <a href={c.url} target="_blank" rel="noopener noreferrer"
                  className="bg-secondary text-secondary-foreground px-5 py-2.5 rounded-lg font-bold hover:opacity-90 transition-opacity whitespace-nowrap">
                  Website ↗
                </a>
              </div>
            ))
          )}
        </>
      )}

      {tab === "careers" && (
        <div>
          <p className="text-sm text-muted-foreground mb-6">
            Based on your interest in <b>{profile.major || "your selected field"}</b> and AP courses
          </p>
          {careers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Update your profile with a major to see career matches.</p>
          ) : (
            careers.map((c, i) => (
              <div key={i} className="bg-card rounded-xl shadow-md p-5 mb-4 border-l-8 border-secondary">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <h4 className="text-lg font-bold text-primary">{c.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{c.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-secondary">{c.salaryRange}</p>
                    <p className="text-xs text-muted-foreground">{c.growth}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MatchesPage;
