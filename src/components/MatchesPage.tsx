import { useState, useEffect } from "react";
import { searchColleges, getCareerMatches, getCollegesByIds, aiRankColleges, aiGetCareerMatches, CollegeResult, CareerMatch, SearchFilters } from "@/lib/college-api";
import { UserProfile, getUsers, saveUsers } from "@/lib/store";
import { Input } from "@/components/ui/input";

interface MatchesPageProps {
  profile: UserProfile;
  email: string;
}

const MatchesPage = ({ profile, email }: MatchesPageProps) => {
  const [tab, setTab] = useState<"colleges" | "careers" | "bookmarks">("colleges");
  const [distance, setDistance] = useState(0);
  const [minDistance, setMinDistance] = useState(0);
  const [sizeFilter, setSizeFilter] = useState("all");
  const [maxCost, setMaxCost] = useState(0);
  const [customMaxCost, setCustomMaxCost] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [classificationFilter, setClassificationFilter] = useState("all");
  const [athleticFilter, setAthleticFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [testPolicyFilter, setTestPolicyFilter] = useState("all");
  const [msiFilter, setMsiFilter] = useState("all");
  const [collegeSearch, setCollegeSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [colleges, setColleges] = useState<CollegeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [careers, setCareers] = useState<CareerMatch[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [bookmarkedColleges, setBookmarkedColleges] = useState<CollegeResult[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [expandedCollege, setExpandedCollege] = useState<string | null>(null);
  const [expandedCareer, setExpandedCareer] = useState<string | null>(null);

  useEffect(() => {
    const users = getUsers();
    setBookmarks(users[email]?.bookmarks || []);
  }, [email]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fallback = getCareerMatches(
        profile.major, profile.aps,
        profile.clubs || [], profile.sports || [],
        profile.isST, profile.extracurriculars || [],
        profile.gpa, profile.achievements || [],
        profile.interests || []
      );
      if (!cancelled) setCareers(fallback);
      const ai = await aiGetCareerMatches({
        major: profile.major, gpa: profile.gpa, sat: profile.sat, act: profile.act,
        aps: profile.aps, clubs: profile.clubs, sports: profile.sports,
        extracurriculars: profile.extracurriculars, achievements: profile.achievements,
        interests: profile.interests, isST: profile.isST, gradYear: profile.gradYear,
      });
      if (!cancelled && ai && ai.length > 0) setCareers(ai);
    })();
    return () => { cancelled = true; };
  }, [profile]);

  // Debounce the search input — prevents flicker / API spam while typing
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(collegeSearch.trim()), 300);
    return () => clearTimeout(t);
  }, [collegeSearch]);

  useEffect(() => {
    if (tab !== "colleges") return;
    setLoading(true);
    let cancelled = false;
    const effectiveMaxCost = customMaxCost ? Number(customMaxCost) : maxCost;
    const filters: SearchFilters = { distance, minDistance, sizeFilter, maxCost: effectiveMaxCost, stateFilter, tierFilter, classificationFilter, athleticFilter, countryFilter, testPolicyFilter, msiFilter, searchQuery: debouncedSearch };
    const isSearching = debouncedSearch.length > 1;
    searchColleges(
      profile.major, filters, email, profile.gpa, profile.aps,
      profile.clubs || [], profile.sat || "", profile.act || "",
      profile.extracurriculars || [], profile.sports || [],
      profile.vibeAnswers || {},
      profile.lat, profile.lon,
      profile.testOptional,
      profile.interests || []
    )
      .then(async (results) => {
        if (cancelled) return;
        setColleges(results);
        // Skip AI re-rank during active name search — it would override exact-match priority.
        if (results.length > 0 && !isSearching) {
          const ranked = await aiRankColleges(results, {
            major: profile.major, gpa: profile.gpa, sat: profile.sat, act: profile.act,
            aps: profile.aps, clubs: profile.clubs, sports: profile.sports,
            extracurriculars: profile.extracurriculars, achievements: profile.achievements,
            interests: profile.interests, isST: profile.isST, testOptional: profile.testOptional,
            vibeAnswers: profile.vibeAnswers, gradYear: profile.gradYear,
          });
          if (!cancelled) setColleges(ranked);
        }
      })
      .catch(() => { if (!cancelled) setColleges([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [profile, distance, minDistance, tab, sizeFilter, maxCost, customMaxCost, stateFilter, tierFilter, classificationFilter, athleticFilter, countryFilter, testPolicyFilter, msiFilter, debouncedSearch, email]);

  // Bookmarks tab: fetch ALL saved colleges directly by ID — ignores all filters
  useEffect(() => {
    if (tab !== "bookmarks") return;
    if (bookmarks.length === 0) { setBookmarkedColleges([]); return; }
    setBookmarksLoading(true);
    getCollegesByIds(
      bookmarks, profile.major, profile.gpa, profile.aps,
      profile.clubs || [], profile.sat || "", profile.act || "",
      profile.extracurriculars || [], profile.sports || [],
      profile.vibeAnswers || {}, profile.lat, profile.lon,
      profile.testOptional, profile.interests || []
    )
      .then(setBookmarkedColleges)
      .catch(() => setBookmarkedColleges([]))
      .finally(() => setBookmarksLoading(false));
  }, [tab, bookmarks, profile]);

  const distanceLabel = profile.lat && profile.lon ? "from your address" : "from ERHS";

  const toggleBookmark = (collegeId: string) => {
    const users = getUsers();
    if (!users[email].bookmarks) users[email].bookmarks = [];
    const cid = String(collegeId);
    if (users[email].bookmarks.includes(cid)) {
      users[email].bookmarks = users[email].bookmarks.filter((b: string) => b !== cid);
    } else {
      users[email].bookmarks.push(cid);
    }
    saveUsers(users);
    setBookmarks([...users[email].bookmarks]);
  };

  const tierColors: Record<string, string> = {
    "Safety": "bg-green-100 text-green-800",
    "Target": "bg-secondary/20 text-secondary-foreground",
    "Possible Reach": "bg-orange-100 text-orange-800",
    "Far Reach": "bg-red-100 text-red-800",
  };

  const displayColleges = tab === "bookmarks" ? bookmarkedColleges : colleges;
  const displayLoading = tab === "bookmarks" ? bookmarksLoading : loading;

  const renderCollegeCard = (c: CollegeResult, i: number) => (
    <div key={c.id + i} className="bg-card rounded-xl shadow-md mb-4 border-l-8 border-primary overflow-hidden">
      <div className="p-5 flex justify-between items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-secondary">MATCH #{i + 1}</span>
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">{c.fitScore}% FIT</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tierColors[c.tier]}`}>{c.tier}</span>
            {c.womenOnly && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-800">Women's College</span>}
            {c.institutionalClassification?.filter(t => t !== "PWI" && t !== "Women's College" && t !== "Men's College").map(tag => (
              <span key={tag} className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">{tag}</span>
            ))}
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
          {c.avgSalary10yr != null && <p className="text-xs text-muted-foreground">💵 Median grad salary: ${c.avgSalary10yr.toLocaleString()}/yr</p>}
        </div>
        <div className="flex flex-col gap-2 items-end shrink-0">
          <button onClick={() => toggleBookmark(c.id)} className="text-2xl" title="Bookmark">
            {bookmarks.includes(String(c.id)) ? "⭐" : "☆"}
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
          {c.chancePct != null && (
            <>
              <p><b>🎯 Your Estimated Chance:</b> <span className="font-bold text-primary">{c.chancePct}%</span></p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded-r p-2 text-xs text-foreground">
                ⚠️ This estimate uses only your GPA, test scores, and the school's admit rate. It does <b>not</b> account for your essays, recommendation letters, interviews, demonstrated interest, or unique background — your real chances may be meaningfully better than the number shown.
              </div>
            </>
          )}
          {c.setting && <p><b>🌆 Setting:</b> {c.setting}</p>}
          {c.athleticDivision && c.athleticDivision !== "Unknown" && <p><b>🏟️ Athletics:</b> {c.athleticDivision}</p>}
          {c.country && c.country !== "USA" && <p><b>🌍 Country:</b> {c.country}</p>}
          {c.bestKnownPrograms && c.bestKnownPrograms.length > 0 && (
            <p><b>⭐ Best Known For:</b> {c.bestKnownPrograms.slice(0, 3).join(", ")}</p>
          )}
          {c.institutionalClassification && c.institutionalClassification.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <b>🏛️ Institutional Classification:</b>
              {c.institutionalClassification.map(tag => (
                <span key={tag} className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {c.avgSalary10yr != null && (
            <p><b>💵 Avg Salary 10yr After Entry:</b> ${c.avgSalary10yr.toLocaleString()}/yr</p>
          )}
          {c.testPolicy && c.testPolicy !== "unknown" && (
            <p><b>📝 Test Policy:</b> {c.testPolicy === "required" ? "SAT/ACT Required" : c.testPolicy === "optional" ? "Test-Optional" : "Test-Blind"}</p>
          )}
          {profile.testOptional && <p className="text-xs text-secondary font-semibold">📝 Classified as test-optional student — SAT not weighted in tier calculation</p>}
          
          {c.demographics && (
            <div className="mt-2">
              <p className="font-semibold mb-1">🏫 Student Demographics:</p>
              <div className="flex gap-1 h-4 rounded-full overflow-hidden mb-1">
                {c.demographics.white > 0 && <div className="bg-blue-400" style={{ width: `${c.demographics.white}%` }} title={`White: ${c.demographics.white}%`} />}
                {c.demographics.black > 0 && <div className="bg-purple-500" style={{ width: `${c.demographics.black}%` }} title={`Black: ${c.demographics.black}%`} />}
                {c.demographics.hispanic > 0 && <div className="bg-orange-400" style={{ width: `${c.demographics.hispanic}%` }} title={`Hispanic: ${c.demographics.hispanic}%`} />}
                {c.demographics.asian > 0 && <div className="bg-green-400" style={{ width: `${c.demographics.asian}%` }} title={`Asian: ${c.demographics.asian}%`} />}
                {c.demographics.other > 0 && <div className="bg-gray-400" style={{ width: `${c.demographics.other}%` }} title={`Other: ${c.demographics.other}%`} />}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                <span>🔵 White: {c.demographics.white}%</span>
                <span>🟣 Black: {c.demographics.black}%</span>
                <span>🟠 Hispanic: {c.demographics.hispanic}%</span>
                <span>🟢 Asian: {c.demographics.asian}%</span>
                <span>⚪ Other: {c.demographics.other}%</span>
              </div>
            </div>
          )}

          {c.aiReason && (
            <div className="bg-primary/5 border-l-4 border-primary rounded-r p-2 mt-2">
              <p className="text-sm"><b>🤖 Why this fits you:</b> {c.aiReason}</p>
            </div>
          )}
          <div className="flex gap-2 mt-2 flex-wrap">
            <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs">Official Website ↗</a>
            <a href={`https://www.niche.com/colleges/${encodeURIComponent(c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))}/visit/`} target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs">🎥 Virtual Tour (Niche) ↗</a>
            <a href={`https://www.niche.com/colleges/search/best-colleges/?q=${encodeURIComponent(c.name)}`} target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs">🏆 Niche Ranking ↗</a>
            {(() => {
              let domain = "";
              try { domain = new URL(c.url).hostname.replace(/^www\./, ""); } catch {}
              const cdsQ = domain
                ? `site:${domain} "common data set" filetype:pdf`
                : `${c.name} latest common data set filetype:pdf`;
              return (
                <a href={`https://www.google.com/search?q=${encodeURIComponent(cdsQ)}`} target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs">📊 Latest Common Data Set (PDF) ↗</a>
              );
            })()}
            <a href={`https://collegescorecard.ed.gov/school?id=${encodeURIComponent(c.id)}`} target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs">💰 Salary Data ↗</a>
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
                <label className="text-sm font-semibold text-foreground">🔍 Search College by Name</label>
                <Input placeholder="e.g. University of Maryland" value={collegeSearch}
                  onChange={e => setCollegeSearch(e.target.value)} className="mt-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-foreground">Max Distance: {distance === 0 ? "No Limit" : `${distance} miles`}</label>
                  <input type="range" min="0" max="3000" step="25" value={distance}
                    onChange={e => setDistance(Number(e.target.value))}
                    className="w-full mt-2 accent-primary" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>No Limit</span><span>3000 mi</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground">Min Distance: {minDistance === 0 ? "None" : `${minDistance} miles`}</label>
                  <input type="range" min="0" max="500" step="10" value={minDistance}
                    onChange={e => setMinDistance(Number(e.target.value))}
                    className="w-full mt-2 accent-primary" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>None</span><span>500 mi</span>
                  </div>
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
                <div>
                  <label className="text-sm font-semibold text-foreground">School Tier</label>
                  <select value={tierFilter} onChange={e => setTierFilter(e.target.value)}
                    className="w-full p-2 mt-1 border border-input rounded-lg bg-card text-sm">
                    <option value="all">All Tiers</option>
                    <option value="safety_target">Safety & Target Only</option>
                    <option value="safety">Safety Only</option>
                    <option value="target">Target Only</option>
                    <option value="possible_reach">Possible Reach Only</option>
                    <option value="far_reach">Far Reach Only</option>
                    <option value="reach">All Reach Schools</option>
                    <option value="hidden_ivies">Hidden Ivies</option>
                    <option value="service_academies">Service Academies</option>
                    <option value="international">International (browse links)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-sm font-semibold text-foreground">Prestige Class</label>
                  <select value={classificationFilter} onChange={e => setClassificationFilter(e.target.value)}
                    className="w-full p-2 mt-1 border border-input rounded-lg bg-card text-sm">
                    <option value="all">All Classes</option>
                    <option value="tier1">Tier 1 (Elite/Ivy+)</option>
                    <option value="tier2">Tier 2 (Top 50)</option>
                    <option value="tier3">Tier 3 (Highly Selective/Top Publics)</option>
                    <option value="tier4">Tier 4 (Strong Regional/Large Publics)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground">Athletic Division</label>
                  <select value={athleticFilter} onChange={e => setAthleticFilter(e.target.value)}
                    className="w-full p-2 mt-1 border border-input rounded-lg bg-card text-sm">
                    <option value="all">Any Division</option>
                    <option value="d1">NCAA D1</option>
                    <option value="d2">NCAA D2</option>
                    <option value="d3">NCAA D3</option>
                    <option value="naia">NAIA</option>
                    <option value="none">No Athletics</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground">Country</label>
                  <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)}
                    className="w-full p-2 mt-1 border border-input rounded-lg bg-card text-sm">
                    <option value="all">US + International</option>
                    <option value="us">United States Only</option>
                    <option value="intl">International Only</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground">Test Policy</label>
                  <select value={testPolicyFilter} onChange={e => setTestPolicyFilter(e.target.value)}
                    className="w-full p-2 mt-1 border border-input rounded-lg bg-card text-sm">
                    <option value="all">Any Test Policy</option>
                    <option value="required">SAT/ACT Required</option>
                    <option value="optional">Test-Optional</option>
                    <option value="blind">Test-Blind</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-sm font-semibold text-foreground">Institutional Classification</label>
                  <select value={msiFilter} onChange={e => setMsiFilter(e.target.value)}
                    className="w-full p-2 mt-1 border border-input rounded-lg bg-card text-sm">
                    <option value="all">All Institutions</option>
                    <option value="womens">Women's Colleges</option>
                    <option value="hbcu">HBCU (Historically Black)</option>
                    <option value="hsi">HSI (Hispanic-Serving)</option>
                    <option value="aanapisi">AANAPISI (AAPI-Serving)</option>
                    <option value="tcu">TCU (Tribal Colleges)</option>
                    <option value="annh">ANNH (Alaska Native/Native Hawaiian)</option>
                    <option value="pbi">PBI (Predominantly Black)</option>
                    <option value="pwi">PWI (Predominantly White)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          {tab === "colleges" && tierFilter === "international" && (
            <div className="bg-secondary/10 border-l-4 border-secondary rounded-r-lg p-3 text-sm text-foreground mb-4">
              🌍 International schools aren't in the US College Scorecard database. Try these directories:
              {" "}<a className="underline text-primary" href="https://www.topuniversities.com/" target="_blank" rel="noopener noreferrer">QS World Rankings ↗</a>,
              {" "}<a className="underline text-primary" href="https://www.timeshighereducation.com/world-university-rankings" target="_blank" rel="noopener noreferrer">THE Rankings ↗</a>,
              {" "}<a className="underline text-primary" href="https://www.studyportals.com/" target="_blank" rel="noopener noreferrer">Studyportals ↗</a>.
            </div>
          )}
          {displayLoading ? (
            <p className="text-muted-foreground text-center py-8">Scanning college databases...</p>
          ) : displayColleges.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {tab === "bookmarks" ? "No bookmarked colleges yet. Star colleges to save them!" : "No schools found matching your filters. Try adjusting your criteria."}
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">{displayColleges.length} college{displayColleges.length !== 1 ? "s" : ""} found — sorted by fit percentage (highest first)</p>
              {displayColleges.map((c, i) => renderCollegeCard(c, i))}
            </>
          )}
        </>
      )}

      {tab === "careers" && (
        <div>
          <p className="text-sm text-muted-foreground mb-6">
            Based on your interest in <b>{profile.major || "your selected field"}</b>, your {profile.aps.length} AP courses,
            {" "}{profile.clubs?.length || 0} clubs, {profile.sports?.length || 0} sports, {profile.extracurriculars?.length || 0} extracurriculars
            {profile.interests && profile.interests.length > 0 ? `, ${profile.interests.length} interests` : ""}
            {profile.isST ? ", and S/T program" : ""}
          </p>
          {careers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Update your profile with a major, interests, or activities to see career matches.</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">{careers.length} career{careers.length !== 1 ? "s" : ""} matched to your profile</p>
              {careers.map((c, i) => (
                <div key={i} className="bg-card rounded-xl shadow-md p-5 mb-4 border-l-8 border-secondary">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-primary">{c.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{c.description}</p>
                      <p className="text-xs text-primary/80 mt-2 italic">💡 {c.whyForYou}</p>
                      {c.relatedClubs.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          <b>Your Related Clubs:</b> {c.relatedClubs.join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-secondary">{c.salaryRange}</p>
                      <p className="text-xs text-muted-foreground">{c.growth}</p>
                      <div className="flex flex-col items-end gap-0.5 mt-1">
                        <a href={c.searchLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">Indeed ↗</a>
                        <a href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(c.title)}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">LinkedIn ↗</a>
                        <a href={`https://www.glassdoor.com/Job/${encodeURIComponent(c.title.toLowerCase().replace(/\s+/g, "-"))}-jobs-SRCH_KO0,${c.title.length}.htm`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">Glassdoor ↗</a>
                        <a href={`https://app.joinhandshake.com/stu/postings?keywords=${encodeURIComponent(c.title)}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">Handshake ↗</a>
                      </div>
                      <button onClick={() => setExpandedCareer(expandedCareer === c.title ? null : c.title)}
                        className="text-xs text-primary underline mt-2 block">
                        {expandedCareer === c.title ? "Less Info" : "More Info"}
                      </button>
                    </div>
                  </div>
                  {expandedCareer === c.title && (
                    <div className="mt-3 pt-3 border-t border-border text-sm space-y-2">
                      <p><b>🔧 Expected Skills:</b> {c.skills.join(", ")}</p>
                      <p><b>🏢 Work Type:</b> {c.workType}</p>
                      <p><b>📋 Conditions:</b> {c.conditions}</p>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MatchesPage;
