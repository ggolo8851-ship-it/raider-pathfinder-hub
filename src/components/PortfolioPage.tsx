import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getUsers, saveUsers, AP_LIST, GRAD_YEARS, ERHS_CLUBS, ERHS_SPORTS, UserProfile, UNDECIDED_CAREER_EXPLORATIONS } from "@/lib/store";
import { generateResumePDF } from "@/lib/resume-builder";

interface PortfolioPageProps {
  email: string;
  profile: UserProfile;
  userName: string;
  onUpdate: () => void;
}

const MAX_EXTRAS = 15;

const PortfolioPage = ({ email, profile, userName, onUpdate }: PortfolioPageProps) => {
  const [major, setMajor] = useState(profile.major);
  const [gpa, setGpa] = useState(profile.gpa);
  const [sat, setSat] = useState(profile.sat || "");
  const [act, setAct] = useState(profile.act || "");
  const [gradYear, setGradYear] = useState(profile.gradYear);
  const [selectedAps, setSelectedAps] = useState<string[]>(profile.aps);
  const [apScores, setApScores] = useState<Record<string, number>>(profile.apScores || {});
  const [selectedClubs, setSelectedClubs] = useState<string[]>(profile.clubs || []);
  const [selectedSports, setSelectedSports] = useState<string[]>(profile.sports || []);
  const [clubSearch, setClubSearch] = useState("");
  const [extracurriculars, setExtracurriculars] = useState<string[]>(profile.extracurriculars || []);
  const [newExtra, setNewExtra] = useState("");
  const [achievements, setAchievements] = useState<string[]>(profile.achievements || []);
  const [newAchievement, setNewAchievement] = useState("");
  const [serviceHours, setServiceHours] = useState(profile.serviceHours || 0);
  const [isST, setIsST] = useState(profile.isST || false);
  const [testOptional, setTestOptional] = useState(profile.testOptional || false);
  const [showExplore, setShowExplore] = useState(false);

  const toggleAp = (ap: string) => setSelectedAps(prev => prev.includes(ap) ? prev.filter(a => a !== ap) : [...prev, ap]);
  const toggleClub = (club: string) => setSelectedClubs(prev => prev.includes(club) ? prev.filter(c => c !== club) : [...prev, club]);
  const toggleSport = (sport: string) => setSelectedSports(prev => prev.includes(sport) ? prev.filter(s => s !== sport) : [...prev, sport]);

  const addExtra = () => {
    if (newExtra.trim() && extracurriculars.length < MAX_EXTRAS) { setExtracurriculars(prev => [...prev, newExtra.trim()]); setNewExtra(""); }
  };
  const addAchievement = () => {
    if (newAchievement.trim()) { setAchievements(prev => [...prev, newAchievement.trim()]); setNewAchievement(""); }
  };

  const setApScore = (ap: string, score: number) => {
    setApScores(prev => ({ ...prev, [ap]: score }));
  };

  const handleSave = () => {
    const users = getUsers();
    users[email].profile = {
      major, gpa, sat, act, gradYear,
      aps: selectedAps, apScores,
      clubs: selectedClubs,
      extracurriculars, achievements,
      serviceHours, isST, testOptional,
      sports: selectedSports
    };
    saveUsers(users);
    onUpdate();
  };

  const filteredClubs = ERHS_CLUBS.filter(c => c.toLowerCase().includes(clubSearch.toLowerCase()));

  return (
    <div className="max-w-2xl mx-auto py-10 px-5">
      <div className="bg-card rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-primary mb-1">Edit Profile</h2>
        <p className="text-muted-foreground mb-6">{userName}</p>

        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input type="checkbox" checked={isST} onChange={() => setIsST(!isST)} className="accent-primary w-4 h-4" />
          <span className="text-sm font-semibold">S/T (Science & Technology) Program</span>
        </label>
        {isST && (
          <div className="bg-secondary/20 border-l-4 border-secondary rounded-r-lg p-3 mb-4 text-xs">
            ⚠️ S/T requires math every year through Pre-Calc Honors+, and 3-4 advanced STEM credits with at least one AP.
            {gradYear === "2026" && (
              <p className="mt-2 font-bold text-destructive">🔔 Seniors doing Option 3 (Dual Enrollment): Remember to complete your required dual enrollment classes!</p>
            )}
          </div>
        )}

        <label className="text-sm font-semibold">Graduation Year</label>
        <select value={gradYear} onChange={e => setGradYear(e.target.value)}
          className="w-full p-3 mb-3 border border-input rounded-lg bg-card">
          {GRAD_YEARS.map(y => <option key={y} value={y}>Class of {y}</option>)}
        </select>

        <label className="text-sm font-semibold">Intended Major / Career</label>
        <Input placeholder="e.g. Computer Science" value={major} onChange={e => { setMajor(e.target.value); setShowExplore(false); }} className="mb-1" />
        <button onClick={() => setShowExplore(!showExplore)} className="text-xs text-secondary underline mb-3 block">
          {showExplore ? "Hide explorer" : "🔍 Undecided? Explore career paths"}
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

        <label className="text-sm font-semibold">Current GPA</label>
        <Input type="number" step="0.1" value={gpa} onChange={e => setGpa(e.target.value)} className="mb-3" />

        <label className="flex items-center gap-2 mb-2 cursor-pointer">
          <input type="checkbox" checked={testOptional} onChange={() => setTestOptional(!testOptional)} className="accent-primary w-4 h-4" />
          <span className="text-sm text-foreground">I'm going test-optional (no SAT/ACT)</span>
        </label>

        {!testOptional && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-sm font-semibold">SAT Score</label>
              <Input type="number" placeholder="e.g. 1200" value={sat} onChange={e => setSat(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-semibold">ACT Score</label>
              <Input type="number" placeholder="e.g. 28" value={act} onChange={e => setAct(e.target.value)} />
            </div>
          </div>
        )}

        <label className="text-sm font-semibold">Student Service Hours (24 required)</label>
        <div className="mb-3">
          <Input type="number" min="0" max="500" value={serviceHours} onChange={e => setServiceHours(Number(e.target.value))} />
          <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, (serviceHours / 24) * 100)}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{serviceHours}/24 hours completed</p>
        </div>

        <label className="text-sm font-semibold">APs Taken / Taking</label>
        <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto border border-input rounded-lg p-3 mb-2 bg-muted/30">
          {AP_LIST.map(ap => (
            <label key={ap} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={selectedAps.includes(ap)} onChange={() => toggleAp(ap)} className="accent-primary" />
              {ap}
            </label>
          ))}
        </div>

        {selectedAps.length > 0 && (
          <>
            <label className="text-sm font-semibold">AP Exam Scores (1-5, leave blank if not taken)</label>
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

        <label className="text-sm font-semibold">Clubs & Organizations</label>
        <Input placeholder="Search clubs..." value={clubSearch} onChange={e => setClubSearch(e.target.value)} className="mb-2 mt-1" />
        <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto border border-input rounded-lg p-3 mb-4 bg-muted/30">
          {filteredClubs.map(club => (
            <label key={club} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={selectedClubs.includes(club)} onChange={() => toggleClub(club)} className="accent-primary" />
              {club}
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mb-4">{selectedClubs.length} club(s) selected</p>

        <label className="text-sm font-semibold">🏅 Sports</label>
        <div className="grid grid-cols-1 gap-1.5 max-h-32 overflow-y-auto border border-input rounded-lg p-3 mb-4 bg-muted/30">
          {ERHS_SPORTS.map(sport => (
            <label key={sport} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={selectedSports.includes(sport)} onChange={() => toggleSport(sport)} className="accent-primary" />
              {sport}
            </label>
          ))}
        </div>

        <label className="text-sm font-semibold">Out-of-School Extracurriculars ({extracurriculars.length}/{MAX_EXTRAS})</label>
        <div className="flex gap-2 mb-2 mt-1">
          <Input placeholder="e.g. Community Soccer League" value={newExtra} onChange={e => setNewExtra(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addExtra()} />
          <Button onClick={addExtra} size="sm" disabled={extracurriculars.length >= MAX_EXTRAS}>Add</Button>
        </div>
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

        <label className="text-sm font-semibold">Notable Achievements & Awards</label>
        <div className="flex gap-2 mb-2 mt-1">
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

        <Button onClick={handleSave} className="w-full mt-4">Save Profile</Button>
        <Button variant="outline" onClick={() => generateResumePDF(userName, email, profile)} className="w-full mt-2">
          📄 Download Resume PDF
        </Button>
      </div>
    </div>
  );
};

export default PortfolioPage;
