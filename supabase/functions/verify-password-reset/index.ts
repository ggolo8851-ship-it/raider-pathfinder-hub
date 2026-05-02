import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Service not configured");

    const { email, code, newPassword } = await req.json();
    if (!email || !code || !newPassword) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanCode = String(code).trim();

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Find matching reset request
    const { data: reqRow } = await admin
      .from("password_reset_requests")
      .select("id, code, expires_at, used, attempts")
      .ilike("email", cleanEmail)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!reqRow) {
      return new Response(JSON.stringify({ error: "Invalid or expired code" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (reqRow.attempts >= 5) {
      await admin.from("password_reset_requests").update({ used: true }).eq("id", reqRow.id);
      return new Response(JSON.stringify({ error: "Too many attempts. Request a new code." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new Date(reqRow.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: "Code has expired. Request a new one." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (reqRow.code !== cleanCode) {
      await admin.from("password_reset_requests")
        .update({ attempts: reqRow.attempts + 1 }).eq("id", reqRow.id);
      return new Response(JSON.stringify({ error: "Invalid code" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find user via profiles
    const { data: profile } = await admin
      .from("profiles").select("user_id").ilike("email", cleanEmail).maybeSingle();
    if (!profile) {
      return new Response(JSON.stringify({ error: "Account not found" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updErr } = await admin.auth.admin.updateUserById(profile.user_id, {
      password: newPassword,
    });
    if (updErr) {
      console.error("updateUserById error:", updErr);
      return new Response(JSON.stringify({ error: "Could not update password" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark code used
    await admin.from("password_reset_requests").update({ used: true }).eq("id", reqRow.id);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-password-reset error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
