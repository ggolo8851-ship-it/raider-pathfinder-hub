import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getUsers, saveUsers, AP_LIST, GRAD_YEARS, ERHS_CLUBS, ERHS_SPORTS, UNDECIDED_CAREER_EXPLORATIONS, MD_GRADUATION_REQUIREMENTS, ClubRole, SportRole } from "@/lib/store";
import { useAllClubs } from "@/lib/use-all-clubs";
import { geocodeAddress } from "@/lib/college-api";
import { loadSiteSettings } from "@/lib/feature-flags";
import VibePollQuiz from "@/components/VibePollQuiz";

interface OnboardingFlowProps {
  email: string;
  onComplete: () => void;
}

const MAX_EXTRAS = 15;
const CLUB_ROLES: ClubRole["role"][] = ["Member", "Management", "Founder"];
const SPORT_ROLES: SportRole["role"][] = ["Player", "Captain", "Manager"];

const OnboardingFlow = ({ email, onComplete }: OnboardingFlowProps) => {
  const [step, setStep] = useState<"grad" | "profile" | "clubs" | "extra" | "polls">("grad");
  const [major, setMajor] = useState("");
  const [gpa, setGpa] = useState("");
  const [sat, setSat] = useState("");
  const [act, setAct] = useState("");
  const [gradYear, setGradYear] = useState("2027");
  const [selectedAps, setSelectedAps] = useState<string[]>([]);
  const [apScores, setApScores] = useState<Record<string, number>>({});
  const [selectedClubs, setSelectedClubs] = useState<string[]>([]);
  const [clubRoles, setClubRoles] = useState<ClubRole[]>([]);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [sportRoles, setSportRoles] = useState<SportRole[]>([]);
  const [extraSports, setExtraSports] = useState<string[]>([]);
  const [clubSearch, setClubSearch] = useState("");
  const [apSearch, setApSearch] = useState("");
  const [extracurriculars, setExtracurriculars] = useState<string[]>([]);
  const [newExtra, setNewExtra] = useState("");
  const [achievements, setAchievements] = useState<string[]>([]);
  const [newAchievement, setNewAchievement] = useState("");
  const [isST, setIsST] = useState(false);
  const [testOptional, setTestOptional] = useState(false);
  const [showExplore, setShowExplore] = useState(false);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("MD");
  const [zipcode, setZipcode] = useState("");

  useEffect(() => { loadSiteSettings().then(s => setExtraSports(s.sports || [])); }, []);

  const toggleAp = (ap: string) => setSelectedAps(prev => prev.includes(ap) ? prev.filter(a => a !== ap) : [...prev, ap]);
  const setApScore = (ap: string, score: number) => setApScores(prev => ({ ...prev, [ap]: score }));
  const toggleClub = (club: string) => setSelectedClubs(prev => {
    if (prev.includes(club)) { setClubRoles(r => r.filter(cr => cr.club !== club)); return prev.filter(c => c !== club); }
    setClubRoles(r => [...r, { club, role: "Member" }]); return [...prev, club];
  });
  const toggleSport = (sport: string) => setSelectedSports(prev => {
    if (prev.includes(sport)) { setSportRoles(r => r.filter(sr => sr.sport !== sport)); return prev.filter(s => s !== sport); }
    setSportRoles(r => [...r, { sport, role: "Player" }]); return [...prev, sport];
  });
  const setClubRole = (club: string, role: ClubRole["role"]) =>
    setClubRoles(prev => prev.map(cr => cr.club === club ? { ...cr, role } : cr));
  const setSportRole = (sport: string, role: SportRole["role"]) =>
    setSportRoles(prev => prev.map(sr => sr.sport === sport ? { ...sr, role } : sr));

  const addExtra = () => {
    if (newExtra.trim() && extracurriculars.length < MAX_EXTRAS) {
      setExtracurriculars(prev => [...prev, newExtra.trim()]);
      setNewExtra("");
    }
  };
  const addAchievement = () => {
    if (newAchievement.trim()) { setAchievements(prev => [...prev, newAchievement.trim()]); setNewAchievement(""); }
  };

  const handlePollsComplete = async (vibeAnswers: Record<string, string>) => {
    let lat: number | undefined;
    let lon: number | undefined;
    if (address || zipcode) {
      const coords = await geocodeAddress(address, city, state, zipcode);
      if (coords) { lat = coords.lat; lon = coords.lon; }
    }

    const users = getUsers();
    users[email].profile = {
      major, gpa, sat, act, gradYear,
      aps: selectedAps, apScores,
      clubs: selectedClubs, clubRoles,
      extracurriculars, achievements,
      serviceHours: 0, isST, testOptional,
      sports: selectedSports, sportRoles,
      interests: [],
      address, city, state, zipcode,
      lat, lon,
      vibeAnswers,
      emailSubscription: { enabled: false, interests: [] },
    };
    users[email].setupComplete = true;
    users[email].isNewSignup = true;
    if (!users[email].bookmarks) users[email].bookmarks = [];
    saveUsers(users);
    onComplete();
  };

  const allClubs = useAllClubs();
  const filteredClubs = allClubs.filter(c => c.toLowerCase().includes(clubSearch.toLowerCase()));

  const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];

  if (step === "grad") {
    return (
      <div className="auth-bg min-h-screen flex items-center justify-center p-5">
        <div className="bg-card rounded-2xl shadow-2xl p-8 w-full max-w-2xl">
          <h2 className="text-2xl font-bold text-primary mb-6 text-center">Maryland High School Graduation Requirements</h2>
          <table className="w-full mb-6">
            <thead>
              <tr className="border-b-2 border-primary">
                <th className="text-left py-3 text-primary">Subject</th>
                <th className="text-left py-3 text-primary">Credits</th>
              </tr>
            </thead>
            <tbody>
              {MD_GRADUATION_REQUIREMENTS.map(r => (
                <tr key={r.subject} className={`border-b border-border ${r.subject === "Total Credits Required" ? "font-bold bg-muted/30" : ""}`}>
                  <td className="py-2.5 text-sm">{r.subject}</td>
                  <td className="py-2.5 font-semibold text-sm">{r.credits}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button onClick={() => setStep("profile")} className="w-full">Continue</Button>
        </div>
      </div>
    );
  }

  if (step === "profile") {
    return (
      <div className="auth-bg min-h-screen flex items-center justify-center p-5">
        <div className="bg-card rounded-2xl shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold text-primary mb-6 text-center">Academic Profile</h2>

          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input type="checkbox" checked={isST} onChange={() => setIsST(!isST)} className="accent-primary w-4 h-4" />
            <span className="text-sm font-semibold text-foreground">I am in the S/T (Science & Technology) Program</span>
          </label>
          {isST && (
            <div className="bg-secondary/20 border-l-4 border-secondary rounded-r-lg p-3 mb-4 text-xs text-foreground">
              ⚠️ S/T students must take math every year through Pre-Calculus Honors or higher, and need 3-4 advanced STEM credits including at least one AP.
            </div>
          )}

          <label className="text-sm font-semibold text-foreground">Graduation Year</label>
          <select value={gradYear} onChange={e => setGradYear(e.target.value)}
            className="w-full p-3 mb-3 border border-input rounded-lg bg-card">
            {GRAD_YEARS.map(y => <option key={y} value={y}>Class of {y}</option>)}
          </select>

          <div className="bg-muted/30 rounded-lg p-3 mb-3 border border-input">
            <label className="text-sm font-semibold text-foreground block mb-2">📍 Your Home Address (for college distance)</label>
            <Input placeholder="Street Address" value={address} onChange={e => setAddress(e.target.value)} className="mb-2" />
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="City" value={city} onChange={e => setCity(e.target.value)} />
              <select value={state} onChange={e => setState(e.target.value)}
                className="p-2 border border-input rounded-lg bg-card text-sm">
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <Input placeholder="Zip" value={zipcode} onChange={e => setZipcode(e.target.value)} />
            </div>
          </div>

          <label className="text-sm font-semibold text-foreground">Intended Major / Career</label>
          <Input placeholder="e.g. Computer Science (or leave blank if undecided)" value={major} onChange={e => { setMajor(e.target.value); setShowExplore(false); }} className="mb-1" />
          <button onClick={() => setShowExplore(!showExplore)} className="text-xs text-secondary underline mb-2 block">
            {showExplore ? "Hide career explorer" : "🔍 Undecided? Explore career paths"}
          </button>
          {showExplore && (
            <div className="bg-muted/30 rounded-lg p-3 mb-3 space-y-2 max-h-48 overflow-y-auto">
              {UNDECIDED_CAREER_EXPLORATIONS.map(c => (
                <button key={c.field} onClick={() => { setMajor(c.majors[0]); setShowExplore(false); }}
                  className="w-full text-left p-2 rounded hover:bg-muted transition-colors">
                  <p className="font-semibold text-sm text-foreground">{c.field}</p>
                  <p className="text-xs text-muted-foreground">{c.description}</p>
                  <p className="text-xs text-primary mt-1">{c.majors.join(" • ")}</p>
                </button>
              ))}
            </div>
          )}

          <label className="text-sm font-semibold text-foreground">Current GPA</label>
          <Input type="number" step="0.1" placeholder="e.g. 3.5" value={gpa} onChange={e => setGpa(e.target.value)} className="mb-3" />

          <label className="flex items-center gap-2 mb-2 cursor-pointer">
            <input type="checkbox" checked={testOptional} onChange={() => setTestOptional(!testOptional)} className="accent-primary w-4 h-4" />
            <span className="text-sm text-foreground">I'm going test-optional (no SAT/ACT)</span>
          </label>

          {!testOptional && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-sm font-semibold text-foreground">SAT Score</label>
                <Input type="number" placeholder="e.g. 1200" value={sat} onChange={e => setSat(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground">ACT Score</label>
                <Input type="number" placeholder="e.g. 28" value={act} onChange={e => setAct(e.target.value)} />
              </div>
            </div>
          )}

          <label className="text-sm font-semibold text-foreground">APs Taken / Taking</label>
          <Input placeholder="Search APs..." value={apSearch} onChange={e => setApSearch(e.target.value)} className="mb-2 mt-1" />
          <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto border border-input rounded-lg p-3 mb-4 bg-muted/30">
            {AP_LIST.filter(ap => ap.toLowerCase().includes(apSearch.toLowerCase())).map(ap => (
              <label key={ap} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={selectedAps.includes(ap)} onChange={() => toggleAp(ap)} className="accent-primary" />
                {ap}
              </label>
            ))}
          </div>
          <Button onClick={() => setStep("clubs")} className="w-full">Next: Select Clubs & Sports</Button>
        </div>
      </div>
    );
  }

  if (step === "clubs") {
    return (
      <div className="auth-bg min-h-screen flex items-center justify-center p-5">
        <div className="bg-card rounded-2xl shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold text-primary mb-4 text-center">ERHS Clubs & Organizations</h2>
          <p className="text-sm text-muted-foreground text-center mb-4">Select the ERHS clubs you're in — this affects your matches!</p>
          <Input placeholder="Search clubs..." value={clubSearch} onChange={e => setClubSearch(e.target.value)} className="mb-3" />
          <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto border border-input rounded-lg p-3 mb-4 bg-muted/30">
            {filteredClubs.map(club => (
              <div key={club} className="flex items-center gap-2 text-sm">
                <label className="flex items-center gap-2 cursor-pointer flex-1">
                  <input type="checkbox" checked={selectedClubs.includes(club)} onChange={() => toggleClub(club)} className="accent-primary" />
                  <span className="truncate">{club}</span>
                </label>
                {selectedClubs.includes(club) && (
                  <select value={clubRoles.find(cr => cr.club === club)?.role || "Member"}
                    onChange={e => setClubRole(club, e.target.value as ClubRole["role"])}
                    className="w-28 p-1 border border-input rounded bg-card text-xs">
                    {CLUB_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mb-4">{selectedClubs.length} club(s) selected</p>

          <h3 className="text-lg font-bold text-primary mb-2">🏅 Sports</h3>
          <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto border border-input rounded-lg p-3 mb-2 bg-muted/30">
            {[...ERHS_SPORTS, ...extraSports].map(sport => (
              <div key={sport} className="flex items-center gap-2 text-sm">
                <label className="flex items-center gap-2 cursor-pointer flex-1">
                  <input type="checkbox" checked={selectedSports.includes(sport)} onChange={() => toggleSport(sport)} className="accent-primary" />
                  <span className="truncate">{sport}</span>
                </label>
                {selectedSports.includes(sport) && (
                  <select value={sportRoles.find(sr => sr.sport === sport)?.role || "Player"}
                    onChange={e => setSportRole(sport, e.target.value as SportRole["role"])}
                    className="w-28 p-1 border border-input rounded bg-card text-xs">
                    {SPORT_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mb-4">{selectedSports.length} sport(s) selected</p>

          {selectedAps.length > 0 && (
            <>
              <label className="text-sm font-semibold text-foreground">AP Exam Scores (1-5, leave blank if not taken)</label>
              <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto border border-input rounded-lg p-3 mb-4 bg-muted/30">
                {selectedAps.sort().map(ap => (
                  <div key={ap} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate flex-1">{ap}</span>
                    <select value={apScores[ap] || ""} onChange={e => setApScore(ap, Number(e.target.value))}
                      className="w-16 p-1 border border-input rounded bg-card text-sm">
                      <option value="">—</option>
                      {[1, 2, 3, 4, 5].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep("profile")} className="flex-1">Back</Button>
            <Button onClick={() => setStep("extra")} className="flex-1">Next: Activities</Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "extra") {
    return (
      <div className="auth-bg min-h-screen flex items-center justify-center p-5">
        <div className="bg-card rounded-2xl shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold text-primary mb-4 text-center">Outside Activities & Achievements</h2>

          <label className="text-sm font-semibold text-foreground">Out-of-School Extracurriculars</label>
          <p className="text-xs text-muted-foreground mb-2">Sports leagues, volunteer work, jobs, etc. (max {MAX_EXTRAS})</p>
          <div className="flex gap-2 mb-2">
            <Input placeholder="e.g. Community Soccer League" value={newExtra} onChange={e => setNewExtra(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addExtra()} />
            <Button onClick={addExtra} size="sm" disabled={extracurriculars.length >= MAX_EXTRAS}>Add</Button>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{extracurriculars.length}/{MAX_EXTRAS}</p>
          {extracurriculars.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {extracurriculars.map((e, i) => (
                <span key={i} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  {e}
                  <button onClick={() => setExtracurriculars(prev => prev.filter((_, j) => j !== i))} className="text-destructive font-bold">×</button>
                </span>
              ))}
            </div>
          )}

          <label className="text-sm font-semibold text-foreground">Notable Achievements & Awards</label>
          <p className="text-xs text-muted-foreground mb-2">Honor roll, competition wins, certifications, etc.</p>
          <div className="flex gap-2 mb-2">
            <Input placeholder="e.g. Science Fair 1st Place" value={newAchievement} onChange={e => setNewAchievement(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addAchievement()} />
            <Button onClick={addAchievement} size="sm">Add</Button>
          </div>
          {achievements.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {achievements.map((a, i) => (
                <span key={i} className="bg-secondary/20 text-secondary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  {a}
                  <button onClick={() => setAchievements(prev => prev.filter((_, j) => j !== i))} className="text-destructive font-bold">×</button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setStep("clubs")} className="flex-1">Back</Button>
            <Button onClick={() => setStep("polls")} className="flex-1">Next: College Vibe Quiz 🎯</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center p-5">
      <div className="bg-card rounded-2xl shadow-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-primary mb-2 text-center">🎯 College Vibe Quiz</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">Quick "this or that" to find your perfect college match!</p>
        <VibePollQuiz
          onComplete={handlePollsComplete}
          onBack={() => setStep("extra")}
          showBackButton={true}
        />
      </div>
    </div>
  );
};

export default OnboardingFlow;
