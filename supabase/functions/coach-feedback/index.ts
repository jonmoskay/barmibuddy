// Supabase Edge Function: coach-feedback
//
// Holds the OpenAI API key server-side so it never ships to the client.
// The mobile app calls this with the user's Supabase auth token; verify_jwt
// in supabase/config.toml ensures only signed-in users can invoke it.
//
// Deploy:
//   supabase functions deploy coach-feedback
// Set the secret (one-time):
//   supabase secrets set OPENAI_API_KEY=sk-...

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CoachRequest {
  /** 0–100 score the client computed locally. */
  score: number;
  /** Which thirds of the section the student struggled with, e.g. ["beginning"]. */
  weakThirds?: ("beginning" | "middle" | "end")[];
  /** "pitch" = pitch-match feedback. "words" = word-accuracy feedback. */
  mode?: "pitch" | "words";
  /** Optional context — parsha name, etc. */
  lesson?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return json({ error: "OPENAI_API_KEY not configured" }, 500);

  let body: CoachRequest;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { score, weakThirds = [], mode = "words", lesson } = body;
  if (typeof score !== "number") {
    return json({ error: "score (number) is required" }, 400);
  }

  const prompt = buildPrompt({ score, weakThirds, mode, lesson });

  try {
    const r = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 180,
        temperature: 0.7,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!r.ok) {
      return json({ error: "OpenAI error", detail: await r.text() }, 502);
    }
    const data = await r.json();
    const feedback = data.choices?.[0]?.message?.content?.trim() ?? "";
    return json({ feedback });
  } catch (e) {
    return json({ error: "Upstream error", detail: String(e) }, 500);
  }
});

function buildPrompt({
  score,
  weakThirds,
  mode,
  lesson,
}: Required<Pick<CoachRequest, "score" | "weakThirds" | "mode">> &
  Pick<CoachRequest, "lesson">): string {
  const weakPart = weakThirds.length
    ? `They struggled most in the ${weakThirds.join(" and ")} of the section.`
    : "They were fairly even throughout.";

  const focusPart =
    mode === "pitch"
      ? "Focus on whether they stayed in tune with the teacher's melody."
      : "Focus on whether they said all the words clearly and kept up with the teacher recording — not on pitch or melody.";

  return [
    `A Bar Mitzvah student (age ~12) just practiced their parsha${
      lesson ? ` (${lesson})` : ""
    } and got ${score}% on this run.`,
    weakPart,
    `Write 2–3 short sentences of encouraging coaching feedback in plain English.`,
    focusPart,
    `End with one concrete next step.`,
    `Do not mention Hebrew words, transliterations, or the percentage number.`,
  ].join(" ");
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
