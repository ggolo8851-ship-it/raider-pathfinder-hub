import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY = "https://connector-gateway.lovable.dev/resend";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!LOVABLE_API_KEY || !RESEND_API_KEY || !SUPABASE_URL || !SERVICE_KEY) {
      throw new Error("Email service not configured");
    }

    const { email } = await req.json();
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const cleanEmail = email.trim().toLowerCase();
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Always respond OK (no email enumeration)
    const okResponse = new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    // Block blacklisted addresses
    const { data: black } = await admin
      .from("email_blacklist").select("id").ilike("email", cleanEmail).maybeSingle();
    if (black) return okResponse;

    // Verify user exists in profiles (we don't expose this fact)
    const { data: profile } = await admin
      .from("profiles").select("user_id").ilike("email", cleanEmail).maybeSingle();
    if (!profile) return okResponse;

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Invalidate prior unused codes for this email
    await admin
      .from("password_reset_requests")
      .update({ used: true })
      .ilike("email", cleanEmail)
      .eq("used", false);

    const { error: insErr } = await admin.from("password_reset_requests").insert({
      email: cleanEmail,
      code,
      expires_at: expiresAt,
      used: false,
    });
    if (insErr) {
      console.error("insert error:", insErr);
      return okResponse;
    }

    const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f7f7f7;padding:24px;color:#222">
      <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;border-top:6px solid #002d62">
        <h1 style="color:#002d62;margin:0 0 8px">Your RaidersMatch reset code</h1>
        <p>Use the code below to reset your password. It expires in <b>15 minutes</b>.</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;background:#f1f5f9;color:#002d62;text-align:center;padding:18px;border-radius:8px;margin:20px 0">${code}</div>
        <p style="font-size:13px;color:#555">If you didn't request this, you can safely ignore this email.</p>
        <p style="color:#888;font-size:12px;margin-top:24px">Eleanor Roosevelt HS — Students for Success</p>
      </div></body></html>`;

    const sendRes = await fetch(`${GATEWAY}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "RaidersMatch <onboarding@resend.dev>",
        to: [cleanEmail],
        subject: `Your RaidersMatch reset code: ${code}`,
        html,
      }),
    });

    if (!sendRes.ok) {
      console.error("Resend error:", sendRes.status, await sendRes.text());
    }

    return okResponse;
  } catch (e) {
    console.error("request-password-reset error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
