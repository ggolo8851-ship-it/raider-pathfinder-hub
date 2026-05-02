// Runs monthly via pg_cron (or admin button). Triggers sync-clubs and updates system_state.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, serviceKey);

  const summary: Record<string, any> = {};

  // 1. Trigger sync-clubs
  try {
    const r = await fetch(`${url}/functions/v1/sync-clubs`, {
      method: "POST",
      headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
    });
    summary.clubs = r.ok ? await r.json().catch(() => ({ ok: true })) : { error: `status ${r.status}` };
  } catch (e) {
    summary.clubs = { error: e instanceof Error ? e.message : "unknown" };
  }

  // 2. (College Scorecard cache is fetched live per-request — no separate cache job needed)
  summary.colleges = { note: "Live fetched on demand" };

  // 3. Update system_state with last + next refresh times
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 5, 0);
  await admin.from("system_state").upsert({
    id: "global",
    last_refresh_at: now.toISOString(),
    next_refresh_at: next.toISOString(),
    last_refresh_summary: summary,
  });

  return new Response(JSON.stringify({ ok: true, summary, next_refresh_at: next.toISOString() }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
