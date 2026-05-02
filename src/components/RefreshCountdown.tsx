import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

function nextFirstOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
}

function fmt(ms: number): string {
  if (ms <= 0) return "refreshing soon…";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

const RefreshCountdown = () => {
  const [nextAt, setNextAt] = useState<Date>(nextFirstOfMonth());
  const [now, setNow] = useState<Date>(new Date());
  const [lastAt, setLastAt] = useState<Date | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("system_state")
        .select("next_refresh_at,last_refresh_at")
        .eq("id", "data_refresh")
        .maybeSingle();
      if (data?.next_refresh_at) setNextAt(new Date(data.next_refresh_at));
      if (data?.last_refresh_at) setLastAt(new Date(data.last_refresh_at));
    })();
    const iv = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="bg-card rounded-xl p-4 border border-border text-sm flex items-center gap-3 flex-wrap">
      <span className="text-2xl">🔄</span>
      <div>
        <p className="font-semibold text-foreground">Next data refresh in {fmt(nextAt.getTime() - now.getTime())}</p>
        <p className="text-xs text-muted-foreground">
          Clubs, colleges, and rankings refresh on the 1st of every month.
          {lastAt && <> Last: {lastAt.toLocaleDateString()}</>}
        </p>
      </div>
    </div>
  );
};

export default RefreshCountdown;
