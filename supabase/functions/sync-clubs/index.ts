import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_sheets/v4";

// Standardized classifications
const CLASSIFICATIONS = ["STEM", "Language", "Arts", "Sports", "Hobby", "Cultural", "Honor Society", "Academic", "SSL", "Other"];

function normalizeClassification(raw: string): string {
  if (!raw) return "Other";
  const r = raw.toLowerCase();
  if (r.includes("stem") || r.includes("science") || r.includes("tech") || r.includes("engineer") || r.includes("math") || r.includes("robot") || r.includes("comput")) return "STEM";
  if (r.includes("language") || r.includes("french") || r.includes("spanish") || r.includes("japanese") || r.includes("korean") || r.includes("italian") || r.includes("asl")) return "Language";
  if (r.includes("art") || r.includes("music") || r.includes("theatre") || r.includes("theater") || r.includes("dance") || r.includes("creative") || r.includes("fashion") || r.includes("media") || r.includes("band") || r.includes("writing")) return "Arts";
  if (r.includes("sport") || r.includes("athletic") || r.includes("rec") || r.includes("badminton") || r.includes("tennis") || r.includes("volleyball") || r.includes("frisbee") || r.includes("soccer") || r.includes("basketball")) return "Sports";
  if (r.includes("honor")) return "Honor Society";
  if (r.includes("ssl") || r.includes("service") || r.includes("volunteer") || r.includes("community")) return "SSL";
  if (r.includes("cultural") || r.includes("african") || r.includes("asian") || r.includes("muslim") || r.includes("indian") || r.includes("caribbean") || r.includes("international")) return "Cultural";
  if (r.includes("academic") || r.includes("debate") || r.includes("mock trial") || r.includes("mun") || r.includes("seminar") || r.includes("tutor")) return "Academic";
  if (r.includes("hobby") || r.includes("chess") || r.includes("crochet") || r.includes("origami") || r.includes("baking") || r.includes("cosmet") || r.includes("game")) return "Hobby";
  // Match exact label
  const exact = CLASSIFICATIONS.find(c => r === c.toLowerCase());
  if (exact) return exact;
  return "Other";
}

function extractSheetId(url: string): string | null {
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return m?.[1] ?? null;
}

const DEFAULT_SHEET_URL = "https://docs.google.com/spreadsheets/d/1mCnzMpRY0l1TbBooJl2MVQxCCLrq7dnL/edit?gid=1421045413";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_SHEETS_API_KEY = Deno.env.get("GOOGLE_SHEETS_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    if (!GOOGLE_SHEETS_API_KEY) throw new Error("GOOGLE_SHEETS_API_KEY missing");

    let sheet_url: string | undefined;
    try {
      const body = await req.json();
      sheet_url = body?.sheet_url;
    } catch { /* empty body — use default */ }
    sheet_url = sheet_url || DEFAULT_SHEET_URL;
    const sheetId = extractSheetId(sheet_url);
    if (!sheetId) throw new Error("Invalid Google Sheet URL");

    // Get the spreadsheet metadata to find sheet names
    const metaRes = await fetch(`${GATEWAY_URL}/spreadsheets/${sheetId}?fields=sheets.properties`, {
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "X-Connection-Api-Key": GOOGLE_SHEETS_API_KEY },
    });
    if (!metaRes.ok) throw new Error(`Sheets metadata failed [${metaRes.status}]: ${await metaRes.text()}`);
    const meta = await metaRes.json();
    const firstSheet = meta.sheets?.[0]?.properties?.title ?? "Sheet1";

    // Pull all values
    const range = `${firstSheet}!A1:Z1000`;
    const valRes = await fetch(`${GATEWAY_URL}/spreadsheets/${sheetId}/values/${range}`, {
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "X-Connection-Api-Key": GOOGLE_SHEETS_API_KEY },
    });
    if (!valRes.ok) throw new Error(`Sheets values failed [${valRes.status}]: ${await valRes.text()}`);
    const valData = await valRes.json();
    const rows: string[][] = valData.values ?? [];
    if (rows.length < 2) throw new Error("Sheet has no data rows");

    const header = rows[0].map(h => (h ?? "").toString().trim().toLowerCase());
    const idx = (...names: string[]) => {
      for (const n of names) {
        const i = header.findIndex(h => h.includes(n));
        if (i >= 0) return i;
      }
      return -1;
    };
    const iName = idx("club", "name", "organization");
    const iClass = idx("classif", "category", "type");
    const iLoc = idx("location", "room", "where");
    const iDay = idx("day", "meeting day");
    const iSched = idx("schedule", "frequency", "when");
    const iSponsor = idx("sponsor", "advisor");
    const iEmail = idx("email", "contact");
    const iPurpose = idx("purpose", "description", "about");

    if (iName < 0) throw new Error(`Could not find a club-name column. Found headers: ${header.join(", ")}`);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const records = rows.slice(1)
      .filter(r => (r[iName] ?? "").toString().trim())
      .map(r => ({
        name: (r[iName] ?? "").toString().trim(),
        classification: normalizeClassification(iClass >= 0 ? (r[iClass] ?? "").toString() : ""),
        location: iLoc >= 0 ? (r[iLoc] ?? "").toString().trim() || null : null,
        meeting_day: iDay >= 0 ? (r[iDay] ?? "").toString().trim() || null : null,
        schedule: iSched >= 0 ? (r[iSched] ?? "").toString().trim() || null : null,
        sponsor: iSponsor >= 0 ? (r[iSponsor] ?? "").toString().trim() || null : null,
        sponsor_email: iEmail >= 0 ? (r[iEmail] ?? "").toString().trim() || null : null,
        purpose: iPurpose >= 0 ? (r[iPurpose] ?? "").toString().trim() || null : null,
        raw: r,
      }));

    const { error } = await supabase.from("clubs").upsert(records, { onConflict: "name" });
    if (error) throw error;

    return new Response(JSON.stringify({ count: records.length, sheet: firstSheet }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sync-clubs error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
