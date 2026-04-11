import { useState } from "react";

interface AppNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const AppNav = ({ currentPage, onNavigate, onLogout }: AppNavProps) => {
  const [showMenu, setShowMenu] = useState(false);

  const links = [
    { id: "home", label: "Home" },
    { id: "portfolio", label: "Portfolio" },
    { id: "matches", label: "Matches" },
    { id: "clubs", label: "Clubs" },
    { id: "sat", label: "SAT/ACT" },
    { id: "essays", label: "Essays" },
    { id: "transcripts", label: "Transcripts & Counseling" },
    { id: "graduation", label: "Graduation" },
  ];

  return (
    <nav className="bg-primary border-b-4 border-secondary sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center px-5 py-4">
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-secondary text-xl">🏫</span>
            <span className="text-primary-foreground text-xl font-bold">RaidersMatch</span>
            <span className="text-primary-foreground/60 text-xs">▼</span>
          </button>
          {showMenu && (
            <div className="absolute top-full left-0 mt-2 bg-card rounded-xl shadow-xl border border-border min-w-48 z-50 overflow-hidden">
              <button onClick={() => { onNavigate("home"); setShowMenu(false); }}
                className="w-full text-left px-4 py-3 text-sm text-foreground hover:bg-muted/50 transition-colors border-b border-border">
                🏠 Home
              </button>
              <button onClick={() => { onNavigate("graduation"); setShowMenu(false); }}
                className="w-full text-left px-4 py-3 text-sm text-foreground hover:bg-muted/50 transition-colors border-b border-border">
                🎓 Graduation Requirements
              </button>
              <a href="https://www.instagram.com/erhsstudentsforsuccess/" target="_blank" rel="noopener noreferrer"
                className="block px-4 py-3 text-sm text-foreground hover:bg-muted/50 transition-colors border-b border-border">
                📸 ESS Instagram
              </a>
              <a href="https://www.pgcps.org/schools/eleanor-roosevelt-high" target="_blank" rel="noopener noreferrer"
                className="block px-4 py-3 text-sm text-foreground hover:bg-muted/50 transition-colors">
                🏫 ERHS Website
              </a>
            </div>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {links.map(l => (
            <button key={l.id} onClick={() => onNavigate(l.id)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                currentPage === l.id
                  ? "bg-secondary text-secondary-foreground border-secondary font-semibold"
                  : "border-secondary text-primary-foreground hover:bg-secondary/20"
              }`}>
              {l.label}
            </button>
          ))}
          <button onClick={onLogout}
            className="px-3 py-1.5 rounded-full text-xs border border-destructive text-destructive hover:bg-destructive/20 transition-colors">
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
};

export default AppNav;
