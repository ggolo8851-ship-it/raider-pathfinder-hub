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

function genSalt(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
}

function validCode(c: unknown): c is string {
  return typeof c === "string" && c.length >= 6 && c.length <= 64 && /^[A-Za-z0-9!@#$%^&*_-]+$/.test(c);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate the caller using their JWT
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { newCode, currentCode } = await req.json();
    if (!validCode(newCode)) {
      return new Response(JSON.stringify({ error: "Code must be 6–64 chars (letters, numbers, or !@#$%^&*_-)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const userId = userData.user.id;

    // If a code already exists, require currentCode to match
    const { data: existing } = await admin
      .from("user_security_codes")
      .select("code_hash, code_salt")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      if (!validCode(currentCode)) {
        return new Response(JSON.stringify({ error: "Current security code required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const currentHash = await hashCode(currentCode, existing.code_salt);
      if (currentHash !== existing.code_hash) {
        return new Response(JSON.stringify({ error: "Current security code is incorrect" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const salt = genSalt();
    const code_hash = await hashCode(newCode, salt);

    const { error: upErr } = await admin
      .from("user_security_codes")
      .upsert({ user_id: userId, code_hash, code_salt: salt, updated_at: new Date().toISOString() });
    if (upErr) {
      console.error("upsert error:", upErr);
      return new Response(JSON.stringify({ error: "Could not save code" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("set-security-code error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
