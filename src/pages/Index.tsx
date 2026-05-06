import { useState, useEffect, useCallback } from "react";
import { getUsers, saveUsers, setSession, clearSession, getDefaultProfile } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import AuthPage from "@/components/AuthPage";
import OnboardingFlow from "@/components/OnboardingFlow";
import AppNav from "@/components/AppNav";
import HomePage from "@/components/HomePage";
import MatchesPage from "@/components/MatchesPage";
import PortfolioPage from "@/components/PortfolioPage";
import ClubsPage from "@/components/ClubsPage";
import SATPage from "@/components/SATPage";
import TranscriptsPage from "@/components/TranscriptsPage";
import EssayPage from "@/components/EssayPage";
import GraduationPage from "@/components/GraduationPage";
import FacultyPage from "@/components/FacultyPage";
import AdminDashboard from "@/components/admin/AdminDashboard";
import CustomTabPage from "@/components/CustomTabPage";
import LegalConsentPage from "@/components/LegalConsentPage";
import { fetchPublishedTabs, CustomTab } from "@/lib/custom-tabs";
import { trackVisit } from "@/lib/visit-tracker";

const CustomTabRouter = ({ slug }: { slug: string }) => {
  const [tab, setTab] = useState<CustomTab | null>(null);
  useEffect(() => { fetchPublishedTabs().then(tabs => setTab(tabs.find(t => t.slug === slug) || null)); }, [slug]);
  if (!tab) return <div className="max-w-4xl mx-auto py-10 px-5 text-muted-foreground">Loading…</div>;
  return <CustomTabPage tab={tab} />;
};

const Index = () => {
  const { session, user: authUser, isAdmin, isBlocked, loading } = useAuth();
  const [page, setPage] = useState("home");
  const [refreshKey, setRefreshKey] = useState(0);
  const [adminMode, setAdminMode] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState<boolean | null>(null);

  const email = authUser?.email?.toLowerCase() ?? null;

  // Bridge Supabase auth into local profile store
  useEffect(() => {
    if (!email || !authUser) return;
    const users = getUsers();
    if (!users[email]) {
      users[email] = {
        name: (authUser.user_metadata?.full_name as string) || email.split("@")[0],
        username: email.split("@")[0],
        pass: "", securityPhrase: "",
        setupComplete: false,
        profile: getDefaultProfile(),
        bookmarks: [],
      };
      saveUsers(users);
    }
    setSession(email);
    setNeedsOnboarding(!users[email].setupComplete);
  }, [email, authUser]);

  // Check whether this user has accepted the legal/privacy page
  useEffect(() => {
    if (!authUser?.id) { setLegalAccepted(null); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("legal_accepted_at")
        .eq("user_id", authUser.id)
        .maybeSingle();
      if (cancelled) return;
      setLegalAccepted(!!data?.legal_accepted_at);
    })();
    return () => { cancelled = true; };
  }, [authUser?.id]);

  const handleLogout = useCallback(async () => {
    clearSession();
    await signOut();
    setPage("home");
    setAdminMode(false);
  }, []);

  // Track visits: on every page change and whenever the tab becomes visible again
  useEffect(() => {
    if (!session) return;
    trackVisit(page);
    const onVis = () => { if (document.visibilityState === "visible") trackVisit(page); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [page, session]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  if (isBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-5">
        <div className="bg-card rounded-xl shadow-xl p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-destructive mb-2">Access Denied</h2>
          <p className="text-muted-foreground">This account has been blocked from RaidersMatch. Contact an administrator if you believe this is a mistake.</p>
        </div>
      </div>
    );
  }

  if (!session || !email) return <AuthPage onLogin={() => { /* auth state listener handles routing */ }} />;

  // Wait for the legal-accepted lookup before showing onboarding/app
  if (legalAccepted === null) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  if (!legalAccepted && authUser?.id) {
    return <LegalConsentPage userId={authUser.id} onAccepted={() => setLegalAccepted(true)} />;
  }

  if (needsOnboarding) {
    return <OnboardingFlow email={email} onComplete={() => setNeedsOnboarding(false)} />;
  }

  const user = getUsers()[email];
  if (!user) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Setting up your profile...</div>;

  if (adminMode && isAdmin) {
    return <AdminDashboard onExit={() => setAdminMode(false)} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNav currentPage={page} onNavigate={setPage} onLogout={handleLogout}
        isAdmin={isAdmin} onEnterAdmin={() => setAdminMode(true)} />
      {page === "home" && (
        <HomePage
          username={user.username}
          gradYear={user.profile.gradYear}
          email={email}
          profile={{
            serviceHours: user.profile.serviceHours || 0,
            isST: user.profile.isST || false,
            aps: user.profile.aps || [],
            clubs: user.profile.clubs || [],
            extracurriculars: user.profile.extracurriculars || [],
            achievements: user.profile.achievements || [],
            sports: user.profile.sports || [],
          }}
        />
      )}
      {page === "matches" && <MatchesPage key={refreshKey} profile={user.profile} email={email} />}
      {page === "portfolio" && (
        <PortfolioPage email={email} profile={user.profile} userName={user.name}
          onUpdate={() => { setRefreshKey(k => k + 1); }} />
      )}
      {page === "clubs" && <ClubsPage />}
      {page === "sat" && <SATPage />}
      {page === "essays" && <EssayPage />}
      {page === "transcripts" && <TranscriptsPage />}
      {page === "graduation" && <GraduationPage />}
      {page === "faculty" && <FacultyPage />}
      {page.startsWith("custom:") && <CustomTabRouter slug={page.slice(7)} />}
    </div>
  );
};

export default Index;
