// Generates a personalized career match list using Lovable AI based on the user's full profile.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { profile } = await req.json();

    const systemPrompt = `You are an expert career counselor for a high-school student. Generate 8-12 personalized career suggestions based on THIS specific student's profile.

Each career MUST:
- Connect concretely to the student's stated major, clubs, sports, achievements, APs, and interests
- Have a "whyForYou" that explicitly references THEIR specific data (e.g., "Your Investment Club involvement plus AP Statistics signal strong analytical fit")
- Use the full fit_score range 1-100 — don't bunch everything in 80-95
- Skip generic careers that don't actually fit this student

Return via the suggest_careers tool.`;

    const userPrompt = `STUDENT PROFILE:
${JSON.stringify(profile, null, 2)}`;

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
            name: "suggest_careers",
            description: "Personalized career suggestions",
            parameters: {
              type: "object",
              properties: {
                careers: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      fit_score: { type: "number" },
                      whyForYou: { type: "string" },
                      salaryRange: { type: "string" },
                      growth: { type: "string" },
                      skills: { type: "array", items: { type: "string" } },
                      workType: { type: "string" },
                      conditions: { type: "string" },
                      relatedClubs: { type: "array", items: { type: "string" } },
                    },
                    required: ["title", "description", "fit_score", "whyForYou", "salaryRange", "growth", "skills", "workType", "conditions", "relatedClubs"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["careers"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "suggest_careers" } },
      }),
    });

    if (aiResp.status === 429) {
      return new Response(JSON.stringify({ error: "rate_limit", careers: [] }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiResp.status === 402) {
      return new Response(JSON.stringify({ error: "payment_required", careers: [] }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiResp.ok) {
      const txt = await aiResp.text();
      console.error("AI error", aiResp.status, txt);
      return new Response(JSON.stringify({ error: "ai_error", careers: [] }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall ? JSON.parse(toolCall.function.arguments) : { careers: [] };

    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-rank-careers error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown", careers: [] }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
