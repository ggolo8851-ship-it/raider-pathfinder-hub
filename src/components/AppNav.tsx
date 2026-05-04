import { useEffect, useState } from "react";
import { fetchPublishedTabs, CustomTab } from "@/lib/custom-tabs";
import EditableText from "@/components/EditableText";

interface AppNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  isAdmin?: boolean;
  onEnterAdmin?: () => void;
}

const AppNav = ({ currentPage, onNavigate, onLogout, isAdmin, onEnterAdmin }: AppNavProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [customTabs, setCustomTabs] = useState<CustomTab[]>([]);
  useEffect(() => { fetchPublishedTabs().then(setCustomTabs); }, []);

  const links: { id: string; label: string; key?: string }[] = [
    { id: "home", label: "Home", key: "nav.home" },
    { id: "portfolio", label: "Portfolio", key: "nav.portfolio" },
    { id: "matches", label: "Matches", key: "nav.matches" },
    { id: "clubs", label: "Clubs", key: "nav.clubs" },
    { id: "sat", label: "SAT/ACT", key: "nav.sat" },
    { id: "essays", label: "Essays", key: "nav.essays" },
    { id: "transcripts", label: "Counseling", key: "nav.counseling" },
    { id: "graduation", label: "Graduation", key: "nav.graduation" },
    { id: "faculty", label: "Faculty", key: "nav.faculty" },
    ...customTabs.map(t => ({ id: `custom:${t.slug}`, label: `${t.icon || "📄"} ${t.title}` })),
  ];

  return (
    <nav className="bg-primary border-b-4 border-secondary sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center px-3 sm:px-5 py-3">
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-primary-foreground text-lg sm:text-xl font-bold">
              <EditableText textKey="nav.brand" defaultValue="RaidersMatch" />
            </span>
            <span className="text-primary-foreground/60 text-xs">▼</span>
          </button>
          {showMenu && (
            <div className="absolute top-full left-0 mt-2 bg-card rounded-xl shadow-xl border border-border min-w-56 z-50 overflow-hidden">
              <button onClick={() => { onNavigate("home"); setShowMenu(false); }}
                className="w-full text-left px-4 py-3 text-sm text-foreground hover:bg-muted/50 border-b border-border">🏠 Home</button>
              <button onClick={() => { onNavigate("graduation"); setShowMenu(false); }}
                className="w-full text-left px-4 py-3 text-sm text-foreground hover:bg-muted/50 border-b border-border">🎓 Graduation Requirements</button>
              <a href="https://www.niche.com/colleges/search/best-colleges/" target="_blank" rel="noopener noreferrer"
                className="block px-4 py-3 text-sm text-foreground hover:bg-muted/50 border-b border-border">🏆 Niche Top 100 Colleges</a>
              {isAdmin && onEnterAdmin && (
                <button onClick={() => { onEnterAdmin(); setShowMenu(false); }}
                  className="w-full text-left px-4 py-3 text-sm font-semibold text-secondary bg-secondary/10 hover:bg-secondary/20">
                  🛡️ Admin Dashboard
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap justify-end">
          {links.map(l => (
            <button key={l.id} onClick={() => onNavigate(l.id)}
              className={`px-2.5 py-1 rounded-full text-[11px] sm:text-xs border transition-colors ${
                currentPage === l.id
                  ? "bg-secondary text-secondary-foreground border-secondary font-semibold"
                  : "border-secondary text-primary-foreground hover:bg-secondary/20"
              }`}>
              {l.key
                ? <EditableText textKey={l.key} defaultValue={l.label} />
                : l.label}
            </button>
          ))}
          <button onClick={onLogout}
            className="px-2.5 py-1 rounded-full text-[11px] sm:text-xs border border-destructive text-destructive hover:bg-destructive/20">
            <EditableText textKey="nav.signout" defaultValue="Sign Out" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default AppNav;
