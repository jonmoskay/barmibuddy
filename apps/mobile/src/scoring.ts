import { WordScore } from './types';

const API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

export async function transcribe(audioUri: string): Promise<string> {
  if (!API_KEY) {
    throw new Error('Missing EXPO_PUBLIC_OPENAI_API_KEY in .env');
  }
  const audioRes = await fetch(audioUri);
  const blob = await audioRes.blob();
  // Whisper requires a filename with a recognised extension.
  const ext = blob.type.includes('webm') ? 'webm'
    : blob.type.includes('mp4') ? 'mp4'
    : blob.type.includes('wav') ? 'wav'
    : 'm4a';
  const file = new File([blob], `audio.${ext}`, { type: blob.type || `audio/${ext}` });
  const form = new FormData();
  form.append('file', file);
  form.append('model', 'whisper-1');
  form.append('language', 'he');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}` },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Whisper error ${res.status}: ${text}`);
  }
  const json = await res.json();
  return (json.text ?? '').trim();
}

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

export async function generateFeedback(
  score: number,
  wordScores: WordScore[],
): Promise<string> {
  if (!API_KEY) return '';
  const total = wordScores.length;
  if (total === 0) return '';

  // Work out which third of the section had problems
  const thirds = [
    wordScores.slice(0, Math.floor(total / 3)),
    wordScores.slice(Math.floor(total / 3), Math.floor((2 * total) / 3)),
    wordScores.slice(Math.floor((2 * total) / 3)),
  ];
  const thirdScores = thirds.map(t => {
    if (!t.length) return 1;
    const good = t.filter(w => w.status === 'good').length;
    return good / t.length;
  });
  const weakThirds = thirdScores
    .map((s, i) => (s < 0.6 ? ['beginning', 'middle', 'end'][i] : null))
    .filter(Boolean);

  const prompt = [
    `A Bar Mitzvah student just practiced their Parsha and scored ${score}%.`,
    weakThirds.length
      ? `They struggled most with the ${weakThirds.join(' and ')} of the section.`
      : 'They were fairly consistent throughout.',
    `Write 2–3 sentences of coaching feedback in plain English aimed at a 12-year-old.`,
    `Be encouraging but specific. Do not mention Hebrew words or transliteration.`,
    `Focus on what to do next to improve.`,
  ].join(' ');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 120,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) return '';
  const json = await res.json();
  return json.choices?.[0]?.message?.content?.trim() ?? '';
}

export async function scoreAttempt(
  studentAudioUri: string,
  referenceTranscript: string,
): Promise<ScoreResult> {
  const studentTranscript = await transcribe(studentAudioUri);
  return scoreAgainstReference(referenceTranscript, studentTranscript);
}
