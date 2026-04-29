import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { storage } from '../storage';
import { Lesson, PitchAttempt } from '../types';
import { colors, radii, spacing, shadows } from '../theme';

export default function LessonScreen({ route, navigation }: any) {
  const { lessonId } = route.params;
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [pitchAttempts, setPitchAttempts] = useState<PitchAttempt[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const playerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    (async () => {
      const lessons = await storage.getLessons();
      const found = lessons.find(l => l.id === lessonId) ?? null;
      setLesson(found);
      const all = await storage.pitchAttemptsForLesson(lessonId);
      setPitchAttempts(all);
    })();
    return () => {
      playerRef.current?.pause();
      playerRef.current = null;
    };
  }, [lessonId]);

  const playReference = async () => {
    if (!lesson || isPlaying) return;
    try {
      setError(null);
      playerRef.current?.pause();
      const audio = new Audio(lesson.referenceAudioUri);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => { setIsPlaying(false); setError('Could not play reference audio'); };
      playerRef.current = audio;
      await audio.play();
      setIsPlaying(true);
    } catch (e: any) {
      setError(`Could not play reference: ${e?.message ?? 'unknown error'}`);
    }
  };

  const stopReference = async () => {
    playerRef.current?.pause();
    setIsPlaying(false);
  };

  if (!lesson) {
    return <View style={styles.container}><ActivityIndicator color={colors.text} style={{ marginTop: 80 }} /></View>;
  }

  const latest = pitchAttempts.length ? pitchAttempts[pitchAttempts.length - 1] : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}>
      <Text style={styles.title}>{lesson.title}</Text>

      {/* Play reference */}
      <Pressable
        style={[styles.bigBtn, styles.skyBtn, isPlaying && { backgroundColor: colors.cardAlt, borderColor: colors.borderStrong }]}
        onPress={isPlaying ? stopReference : playReference}
      >
        <Text style={styles.bigBtnIcon}>{isPlaying ? '⏹' : '▶'}</Text>
        <Text style={styles.bigBtnText}>{isPlaying ? 'Stop' : 'Play teacher recording'}</Text>
      </Pressable>

      {/* Sing along */}
      <Pressable
        style={[styles.bigBtn, styles.primaryBtn]}
        onPress={() => navigation.navigate('PitchPractice', { lessonId })}
      >
        <Text style={styles.bigBtnIcon}>🎵</Text>
        <Text style={styles.bigBtnText}>Sing along</Text>
      </Pressable>

      {error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Latest result */}
      {latest && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Latest score</Text>
          <Text style={[
            styles.bigScore,
            { color: latest.overallScore >= 85 ? colors.good : latest.overallScore >= 65 ? colors.okay : colors.bad },
          ]}>
            {latest.overallScore}%
          </Text>
          {latest.feedback ? (
            <>
              <Text style={styles.cardLabel}>Coach says</Text>
              <Text style={styles.feedback}>{latest.feedback}</Text>
            </>
          ) : null}
        </View>
      )}

      {/* History */}
      {pitchAttempts.length > 1 && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>History · tap to expand · swipe to delete</Text>
          {pitchAttempts.slice().reverse().map(a => {
            const expanded = expandedId === a.id;
            const scoreColor = a.overallScore >= 85 ? colors.good : a.overallScore >= 65 ? colors.okay : colors.bad;
            return (
              <Swipeable
                key={a.id}
                renderRightActions={() => (
                  <Pressable
                    style={styles.swipeDelete}
                    onPress={async () => {
                      await storage.deletePitchAttempt(a.id);
                      const all = await storage.pitchAttemptsForLesson(lessonId);
                      setPitchAttempts(all);
                      if (expandedId === a.id) setExpandedId(null);
                    }}
                  >
                    <Text style={styles.swipeDeleteText}>Delete</Text>
                  </Pressable>
                )}
              >
                <Pressable
                  style={styles.historyRow}
                  onPress={() => setExpandedId(expanded ? null : a.id)}
                >
                  <Text style={styles.historyDate}>{new Date(a.createdAt).toLocaleDateString()}</Text>
                  <Text style={[styles.historyScore, { color: scoreColor }]}>{a.overallScore}%</Text>
                  <Text style={styles.historyChevron}>{expanded ? '▲' : '▼'}</Text>
                </Pressable>
                {expanded && (
                  <View style={styles.historyDetail}>
                    {a.feedback ? (
                      <Text style={styles.historyFeedback}>{a.feedback}</Text>
                    ) : (
                      <Text style={styles.historyFeedback}>No feedback recorded for this attempt.</Text>
                    )}
                    <View style={styles.segmentRow}>
                      {a.segments.map((seg, i) => (
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
              </Swipeable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.6, marginTop: spacing.md, marginBottom: spacing.lg },
  bigBtn: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: radii.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryBtn: { backgroundColor: colors.primary, borderColor: 'transparent', ...shadows.primaryGlow },
  skyBtn: { backgroundColor: 'rgba(14,165,233,0.12)', borderColor: 'rgba(14,165,233,0.35)' },
  bigBtnIcon: { fontSize: 28, marginBottom: spacing.xs },
  bigBtnText: { color: colors.text, fontWeight: '800', fontSize: 18 },
  errorCard: { backgroundColor: colors.card, padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.bad, marginBottom: spacing.md },
  errorText: { color: colors.bad },
  card: { backgroundColor: colors.card, padding: spacing.md, borderRadius: radii.md, marginBottom: spacing.md },
  cardLabel: { color: colors.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },
  bigScore: { fontSize: 56, fontWeight: '900', marginVertical: spacing.sm },
  feedback: { color: colors.text, fontSize: 16, lineHeight: 24 },
  historyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
  historyDate: { color: colors.textDim, flex: 1 },
  historyScore: { fontWeight: '700', marginRight: spacing.sm },
  historyChevron: { color: colors.textDim, fontSize: 12 },
  historyDetail: { backgroundColor: colors.cardAlt, padding: spacing.md, borderRadius: radii.sm, marginBottom: spacing.sm },
  historyFeedback: { color: colors.text, fontSize: 15, lineHeight: 22, marginBottom: spacing.md },
  swipeDelete: { backgroundColor: colors.bad, justifyContent: 'center', alignItems: 'center', width: 80, borderTopWidth: 1, borderTopColor: colors.border },
  swipeDeleteText: { color: colors.text, fontWeight: '700' },
  segmentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  segPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.sm, alignItems: 'center' },
  segTime: { color: '#0B1620', fontSize: 11, fontWeight: '700' },
  segScore: { color: '#0B1620', fontSize: 13, fontWeight: '900' },
});
