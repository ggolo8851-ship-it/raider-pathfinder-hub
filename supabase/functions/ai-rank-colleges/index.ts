// Re-ranks a candidate list of colleges using Lovable AI based on the user's full profile.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { profile, candidates } = await req.json();
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return new Response(JSON.stringify({ rankings: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const trimmed = candidates.slice(0, 30).map((c: any) => ({
      id: c.id,
      name: c.name,
      state: c.state,
      miles: Math.round(c.miles),
      enrollment: c.enrollment,
      majorPct: c.majorPercentage,
      majorLabel: c.majorLabel,
      admitRate: c.admissionRate,
      satAvg: c.satAvg,
      costInState: c.costInState,
      costOutState: c.costOutState,
      tier: c.tier,
      ruleScore: c.fitScore,
    }));

    const systemPrompt = `You are an expert college counselor. You will receive a SPECIFIC student's profile and a list of candidate colleges. Re-rank the colleges for THIS student personally.

Weighting priorities:
- Major-program strength (% of students in their intended major area) — heavy weight
- Their specific clubs, achievements, and extracurriculars — connect concretely (e.g., "Your Programming Club + AP CS A make their CS program a strong fit")
- GPA / SAT / AP rigor vs the school's selectivity (don't punish reaches if other strengths compensate)
- Vibe/setting/cost preferences — only if the student answered the vibe quiz
- Distance from home — moderate weight, only penalize extreme distances
- Generic prestige is the LEAST important factor

For each college return: ai_fit_score 1-100 (be honest — use the full range, not just 70-90), and a 1-2 sentence reason that EXPLICITLY references the student's own data (their major, a specific club they're in, their GPA, etc.). Never give two students with different profiles the same reason. Output via the rank_colleges tool.`;

    const userPrompt = `STUDENT PROFILE:
${JSON.stringify(profile, null, 2)}

CANDIDATE COLLEGES (${trimmed.length}):
${JSON.stringify(trimmed, null, 2)}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "rank_colleges",
            description: "Return personalized ranking",
            parameters: {
              type: "object",
              properties: {
                rankings: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      college_id: { type: "string" },
                      ai_fit_score: { type: "number" },
                      reason: { type: "string" },
                    },
                    required: ["college_id", "ai_fit_score", "reason"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["rankings"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "rank_colleges" } },
      }),
    });

    if (aiResp.status === 429) {
      return new Response(JSON.stringify({ error: "rate_limit", rankings: [] }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiResp.status === 402) {
      return new Response(JSON.stringify({ error: "payment_required", rankings: [] }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiResp.ok) {
      const txt = await aiResp.text();
      console.error("AI error", aiResp.status, txt);
      return new Response(JSON.stringify({ error: "ai_error", rankings: [] }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall ? JSON.parse(toolCall.function.arguments) : { rankings: [] };

    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-rank-colleges error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown", rankings: [] }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
