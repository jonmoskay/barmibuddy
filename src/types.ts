export type Role = 'student' | 'parent';

export type Lesson = {
  id: string;
  title: string;
  weekNumber: number;
  referenceAudioUri: string;
  referenceTranscript?: string;
  pitchCurve?: number[];      // Hz values sampled at 50ms intervals
  pitchDuration?: number;     // total ms of the reference recording
  createdAt: number;
};

export type Attempt = {
  id: string;
  lessonId: string;
  audioUri: string;
  score: number;
  wordScores: WordScore[];
  transcript: string;
  feedback?: string;
  createdAt: number;
};

export type WordScore = {
  word: string;
  status: 'good' | 'okay' | 'bad';
};

export type PitchSegment = {
  startSec: number;
  endSec: number;
  score: number;
};

export type PitchAttempt = {
  id: string;
  lessonId: string;
  overallScore: number;
  segments: PitchSegment[];
  feedback?: string;
  createdAt: number;
};

export type SkinTone = 'light' | 'medium' | 'tan' | 'dark';
export type Hair = 'none' | 'shortBrown' | 'shortBlack' | 'curly' | 'red' | 'blonde';
export type Headwear = 'none' | 'yarmulke' | 'capBaseball' | 'hatBeach' | 'beanie';
export type Glasses = 'none' | 'round' | 'square' | 'aviator';
export type Mouth = 'smile' | 'grin' | 'smirk' | 'surprised';
export type Peiyot = 'none' | 'short' | 'long' | 'curly';

export type Character = {
  skin: SkinTone;
  hair: Hair;
  headwear: Headwear;
  glasses: Glasses;
  mouth: Mouth;
  peiyot: Peiyot;
};

export type Profile = {
  username: string;
  city: string;
  synagogue: string;
  parsha?: string;
  barmiDate?: string; // ISO yyyy-mm-dd
  avatarColor: string;
  teamName: string;
  teamId?: string;
  teamPrimary?: string;
  teamSecondary?: string;
  character?: Character;
  teacherContact?: string;
};

export type StreakState = {
  count: number;
  lastPracticeDay: string | null;
};

export const MILESTONES = [
  { id: 'first-attempt', label: 'First Sing-Along', test: (a: PitchAttempt[]) => a.length >= 1 },
  { id: 'three-attempts', label: '3 Practices', test: (a: PitchAttempt[]) => a.length >= 3 },
  { id: 'score-70', label: 'Hit 70%', test: (a: PitchAttempt[]) => a.some(x => x.overallScore >= 70) },
  { id: 'score-85', label: 'Hit 85%', test: (a: PitchAttempt[]) => a.some(x => x.overallScore >= 85) },
  { id: 'score-95', label: 'Mastery 95%', test: (a: PitchAttempt[]) => a.some(x => x.overallScore >= 95) },
  { id: 'ten-attempts', label: '10 Practices', test: (a: PitchAttempt[]) => a.length >= 10 },
];
