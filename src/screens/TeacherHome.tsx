import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useFocusEffect } from '@react-navigation/native';
import { storage } from '../storage';
import { Attempt, Lesson } from '../types';
import { colors, radii, spacing } from '../theme';

export default function TeacherHome({ navigation }: any) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [week, setWeek] = useState('1');
  const [transcript, setTranscript] = useState('');
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [pickedName, setPickedName] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [l, a] = await Promise.all([storage.getLessons(), storage.getAttempts()]);
    setLessons(l.sort((x, y) => x.weekNumber - y.weekNumber));
    setAttempts(a);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

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
  };

  const saveLesson = async () => {
    if (!title.trim() || !pickedUri) {
      Alert.alert('Missing info', 'Need a title and an audio file.');
      return;
    }
    const lesson: Lesson = {
      id: `${Date.now()}`,
      title: title.trim(),
      weekNumber: parseInt(week, 10) || 1,
      referenceAudioUri: pickedUri,
      referenceTranscript: transcript.trim(),
      createdAt: Date.now(),
    };
    await storage.addLesson(lesson);
    setTitle(''); setWeek(`${(parseInt(week, 10) || 1) + 1}`); setTranscript(''); setPickedUri(null); setPickedName(null);
    setShowAdd(false);
    load();
  };

  const totalAttempts = attempts.length;
  const avgScore = attempts.length ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length) : 0;
  const lastPractice = attempts.length ? new Date(Math.max(...attempts.map(a => a.createdAt))) : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl * 2 }}>
      <Text style={styles.title}>Teacher Dashboard</Text>

      <View style={styles.statsRow}>
        <Stat label="Lessons" value={`${lessons.length}`} />
        <Stat label="Attempts" value={`${totalAttempts}`} />
        <Stat label="Avg score" value={`${avgScore}%`} />
      </View>
      <Text style={styles.lastPractice}>
        Last practice: {lastPractice ? lastPractice.toLocaleString() : 'never'}
      </Text>

      <View style={styles.sectionHeader}>
        <Text style={styles.section}>Lessons</Text>
        <Pressable style={styles.addBtn} onPress={() => setShowAdd(s => !s)}>
          <Text style={styles.addBtnText}>{showAdd ? 'Cancel' : '+ Add'}</Text>
        </Pressable>
      </View>

      {showAdd && (
        <View style={styles.card}>
          <Text style={styles.label}>Week #</Text>
          <TextInput style={styles.input} value={week} onChangeText={setWeek} keyboardType="number-pad" placeholderTextColor={colors.textDim} />
          <Text style={styles.label}>Section title</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Aliyah 1, verses 1-3" placeholderTextColor={colors.textDim} />
          <Text style={styles.label}>Reference transcript (Hebrew or transliteration)</Text>
          <TextInput
            style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
            value={transcript}
            onChangeText={setTranscript}
            placeholder="Paste the words the student should be reciting"
            placeholderTextColor={colors.textDim}
            multiline
          />
          <Pressable style={styles.pickBtn} onPress={pickAudio}>
            <Text style={styles.pickBtnText}>{pickedName ? `🎵 ${pickedName}` : '📁 Pick audio file'}</Text>
          </Pressable>
          <Pressable style={styles.saveBtn} onPress={saveLesson}>
            <Text style={styles.saveBtnText}>Save lesson</Text>
          </Pressable>
        </View>
      )}

      {lessons.map(l => {
        const lessonAttempts = attempts.filter(a => a.lessonId === l.id);
        const best = lessonAttempts.length ? Math.max(...lessonAttempts.map(a => a.score)) : null;
        const weak = computeWeakWords(lessonAttempts);
        return (
          <View key={l.id} style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.cardTitle}>Week {l.weekNumber} · {l.title}</Text>
              <Pressable onPress={() => Alert.alert('Delete?', 'Remove this lesson?', [
                { text: 'Cancel' },
                { text: 'Delete', style: 'destructive', onPress: async () => { await storage.deleteLesson(l.id); load(); } },
              ])}>
                <Text style={{ color: colors.bad }}>Delete</Text>
              </Pressable>
            </View>
            <Text style={styles.cardSub}>Attempts: {lessonAttempts.length}{best != null ? ` · Best: ${best}%` : ''}</Text>
            {weak.length > 0 && (
              <>
                <Text style={[styles.label, { marginTop: spacing.sm }]}>Weakest words</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {weak.map((w, i) => (
                    <View key={i} style={styles.weakChip}>
                      <Text style={styles.weakText}>{w}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        );
      })}

      <Pressable style={styles.settingsBtn} onPress={() => navigation.navigate('Settings')}>
        <Text style={styles.settingsText}>Settings · Switch role</Text>
      </Pressable>
    </ScrollView>
  );
}

function computeWeakWords(attempts: Attempt[]): string[] {
  const counts = new Map<string, { bad: number; total: number }>();
  for (const a of attempts) {
    for (const w of a.wordScores) {
      const c = counts.get(w.word) ?? { bad: 0, total: 0 };
      c.total += 1;
      if (w.status !== 'good') c.bad += 1;
      counts.set(w.word, c);
    }
  }
  return Array.from(counts.entries())
    .filter(([, c]) => c.total >= 2 && c.bad / c.total >= 0.5)
    .sort((a, b) => b[1].bad / b[1].total - a[1].bad / a[1].total)
    .slice(0, 8)
    .map(([w]) => w);
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: spacing.md, marginBottom: spacing.lg },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, backgroundColor: colors.card, padding: spacing.md, borderRadius: radii.md, alignItems: 'center' },
  statValue: { color: colors.text, fontSize: 24, fontWeight: '800' },
  statLabel: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  lastPractice: { color: colors.textDim, marginTop: spacing.sm, marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  section: { color: colors.text, fontSize: 18, fontWeight: '700' },
  addBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.sm },
  addBtnText: { color: colors.text, fontWeight: '700' },
  card: { backgroundColor: colors.card, padding: spacing.md, borderRadius: radii.md, marginBottom: spacing.md },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  cardSub: { color: colors.textDim, marginTop: spacing.xs },
  label: { color: colors.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginTop: spacing.sm, marginBottom: spacing.xs },
  input: { backgroundColor: colors.cardAlt, color: colors.text, padding: spacing.sm, borderRadius: radii.sm, fontSize: 15 },
  pickBtn: { backgroundColor: colors.cardAlt, padding: spacing.md, borderRadius: radii.sm, alignItems: 'center', marginTop: spacing.md },
  pickBtnText: { color: colors.text, fontWeight: '600' },
  saveBtn: { backgroundColor: colors.good, padding: spacing.md, borderRadius: radii.md, alignItems: 'center', marginTop: spacing.md },
  saveBtnText: { color: '#0B1620', fontWeight: '800' },
  weakChip: { backgroundColor: colors.bad, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 6, marginTop: 6 },
  weakText: { color: colors.text, fontWeight: '600' },
  settingsBtn: { marginTop: spacing.xl, alignItems: 'center', padding: spacing.md },
  settingsText: { color: colors.textDim },
});
