import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator,
} from 'react-native';
import { storage } from '../storage';
import { Lesson, PitchAttempt, WordScore } from '../types';
import { extractPitch } from '../lib/pitch';
import { WebRecorder } from '../lib/recorder';
import { transcribe, scoreAgainstReference } from '../scoring';
import { colors, radii, shadows, spacing } from '../theme';

type Stage =
  | 'loading'
  | 'preparing_teacher'
  | 'ready'
  | 'singing'
  | 'analysing_student'
  | 'done';

type TimingSegment = { startSec: number; endSec: number; score: number };

const HOP_SEC = 0.05;
const SEGMENT_SEC = 5;
const API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

export default function PitchPractice({ route }: any) {
  const { lessonId } = route.params;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [stage, setStage] = useState<Stage>('loading');
  const [teacherCurve, setTeacherCurve] = useState<number[]>([]);
  const [referenceTranscript, setReferenceTranscript] = useState<string>('');
  const [studentTranscript, setStudentTranscript] = useState<string>('');
  const [wordScores, setWordScores] = useState<WordScore[]>([]);
  const [timingSegments, setTimingSegments] = useState<TimingSegment[]>([]);
  const [overallPct, setOverallPct] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [teacherMuted, setTeacherMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recorderRef = useRef<WebRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    const lessons = await storage.getLessons();
    const found = lessons.find(l => l.id === lessonId) ?? null;
    if (!found) { setStage('ready'); return; }

    const hasCurve = !!found.pitchCurve?.length;
    const hasTranscript = !!found.referenceTranscript?.trim();

    if (hasCurve && hasTranscript) {
      setLesson(found);
      setTeacherCurve(found.pitchCurve!);
      setReferenceTranscript(found.referenceTranscript!);
      setStage('ready');
      return;
    }

    setStage('preparing_teacher');
    let updated: Lesson = found;
    try {
      if (!hasCurve) {
        const { pitchCurve, durationMs } = await extractPitch(found.referenceAudioUri);
        updated = { ...updated, pitchCurve, pitchDuration: durationMs };
      }
      if (!hasTranscript) {
        const text = await transcribe(found.referenceAudioUri);
        updated = { ...updated, referenceTranscript: text };
      }
      await storage.updateLesson(updated);
      setLesson(updated);
      setTeacherCurve(updated.pitchCurve ?? []);
      setReferenceTranscript(updated.referenceTranscript ?? '');
      setStage('ready');
    } catch (e: any) {
      setError(e?.message ?? 'Could not prepare teacher recording');
      setLesson(updated);
      setTeacherCurve(updated.pitchCurve ?? []);
      setReferenceTranscript(updated.referenceTranscript ?? '');
      setStage('ready');
    }
  }, [lessonId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      recorderRef.current?.cancel();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startSinging = async () => {
    if (!lesson) return;
    setError(null);
    setStudentTranscript('');
    setWordScores([]);
    setTimingSegments([]);
    setOverallPct(null);
    setFeedback(null);
    setElapsed(0);

    try {
      const audio = new Audio(lesson.referenceAudioUri);
      audio.onended = () => { finishSinging(); };
      audioRef.current = audio;

      const rec = new WebRecorder();
      await rec.start();
      recorderRef.current = rec;

      await audio.play();

      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
      setStage('singing');
    } catch (e: any) {
      setError(e?.message ?? 'Could not start recording');
      setStage('ready');
    }
  };

  const toggleMute = () => {
    const next = !teacherMuted;
    setTeacherMuted(next);
    if (audioRef.current) audioRef.current.volume = next ? 0 : 1;
  };

  const finishSinging = async () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    audioRef.current?.pause();
    const rec = recorderRef.current;
    if (!rec) { setStage('ready'); return; }
    setStage('analysing_student');
    try {
      const uri = await rec.stop();
      recorderRef.current = null;

      // Two parallel analyses: words (Whisper) and timing (voicing mask).
      const [studentText, studentPitch] = await Promise.all([
        transcribe(uri),
        extractPitch(uri),
      ]);

      const wordResult = scoreAgainstReference(referenceTranscript, studentText);
      const timing = computeTimingSegments(teacherCurve, studentPitch.pitchCurve);

      setStudentTranscript(studentText);
      setWordScores(wordResult.wordScores);
      setTimingSegments(timing);
      setOverallPct(wordResult.score);

      const fb = await generateWordFeedback(wordResult.score, wordResult.wordScores);
      setFeedback(fb);

      const attempt: PitchAttempt = {
        id: `${Date.now()}`,
        lessonId,
        overallScore: wordResult.score,
        segments: timing,
        feedback: fb,
        createdAt: Date.now(),
      };
      await storage.addPitchAttempt(attempt);
      await storage.bumpStreak();

      setStage('done');
    } catch (e: any) {
      setError(e?.message ?? 'Could not analyse your recording');
      setStage('ready');
    }
  };

  const reset = () => {
    setStage('ready');
    setStudentTranscript('');
    setWordScores([]);
    setTimingSegments([]);
    setOverallPct(null);
    setFeedback(null);
    setElapsed(0);
    setTeacherMuted(false);
  };

  const totalSec = lesson?.pitchDuration ? Math.round(lesson.pitchDuration / 1000) : 0;

  if (stage === 'loading') {
    return <View style={styles.center}><ActivityIndicator color={colors.text} /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}>
      <Text style={styles.title}>{lesson?.title}</Text>
      <Text style={styles.subtitle}>Sing along · we'll score you</Text>

      {stage === 'preparing_teacher' && (
        <View style={styles.statusCard}>
          <ActivityIndicator color={colors.text} size="small" />
          <Text style={styles.statusText}>Preparing teacher recording… (one-time)</Text>
        </View>
      )}

      {stage === 'analysing_student' && (
        <View style={styles.statusCard}>
          <ActivityIndicator color={colors.text} size="small" />
          <Text style={styles.statusText}>Listening to your recording…</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {stage === 'ready' && (
        <>
          <Text style={styles.hint}>
            Teacher's voice plays through the speaker. Sing along — we'll show you which bits you nailed.
          </Text>
          <Pressable style={[styles.bigBtn, styles.primaryBtn]} onPress={startSinging}>
            <Text style={styles.bigBtnIcon}>🎤</Text>
            <Text style={styles.bigBtnText}>Let's go</Text>
          </Pressable>
        </>
      )}

      {stage === 'singing' && (
        <>
          <View style={styles.statusCard}>
            <Text style={styles.recordingDot}>⏺</Text>
            <Text style={styles.statusText}>
              Recording… {elapsed}s{totalSec > 0 ? ` / ${totalSec}s` : ''}
            </Text>
          </View>
          <View style={styles.singingBtns}>
            <Pressable
              style={[styles.muteBtn, teacherMuted && styles.muteBtnActive]}
              onPress={toggleMute}
            >
              <Text style={styles.muteBtnIcon}>{teacherMuted ? '🔇' : '🔊'}</Text>
              <Text style={styles.muteBtnText}>
                {teacherMuted ? 'Teacher off' : 'Teacher on'}
              </Text>
            </Pressable>
            <Pressable style={[styles.bigBtn, styles.stopBtn, { flex: 1 }]} onPress={finishSinging}>
              <Text style={styles.bigBtnIcon}>⏹</Text>
              <Text style={styles.bigBtnText}>Stop</Text>
            </Pressable>
          </View>
        </>
      )}

      {stage === 'done' && (
        <>
          {overallPct !== null && (
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Your match</Text>
              <Text style={[styles.resultScore, {
                color: overallPct >= 80 ? colors.good : overallPct >= 60 ? colors.okay : colors.bad,
              }]}>
                {overallPct}%
              </Text>
              {feedback ? (
                <Text style={styles.feedbackText}>{feedback}</Text>
              ) : (
                <ActivityIndicator color={colors.textDim} style={{ marginTop: spacing.sm }} />
              )}
            </View>
          )}

          {wordScores.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Word-by-word</Text>
              <View style={styles.wordWrap}>
                {wordScores.map((w, i) => (
                  <View
                    key={i}
                    style={[
                      styles.wordChip,
                      {
                        backgroundColor:
                          w.status === 'good' ? colors.good
                          : w.status === 'okay' ? colors.okay
                          : colors.bad,
                      },
                    ]}
                  >
                    <Text style={styles.wordChipText}>{w.word}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {timingSegments.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Did you keep up? (per 5 seconds)</Text>
              <View style={styles.segmentRow}>
                {timingSegments.map((seg, i) => (
                  <View
                    key={i}
                    style={[
                      styles.segPill,
                      { backgroundColor: seg.score >= 70 ? colors.good : seg.score >= 45 ? colors.okay : colors.bad },
                    ]}
                  >
                    <Text style={styles.segTime}>{Math.round(seg.startSec)}–{Math.round(seg.endSec)}s</Text>
                    <Text style={styles.segScore}>{seg.score}%</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {studentTranscript ? (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>What we heard</Text>
              <Text style={styles.transcript}>{studentTranscript}</Text>
            </View>
          ) : null}

          <Pressable style={[styles.bigBtn, styles.primaryBtn]} onPress={reset}>
            <Text style={styles.bigBtnIcon}>↻</Text>
            <Text style={styles.bigBtnText}>Try again</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

// Per-5-second "did the student sing while the teacher was singing" overlap.
// Uses the binary voicing mask of each pitch curve only — no pitch comparison.
function computeTimingSegments(teacher: number[], student: number[]): TimingSegment[] {
  const framesPerSeg = Math.round(SEGMENT_SEC / HOP_SEC);
  const totalFrames = Math.min(teacher.length, student.length);
  const segs: TimingSegment[] = [];

  for (let start = 0; start < totalFrames; start += framesPerSeg) {
    const end = Math.min(start + framesPerSeg, totalFrames);
    let teacherVoiced = 0, both = 0;
    for (let i = start; i < end; i++) {
      if (teacher[i] > 0) {
        teacherVoiced += 1;
        if (student[i] > 0) both += 1;
      }
    }
    const score = teacherVoiced >= 5
      ? Math.round((both / teacherVoiced) * 100)
      : 100; // segment is mostly silence on the teacher side — nothing to keep up with
    segs.push({
      startSec: start * HOP_SEC,
      endSec: end * HOP_SEC,
      score,
    });
  }
  return segs;
}

async function generateWordFeedback(score: number, wordScores: WordScore[]): Promise<string> {
  if (!API_KEY || !wordScores.length) return genericFeedback(score);

  const total = wordScores.length;
  const thirds = [
    wordScores.slice(0, Math.floor(total / 3)),
    wordScores.slice(Math.floor(total / 3), Math.floor((2 * total) / 3)),
    wordScores.slice(Math.floor((2 * total) / 3)),
  ];
  const thirdRatios = thirds.map(t => {
    if (!t.length) return 1;
    const ok = t.filter(w => w.status !== 'bad').length;
    return ok / t.length;
  });
  const labels = ['beginning', 'middle', 'end'];
  const weak = thirdRatios
    .map((r, i) => (r < 0.6 ? labels[i] : null))
    .filter(Boolean);

  const prompt = [
    `A Bar Mitzvah student (age ~12) just practiced their parsha and got ${score}% of the words correct.`,
    weak.length
      ? `They struggled most in the ${weak.join(' and ')} of the section.`
      : 'They were fairly even throughout.',
    `Write 2–3 sentences of encouraging coaching feedback in plain English.`,
    `Focus on whether they said all the words and stayed with the teacher recording — not on pitch or melody.`,
    `Suggest one concrete next step.`,
    `Do not mention Hebrew words, transliterations, or percentages.`,
  ].join(' ');

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 150,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) return genericFeedback(score);
    const json = await res.json();
    return json.choices?.[0]?.message?.content?.trim() ?? genericFeedback(score);
  } catch {
    return genericFeedback(score);
  }
}

function genericFeedback(score: number): string {
  if (score >= 85) return "Crushing it — you locked in almost every word.";
  if (score >= 65) return "Decent run. The red words are the ones that slipped — chuck the teacher on loop and hit those bits.";
  return "Keep at it. Focus on the red words — replay the teacher recording for those parts until they stick.";
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', marginTop: spacing.md },
  subtitle: { color: colors.primary, fontWeight: '600', marginBottom: spacing.lg },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, padding: spacing.md, borderRadius: radii.md, marginBottom: spacing.md },
  statusText: { color: colors.textDim },
  recordingDot: { color: colors.bad, fontSize: 16 },
  hint: { color: colors.textDim, marginTop: spacing.lg, marginBottom: spacing.md, lineHeight: 22 },
  card: { backgroundColor: colors.card, padding: spacing.md, borderRadius: radii.md, marginTop: spacing.md },
  cardLabel: { color: colors.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },
  wordWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  wordChip: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.sm },
  wordChipText: { color: '#0B1620', fontSize: 14, fontWeight: '700' },
  segmentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  segPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.sm, alignItems: 'center' },
  segTime: { color: '#0B1620', fontSize: 11, fontWeight: '700' },
  segScore: { color: '#0B1620', fontSize: 13, fontWeight: '900' },
  transcript: { color: colors.text, fontSize: 16, lineHeight: 24 },
  singingBtns: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, alignItems: 'stretch' },
  muteBtn: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
    borderWidth: 1,
    borderColor: colors.border,
  },
  muteBtnActive: { backgroundColor: colors.cardAlt, borderColor: colors.primary },
  muteBtnIcon: { fontSize: 24, marginBottom: 4 },
  muteBtnText: { color: colors.textDim, fontSize: 12, fontWeight: '600' },
  bigBtn: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: radii.lg,
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryBtn: { backgroundColor: colors.primary, borderColor: 'transparent', ...shadows.primaryGlow },
  stopBtn: { backgroundColor: colors.bad, borderColor: 'transparent' },
  bigBtnIcon: { fontSize: 28, marginBottom: spacing.xs },
  bigBtnText: { color: colors.text, fontWeight: '800', fontSize: 18 },
  errorCard: { backgroundColor: colors.card, padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.bad, marginTop: spacing.md },
  errorText: { color: colors.bad },
  resultCard: { backgroundColor: colors.card, padding: spacing.lg, borderRadius: radii.md, marginTop: spacing.lg },
  resultLabel: { color: colors.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  resultScore: { fontSize: 64, fontWeight: '900', marginVertical: spacing.sm },
  feedbackText: { color: colors.text, fontSize: 15, lineHeight: 24, marginTop: spacing.sm },
});
