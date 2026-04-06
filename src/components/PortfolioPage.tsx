import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getUsers, saveUsers, AP_LIST, GRAD_YEARS, ERHS_CLUBS, UserProfile } from "@/lib/store";

interface PortfolioPageProps {
  email: string;
  profile: UserProfile;
  userName: string;
  onUpdate: () => void;
}

const PortfolioPage = ({ email, profile, userName, onUpdate }: PortfolioPageProps) => {
  const [major, setMajor] = useState(profile.major);
  const [gpa, setGpa] = useState(profile.gpa);
  const [sat, setSat] = useState(profile.sat || "");
  const [act, setAct] = useState(profile.act || "");
  const [gradYear, setGradYear] = useState(profile.gradYear);
  const [selectedAps, setSelectedAps] = useState<string[]>(profile.aps);
  const [selectedClubs, setSelectedClubs] = useState<string[]>(profile.clubs || []);
  const [clubSearch, setClubSearch] = useState("");
  const [extracurriculars, setExtracurriculars] = useState<string[]>(profile.extracurriculars || []);
  const [newExtra, setNewExtra] = useState("");
  const [achievements, setAchievements] = useState<string[]>(profile.achievements || []);
  const [newAchievement, setNewAchievement] = useState("");
  const [serviceHours, setServiceHours] = useState(profile.serviceHours || 0);
  const [isST, setIsST] = useState(profile.isST || false);

  const toggleAp = (ap: string) => setSelectedAps(prev => prev.includes(ap) ? prev.filter(a => a !== ap) : [...prev, ap]);
  const toggleClub = (club: string) => setSelectedClubs(prev => prev.includes(club) ? prev.filter(c => c !== club) : [...prev, club]);

  const addExtra = () => {
    if (newExtra.trim()) { setExtracurriculars(prev => [...prev, newExtra.trim()]); setNewExtra(""); }
  };
  const addAchievement = () => {
    if (newAchievement.trim()) { setAchievements(prev => [...prev, newAchievement.trim()]); setNewAchievement(""); }
  };

  const handleSave = () => {
    const users = getUsers();
    users[email].profile = {
      major, gpa, sat, act, gradYear,
      aps: selectedAps, clubs: selectedClubs,
      extracurriculars, achievements,
      serviceHours, isST
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
          </div>
        )}

        <label className="text-sm font-semibold">Graduation Year</label>
        <select value={gradYear} onChange={e => setGradYear(e.target.value)}
          className="w-full p-3 mb-3 border border-input rounded-lg bg-card">
          {GRAD_YEARS.map(y => <option key={y} value={y}>Class of {y}</option>)}
        </select>

        <label className="text-sm font-semibold">Intended Major / Career</label>
        <Input placeholder="e.g. Computer Science" value={major} onChange={e => setMajor(e.target.value)} className="mb-3" />

        <label className="text-sm font-semibold">Current GPA</label>
        <Input type="number" step="0.1" value={gpa} onChange={e => setGpa(e.target.value)} className="mb-3" />

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

        <label className="text-sm font-semibold">Student Service Hours (24 required)</label>
        <div className="mb-3">
          <Input type="number" min="0" max="500" value={serviceHours} onChange={e => setServiceHours(Number(e.target.value))} />
          <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, (serviceHours / 24) * 100)}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{serviceHours}/24 hours completed</p>
        </div>

        <label className="text-sm font-semibold">APs Taken / Taking</label>
        <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto border border-input rounded-lg p-3 mb-4 bg-muted/30">
          {AP_LIST.map(ap => (
            <label key={ap} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={selectedAps.includes(ap)} onChange={() => toggleAp(ap)} className="accent-primary" />
              {ap}
            </label>
          ))}
        </div>

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

        <label className="text-sm font-semibold">Out-of-School Extracurriculars</label>
        <div className="flex gap-2 mb-2 mt-1">
          <Input placeholder="e.g. Community Soccer League" value={newExtra} onChange={e => setNewExtra(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addExtra()} />
          <Button onClick={addExtra} size="sm">Add</Button>
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
      </div>
    </div>
  );
};

export default PortfolioPage;
