// Brutal, accurate AI essay grader powered by Lovable AI Gateway.
// Returns a strict 0-100 score plus rubric breakdown and concrete revision notes.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { essay, prompt } = await req.json();
    if (typeof essay !== "string" || essay.trim().length < 50) {
      return new Response(JSON.stringify({ error: "Essay must be at least 50 characters." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (essay.length > 12000) {
      return new Response(JSON.stringify({ error: "Essay too long (max 12,000 chars)." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const system = `You are a brutally honest, highly experienced Ivy League admissions reader grading a college application essay on a strict 0-100 scale.

Use this rubric (weighted):
- Hook & Voice (20): Does the opening grab? Does the writer sound like a real, distinctive human?
- Story & Specificity (25): Concrete scenes, names, sensory detail. Penalize generic platitudes hard.
- Insight & Reflection (20): Does the writer reveal genuine self-awareness and growth? Surface-level reflection is heavily penalized.
- Structure & Flow (15): Logical arc, paragraph rhythm, transitions.
- Mechanics & Style (10): Grammar, varied sentences, no clichés, no passive overload.
- Fit to Prompt (10): If a prompt is given, does it answer it? If none, does the essay have clear purpose?

Scoring discipline: most real applicants land 55-78. Reserve 85+ for genuinely outstanding writing. Score below 50 if the essay is generic, full of clichés, or lacks any real story.

Return ONLY valid JSON with this exact shape:
{
  "score": <integer 0-100>,
  "verdict": "<one brutally honest sentence>",
  "rubric": {
    "hookVoice": <0-20>,
    "storySpecificity": <0-25>,
    "insightReflection": <0-20>,
    "structureFlow": <0-15>,
    "mechanicsStyle": <0-10>,
    "fitToPrompt": <0-10>
  },
  "strengths": ["<short bullet>", "<short bullet>", "<short bullet>"],
  "weaknesses": ["<specific issue with quoted phrase>", "<specific issue>", "<specific issue>"],
  "revisionPlan": ["<concrete next step>", "<concrete next step>", "<concrete next step>"]
}`;

    const user = `${prompt ? `PROMPT: ${prompt}\n\n` : ""}ESSAY:\n${essay}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit hit. Please try again in a minute." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Lovable Cloud settings." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok) {
      const t = await resp.text();
      return new Response(JSON.stringify({ error: `AI gateway error: ${t.slice(0, 200)}` }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try { parsed = JSON.parse(raw); }
    catch { return new Response(JSON.stringify({ error: "AI returned invalid JSON.", raw }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }

    // Sanity-clamp score
    if (typeof parsed.score === "number") parsed.score = Math.max(0, Math.min(100, Math.round(parsed.score)));

    return new Response(JSON.stringify(parsed), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
