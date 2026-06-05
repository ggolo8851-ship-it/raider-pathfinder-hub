// Public newsletter signup -> stores locally + forwards to Beehiiv.
// No auth required. Double opt-in/welcome is handled by Beehiiv.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizePubId(raw: string | undefined): string | null {
  if (!raw) return null;
  const v = raw.trim();
  if (!v) return null;
  return v.startsWith("pub_") ? v : `pub_${v}`;
}

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

    // Upsert into local mirror (idempotent on email).
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

    // Forward to Beehiiv.
    const BEEHIIV_API_KEY = Deno.env.get("BEEHIIV_API_KEY");
    const BEEHIIV_PUBLICATION_ID = normalizePubId(Deno.env.get("BEEHIIV_PUBLICATION_ID"));

    let beehiivStatus = "skipped";
    let beehiivDetail: string | null = null;

    if (!BEEHIIV_API_KEY || !BEEHIIV_PUBLICATION_ID) {
      beehiivStatus = "not_configured";
      beehiivDetail = "Missing BEEHIIV_API_KEY or BEEHIIV_PUBLICATION_ID";
    } else {
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
        if (res.ok) {
          beehiivStatus = "sent";
        } else {
          const text = await res.text();
          console.error("beehiiv error", res.status, text);
          beehiivDetail = text.slice(0, 500);
          if (res.status === 401 || res.status === 403) beehiivStatus = "bad_api_key";
          else if (res.status === 404) beehiivStatus = "bad_publication_id";
          else if (res.status === 429) beehiivStatus = "rate_limited";
          else if (res.status >= 500) beehiivStatus = "beehiiv_down";
          else beehiivStatus = `error_${res.status}`;
        }
      } catch (e) {
        console.error("beehiiv fetch failed", e);
        beehiivStatus = "fetch_failed";
        beehiivDetail = String(e).slice(0, 500);
      }
    }

    await admin
      .from("newsletter_subscribers")
      .update({
        beehiiv_status: beehiivStatus,
        confirmed_at: beehiivStatus === "sent" ? new Date().toISOString() : null,
      })
      .eq("email", email);

    return new Response(
      JSON.stringify({ ok: true, beehiiv: beehiivStatus, detail: beehiivDetail }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("subscribe-newsletter fatal", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
