import { useState, useEffect } from "react";
import { searchColleges, getCareerMatches, CollegeResult, CareerMatch, SearchFilters } from "@/lib/college-api";
import { UserProfile } from "@/lib/store";

interface MatchesPageProps {
  profile: UserProfile;
  email: string;
}

const MatchesPage = ({ profile, email }: MatchesPageProps) => {
  const [tab, setTab] = useState<"colleges" | "careers">("colleges");
  const [distance, setDistance] = useState(500);
  const [sizeFilter, setSizeFilter] = useState("all");
  const [maxCost, setMaxCost] = useState(0);
  const [colleges, setColleges] = useState<CollegeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [careers, setCareers] = useState<CareerMatch[]>([]);

  useEffect(() => {
    setCareers(getCareerMatches(profile.major, profile.aps, profile.clubs || []));
  }, [profile.major, profile.aps, profile.clubs]);

  useEffect(() => {
    if (tab === "colleges") {
      setLoading(true);
      const filters: SearchFilters = { distance, sizeFilter, maxCost };
      searchColleges(profile.major, filters, email, profile.gpa, profile.aps, profile.clubs || [])
        .then(setColleges)
        .catch(() => setColleges([]))
        .finally(() => setLoading(false));
    }
  }, [profile.major, distance, tab, sizeFilter, maxCost, email, profile.gpa, profile.aps, profile.clubs]);

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
          <div className="mb-6 space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground">Search Distance: {distance} miles</label>
              <input type="range" min="50" max="2000" step="50" value={distance}
                onChange={e => setDistance(Number(e.target.value))}
                className="w-full mt-2 accent-primary" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground">School Size</label>
                <select value={sizeFilter} onChange={e => setSizeFilter(e.target.value)}
                  className="w-full p-2 mt-1 border border-input rounded-lg bg-card text-sm">
                  <option value="all">All Sizes</option>
                  <option value="small">Small (&lt;2,000)</option>
                  <option value="medium">Medium (2K-10K)</option>
                  <option value="large">Large (10K-25K)</option>
                  <option value="verylarge">Very Large (25K+)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground">Max Tuition/Year</label>
                <select value={maxCost} onChange={e => setMaxCost(Number(e.target.value))}
                  className="w-full p-2 mt-1 border border-input rounded-lg bg-card text-sm">
                  <option value="0">No Limit</option>
                  <option value="10000">Under $10,000</option>
                  <option value="20000">Under $20,000</option>
                  <option value="30000">Under $30,000</option>
                  <option value="50000">Under $50,000</option>
                </select>
              </div>
            </div>
          </div>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Scanning college databases...</p>
          ) : colleges.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No schools found. Try adjusting your filters.</p>
          ) : (
            colleges.map((c, i) => (
              <div key={i} className="bg-card rounded-xl shadow-md p-5 mb-4 flex justify-between items-center border-l-8 border-primary">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-secondary">MATCH RANK #{i + 1}</span>
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">{c.fitScore}% FIT</span>
                  </div>
                  <h4 className="text-lg font-bold text-primary">{c.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {c.city}, {c.state} • <b>{c.miles.toFixed(1)} mi</b>
                    {c.majorPercentage > 0 && <> • {(c.majorPercentage * 100).toFixed(0)}% in your field</>}
                    {c.costPerYear && <> • ${c.costPerYear.toLocaleString()}/yr</>}
                    <> • {c.size}</>
                  </p>
                </div>
                <a href={c.url} target="_blank" rel="noopener noreferrer"
                  className="bg-secondary text-secondary-foreground px-5 py-2.5 rounded-lg font-bold hover:opacity-90 transition-opacity whitespace-nowrap ml-4">
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
            Based on your interest in <b>{profile.major || "your selected field"}</b>, AP courses, and club involvement
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
                    <a href={c.searchLink} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-primary underline mt-1 inline-block">Search Jobs ↗</a>
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
