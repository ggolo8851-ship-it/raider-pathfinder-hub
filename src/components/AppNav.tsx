import { Button } from "@/components/ui/button";

interface AppNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const AppNav = ({ currentPage, onNavigate, onLogout }: AppNavProps) => {
  const links = [
    { id: "home", label: "Home" },
    { id: "portfolio", label: "Portfolio" },
    { id: "matches", label: "Matches" },
    { id: "clubs", label: "Clubs" },
    { id: "sat", label: "SAT/ACT" },
    { id: "transcripts", label: "Transcripts" },
  ];

  return (
    <nav className="bg-primary border-b-4 border-secondary sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center px-5 py-4">
        <span className="text-primary-foreground text-xl font-bold">RaidersMatch</span>
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
