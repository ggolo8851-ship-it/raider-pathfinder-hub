import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hashCode(code: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${code}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const { email, securityCode, newPassword } = await req.json();
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof securityCode !== "string" || securityCode.length < 6) {
      return new Response(JSON.stringify({ error: "Security code is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const cleanEmail = email.trim().toLowerCase();
    const ip = req.headers.get("x-forwarded-for") ?? null;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Rate limit: max 5 attempts per email in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentFails } = await admin
      .from("security_code_attempts")
      .select("id", { count: "exact", head: true })
      .ilike("email", cleanEmail)
      .eq("succeeded", false)
      .gte("created_at", oneHourAgo);

    if ((recentFails ?? 0) >= 5) {
      return new Response(JSON.stringify({ error: "Too many attempts. Try again in an hour." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const logAttempt = async (succeeded: boolean) => {
      await admin.from("security_code_attempts").insert({ email: cleanEmail, succeeded, ip });
    };

    // Look up user via profiles
    const { data: profile } = await admin
      .from("profiles").select("user_id").ilike("email", cleanEmail).maybeSingle();
    if (!profile) {
      await logAttempt(false);
      return new Response(JSON.stringify({ error: "Invalid email or security code" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: codeRow } = await admin
      .from("user_security_codes")
      .select("code_hash, code_salt")
      .eq("user_id", profile.user_id)
      .maybeSingle();

    if (!codeRow) {
      await logAttempt(false);
      return new Response(JSON.stringify({
        error: "No security code on file. Sign in normally and set one in Settings."
      }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const candidate = await hashCode(securityCode, codeRow.code_salt);
    if (candidate !== codeRow.code_hash) {
      await logAttempt(false);
      return new Response(JSON.stringify({ error: "Invalid email or security code" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updErr } = await admin.auth.admin.updateUserById(profile.user_id, {
      password: newPassword,
    });
    if (updErr) {
      console.error("updateUserById:", updErr);
      await logAttempt(false);
      return new Response(JSON.stringify({ error: "Could not update password" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await logAttempt(true);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-security-code-reset error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
