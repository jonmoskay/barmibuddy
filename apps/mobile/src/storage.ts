import AsyncStorage from '@react-native-async-storage/async-storage';
import { Attempt, Lesson, PitchAttempt, Profile, Role, StreakState } from './types';

const K = {
  role: 'bb:role',
  profile: 'bb:profile',
  lessons: 'bb:lessons',
  attempts: 'bb:attempts',
  pitchAttempts: 'bb:pitchAttempts',
  streak: 'bb:streak',
};

async function get<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

async function set<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  getRole: () => get<Role | null>(K.role, null),
  setRole: (r: Role) => set(K.role, r),

  getProfile: () => get<Profile | null>(K.profile, null),
  setProfile: (p: Profile) => set(K.profile, p),

  getLessons: () => get<Lesson[]>(K.lessons, []),
  addLesson: async (l: Lesson) => {
    const all = await get<Lesson[]>(K.lessons, []);
    await set(K.lessons, [...all, l]);
  },
  deleteLesson: async (id: string) => {
    const all = await get<Lesson[]>(K.lessons, []);
    await set(K.lessons, all.filter(l => l.id !== id));
  },
  updateLesson: async (updated: Lesson) => {
    const all = await get<Lesson[]>(K.lessons, []);
    await set(K.lessons, all.map(l => l.id === updated.id ? updated : l));
  },

  getAttempts: () => get<Attempt[]>(K.attempts, []),
  addAttempt: async (a: Attempt) => {
    const all = await get<Attempt[]>(K.attempts, []);
    await set(K.attempts, [...all, a]);
  },
  deleteAttempt: async (id: string) => {
    const all = await get<Attempt[]>(K.attempts, []);
    await set(K.attempts, all.filter(a => a.id !== id));
  },
  attemptsForLesson: async (lessonId: string) => {
    const all = await get<Attempt[]>(K.attempts, []);
    return all.filter(a => a.lessonId === lessonId);
  },

  getPitchAttempts: () => get<PitchAttempt[]>(K.pitchAttempts, []),
  addPitchAttempt: async (a: PitchAttempt) => {
    const all = await get<PitchAttempt[]>(K.pitchAttempts, []);
    await set(K.pitchAttempts, [...all, a]);
  },
  deletePitchAttempt: async (id: string) => {
    const all = await get<PitchAttempt[]>(K.pitchAttempts, []);
    await set(K.pitchAttempts, all.filter(a => a.id !== id));
  },
  pitchAttemptsForLesson: async (lessonId: string) => {
    const all = await get<PitchAttempt[]>(K.pitchAttempts, []);
    return all.filter(a => a.lessonId === lessonId);
  },

  getStreak: () => get<StreakState>(K.streak, { count: 0, lastPracticeDay: null }),
  bumpStreak: async () => {
    const today = new Date().toISOString().slice(0, 10);
    const cur = await get<StreakState>(K.streak, { count: 0, lastPracticeDay: null });
    if (cur.lastPracticeDay === today) return cur;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const next: StreakState = {
      count: cur.lastPracticeDay === yesterday ? cur.count + 1 : 1,
      lastPracticeDay: today,
    };
    await set(K.streak, next);
    return next;
  },

  reset: async () => {
    await AsyncStorage.multiRemove(Object.values(K));
  },
};
