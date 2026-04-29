// Supabase Edge Function: coach-feedback
//
// Holds the OpenAI API key server-side so it never ships to the client.
// The mobile app calls this with the user's Supabase auth token; verify_jwt
// in supabase/config.toml ensures only signed-in users can invoke it.
//
// Deploy:
//   npx supabase functions deploy coach-feedback
// Set the secret (one-time):
//   npx supabase secrets set OPENAI_API_KEY=sk-...

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CoachRequest {
  /** Score from 0–100 the client computed locally from pitch comparison. */
  score: number;
  /** Optional: short summary of where the student went off (e.g. "drifted flat in bar 3"). */
  notes?: string;
  /** Optional: which parsha / lesson, for context. */
  lesson?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    return json({ error: "OPENAI_API_KEY not configured" }, 500);
  }

  let body: CoachRequest;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { score, notes, lesson } = body;
  if (typeof score !== "number") {
    return json({ error: "score (number) is required" }, 400);
  }

  const systemPrompt =
    "You are a warm, encouraging Bar Mitzvah practice coach for a 12-year-old boy. " +
    "Give 2–3 short sentences of feedback based on their pitch-match score. " +
    "Be specific, upbeat, and end with one concrete tip for next attempt. " +
    "Never use Hebrew transliteration unless the student's notes include it.";

  const userPrompt = [
    `Score: ${score}/100`,
    lesson ? `Lesson: ${lesson}` : null,
    notes ? `What went off: ${notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const openaiRes = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      return json({ error: "OpenAI request failed", detail: errText }, 502);
    }

    const data = await openaiRes.json();
    const feedback = data.choices?.[0]?.message?.content?.trim() ?? "";
    return json({ feedback });
  } catch (e) {
    return json({ error: "Upstream error", detail: String(e) }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
