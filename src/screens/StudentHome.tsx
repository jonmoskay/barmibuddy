import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  RefreshControl, TextInput, Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useFocusEffect } from '@react-navigation/native';
import { storage } from '../storage';
import { Lesson, MILESTONES, PitchAttempt, Profile, StreakState } from '../types';
import { colors, radii, spacing } from '../theme';

export default function StudentHome({ navigation }: any) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [pitchAttempts, setPitchAttempts] = useState<PitchAttempt[]>([]);
  const [streak, setStreak] = useState<StreakState>({ count: 0, lastPracticeDay: null });
  const [refreshing, setRefreshing] = useState(false);

  // "Add section" form state
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [pickedName, setPickedName] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [p, l, a, s] = await Promise.all([
      storage.getProfile(),
      storage.getLessons(),
      storage.getPitchAttempts(),
      storage.getStreak(),
    ]);
    setProfile(p);
    setLessons(l.sort((x, y) => x.weekNumber - y.weekNumber));
    setPitchAttempts(a);
    setStreak(s);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const pickAudio = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
    if (res.canceled) return;
    const file = res.assets[0];
    const dir = FileSystem.documentDirectory + 'lessons/';
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
    const dest = dir + `${Date.now()}-${file.name}`;
    await FileSystem.copyAsync({ from: file.uri, to: dest });
    setPickedUri(dest);
    setPickedName(file.name);
    // Auto-populate name from filename if not already set
    if (!title.trim()) {
      const clean = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').trim();
      setTitle(clean);
    }
  };

  const saveSection = async () => {
    if (!title.trim() || !pickedUri) {
      Alert.alert('Missing info', 'Give this section a name and pick the audio your teacher sent you.');
      return;
    }
    const lesson: Lesson = {
      id: `${Date.now()}`,
      title: title.trim(),
      weekNumber: lessons.length + 1,
      referenceAudioUri: pickedUri,
      referenceTranscript: transcript.trim(),
      createdAt: Date.now(),
    };
    await storage.addLesson(lesson);
    setTitle('');
    setTranscript('');
    setPickedUri(null);
    setPickedName(null);
    setShowAdd(false);
    load();
  };

  const bestForLesson = (lessonId: string) => {
    const arr = pitchAttempts.filter(a => a.lessonId === lessonId);
    if (!arr.length) return null;
    return Math.max(...arr.map(a => a.overallScore));
  };

  const unlocked = MILESTONES.filter(m => m.test(pitchAttempts));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl * 2 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: profile?.avatarColor ?? colors.primary }]}>
          <Text style={styles.avatarText}>{profile?.username?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={styles.name}>{profile?.username ?? 'Student'}</Text>
          <Text style={styles.sub}>{profile?.city}{profile?.teamName ? ` · ${profile.teamName}` : ''}</Text>
        </View>
        <View style={styles.streakBadge}>
          <Text style={styles.streakNum}>🔥 {streak.count}</Text>
          <Text style={styles.streakLabel}>day streak</Text>
        </View>
      </View>

      {/* Section list */}
      <View style={styles.sectionHeader}>
        <Text style={styles.section}>My Parsha Sections</Text>
        <View style={styles.sectionBtns}>
          {lessons.length > 0 && (
            <Pressable
              style={styles.deleteSecBtn}
              onPress={() => Alert.alert(
                'Delete section',
                'Which section do you want to remove?',
                [
                  ...lessons.map(l => ({
                    text: l.title,
                    style: 'destructive' as const,
                    onPress: () => Alert.alert('Delete?', `Remove "${l.title}"?`, [
                      { text: 'Cancel' },
                      { text: 'Delete', style: 'destructive', onPress: async () => { await storage.deleteLesson(l.id); load(); } },
                    ]),
                  })),
                  { text: 'Cancel', style: 'cancel' },
                ],
              )}
            >
              <Text style={styles.deleteSecBtnText}>Delete section</Text>
            </Pressable>
          )}
          <Pressable style={styles.addBtn} onPress={() => setShowAdd(s => !s)}>
            <Text style={styles.addBtnText}>{showAdd ? 'Cancel' : '+ Add section'}</Text>
          </Pressable>
        </View>
      </View>

      {/* Add section form */}
      {showAdd && (
        <View style={styles.formCard}>
          <Text style={styles.formHint}>
            Got a recording from your teacher? Add it here — then you can practice against it.
          </Text>
          <Text style={styles.label}>Section name</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. First aliyah, lines 1–3"
            placeholderTextColor={colors.textDim}
          />
          <Pressable style={styles.pickBtn} onPress={pickAudio}>
            <Text style={styles.pickBtnText}>
              {pickedName ? `🎵 ${pickedName}` : '⬆️ Upload teacher recording'}
            </Text>
          </Pressable>
          <Text style={styles.pickHint}>
            Find the voice note your teacher sent you (WhatsApp, email, etc.) and select it here.
          </Text>
          <Pressable style={[styles.saveBtn, (!title.trim() || !pickedUri) && { opacity: 0.4 }]} onPress={saveSection}>
            <Text style={styles.saveBtnText}>Save section</Text>
          </Pressable>
        </View>
      )}

      {lessons.length === 0 && !showAdd ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🎤</Text>
          <Text style={styles.emptyTitle}>No sections yet</Text>
          <Text style={styles.emptyText}>
            Tap "+ Add section" to upload a recording your teacher sent you, then start practicing.
          </Text>
        </View>
      ) : (
        lessons.map(l => {
          const best = bestForLesson(l.id);
          const scoreColor = best == null ? colors.textDim : best >= 85 ? colors.good : best >= 65 ? colors.okay : colors.bad;
          return (
            <Pressable key={l.id} style={styles.card} onPress={() => navigation.navigate('Lesson', { lessonId: l.id })}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{l.title}</Text>
                <Text style={styles.cardSub}>{best != null ? `Best score: ${best}%` : 'Not practiced yet'}</Text>
              </View>
              <View style={[styles.scoreBadge, { borderColor: scoreColor }]}>
                <Text style={[styles.scoreText, { color: scoreColor }]}>{best != null ? `${best}%` : '—'}</Text>
              </View>
            </Pressable>
          );
        })
      )}

      {/* Milestones */}
      <Text style={styles.section}>Milestones</Text>
      <View style={styles.milestonesGrid}>
        {MILESTONES.map(m => {
          const got = unlocked.includes(m);
          return (
            <View key={m.id} style={[styles.milestone, got && styles.milestoneOn]}>
              <Text style={styles.milestoneIcon}>{got ? '🏆' : '🔒'}</Text>
              <Text style={[styles.milestoneText, got && { color: colors.text }]}>{m.label}</Text>
            </View>
          );
        })}
      </View>

      <Pressable style={styles.settingsBtn} onPress={() => navigation.navigate('Settings')}>
        <Text style={styles.settingsText}>Settings</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg, marginTop: spacing.md },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.text, fontSize: 24, fontWeight: '800' },
  name: { color: colors.text, fontSize: 22, fontWeight: '700' },
  sub: { color: colors.textDim, marginTop: 2 },
  streakBadge: { backgroundColor: colors.card, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.md, alignItems: 'center' },
  streakNum: { color: colors.text, fontWeight: '800', fontSize: 16 },
  streakLabel: { color: colors.textDim, fontSize: 11 },
  sectionHeader: { marginTop: spacing.lg, marginBottom: spacing.md },
  section: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: spacing.sm },
  sectionBtns: { flexDirection: 'row', gap: spacing.sm },
  addBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.sm },
  addBtnText: { color: colors.text, fontWeight: '700', fontSize: 14 },
  deleteSecBtn: { backgroundColor: colors.bad, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.sm },
  deleteSecBtnText: { color: colors.text, fontWeight: '700', fontSize: 14 },
  formCard: { backgroundColor: colors.card, padding: spacing.md, borderRadius: radii.md, marginBottom: spacing.md },
  formHint: { color: colors.textDim, marginBottom: spacing.md, lineHeight: 20 },
  label: { color: colors.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginTop: spacing.md, marginBottom: spacing.xs },
  input: { backgroundColor: colors.cardAlt, color: colors.text, padding: spacing.sm, borderRadius: radii.sm, fontSize: 15 },
  pickBtn: { backgroundColor: colors.cardAlt, padding: spacing.md, borderRadius: radii.sm, alignItems: 'center', marginTop: spacing.md },
  pickBtnText: { color: colors.text, fontWeight: '600' },
  pickHint: { color: colors.textDim, fontSize: 12, marginTop: spacing.xs },
  saveBtn: { backgroundColor: colors.good, padding: spacing.md, borderRadius: radii.md, alignItems: 'center', marginTop: spacing.md },
  saveBtnText: { color: '#0B1620', fontWeight: '800', fontSize: 16 },
  card: { backgroundColor: colors.card, padding: spacing.md, borderRadius: radii.md, flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  cardSub: { color: colors.textDim, marginTop: 2 },
  scoreBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.sm, borderWidth: 1 },
  scoreText: { fontWeight: '700' },
  emptyCard: { backgroundColor: colors.card, padding: spacing.xl, borderRadius: radii.md, alignItems: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: spacing.md },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: spacing.sm },
  emptyText: { color: colors.textDim, textAlign: 'center', lineHeight: 20 },
  milestonesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  milestone: { width: '48%', backgroundColor: colors.card, padding: spacing.md, borderRadius: radii.md, opacity: 0.5 },
  milestoneOn: { opacity: 1, borderWidth: 1, borderColor: colors.good },
  milestoneIcon: { fontSize: 22 },
  milestoneText: { color: colors.textDim, marginTop: spacing.xs, fontWeight: '600' },
  settingsBtn: { marginTop: spacing.xl, alignItems: 'center', padding: spacing.md },
  settingsText: { color: colors.textDim },
});
