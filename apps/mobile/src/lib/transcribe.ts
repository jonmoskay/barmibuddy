import { supabase } from "./supabase";

/**
 * Transcribe an audio recording via the Supabase `transcribe-audio` Edge
 * Function. The OpenAI API key never ships to the client.
 *
 * @param audioUri - URI from WebRecorder / DocumentPicker. Must be fetchable
 *                   so we can convert it to a Blob.
 * @param language - ISO code (default "he" for Hebrew).
 */
export async function transcribe(
  audioUri: string,
  language = "he"
): Promise<string> {
  const audioRes = await fetch(audioUri);
  const blob = await audioRes.blob();

  const ext = blob.type.includes("webm")
    ? "webm"
    : blob.type.includes("mp4")
      ? "mp4"
      : blob.type.includes("wav")
        ? "wav"
        : "m4a";

  const form = new FormData();
  form.append(
    "file",
    new File([blob], `audio.${ext}`, {
      type: blob.type || `audio/${ext}`,
    })
  );
  form.append("language", language);

  const { data, error } = await supabase.functions.invoke<{
    text?: string;
    error?: string;
  }>("transcribe-audio", { body: form });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return (data?.text ?? "").trim();
}
