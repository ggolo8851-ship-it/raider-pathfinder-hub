import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

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

    const { email, redirectTo } = await req.json();
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const cleanEmail = email.trim().toLowerCase();
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Block blacklisted addresses
    const { data: black } = await admin
      .from("email_blacklist").select("id").ilike("email", cleanEmail).maybeSingle();
    if (black) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate a real Supabase recovery link (handles token securely)
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: cleanEmail,
      options: { redirectTo: redirectTo || "https://raider-pathfinder-hub.lovable.app/reset-password" },
    });

    // Always respond OK to avoid email enumeration
    if (linkErr || !linkData?.properties?.action_link) {
      console.warn("generateLink:", linkErr?.message);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const actionLink = linkData.properties.action_link;

    const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f7f7f7;padding:24px;color:#222">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;border-top:6px solid #002d62">
        <h1 style="color:#002d62;margin:0 0 8px">Reset your RaidersMatch password</h1>
        <p>We received a request to reset the password for <b>${cleanEmail}</b>.</p>
        <p style="margin:24px 0">
          <a href="${actionLink}" style="display:inline-block;background:#002d62;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">Reset Password</a>
        </p>
        <p style="font-size:13px;color:#555">Or copy this link into your browser:<br><span style="word-break:break-all;color:#002d62">${actionLink}</span></p>
        <p style="font-size:12px;color:#888;margin-top:24px">If you didn't request this, you can ignore this email — your password won't change.</p>
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
        from: "ESS RaidersMatch <onboarding@resend.dev>",
        to: [cleanEmail],
        subject: "Reset your RaidersMatch password",
        html,
      }),
    });

    if (!sendRes.ok) {
      const errBody = await sendRes.text();
      console.error("Resend error:", sendRes.status, errBody);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-password-reset error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
