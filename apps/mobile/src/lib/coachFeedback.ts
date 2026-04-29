import { supabase } from "./supabase";

export interface CoachFeedbackInput {
  score: number;
  notes?: string;
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
