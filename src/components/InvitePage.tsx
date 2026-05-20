const InvitePage = () => {
  const shareUrl = typeof window !== "undefined" ? window.location.origin : "https://raiderhub.lovable.app";
  const shareText = "RaidersMatch helps ERHS students find college matches, clubs, scholarships, volunteer hours, and graduation resources.";

  const copyInvite = async () => {
    await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    const { toast } = await import("sonner");
    toast.success("Invite copied");
  };

  return (
    <main className="max-w-4xl mx-auto py-10 px-5">
      <section className="rounded-xl bg-card border border-border p-6 shadow-sm">
        <p className="text-sm font-semibold text-secondary mb-2">New students</p>
        <h1 className="text-3xl font-bold text-primary mb-3">Join RaidersMatch</h1>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Build your ERHS profile, discover colleges that fit your goals, browse clubs, track graduation steps, and find volunteer opportunities in one place.
        </p>
        <div className="grid sm:grid-cols-3 gap-3 mb-6">
          <div className="rounded-lg border border-border p-4"><b>College matches</b><p className="text-sm text-muted-foreground mt-1">Personalized by major, scores, activities, vibe, cost, and distance.</p></div>
          <div className="rounded-lg border border-border p-4"><b>ERHS clubs</b><p className="text-sm text-muted-foreground mt-1">Find organizations and activities that match your interests.</p></div>
          <div className="rounded-lg border border-border p-4"><b>Student tools</b><p className="text-sm text-muted-foreground mt-1">Graduation, SAT/ACT, essays, transcripts, and SSL support.</p></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={copyInvite} className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity">Copy invite</button>
          <a href={`sms:?&body=${encodeURIComponent(`${shareText} ${shareUrl}`)}`} className="bg-secondary text-secondary-foreground px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity">Text it</a>
          <a href={`mailto:?subject=${encodeURIComponent("Join RaidersMatch")}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`} className="bg-muted text-foreground px-5 py-2.5 rounded-lg font-semibold hover:bg-muted/80 transition-colors">Email it</a>
        </div>
      </section>
    </main>
  );
};

export default InvitePage;