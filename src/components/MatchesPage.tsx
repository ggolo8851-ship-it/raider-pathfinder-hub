import { useState, useEffect } from "react";
import { searchColleges, getCareerMatches, CollegeResult, CareerMatch, SearchFilters } from "@/lib/college-api";
import { UserProfile, getUsers, saveUsers } from "@/lib/store";
import { Input } from "@/components/ui/input";

interface MatchesPageProps {
  profile: UserProfile;
  email: string;
}

const MatchesPage = ({ profile, email }: MatchesPageProps) => {
  const [tab, setTab] = useState<"colleges" | "careers" | "bookmarks">("colleges");
  const [distance, setDistance] = useState(0);
  const [sizeFilter, setSizeFilter] = useState("all");
  const [maxCost, setMaxCost] = useState(0);
  const [customMaxCost, setCustomMaxCost] = useState("");
  const [tuitionType, setTuitionType] = useState<"out_of_state" | "in_state">("out_of_state");
  const [stateFilter, setStateFilter] = useState("all");
  const [colleges, setColleges] = useState<CollegeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [careers, setCareers] = useState<CareerMatch[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [expandedCollege, setExpandedCollege] = useState<string | null>(null);

  useEffect(() => {
    const users = getUsers();
    setBookmarks(users[email]?.bookmarks || []);
  }, [email]);

  // Career matches based ONLY on user's selected profile choices
  useEffect(() => {
    setCareers(getCareerMatches(
      profile.major, profile.aps,
      profile.clubs || [], profile.sports || [],
      profile.isST, profile.extracurriculars || []
    ));
  }, [profile.major, profile.aps, profile.clubs, profile.sports, profile.isST, profile.extracurriculars]);

  useEffect(() => {
    if (tab === "colleges" || tab === "bookmarks") {
      setLoading(true);
      const effectiveMaxCost = customMaxCost ? Number(customMaxCost) : maxCost;
      const filters: SearchFilters = { distance, sizeFilter, maxCost: effectiveMaxCost, tuitionType, stateFilter };
      searchColleges(
        profile.major, filters, email, profile.gpa, profile.aps,
        profile.clubs || [], profile.sat || "", profile.act || "",
        profile.extracurriculars || [], profile.sports || [],
        profile.vibeAnswers || {},
        profile.lat, profile.lon
      )
        .then(setColleges)
        .catch(() => setColleges([]))
        .finally(() => setLoading(false));
    }
  }, [profile, distance, tab, sizeFilter, maxCost, customMaxCost, tuitionType, stateFilter, email]);

  const distanceLabel = profile.lat && profile.lon ? "from your address" : "from ERHS";

  const toggleBookmark = (collegeId: string) => {
    const users = getUsers();
    if (!users[email].bookmarks) users[email].bookmarks = [];
    if (users[email].bookmarks.includes(collegeId)) {
      users[email].bookmarks = users[email].bookmarks.filter((b: string) => b !== collegeId);
    } else {
      users[email].bookmarks.push(collegeId);
    }
    saveUsers(users);
    setBookmarks([...users[email].bookmarks]);
  };

  const tierColors: Record<string, string> = {
    "Safety": "bg-green-100 text-green-800",
    "Target": "bg-secondary/20 text-secondary-foreground",
    "Reach": "bg-red-100 text-red-800",
  };

  const displayColleges = tab === "bookmarks"
    ? colleges.filter(c => bookmarks.includes(c.id))
    : colleges;

  const renderCollegeCard = (c: CollegeResult, i: number) => (
    <div key={c.id + i} className="bg-card rounded-xl shadow-md mb-4 border-l-8 border-primary overflow-hidden">
      <div className="p-5 flex justify-between items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-secondary">MATCH #{i + 1}</span>
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">{c.fitScore}% FIT</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tierColors[c.tier]}`}>{c.tier}</span>
          </div>
          <h4 className="text-lg font-bold text-primary mt-1">{c.name}</h4>
          <p className="text-sm text-muted-foreground">
            {c.city}, {c.state} • <b>{c.miles.toFixed(0)} mi</b> {distanceLabel}
            {c.enrollment && <> • {c.enrollment.toLocaleString()} students ({c.size})</>}
          </p>
          <p className="text-sm text-muted-foreground">
            {c.majorPercentage > 0 && <>{(c.majorPercentage * 100).toFixed(0)}% in {c.majorLabel} • </>}
            {c.costOutState && <>Out-of-state: ${c.costOutState.toLocaleString()}/yr • </>}
            {c.costInState && <>In-state: ${c.costInState.toLocaleString()}/yr</>}
          </p>
          {c.satAvg && <p className="text-xs text-muted-foreground">Avg SAT: {c.satAvg} {c.admissionRate && <>• Admit Rate: {(c.admissionRate * 100).toFixed(0)}%</>}</p>}
        </div>
        <div className="flex flex-col gap-2 items-end shrink-0">
          <button onClick={() => toggleBookmark(c.id)} className="text-2xl" title="Bookmark">
            {bookmarks.includes(c.id) ? "⭐" : "☆"}
          </button>
          <a href={c.url} target="_blank" rel="noopener noreferrer"
            className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-bold hover:opacity-90 transition-opacity text-sm whitespace-nowrap">
            Website ↗
          </a>
          <button onClick={() => setExpandedCollege(expandedCollege === c.id ? null : c.id)}
            className="text-xs text-primary underline">
            {expandedCollege === c.id ? "Less Info" : "More Info"}
          </button>
        </div>
      </div>
      {expandedCollege === c.id && (
        <div className="bg-muted/30 px-5 py-4 border-t border-border text-sm space-y-2">
          <p><b>Matching Major Area:</b> {c.majorLabel} ({c.majorPercentage > 0 ? `${(c.majorPercentage * 100).toFixed(1)}% of students` : "Data unavailable"})</p>
          <p><b>In-State Tuition:</b> {c.costInState ? `$${c.costInState.toLocaleString()}/yr` : "N/A"}</p>
          <p><b>Out-of-State Tuition:</b> {c.costOutState ? `$${c.costOutState.toLocaleString()}/yr` : "N/A"}</p>
          <p><b>Enrollment:</b> {c.enrollment ? c.enrollment.toLocaleString() : "N/A"} ({c.size})</p>
          <p><b>Admission Rate:</b> {c.admissionRate ? `${(c.admissionRate * 100).toFixed(1)}%` : "N/A"}</p>
          <p><b>Average SAT:</b> {c.satAvg || "N/A"}</p>
          <p><b>Distance:</b> {c.miles.toFixed(1)} miles {distanceLabel}</p>
          <p><b>Classification:</b> <span className={`font-semibold px-2 py-0.5 rounded ${tierColors[c.tier]}`}>{c.tier} School</span></p>
          <div className="flex gap-2 mt-2 flex-wrap">
            <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs">Official Website ↗</a>
            <a href={`https://www.google.com/search?q=${encodeURIComponent(c.name + " virtual tour")}`} target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs">Virtual Tour 🎥</a>
            <a href={`https://nces.ed.gov/collegenavigator/?q=${encodeURIComponent(c.name)}`} target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs">College Navigator ↗</a>
            <a href={`https://www.google.com/search?q=${encodeURIComponent(c.name + " " + profile.major + " major")}`} target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs">Major Info ↗</a>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-10 px-5">
      <div className="flex gap-2 mb-8 flex-wrap">
        {(["colleges", "careers", "bookmarks"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-6 py-2.5 rounded-lg font-semibold transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            {t === "colleges" ? "🎓 College Matches" : t === "careers" ? "💼 Career Matches" : `⭐ Bookmarks (${bookmarks.length})`}
          </button>
        ))}
      </div>

      {(tab === "colleges" || tab === "bookmarks") && (
        <>
          {tab === "colleges" && (
            <div className="mb-6 space-y-4">
              {!profile.lat && (
                <div className="bg-secondary/10 border-l-4 border-secondary rounded-r-lg p-3 text-sm text-foreground">
                  💡 Add your home address in <b>Portfolio</b> for accurate distance calculations from your location.
                </div>
              )}
              <div>
                <label className="text-sm font-semibold text-foreground">Max Distance: {distance === 0 ? "No Limit" : `${distance} miles`}</label>
                <input type="range" min="0" max="3000" step="25" value={distance}
                  onChange={e => setDistance(Number(e.target.value))}
                  className="w-full mt-2 accent-primary" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>No Limit</span>
                  <span>3000 mi</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-sm font-semibold text-foreground">School Size</label>
                  <select value={sizeFilter} onChange={e => setSizeFilter(e.target.value)}
                    className="w-full p-2 mt-1 border border-input rounded-lg bg-card text-sm">
                    <option value="all">All Sizes</option>
                    <option value="small">Small (&lt;2K)</option>
                    <option value="medium">Medium (2K-10K)</option>
                    <option value="large">Large (10K-25K)</option>
                    <option value="verylarge">Very Large (25K+)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground">Tuition Type</label>
                  <select value={tuitionType} onChange={e => setTuitionType(e.target.value as any)}
                    className="w-full p-2 mt-1 border border-input rounded-lg bg-card text-sm">
                    <option value="out_of_state">Out-of-State</option>
                    <option value="in_state">In-State</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground">Max Tuition/Year</label>
                  <select value={maxCost} onChange={e => { setMaxCost(Number(e.target.value)); setCustomMaxCost(""); }}
                    className="w-full p-2 mt-1 border border-input rounded-lg bg-card text-sm">
                    <option value="0">No Limit</option>
                    <option value="10000">Under $10K</option>
                    <option value="20000">Under $20K</option>
                    <option value="30000">Under $30K</option>
                    <option value="40000">Under $40K</option>
                    <option value="50000">Under $50K</option>
                    <option value="60000">Under $60K</option>
                    <option value="80000">Under $80K</option>
                  </select>
                  <Input type="number" placeholder="Custom max $" value={customMaxCost}
                    onChange={e => { setCustomMaxCost(e.target.value); setMaxCost(0); }}
                    className="mt-1 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground">State</label>
                  <select value={stateFilter} onChange={e => setStateFilter(e.target.value)}
                    className="w-full p-2 mt-1 border border-input rounded-lg bg-card text-sm">
                    <option value="all">All States</option>
                    <option value="maryland">Maryland Only</option>
                    <option value="out_of_state">Out-of-State Only</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Scanning college databases...</p>
          ) : displayColleges.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {tab === "bookmarks" ? "No bookmarked colleges yet. Star colleges to save them!" : "No schools found. Try adjusting your filters."}
            </p>
          ) : (
            displayColleges.map((c, i) => renderCollegeCard(c, i))
          )}
        </>
      )}

      {tab === "careers" && (
        <div>
          <p className="text-sm text-muted-foreground mb-6">
            Based on your interest in <b>{profile.major || "your selected field"}</b>, your {profile.aps.length} AP courses,
            {profile.clubs?.length || 0} clubs, {profile.sports?.length || 0} sports, {profile.extracurriculars?.length || 0} extracurriculars
            {profile.isST ? ", and S/T program" : ""}
          </p>
          {careers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Update your profile with a major, clubs, or activities to see career matches.</p>
          ) : (
            careers.map((c, i) => (
              <div key={i} className="bg-card rounded-xl shadow-md p-5 mb-4 border-l-8 border-secondary">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <h4 className="text-lg font-bold text-primary">{c.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{c.description}</p>
                    {c.relatedClubs.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        <b>Your Related Clubs:</b> {c.relatedClubs.join(", ")}
                      </p>
                    )}
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
