import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_sheets/v4";

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
  const exact = CLASSIFICATIONS.find(c => r === c.toLowerCase());
  if (exact) return exact;
  return "Other";
}

function extractSheetId(url: string): string | null {
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return m?.[1] ?? null;
}

const DEFAULT_SHEET_URL = "https://docs.google.com/spreadsheets/d/1Fe2xlUGni87VhweozuBT1sZ1pdBRDA-QOdgKe0CIKkg/edit?gid=1421045413";

interface ClubRecord {
  name: string;
  classification: string;
  location: string | null;
  meeting_day: string | null;
  schedule: string | null;
  sponsor: string | null;
  sponsor_email: string | null;
  purpose: string | null;
  raw: unknown;
}

function parseTab(tabName: string, rows: string[][], skipped: string[]): ClubRecord[] {
  if (rows.length < 2) {
    console.log(`[${tabName}] no data rows`);
    return [];
  }
  const header = rows[0].map(h => (h ?? "").toString().trim().toLowerCase());
  const idx = (...names: string[]) => {
    for (const n of names) {
      const i = header.findIndex(h => h.includes(n));
      if (i >= 0) return i;
    }
    return -1;
  };
  const iName = idx("club name", "organization", "club", "name", "title");
  const iClass = idx("classif", "category", "type");
  const iLoc = idx("location", "room", "where");
  const iDay = idx("day", "meeting day");
  const iSched = idx("schedule", "frequency", "when");
  const iSponsor = idx("sponsor", "advisor");
  const iEmail = idx("email", "contact");
  const iPurpose = idx("purpose", "description", "about");

  console.log(`[${tabName}] header:`, header);
  console.log(`[${tabName}] iName=${iName} iClass=${iClass} iLoc=${iLoc} iDay=${iDay} iSponsor=${iSponsor} iEmail=${iEmail} iPurpose=${iPurpose}`);

  if (iName < 0) {
    console.log(`[${tabName}] no name column found, skipping tab`);
    return [];
  }

  const out: ClubRecord[] = [];
  for (const r of rows.slice(1)) {
    const name = (r[iName] ?? "").toString().trim().replace(/\s+/g, " ");
    if (!name) continue;
    out.push({
      name,
      classification: normalizeClassification(iClass >= 0 ? (r[iClass] ?? "").toString() : ""),
      location: iLoc >= 0 ? (r[iLoc] ?? "").toString().trim() || null : null,
      meeting_day: iDay >= 0 ? (r[iDay] ?? "").toString().trim() || null : null,
      schedule: iSched >= 0 ? (r[iSched] ?? "").toString().trim() || null : null,
      sponsor: iSponsor >= 0 ? (r[iSponsor] ?? "").toString().trim() || null : null,
      sponsor_email: iEmail >= 0 ? (r[iEmail] ?? "").toString().trim() || null : null,
      purpose: iPurpose >= 0 ? (r[iPurpose] ?? "").toString().trim() || null : null,
      raw: r,
    });
  }
  console.log(`[${tabName}] parsed ${out.length} clubs from ${rows.length - 1} data rows`);
  return out;
}

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
    } catch { /* no body */ }
    sheet_url = sheet_url || DEFAULT_SHEET_URL;
    const sheetId = extractSheetId(sheet_url);
    if (!sheetId) throw new Error("Invalid Google Sheet URL");

    const headers = { Authorization: `Bearer ${LOVABLE_API_KEY}`, "X-Connection-Api-Key": GOOGLE_SHEETS_API_KEY };

    // Get ALL tab names
    const metaRes = await fetch(`${GATEWAY_URL}/spreadsheets/${sheetId}?fields=sheets.properties`, { headers });
    if (!metaRes.ok) throw new Error(`Sheets metadata failed [${metaRes.status}]: ${await metaRes.text()}`);
    const meta = await metaRes.json();
    const tabs: string[] = (meta.sheets ?? []).map((s: { properties: { title: string } }) => s.properties.title);
    console.log("Found tabs:", tabs);

    // Fetch all tabs in parallel
    const all: ClubRecord[] = [];
    const skipped: string[] = [];
    const perTab: Record<string, number> = {};

    for (const tab of tabs) {
      const range = `${tab}!A1:ZZ5000`;
      const valRes = await fetch(`${GATEWAY_URL}/spreadsheets/${sheetId}/values/${range}`, { headers });
      if (!valRes.ok) {
        console.log(`[${tab}] fetch failed [${valRes.status}]`);
        continue;
      }
      const valData = await valRes.json();
      const rows: string[][] = valData.values ?? [];
      const recs = parseTab(tab, rows, skipped);
      perTab[tab] = recs.length;
      all.push(...recs);
    }

    // Deduplicate by lowercased trimmed name (keep richest record)
    const byKey = new Map<string, ClubRecord>();
    const dupes: string[] = [];
    for (const r of all) {
      const key = r.name.toLowerCase();
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, r);
      } else {
        dupes.push(r.name);
        // Merge: prefer non-null fields
        byKey.set(key, {
          ...existing,
          classification: existing.classification !== "Other" ? existing.classification : r.classification,
          location: existing.location ?? r.location,
          meeting_day: existing.meeting_day ?? r.meeting_day,
          schedule: existing.schedule ?? r.schedule,
          sponsor: existing.sponsor ?? r.sponsor,
          sponsor_email: existing.sponsor_email ?? r.sponsor_email,
          purpose: existing.purpose ?? r.purpose,
        });
      }
    }
    const records = Array.from(byKey.values());
    console.log(`Total parsed: ${all.length}, after dedupe: ${records.length}, duplicates collapsed: ${dupes.length}`);
    if (dupes.length) console.log("Duplicate names merged:", dupes);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { error } = await supabase.from("clubs").upsert(records, { onConflict: "name" });
    if (error) throw error;

    return new Response(JSON.stringify({
      count: records.length,
      tabs,
      perTab,
      duplicatesMerged: dupes.length,
      duplicates: dupes,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sync-clubs error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
