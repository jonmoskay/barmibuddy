import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { storage } from '../storage';
import { Lesson, MILESTONES, PitchAttempt, Profile, StreakState } from '../types';
import { colors, radii, spacing } from '../theme';

export default function ParentHome({ navigation }: any) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [attempts, setAttempts] = useState<PitchAttempt[]>([]);
  const [streak, setStreak] = useState<StreakState>({ count: 0, lastPracticeDay: null });

  const load = useCallback(async () => {
    const [p, l, a, s] = await Promise.all([
      storage.getProfile(), storage.getLessons(), storage.getPitchAttempts(), storage.getStreak(),
    ]);
    setProfile(p); setLessons(l); setAttempts(a); setStreak(s);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const lessonsWithProgress = lessons.filter(l => attempts.some(a => a.lessonId === l.id));
  const completion = lessons.length === 0 ? 0 : Math.round((lessonsWithProgress.length / lessons.length) * 100);
  const avg = attempts.length === 0 ? 0 : Math.round(attempts.reduce((s, a) => s + a.overallScore, 0) / attempts.length);
  const milestones = MILESTONES.filter(m => m.test(attempts));

  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10);
    const count = attempts.filter(a => new Date(a.createdAt).toISOString().slice(0, 10) === d).length;
    return { d, count };
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.title}>{profile?.username ?? 'Your child'}'s Progress</Text>
      <Text style={styles.subtitle}>High-level summary</Text>

      <View style={styles.bigCard}>
        <Text style={styles.bigLabel}>Parasha completion</Text>
        <Text style={styles.bigNum}>{completion}%</Text>
        <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${completion}%` }]} /></View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}><Text style={styles.statValue}>🔥 {streak.count}</Text><Text style={styles.statLabel}>Day streak</Text></View>
        <View style={styles.stat}><Text style={styles.statValue}>{avg}%</Text><Text style={styles.statLabel}>Avg accuracy</Text></View>
        <View style={styles.stat}><Text style={styles.statValue}>{milestones.length}</Text><Text style={styles.statLabel}>Milestones</Text></View>
      </View>

      <Text style={styles.section}>Practice this week</Text>
      <View style={styles.weekCard}>
        {last7.map(d => (
          <View key={d.d} style={{ alignItems: 'center', flex: 1 }}>
            <View style={[styles.dayBar, { height: 10 + d.count * 18, backgroundColor: d.count > 0 ? colors.good : colors.cardAlt }]} />
            <Text style={styles.dayLabel}>{d.d.slice(5)}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.section}>Milestones earned</Text>
      {milestones.length === 0 ? (
        <Text style={{ color: colors.textDim }}>None yet — encourage daily practice!</Text>
      ) : (
        milestones.map(m => (
          <View key={m.id} style={styles.milestoneRow}>
            <Text style={{ fontSize: 22 }}>🏆</Text>
            <Text style={styles.milestoneText}>{m.label}</Text>
          </View>
        ))
      )}

      <Pressable style={styles.settingsBtn} onPress={() => navigation.navigate('Settings')}>
        <Text style={styles.settingsText}>Settings · Switch role</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: spacing.md },
  subtitle: { color: colors.textDim, marginBottom: spacing.lg },
  bigCard: { backgroundColor: colors.card, padding: spacing.lg, borderRadius: radii.md, marginBottom: spacing.md },
  bigLabel: { color: colors.textDim, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  bigNum: { color: colors.text, fontSize: 56, fontWeight: '900', marginVertical: spacing.sm },
  progressBar: { height: 8, backgroundColor: colors.cardAlt, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.good },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  stat: { flex: 1, backgroundColor: colors.card, padding: spacing.md, borderRadius: radii.md, alignItems: 'center' },
  statValue: { color: colors.text, fontSize: 22, fontWeight: '800' },
  statLabel: { color: colors.textDim, fontSize: 11, marginTop: 2 },
  section: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: spacing.lg, marginBottom: spacing.md },
  weekCard: { backgroundColor: colors.card, padding: spacing.md, borderRadius: radii.md, flexDirection: 'row', alignItems: 'flex-end', minHeight: 120 },
  dayBar: { width: 18, borderRadius: 4 },
  dayLabel: { color: colors.textDim, fontSize: 10, marginTop: spacing.xs },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: spacing.md, borderRadius: radii.md, marginBottom: spacing.sm },
  milestoneText: { color: colors.text, marginLeft: spacing.md, fontWeight: '600' },
  settingsBtn: { marginTop: spacing.xl, alignItems: 'center', padding: spacing.md },
  settingsText: { color: colors.textDim },
});
