import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getUsers, saveUsers, AP_LIST, GRAD_YEARS, UserProfile } from "@/lib/store";

interface PortfolioPageProps {
  email: string;
  profile: UserProfile;
  onUpdate: () => void;
}

const PortfolioPage = ({ email, profile, onUpdate }: PortfolioPageProps) => {
  const [major, setMajor] = useState(profile.major);
  const [gpa, setGpa] = useState(profile.gpa);
  const [gradYear, setGradYear] = useState(profile.gradYear);
  const [selectedAps, setSelectedAps] = useState<string[]>(profile.aps);

  const toggleAp = (ap: string) => {
    setSelectedAps(prev => prev.includes(ap) ? prev.filter(a => a !== ap) : [...prev, ap]);
  };

  const handleSave = () => {
    const users = getUsers();
    users[email].profile = { major, gpa, gradYear, aps: selectedAps };
    saveUsers(users);
    onUpdate();
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-5">
      <div className="bg-card rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-primary mb-6">Edit Profile</h2>
        <label className="text-sm font-semibold">Graduation Year</label>
        <select value={gradYear} onChange={e => setGradYear(e.target.value)}
          className="w-full p-3 mb-3 border border-input rounded-lg bg-card">
          {GRAD_YEARS.map(y => <option key={y} value={y}>Class of {y}</option>)}
        </select>
        <label className="text-sm font-semibold">Intended Major / Career</label>
        <Input placeholder="e.g. Computer Science" value={major} onChange={e => setMajor(e.target.value)} className="mb-3" />
        <label className="text-sm font-semibold">Current GPA</label>
        <Input type="number" step="0.1" value={gpa} onChange={e => setGpa(e.target.value)} className="mb-3" />
        <label className="text-sm font-semibold">APs Taken</label>
        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-input rounded-lg p-3 mb-6 bg-muted/30">
          {AP_LIST.map(ap => (
            <label key={ap} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={selectedAps.includes(ap)} onChange={() => toggleAp(ap)} className="accent-primary" />
              {ap}
            </label>
          ))}
        </div>
        <Button onClick={handleSave} className="w-full">Save</Button>
      </div>
    </div>
  );
};

export default PortfolioPage;
