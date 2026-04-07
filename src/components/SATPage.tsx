import { SAT_DEADLINES, ACT_DEADLINES } from "@/lib/store";
import { useState } from "react";

const SATPage = () => {
  const [tab, setTab] = useState<"sat" | "act">("sat");
  const now = new Date();

  const getStatus = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "upcoming";
    const diff = d.getTime() - now.getTime();
    if (diff < 0) return "passed";
    if (diff < 14 * 86400000) return "soon";
    return "upcoming";
  };

  const statusColors: Record<string, string> = {
    passed: "bg-muted text-muted-foreground line-through",
    soon: "bg-destructive/10 text-destructive font-semibold",
    upcoming: "bg-card",
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-5">
      <h2 className="text-3xl font-bold text-primary mb-2">📝 SAT & ACT Resource Center</h2>
      <p className="text-muted-foreground mb-6">Test dates, registration deadlines, and study resources</p>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("sat")}
          className={`px-6 py-2.5 rounded-lg font-semibold transition-colors ${tab === "sat" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          SAT
        </button>
        <button onClick={() => setTab("act")}
          className={`px-6 py-2.5 rounded-lg font-semibold transition-colors ${tab === "act" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          ACT
        </button>
      </div>

      {tab === "sat" && (
        <>
          <div className="space-y-3 mb-8">
            {SAT_DEADLINES.map((d, i) => {
              const regStatus = getStatus(d.regDeadline);
              const testStatus = getStatus(d.testDate);
              return (
                <div key={i} className={`rounded-xl shadow-sm p-4 border-l-4 border-primary ${statusColors[testStatus]}`}>
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <p className="font-bold text-foreground">Test: {d.testDate}</p>
                      <p className="text-sm text-muted-foreground">Registration: {d.regDeadline}</p>
                      <p className="text-sm text-muted-foreground">Late Registration: {d.lateDeadline}</p>
                    </div>
                    {testStatus === "soon" && <span className="text-xs bg-destructive text-destructive-foreground px-3 py-1 rounded-full">⏰ Coming Soon!</span>}
                    {testStatus === "passed" && <span className="text-xs bg-muted px-3 py-1 rounded-full">Passed</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <h3 className="text-xl font-bold text-primary mb-4">📚 SAT Study Resources</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a href="https://satsuite.collegeboard.org/sat/registration" target="_blank" rel="noopener noreferrer" className="bg-card rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border-l-4 border-secondary">
              <p className="font-bold text-foreground">Register for the SAT ↗</p>
              <p className="text-sm text-muted-foreground">CollegeBoard official registration</p>
            </a>
            <a href="https://www.khanacademy.org/digital-sat" target="_blank" rel="noopener noreferrer" className="bg-card rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border-l-4 border-secondary">
              <p className="font-bold text-foreground">Khan Academy SAT Prep ↗</p>
              <p className="text-sm text-muted-foreground">Free official practice — personalized</p>
            </a>
            <a href="https://satsuite.collegeboard.org/digital/digital-practice-preparation" target="_blank" rel="noopener noreferrer" className="bg-card rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border-l-4 border-secondary">
              <p className="font-bold text-foreground">Bluebook Practice Tests ↗</p>
              <p className="text-sm text-muted-foreground">Official digital SAT practice app</p>
            </a>
            <a href="https://www.youtube.com/results?search_query=digital+sat+prep+2025" target="_blank" rel="noopener noreferrer" className="bg-card rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border-l-4 border-secondary">
              <p className="font-bold text-foreground">YouTube SAT Prep ↗</p>
              <p className="text-sm text-muted-foreground">Free video lessons and strategies</p>
            </a>
          </div>
        </>
      )}

      {tab === "act" && (
        <>
          <div className="space-y-3 mb-8">
            {ACT_DEADLINES.map((d, i) => {
              const testStatus = getStatus(d.testDate);
              return (
                <div key={i} className={`rounded-xl shadow-sm p-4 border-l-4 border-secondary ${statusColors[testStatus]}`}>
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <p className="font-bold text-foreground">Test: {d.testDate}</p>
                      <p className="text-sm text-muted-foreground">Registration: {d.regDeadline}</p>
                      <p className="text-sm text-muted-foreground">Late Registration: {d.lateDeadline}</p>
                    </div>
                    {testStatus === "soon" && <span className="text-xs bg-destructive text-destructive-foreground px-3 py-1 rounded-full">⏰ Coming Soon!</span>}
                    {testStatus === "passed" && <span className="text-xs bg-muted px-3 py-1 rounded-full">Passed</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <h3 className="text-xl font-bold text-primary mb-4">📚 ACT Study Resources</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a href="https://www.act.org/content/act/en/products-and-services/the-act/registration.html" target="_blank" rel="noopener noreferrer" className="bg-card rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border-l-4 border-primary">
              <p className="font-bold text-foreground">Register for the ACT ↗</p>
              <p className="text-sm text-muted-foreground">Official ACT registration</p>
            </a>
            <a href="https://www.act.org/content/act/en/products-and-services/the-act/test-preparation.html" target="_blank" rel="noopener noreferrer" className="bg-card rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border-l-4 border-primary">
              <p className="font-bold text-foreground">ACT Official Prep ↗</p>
              <p className="text-sm text-muted-foreground">Free practice tests and tips</p>
            </a>
          </div>
        </>
      )}
    </div>
  );
};

export default SATPage;
