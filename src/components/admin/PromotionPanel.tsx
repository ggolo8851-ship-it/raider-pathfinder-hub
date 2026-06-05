import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";


interface Subscriber {
  id: string;
  email: string;
  grad_year: number | null;
  source: string | null;
  beehiiv_status: string | null;
  created_at: string;
}
interface ReferralRow {
  id: string;
  inviter_user_id: string;
  invitee_user_id: string;
  inviter_code: string | null;
  created_at: string;
}

const PromotionPanel = () => {
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [savingFlag, setSavingFlag] = useState(false);

  const loadFlag = async () => {
    const { data } = await supabase
      .from("site_settings").select("feature_flags").eq("id", "global").maybeSingle();
    const flags = ((data as any)?.feature_flags || {}) as Record<string, any>;
    setShowLeaderboard(flags.showLeaderboard !== false);
  };

  const toggleLeaderboard = async (next: boolean) => {
    setSavingFlag(true);
    const { data } = await supabase
      .from("site_settings").select("feature_flags").eq("id", "global").maybeSingle();
    const flags = ((data as any)?.feature_flags || {}) as Record<string, any>;
    flags.showLeaderboard = next;
    const { error } = await supabase
      .from("site_settings")
      .upsert({ id: "global", feature_flags: flags }, { onConflict: "id" });
    setSavingFlag(false);
    if (error) { toast.error("Could not save setting"); return; }
    setShowLeaderboard(next);
    toast.success(next ? "Leaderboard is now visible to students" : "Leaderboard hidden from students");
  };


  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: r }] = await Promise.all([
      supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("referrals").select("*").order("created_at", { ascending: false }).limit(500),
    ]);
    setSubs((s as Subscriber[]) ?? []);
    setReferrals((r as ReferralRow[]) ?? []);
    const ids = Array.from(new Set([
      ...((r as ReferralRow[]) ?? []).map(x => x.inviter_user_id),
      ...((r as ReferralRow[]) ?? []).map(x => x.invitee_user_id),
    ]));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles").select("user_id, display_name, username, email").in("user_id", ids);
      const m: Record<string, string> = {};
      for (const p of profs ?? []) {
        m[p.user_id] = p.display_name || p.username || (p.email ? p.email.split("@")[0] : "Raider");
      }
      setNameMap(m);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const exportCsv = () => {
    const header = "email,grad_year,source,beehiiv_status,created_at\n";
    const rows = subs.map(s => [
      s.email, s.grad_year ?? "", s.source ?? "", s.beehiiv_status ?? "", s.created_at,
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([header + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `subscribers-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const removeReferral = async (id: string) => {
    if (!confirm("Delete this referral credit?")) return;
    const row = referrals.find(r => r.id === id);
    await supabase.from("referrals").delete().eq("id", id);
    if (row) {
      await supabase.from("profiles")
        .update({ referred_by_code: null })
        .eq("user_id", row.invitee_user_id);
    }
    load();
  };

  // Leaderboard from current rows
  const counts = new Map<string, number>();
  for (const row of referrals) counts.set(row.inviter_user_id, (counts.get(row.inviter_user_id) ?? 0) + 1);
  const leaderboard = Array.from(counts.entries())
    .map(([uid, c]) => ({ uid, c, name: nameMap[uid] ?? "Raider" }))
    .sort((a, b) => b.c - a.c)
    .slice(0, 20);

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-primary">📬 Newsletter Subscribers ({subs.length})</h1>
          <Button onClick={exportCsv} disabled={!subs.length}>Export CSV</Button>
        </div>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Email</th><th className="p-3">Grad</th>
                <th className="p-3">Source</th><th className="p-3">Beehiiv</th><th className="p-3">When</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td className="p-3 text-muted-foreground" colSpan={5}>Loading…</td></tr>}
              {!loading && subs.length === 0 && <tr><td className="p-3 text-muted-foreground" colSpan={5}>No subscribers yet.</td></tr>}
              {subs.map(s => (
                <tr key={s.id} className="border-t border-border">
                  <td className="p-3 font-mono text-xs">{s.email}</td>
                  <td className="p-3">{s.grad_year ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{s.source ?? "—"}</td>
                  <td className="p-3">{s.beehiiv_status ?? "—"}</td>
                  <td className="p-3 text-muted-foreground text-xs">{new Date(s.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h1 className="text-2xl font-bold text-primary mb-3">🚀 Referral Leaderboard</h1>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <h2 className="font-semibold mb-3">Top inviters (all-time, recent 500 events)</h2>
            <ol className="space-y-1 text-sm">
              {leaderboard.length === 0 && <li className="text-muted-foreground">No referrals yet.</li>}
              {leaderboard.map((row, i) => (
                <li key={row.uid} className="flex justify-between py-1 border-b border-border/50">
                  <span><span className="font-bold mr-2">#{i + 1}</span>{row.name}</span>
                  <span className="font-semibold text-secondary">{row.c}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <h2 className="font-semibold mb-3">Recent referrals ({referrals.length})</h2>
            <ul className="space-y-1 text-sm max-h-96 overflow-auto">
              {referrals.map(r => (
                <li key={r.id} className="flex justify-between gap-2 py-1 border-b border-border/50">
                  <span className="truncate">
                    <b>{nameMap[r.inviter_user_id] ?? "Raider"}</b>
                    {" → "}
                    <span className="text-muted-foreground">{nameMap[r.invitee_user_id] ?? r.invitee_user_id.slice(0, 8)}</span>
                  </span>
                  <button onClick={() => removeReferral(r.id)} className="text-destructive text-xs hover:underline shrink-0">Revoke</button>
                </li>
              ))}
              {referrals.length === 0 && <li className="text-muted-foreground">No referrals yet.</li>}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PromotionPanel;
