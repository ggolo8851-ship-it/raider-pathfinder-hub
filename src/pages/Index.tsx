import { useState, useEffect, useCallback } from "react";
import { getUsers, getSession, clearSession } from "@/lib/store";
import AuthPage from "@/components/AuthPage";
import OnboardingFlow from "@/components/OnboardingFlow";
import AppNav from "@/components/AppNav";
import HomePage from "@/components/HomePage";
import MatchesPage from "@/components/MatchesPage";
import PortfolioPage from "@/components/PortfolioPage";

type AppState = "auth" | "onboarding" | "app";

const Index = () => {
  const [appState, setAppState] = useState<AppState>("auth");
  const [email, setEmail] = useState<string | null>(null);
  const [page, setPage] = useState("home");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const session = getSession();
    if (session) {
      const users = getUsers();
      if (users[session]) {
        setEmail(session);
        setAppState(users[session].setupComplete ? "app" : "onboarding");
      }
    }
  }, []);

  const handleLogin = useCallback((em: string) => {
    setEmail(em);
    const users = getUsers();
    if (users[em].setupComplete) {
      setAppState("app");
      setPage("home");
    } else {
      setAppState("onboarding");
    }
  }, []);

  const handleLogout = useCallback(() => {
    clearSession();
    setEmail(null);
    setAppState("auth");
    setPage("home");
  }, []);

  const user = email ? getUsers()[email] : null;

  if (appState === "auth") return <AuthPage onLogin={handleLogin} />;
  if (appState === "onboarding" && email) return <OnboardingFlow email={email} onComplete={() => { setAppState("app"); setPage("home"); }} />;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <AppNav currentPage={page} onNavigate={setPage} onLogout={handleLogout} />
      {page === "home" && <HomePage username={user.username} />}
      {page === "matches" && <MatchesPage key={refreshKey} profile={user.profile} />}
      {page === "portfolio" && (
        <PortfolioPage email={email!} profile={user.profile}
          onUpdate={() => { setRefreshKey(k => k + 1); setPage("home"); }} />
      )}
    </div>
  );
};

export default Index;
