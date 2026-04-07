import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ERHS_CLUBS, ERHS_CLUB_INFO } from "@/lib/store";

const ClubsPage = () => {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = ERHS_CLUBS
    .filter(c => c.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.localeCompare(b));

  return (
    <div className="max-w-4xl mx-auto py-10 px-5">
      <h2 className="text-3xl font-bold text-primary mb-2">🏫 ERHS Clubs & Organizations</h2>
      <p className="text-muted-foreground mb-6">{ERHS_CLUBS.length} clubs available — click any to learn more</p>
      <Input placeholder="Search clubs..." value={search} onChange={e => setSearch(e.target.value)} className="mb-6" />
      <div className="space-y-2">
        {filtered.map(club => {
          const info = ERHS_CLUB_INFO[club];
          const isExpanded = expanded === club;
          return (
            <div key={club} className="bg-card rounded-xl shadow-sm border-l-4 border-primary overflow-hidden">
              <button onClick={() => setExpanded(isExpanded ? null : club)}
                className="w-full text-left p-4 flex justify-between items-center hover:bg-muted/30 transition-colors">
                <span className="font-semibold text-foreground">{club}</span>
                <span className="text-xs text-muted-foreground">{info?.schedule || ""} {isExpanded ? "▲" : "▼"}</span>
              </button>
              {isExpanded && info && (
                <div className="px-4 pb-4 text-sm space-y-1 border-t border-border pt-3">
                  <p><b>Purpose:</b> {info.purpose}</p>
                  <p><b>Sponsor:</b> {info.sponsor}</p>
                  {info.email && <p><b>Email:</b> <a href={`mailto:${info.email}`} className="text-primary underline">{info.email}</a></p>}
                  <p><b>Meeting Schedule:</b> {info.schedule}</p>
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
