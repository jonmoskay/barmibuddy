import { WordScore } from './types';

// NOTE: transcribe() and generateFeedback() previously called OpenAI directly
// from the client (with EXPO_PUBLIC_OPENAI_API_KEY in the bundle — unsafe).
// They've been moved to Supabase Edge Functions:
//   - apps/mobile/src/lib/transcribe.ts      → supabase fn `transcribe-audio`
//   - apps/mobile/src/lib/coachFeedback.ts   → supabase fn `coach-feedback`
// This file now only contains the local string-comparison scoring logic.

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(s: string): string[] {
  const n = normalize(s);
  return n ? n.split(' ') : [];
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

function wordSimilarity(a: string, b: string): number {
  const max = Math.max(a.length, b.length) || 1;
  return 1 - levenshtein(a, b) / max;
}

export type ScoreResult = {
  score: number;
  wordScores: WordScore[];
  studentTranscript: string;
};

export function scoreAgainstReference(
  reference: string,
  studentTranscript: string,
): ScoreResult {
  const ref = tokens(reference);
  const stu = tokens(studentTranscript);

  if (ref.length === 0) {
    return { score: 0, wordScores: [], studentTranscript };
  }

  const wordScores: WordScore[] = ref.map((refWord, i) => {
    const window = stu.slice(Math.max(0, i - 2), i + 3);
    let best = 0;
    for (const w of window) {
      const sim = wordSimilarity(refWord, w);
      if (sim > best) best = sim;
    }
    let status: WordScore['status'] = 'bad';
    if (best >= 0.8) status = 'good';
    else if (best >= 0.5) status = 'okay';
    return { word: refWord, status };
  });

  const points = wordScores.reduce((sum, w) => {
    if (w.status === 'good') return sum + 1;
    if (w.status === 'okay') return sum + 0.5;
    return sum;
  }, 0);
  const score = Math.round((points / ref.length) * 100);
  return { score, wordScores, studentTranscript };
}
