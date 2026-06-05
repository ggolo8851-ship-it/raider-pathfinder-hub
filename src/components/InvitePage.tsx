import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { buildShareUrl, getMyReferralCode, getMyReferralCount } from "@/lib/referrals";

import ReferralLeaderboard from "@/components/ReferralLeaderboard";

const InvitePage = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [refCode, setRefCode] = useState<string | null>(null);
  const [refCount, setRefCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    getMyReferralCode(user.id).then(setRefCode);
    getMyReferralCount(user.id).then(setRefCount);
  }, [user?.id]);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://raiderhub.lovable.app";
  const shareUrl = buildShareUrl(baseUrl, refCode);
  const shareText = "RaidersMatch helps ERHS students find college matches, clubs, scholarships, volunteer hours, and graduation resources.";
  const fullMsg = `${shareText}\n\n${shareUrl}`;

  const toast = async (kind: "success" | "error", msg: string) => {
    try { const { toast: t } = await import("sonner"); kind === "success" ? t.success(msg) : t.error(msg); } catch {}
  };

  const copy = async (text: string, label: string) => {
    try { await navigator.clipboard.writeText(text); toast("success", `${label} copied`); }
    catch { toast("error", "Copy failed — long-press to copy manually"); }
  };

  const shareNative = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "RaidersMatch", text: shareText, url: shareUrl }); return; } catch {}
    }
    copy(fullMsg, "Invite");
  };

  const openInstagram = async () => {
    await copy(fullMsg, "Caption + link");
    window.open("https://www.instagram.com/erhsstudentsforsuccess/", "_blank", "noopener,noreferrer");
  };

  return (
    <main className="max-w-4xl mx-auto py-10 px-5 space-y-6">
      <section className="rounded-xl bg-card border border-border p-6 shadow-sm">
        <p className="text-sm font-semibold text-secondary mb-2">New students</p>
        <h1 className="text-3xl font-bold text-primary mb-3">Join RaidersMatch</h1>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Build your ERHS profile, discover colleges that fit your goals, browse clubs, track graduation steps, and find volunteer opportunities in one place.
        </p>

        {refCode && (
          <div className="rounded-lg bg-secondary/10 border border-secondary/30 p-3 mb-4 text-sm">
            <span className="font-semibold">Your invite code:</span> <span className="font-mono font-bold text-secondary">{refCode}</span>
            <span className="ml-3 text-muted-foreground">You've referred <span className="font-bold text-foreground">{refCount}</span> {refCount === 1 ? "student" : "students"}.</span>
          </div>
        )}

        <div className="rounded-lg bg-muted/40 border border-border p-3 mb-6 flex items-center justify-between gap-3 flex-wrap">
          <a href={shareUrl} className="text-primary font-mono text-sm underline break-all">{shareUrl}</a>
          <button onClick={() => copy(shareUrl, "Link")} className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-semibold hover:opacity-90">Copy link</button>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-6">
          <div className="rounded-lg border border-border p-4"><b>College matches</b><p className="text-sm text-muted-foreground mt-1">Personalized by major, scores, activities, vibe, cost, and distance.</p></div>
          <div className="rounded-lg border border-border p-4"><b>ERHS clubs</b><p className="text-sm text-muted-foreground mt-1">Find organizations and activities that match your interests.</p></div>
          <div className="rounded-lg border border-border p-4"><b>Student tools</b><p className="text-sm text-muted-foreground mt-1">Graduation, SAT/ACT, essays, transcripts, and SSL support.</p></div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={shareNative} className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity">Share…</button>
          <button onClick={() => copy(fullMsg, "Invite")} className="bg-secondary text-secondary-foreground px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity">Copy invite</button>
          <a
            href={`mailto:?subject=${encodeURIComponent("Join RaidersMatch")}&body=${encodeURIComponent(`${shareText}\n\nOpen RaidersMatch: ${shareUrl}`)}`}
            className="bg-muted text-foreground px-5 py-2.5 rounded-lg font-semibold hover:bg-muted/80 transition-colors">Email it</a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(fullMsg)}`}
            target="_blank" rel="noopener noreferrer"
            className="bg-[#25D366] text-white px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity">WhatsApp</a>
          <button onClick={openInstagram} className="bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity">Instagram</button>
          {isMobile && (
            <a
              href={`sms:?&body=${encodeURIComponent(fullMsg)}`}
              className="bg-secondary text-secondary-foreground px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity">Text it</a>
          )}
        </div>
        {!isMobile && (
          <p className="text-xs text-muted-foreground mt-3">Text-message sharing appears automatically on phones and tablets that can send SMS.</p>
        )}
      </section>

      <ReferralLeaderboard />

    </main>
  );
};

export default InvitePage;
