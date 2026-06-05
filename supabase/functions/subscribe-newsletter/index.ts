// Public newsletter signup -> stores locally + forwards to Beehiiv.
// No auth required. Double opt-in is handled by Beehiiv (reactivate_existing=true).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim().toLowerCase();
    const gradYearRaw = body?.grad_year;
    const source = String(body?.source ?? "site").slice(0, 40);

    if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    let gradYear: number | null = null;
    if (gradYearRaw != null && gradYearRaw !== "") {
      const n = Number(gradYearRaw);
      if (!Number.isFinite(n) || n < 2020 || n > 2040) {
        return new Response(JSON.stringify({ error: "Invalid grad_year" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      gradYear = Math.trunc(n);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    // Upsert into local mirror (idempotent on email)
    const { error: dbErr } = await admin
      .from("newsletter_subscribers")
      .upsert(
        { email, grad_year: gradYear, source, beehiiv_status: "pending" },
        { onConflict: "email" }
      );
    if (dbErr) {
      console.error("db upsert failed", dbErr);
      return new Response(JSON.stringify({ error: "Could not save subscription" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Forward to Beehiiv (best-effort — local mirror is the source of truth)
    const BEEHIIV_API_KEY = Deno.env.get("BEEHIIV_API_KEY");
    const BEEHIIV_PUBLICATION_ID = Deno.env.get("BEEHIIV_PUBLICATION_ID");

    let beehiivStatus = "skipped";
    if (BEEHIIV_API_KEY && BEEHIIV_PUBLICATION_ID) {
      try {
        const res = await fetch(
          `https://api.beehiiv.com/v2/publications/${BEEHIIV_PUBLICATION_ID}/subscriptions`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${BEEHIIV_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              reactivate_existing: true,
              send_welcome_email: true,
              utm_source: source,
              utm_medium: "site",
              custom_fields: gradYear ? [{ name: "grad_year", value: String(gradYear) }] : [],
            }),
          }
        );
        beehiivStatus = res.ok ? "sent" : `error_${res.status}`;
        if (!res.ok) {
          const t = await res.text();
          console.error("beehiiv error", res.status, t);
        }
      } catch (e) {
        console.error("beehiiv fetch failed", e);
        beehiivStatus = "fetch_failed";
      }
      await admin
        .from("newsletter_subscribers")
        .update({ beehiiv_status: beehiivStatus })
        .eq("email", email);
    }

    return new Response(JSON.stringify({ ok: true, beehiiv: beehiivStatus }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("subscribe-newsletter fatal", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
