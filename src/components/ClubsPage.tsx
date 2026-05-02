import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

type Club = {
  id: string;
  name: string;
  classification: string | null;
  meeting_day: string | null;
  schedule: string | null;
  sponsor: string | null;
  sponsor_email: string | null;
  purpose: string | null;
  location: string | null;
};

const classificationColors: Record<string, string> = {
  "Academic": "border-blue-500",
  "Arts": "border-purple-500",
  "Cultural": "border-orange-500",
  "Honor Society": "border-yellow-500",
  "Lifestyle": "border-pink-500",
  "Professional": "border-green-500",
  "Service": "border-red-500",
  "Sports & Recreation": "border-teal-500",
  "Sports": "border-teal-500",
  "STEM": "border-cyan-500",
  "Student Government": "border-indigo-500",
  "Hobby": "border-pink-500",
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
  "Sports": "bg-teal-100 text-teal-800",
  "STEM": "bg-cyan-100 text-cyan-800",
  "Student Government": "bg-indigo-100 text-indigo-800",
  "Hobby": "bg-pink-100 text-pink-800",
};

const ClubsPage = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState("All");
  const [dayFilter, setDayFilter] = useState("All");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("clubs")
        .select("id,name,classification,meeting_day,schedule,sponsor,sponsor_email,purpose,location")
        .order("name", { ascending: true });
      if (!error && data) setClubs(data as Club[]);
      setLoading(false);
    })();
  }, []);

  const classifications = useMemo(() => {
    const set = new Set<string>();
    clubs.forEach(c => c.classification && set.add(c.classification));
    return ["All", ...Array.from(set).sort()];
  }, [clubs]);

  const filtered = useMemo(() => {
    return clubs.filter(c => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (classFilter !== "All" && c.classification !== classFilter) return false;
      if (dayFilter !== "All" && c.meeting_day !== dayFilter) return false;
      return true;
    });
  }, [clubs, search, classFilter, dayFilter]);

  const meetingDays = ["All", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  return (
    <div className="max-w-4xl mx-auto py-10 px-5">
      <h2 className="text-3xl font-bold text-primary mb-2">🏫 ERHS Clubs & Organizations</h2>
      <p className="text-muted-foreground mb-6">
        {loading ? "Loading clubs…" : `${clubs.length} clubs available — click any to learn more`}
      </p>

      <Input placeholder="Search clubs..." value={search} onChange={e => setSearch(e.target.value)} className="mb-4" />

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div>
          <label className="text-sm font-semibold text-foreground">Classification</label>
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
            className="w-full p-2 mt-1 border border-input rounded-lg bg-card text-sm">
            {classifications.map(c => <option key={c} value={c}>{c}</option>)}
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
          const isExpanded = expanded === club.id;
          const cls = club.classification ?? "";
          const borderColor = classificationColors[cls] || "border-primary";
          const badgeColor = classificationBadgeColors[cls] || "bg-muted text-muted-foreground";
          return (
            <div key={club.id} className={`bg-card rounded-xl shadow-sm border-l-4 ${borderColor} overflow-hidden`}>
              <button onClick={() => setExpanded(isExpanded ? null : club.id)}
                className="w-full text-left p-4 flex justify-between items-center hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">{club.name}</span>
                  {cls && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${badgeColor}`}>{cls}</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{club.meeting_day || ""} {isExpanded ? "▲" : "▼"}</span>
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 text-sm space-y-1 border-t border-border pt-3">
                  {club.purpose && <p><b>Purpose:</b> {club.purpose}</p>}
                  {club.sponsor && <p><b>Sponsor:</b> {club.sponsor}</p>}
                  {club.sponsor_email && <p><b>Email:</b> <a href={`mailto:${club.sponsor_email}`} className="text-primary underline">{club.sponsor_email}</a></p>}
                  {club.schedule && <p><b>Meeting Schedule:</b> {club.schedule}</p>}
                  {club.meeting_day && <p><b>Meeting Day:</b> {club.meeting_day}</p>}
                  {club.location && <p><b>Location:</b> {club.location}</p>}
                  {cls && <p><b>Classification:</b> <span className={`px-2 py-0.5 rounded-full text-xs ${badgeColor}`}>{cls}</span></p>}
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
