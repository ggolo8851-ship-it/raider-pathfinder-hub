import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getReferralLeaderboard, LeaderboardEntry } from "@/lib/referrals";

interface Props {
  className?: string;
  limit?: number;
}

const ReferralLeaderboard = ({ className = "", limit = 10 }: Props) => {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("feature_flags")
        .eq("id", "global")
        .maybeSingle();
      const flags = ((data as any)?.feature_flags || {}) as Record<string, any>;
      const show = flags.showLeaderboard !== false; // default ON
      setEnabled(show);
      if (show) {
        const list = await getReferralLeaderboard(limit);
        setRows(list);
      }
      setLoading(false);
    })();
  }, [limit]);

  if (enabled === false) return null;

  return (
    <section className={`rounded-xl bg-card border border-border p-5 ${className}`}>
      <h2 className="text-xl font-bold text-primary mb-1">🚀 Top Raiders</h2>
      <p className="text-xs text-muted-foreground mb-3">Most invites in the last 30 days.</p>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No referrals yet — be the first to invite a friend!</p>
      ) : (
        <ol className="space-y-1 text-sm">
          {rows.map((r, i) => (
            <li key={r.inviter_user_id} className="flex justify-between py-1 border-b border-border/50 last:border-0">
              <span><span className="font-bold mr-2 text-secondary">#{i + 1}</span>{r.display_name}</span>
              <span className="font-semibold">{r.count}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};

export default ReferralLeaderboard;
