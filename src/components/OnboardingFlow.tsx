import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getUsers, saveUsers, AP_LIST, GRAD_YEARS } from "@/lib/store";

interface OnboardingFlowProps {
  email: string;
  onComplete: () => void;
}

const OnboardingFlow = ({ email, onComplete }: OnboardingFlowProps) => {
  const [step, setStep] = useState<"grad" | "profile">("grad");
  const [major, setMajor] = useState("");
  const [gpa, setGpa] = useState("");
  const [gradYear, setGradYear] = useState("2027");
  const [selectedAps, setSelectedAps] = useState<string[]>([]);

  const toggleAp = (ap: string) => {
    setSelectedAps(prev => prev.includes(ap) ? prev.filter(a => a !== ap) : [...prev, ap]);
  };

  const handleComplete = () => {
    const users = getUsers();
    users[email].profile = { major, gpa, gradYear, aps: selectedAps };
    users[email].setupComplete = true;
    saveUsers(users);
    onComplete();
  };

  if (step === "grad") {
    return (
      <div className="auth-bg min-h-screen flex items-center justify-center p-5">
        <div className="bg-card rounded-2xl shadow-2xl p-8 w-full max-w-2xl">
          <h2 className="text-2xl font-bold text-primary mb-6 text-center">MD Graduation Requirements</h2>
          <table className="w-full mb-6">
            <thead>
              <tr className="border-b-2 border-primary">
                <th className="text-left py-3 text-primary">Subject</th>
                <th className="text-left py-3 text-primary">Credits</th>
              </tr>
            </thead>
            <tbody>
              {[["English", "4"], ["Math", "4"], ["Science", "3"], ["Social Studies", "3"], ["Service Learning", "75 Hrs"]].map(([s, c]) => (
                <tr key={s} className="border-b border-border">
                  <td className="py-3">{s}</td>
                  <td className="py-3 font-semibold">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button onClick={() => setStep("profile")} className="w-full">Continue</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center p-5">
      <div className="bg-card rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-primary mb-6 text-center">Academic Profile</h2>
        <label className="text-sm font-semibold text-foreground">Graduation Year</label>
        <select value={gradYear} onChange={e => setGradYear(e.target.value)}
          className="w-full p-3 mb-3 border border-input rounded-lg bg-card">
          {GRAD_YEARS.map(y => <option key={y} value={y}>Class of {y}</option>)}
        </select>
        <label className="text-sm font-semibold text-foreground">Intended Major / Career</label>
        <Input placeholder="e.g. Computer Science" value={major} onChange={e => setMajor(e.target.value)} className="mb-3" />
        <label className="text-sm font-semibold text-foreground">Current GPA</label>
        <Input type="number" step="0.1" placeholder="e.g. 3.5" value={gpa} onChange={e => setGpa(e.target.value)} className="mb-3" />
        <label className="text-sm font-semibold text-foreground">APs Taken</label>
        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-input rounded-lg p-3 mb-4 bg-muted/30">
          {AP_LIST.map(ap => (
            <label key={ap} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={selectedAps.includes(ap)} onChange={() => toggleAp(ap)} className="accent-primary" />
              {ap}
            </label>
          ))}
        </div>
        <Button onClick={handleComplete} className="w-full">Complete</Button>
      </div>
    </div>
  );
};

export default OnboardingFlow;
