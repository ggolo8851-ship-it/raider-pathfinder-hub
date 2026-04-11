import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ERHS_CLUBS, ERHS_CLUB_INFO, CLUB_CLASSIFICATIONS } from "@/lib/store";

const classificationColors: Record<string, string> = {
  "Academic": "border-blue-500",
  "Arts": "border-purple-500",
  "Cultural": "border-orange-500",
  "Honor Society": "border-yellow-500",
  "Lifestyle": "border-pink-500",
  "Professional": "border-green-500",
  "Service": "border-red-500",
  "Sports & Recreation": "border-teal-500",
  "STEM": "border-cyan-500",
  "Student Government": "border-indigo-500",
};

const classificationBadgeColors: Record<string, string> = {
  "Academic": "bg-blue-100 text-blue-800",
  "Arts": "bg-purple-100 text-purple-800",
  "Cultural": "bg-orange-100 text-orange-800",
  "Honor Society": "bg-yellow-100 text-yellow-800",
  "Lifestyle": "bg-pink-100 text-pink-800",
  "Professional": "bg-green-100 text-green-800",
  "Service": "bg-red-100 text-red-800",
  "Sports & Recreation": "bg-teal-100 text-teal-800",
  "STEM": "bg-cyan-100 text-cyan-800",
  "Student Government": "bg-indigo-100 text-indigo-800",
};

const ClubsPage = () => {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState("All");
  const [dayFilter, setDayFilter] = useState("All");

  const filtered = ERHS_CLUBS
    .filter(c => {
      if (!c.toLowerCase().includes(search.toLowerCase())) return false;
      const info = ERHS_CLUB_INFO[c];
      if (classFilter !== "All" && info?.classification !== classFilter) return false;
      if (dayFilter !== "All" && info?.meetingDay !== dayFilter) return false;
      return true;
    })
    .sort((a, b) => a.localeCompare(b));

  const meetingDays = ["All", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  return (
    <div className="max-w-4xl mx-auto py-10 px-5">
      <h2 className="text-3xl font-bold text-primary mb-2">🏫 ERHS Clubs & Organizations</h2>
      <p className="text-muted-foreground mb-6">{ERHS_CLUBS.length} clubs available — click any to learn more</p>
      
      <Input placeholder="Search clubs..." value={search} onChange={e => setSearch(e.target.value)} className="mb-4" />
      
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div>
          <label className="text-sm font-semibold text-foreground">Classification</label>
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
            className="w-full p-2 mt-1 border border-input rounded-lg bg-card text-sm">
            {CLUB_CLASSIFICATIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-foreground">Meeting Day</label>
          <select value={dayFilter} onChange={e => setDayFilter(e.target.value)}
            className="w-full p-2 mt-1 border border-input rounded-lg bg-card text-sm">
            {meetingDays.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4">{filtered.length} clubs shown</p>

      <div className="space-y-2">
        {filtered.map(club => {
          const info = ERHS_CLUB_INFO[club];
          const isExpanded = expanded === club;
          const borderColor = info ? classificationColors[info.classification] || "border-primary" : "border-primary";
          return (
            <div key={club} className={`bg-card rounded-xl shadow-sm border-l-4 ${borderColor} overflow-hidden`}>
              <button onClick={() => setExpanded(isExpanded ? null : club)}
                className="w-full text-left p-4 flex justify-between items-center hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">{club}</span>
                  {info && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${classificationBadgeColors[info.classification] || "bg-muted text-muted-foreground"}`}>
                      {info.classification}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{info?.meetingDay || ""} {isExpanded ? "▲" : "▼"}</span>
              </button>
              {isExpanded && info && (
                <div className="px-4 pb-4 text-sm space-y-1 border-t border-border pt-3">
                  <p><b>Purpose:</b> {info.purpose}</p>
                  <p><b>Sponsor:</b> {info.sponsor}</p>
                  {info.email && <p><b>Email:</b> <a href={`mailto:${info.email}`} className="text-primary underline">{info.email}</a></p>}
                  <p><b>Meeting Schedule:</b> {info.schedule}</p>
                  <p><b>Meeting Day:</b> {info.meetingDay}</p>
                  <p><b>Classification:</b> <span className={`px-2 py-0.5 rounded-full text-xs ${classificationBadgeColors[info.classification]}`}>{info.classification}</span></p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClubsPage;
