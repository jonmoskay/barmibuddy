import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { storage } from '../storage';
import { Lesson, PitchAttempt } from '../types';
import { extractPitch } from '../lib/pitch';
import { WebRecorder } from '../lib/recorder';
import PitchGraph, { Segment } from '../components/PitchGraph';
import { colors, radii, spacing } from '../theme';

type Stage =
  | 'loading'
  | 'extracting_teacher'
  | 'ready'
  | 'singing'
  | 'analysing_student'
  | 'done';

const HOP_SEC = 0.05;
const SEGMENT_SEC = 5;
const API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

export default function PitchPractice({ route }: any) {
  const { lessonId } = route.params;
  const { width } = useWindowDimensions();
  const graphWidth = width - spacing.lg * 2;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [stage, setStage] = useState<Stage>('loading');
  const [teacherCurve, setTeacherCurve] = useState<number[]>([]);
  const [studentCurve, setStudentCurve] = useState<number[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
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
    setLesson(found);
    if (found?.pitchCurve?.length) {
      setTeacherCurve(found.pitchCurve);
      setStage('ready');
    } else if (found) {
      setStage('extracting_teacher');
      try {
        const { pitchCurve, durationMs } = await extractPitch(found.referenceAudioUri);
        const updated = { ...found, pitchCurve, pitchDuration: durationMs };
        await storage.updateLesson(updated);
        setLesson(updated);
        setTeacherCurve(pitchCurve);
        setStage('ready');
      } catch (e: any) {
        setError(e?.message ?? 'Could not analyse teacher audio');
        setStage('ready');
      }
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
    setStudentCurve([]);
    setSegments([]);
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
      const { pitchCurve } = await extractPitch(uri);
      await onStudentPitchReady(pitchCurve);
    } catch (e: any) {
      setError(e?.message ?? 'Could not analyse your recording');
      setStage('ready');
    }
  };

  const onStudentPitchReady = async (curve: number[]) => {
    setStudentCurve(curve);
    const segs = computeSegments(teacherCurve, curve);
    const overall = Math.round(segs.reduce((s, g) => s + g.score, 0) / (segs.length || 1));
    setSegments(segs);
    setOverallPct(overall);
    const fb = await generateSpecificFeedback(segs, overall);
    setFeedback(fb);

    const attempt: PitchAttempt = {
      id: `${Date.now()}`,
      lessonId,
      overallScore: overall,
      segments: segs,
      feedback: fb,
      createdAt: Date.now(),
    };
    await storage.addPitchAttempt(attempt);
    await storage.bumpStreak();

    setStage('done');
  };

  const reset = () => {
    setStage('ready');
    setStudentCurve([]);
    setSegments([]);
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
      <Text style={styles.subtitle}>Sing-along · pitch comparison</Text>

      {stage === 'extracting_teacher' && (
        <View style={styles.statusCard}>
          <ActivityIndicator color={colors.text} size="small" />
          <Text style={styles.statusText}>Analysing teacher melody… (one-time)</Text>
        </View>
      )}

      {stage === 'analysing_student' && (
        <View style={styles.statusCard}>
          <ActivityIndicator color={colors.text} size="small" />
          <Text style={styles.statusText}>Comparing your melody…</Text>
        </View>
      )}

      {teacherCurve.length > 0 && (stage === 'ready' || stage === 'singing' || stage === 'done') && (
        <PitchGraph
          teacherCurve={teacherCurve}
          studentCurve={studentCurve}
          segments={stage === 'done' ? segments : undefined}
          width={graphWidth}
          height={220}
        />
      )}

      {stage === 'done' && segments.length > 0 && (
        <View style={styles.segmentRow}>
          {segments.map((seg, i) => (
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
      )}

      {error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {stage === 'ready' && (
        <>
          <Text style={styles.hint}>
            The teacher recording plays through the speaker. Sing along — we'll compare your melody and show you exactly where to improve.
          </Text>
          <Pressable style={styles.bigBtn} onPress={startSinging}>
            <Text style={styles.bigBtnIcon}>🎤</Text>
            <Text style={styles.bigBtnText}>Start singing</Text>
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
            <Pressable style={[styles.bigBtn, { backgroundColor: colors.bad, flex: 1 }]} onPress={finishSinging}>
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
              <Text style={styles.resultLabel}>Overall melody match</Text>
              <Text style={[styles.resultScore, {
                color: overallPct >= 70 ? colors.good : overallPct >= 45 ? colors.okay : colors.bad,
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
          <Pressable style={styles.bigBtn} onPress={reset}>
            <Text style={styles.bigBtnIcon}>↻</Text>
            <Text style={styles.bigBtnText}>Try again</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

function computeSegments(teacher: number[], student: number[]): Segment[] {
  const framesPerSeg = Math.round(SEGMENT_SEC / HOP_SEC);
  const totalFrames = Math.min(teacher.length, student.length);
  const segs: Segment[] = [];

  for (let start = 0; start < totalFrames; start += framesPerSeg) {
    const end = Math.min(start + framesPerSeg, totalFrames);
    let matched = 0, counted = 0;
    for (let i = start; i < end; i++) {
      const t = teacher[i], s = student[i];
      if (t <= 0 && s <= 0) { matched += 1; counted += 1; continue; }
      if (t <= 0 || s <= 0) continue;
      const ratio = s / t;
      if (ratio >= 0.94 && ratio <= 1.06) matched += 1;
      else if (ratio >= 0.89 && ratio <= 1.12) matched += 0.5;
      counted += 1;
    }
    segs.push({
      startSec: start * HOP_SEC,
      endSec: end * HOP_SEC,
      score: counted > 0 ? Math.round((matched / counted) * 100) : 0,
    });
  }
  return segs;
}

async function generateSpecificFeedback(segs: Segment[], overall: number): Promise<string> {
  if (!API_KEY || !segs.length) return genericFeedback(overall);

  const weak = segs
    .filter(s => s.score < 60)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  const segSummary = segs
    .map(s => `${Math.round(s.startSec)}–${Math.round(s.endSec)}s: ${s.score}%`)
    .join(', ');

  const weakSummary = weak.length
    ? `Weakest parts: ${weak.map(s => `${Math.round(s.startSec)}–${Math.round(s.endSec)}s (${s.score}%)`).join(', ')}.`
    : 'No significantly weak sections.';

  const prompt = [
    `A Bar Mitzvah student (age ~12) just practiced singing their Parsha and scored ${overall}% overall melody match.`,
    `Segment scores: ${segSummary}.`,
    weakSummary,
    `Write 3 sentences of specific, encouraging coaching feedback in plain English.`,
    `Reference the actual time ranges where they struggled (e.g. "around 10–15 seconds").`,
    `Suggest one concrete thing to do to improve those sections.`,
    `Do not mention Hebrew words, technical terms, or percentages in your response.`,
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
    if (!res.ok) return genericFeedback(overall);
    const json = await res.json();
    return json.choices?.[0]?.message?.content?.trim() ?? genericFeedback(overall);
  } catch {
    return genericFeedback(overall);
  }
}

function genericFeedback(score: number): string {
  if (score >= 80) return 'Great work — your melody is tracking really well across the whole section!';
  if (score >= 60) return "Good effort! Check the coloured bands on the graph — the red sections are where your melody drifted. Listen to the teacher there a few extra times.";
  return "Keep going! The red sections on the graph show where to focus. Listen to those parts of the teacher recording on repeat until the melody feels natural.";
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
  segmentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  segPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.sm, alignItems: 'center' },
  segTime: { color: '#0B1620', fontSize: 11, fontWeight: '700' },
  segScore: { color: '#0B1620', fontSize: 13, fontWeight: '900' },
  singingBtns: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, alignItems: 'stretch' },
  muteBtn: { backgroundColor: colors.card, padding: spacing.md, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center', minWidth: 90, borderWidth: 1, borderColor: colors.border },
  muteBtnActive: { backgroundColor: colors.cardAlt, borderColor: colors.primary },
  muteBtnIcon: { fontSize: 24, marginBottom: 4 },
  muteBtnText: { color: colors.textDim, fontSize: 12, fontWeight: '600' },
  bigBtn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: radii.lg, alignItems: 'center', marginTop: spacing.md },
  bigBtnIcon: { fontSize: 28, marginBottom: spacing.xs },
  bigBtnText: { color: colors.text, fontWeight: '800', fontSize: 18 },
  errorCard: { backgroundColor: colors.card, padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.bad, marginTop: spacing.md },
  errorText: { color: colors.bad },
  resultCard: { backgroundColor: colors.card, padding: spacing.lg, borderRadius: radii.md, marginTop: spacing.lg },
  resultLabel: { color: colors.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  resultScore: { fontSize: 64, fontWeight: '900', marginVertical: spacing.sm },
  feedbackText: { color: colors.text, fontSize: 15, lineHeight: 24, marginTop: spacing.sm },
});
