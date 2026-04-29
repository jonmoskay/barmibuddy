// Supabase Edge Function: transcribe-audio
//
// Forwards an audio recording to OpenAI Whisper and returns the transcript.
// Keeps the OpenAI API key server-side. Verifies the user's Supabase JWT.
//
// Request: multipart/form-data with field `file` (audio blob) and optional `language` (default "he")
// Response: { text: string }
//
// Deploy:
//   supabase functions deploy transcribe-audio

const WHISPER_URL = "https://api.openai.com/v1/audio/transcriptions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return json({ error: "OPENAI_API_KEY not configured" }, 500);

  let incoming: FormData;
  try {
    incoming = await req.formData();
  } catch {
    return json({ error: "Expected multipart/form-data" }, 400);
  }

  const file = incoming.get("file");
  if (!(file instanceof File) && !(file instanceof Blob)) {
    return json({ error: "Missing 'file' field" }, 400);
  }

  const language = (incoming.get("language") as string) || "he";

  // Re-pack and forward to Whisper. We keep the original blob's MIME and a
  // sensible filename so Whisper recognises the format.
  const ext = pickExt(file);
  const filename =
    file instanceof File ? file.name : `audio.${ext}`;

  const outgoing = new FormData();
  outgoing.append(
    "file",
    file instanceof File ? file : new File([file], filename, { type: file.type || `audio/${ext}` })
  );
  outgoing.append("model", "whisper-1");
  outgoing.append("language", language);

  try {
    const r = await fetch(WHISPER_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: outgoing,
    });
    if (!r.ok) {
      return json({ error: "Whisper error", detail: await r.text() }, 502);
    }
    const data = await r.json();
    return json({ text: (data.text ?? "").trim() });
  } catch (e) {
    return json({ error: "Upstream error", detail: String(e) }, 500);
  }
});

function pickExt(file: File | Blob): string {
  const t = file.type || "";
  if (t.includes("webm")) return "webm";
  if (t.includes("mp4")) return "mp4";
  if (t.includes("wav")) return "wav";
  if (t.includes("mpeg")) return "mp3";
  return "m4a";
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
