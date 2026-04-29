import { supabase } from "./supabase";

export type Third = "beginning" | "middle" | "end";

export interface CoachFeedbackInput {
  /** 0–100 score the client computed locally. */
  score: number;
  /** Which thirds were weak (e.g. ["beginning"]). */
  weakThirds?: Third[];
  /** "pitch" = melody/tune feedback. "words" = word-accuracy feedback. */
  mode?: "pitch" | "words";
  /** Optional context (parsha name, etc). */
  lesson?: string;
}

/**
 * Fetch coaching feedback from the Supabase Edge Function.
 * The OpenAI API key lives server-side — never in the app bundle.
 * Requires the user to be signed in (Edge Function verifies JWT).
 */
export async function getCoachFeedback(
  input: CoachFeedbackInput
): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{
    feedback?: string;
    error?: string;
  }>("coach-feedback", { body: input });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data?.feedback ?? "";
}
