import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const GATEWAY = "https://connector-gateway.lovable.dev/resend";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!LOVABLE_API_KEY || !RESEND_API_KEY) throw new Error("Email service not configured");

    const { email } = await req.json();
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const cleanEmail = email.trim().toLowerCase();

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Check blacklist
    const { data: black } = await supabase.from("email_blacklist").select("id").ilike("email", cleanEmail).maybeSingle();
    if (black) {
      return new Response(JSON.stringify({ error: "This email is blocked." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upsert subscription
    const { data: existing } = await supabase.from("email_subscriptions").select("id, welcome_sent").ilike("email", cleanEmail).maybeSingle();
    if (existing?.welcome_sent) {
      return new Response(JSON.stringify({ ok: true, alreadySubscribed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!existing) {
      await supabase.from("email_subscriptions").insert({ email: cleanEmail });
    }

    // Send welcome email via Resend
    const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f7f7f7;padding:24px;color:#222">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px;border-top:6px solid #002d62">
        <h1 style="color:#002d62;margin:0 0 8px">Welcome to Students for Success!</h1>
        <p>Thanks for subscribing to ESS updates from Eleanor Roosevelt High School.</p>
        <p>You'll get news on scholarships, college matches, club opportunities, and SAT/ACT dates.</p>
        <p style="margin-top:24px"><b>Stay connected:</b></p>
        <ul>
          <li><a href="https://www.instagram.com/erhsstudentsforsuccess/" style="color:#002d62">ESS on Instagram</a></li>
          <li><a href="https://raider-pathfinder-hub.lovable.app" style="color:#002d62">RaidersMatch website</a></li>
        </ul>
        <p style="color:#888;font-size:12px;margin-top:32px">Eleanor Roosevelt HS — Students for Success</p>
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
        subject: "Welcome to ESS RaidersMatch 🎓",
        html,
      }),
    });
    const sendData = await sendRes.json();
    if (!sendRes.ok) {
      console.error("Resend error:", sendData);
      // Don't fail subscription if email send fails — still mark as subscribed
      return new Response(JSON.stringify({ ok: true, emailWarning: sendData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("email_subscriptions").update({ welcome_sent: true }).ilike("email", cleanEmail);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("subscribe-newsletter error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
