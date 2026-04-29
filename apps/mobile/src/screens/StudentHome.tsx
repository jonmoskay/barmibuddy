import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  RefreshControl, TextInput, Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect } from '@react-navigation/native';
import { storage } from '../storage';
import { Lesson, MILESTONES, PitchAttempt, Profile, StreakState } from '../types';
import { colors, radii, spacing, shadows } from '../theme';
import { fileToDataUrl, uriToDataUrl } from '../lib/recorder';
import CharacterAvatar, { DEFAULT_CHARACTER } from '../components/Character';
import BackgroundFX from '../components/BackgroundFX';
import { readableAccent } from '../lib/colorUtils';

const XP_PER_LEVEL = 1000;
const XP_PER_PRACTICE = 75;

export default function StudentHome({ navigation }: any) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [pitchAttempts, setPitchAttempts] = useState<PitchAttempt[]>([]);
  const [streak, setStreak] = useState<StreakState>({ count: 0, lastPracticeDay: null });
  const [refreshing, setRefreshing] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [pickedName, setPickedName] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

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

  const teamPrimary = profile?.teamPrimary ?? colors.primary;
  const teamSecondary = profile?.teamSecondary ?? colors.skyLight;
  const accentText = readableAccent(profile?.teamPrimary, profile?.teamSecondary, colors.primaryLight);
  const accentTextAlt = readableAccent(profile?.teamSecondary, profile?.teamPrimary, colors.skyLight);
  const fillColor = readableAccent(profile?.teamPrimary, profile?.teamSecondary, colors.primary);

  const totalXP = pitchAttempts.length * XP_PER_PRACTICE +
    pitchAttempts.reduce((s, a) => s + Math.round(a.overallScore / 2), 0);
  const level = Math.max(1, Math.floor(totalXP / XP_PER_LEVEL) + 1);
  const xpInLevel = totalXP % XP_PER_LEVEL;
  const xpPct = Math.round((xpInLevel / XP_PER_LEVEL) * 100);

  const nextLesson = useMemo(() => {
    if (!lessons.length) return null;
    const unpracticed = lessons.find(l => !pitchAttempts.some(a => a.lessonId === l.id));
    return unpracticed ?? lessons[0];
  }, [lessons, pitchAttempts]);

  const unlocked = MILESTONES.filter(m => m.test(pitchAttempts));
  const latestBadge = unlocked[unlocked.length - 1];

  const pickAudio = async () => {
    setPicking(true);
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: false });
      if (res.canceled) return;
      const file = res.assets[0];
      const anyFile = file as any;
      const dataUrl = anyFile.file instanceof Blob
        ? await fileToDataUrl(anyFile.file)
        : await uriToDataUrl(file.uri);
      setPickedUri(dataUrl);
      setPickedName(file.name);
      if (!title.trim()) {
        const clean = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').trim();
        setTitle(clean);
      }
    } catch (e: any) {
      Alert.alert('Could not load audio', e?.message ?? 'Try a different file.');
    } finally {
      setPicking(false);
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
      createdAt: Date.now(),
    };
    await storage.addLesson(lesson);
    setTitle(''); setPickedUri(null); setPickedName(null); setShowAdd(false);
    load();
  };

  const sendReportToTeacher = async () => {
    if (!profile) return;
    let contact = profile.teacherContact?.trim() ?? '';
    if (!contact) {
      const entered = typeof window !== 'undefined' ? window.prompt("Your teacher's email address?") : null;
      if (!entered) return;
      contact = entered.trim();
      await storage.setProfile({ ...profile, teacherContact: contact });
      setProfile({ ...profile, teacherContact: contact });
    }
    const report = buildReport(profile, lessons, pitchAttempts, streak);
    const subject = `${profile.username}'s BarmiBuddy progress`;
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try { await (navigator as any).share({ title: subject, text: report }); return; } catch {}
    }
    const href = `mailto:${encodeURIComponent(contact)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(report)}`;
    if (typeof window !== 'undefined') window.location.href = href;
  };

  const fakeLeaderboard = useMemo(() => {
    const me = profile?.username ?? 'You';
    const myXP = totalXP;
    const others = [
      { name: 'Jake K.',  xp: Math.max(myXP + 1460, 4210), color: '#FB923C' },
      { name: 'Ethan M.', xp: Math.max(myXP + 1120, 3870), color: '#0EA5E9' },
      { name: 'Liam R.',  xp: Math.max(myXP + 760,  3510), color: '#A78BFA' },
      { name: 'Noah W.',  xp: Math.max(myXP + 140,  2890), color: '#4ADE80' },
    ];
    const rows = [...others, { name: me, xp: myXP, color: teamPrimary, isMe: true as const }];
    return rows.sort((a, b) => b.xp - a.xp).map((r, i) => ({ ...r, rank: i + 1 }));
  }, [profile, totalXP, teamPrimary]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollPad}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
    >
    <View style={styles.inner}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.avatarRing, { borderColor: teamSecondary, backgroundColor: teamPrimary }]}>
          <CharacterAvatar
            character={profile?.character ?? DEFAULT_CHARACTER}
            size={56}
            teamPrimary={profile?.teamPrimary}
            teamSecondary={profile?.teamSecondary}
          />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={styles.greeting}>Barmi Boy</Text>
          <Text style={styles.name}>{profile?.username ?? 'Student'} <Text style={styles.wave}>👋</Text></Text>
        </View>
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>🔥 {streak.count}</Text>
          <Text style={styles.streakLabelSm}>Day Streak</Text>
        </View>
      </View>

      {/* Level / XP */}
      <View style={styles.xpRow}>
        <Text style={styles.xpLabel}>Level {level}</Text>
        <Text style={styles.xpVal}>{xpInLevel} / {XP_PER_LEVEL} XP</Text>
      </View>
      <View style={styles.xpTrack}>
        <View style={[styles.xpFill, { width: `${xpPct}%`, backgroundColor: fillColor }]} />
        <View style={[styles.xpFillTop, { width: `${xpPct}%`, backgroundColor: accentTextAlt, opacity: 0.5 }]} />
      </View>

      {/* Barmi countdown + progress */}
      {profile?.barmiDate ? (() => {
        const today = new Date();
        const target = new Date(profile.barmiDate + 'T00:00:00');
        const daysLeft = Math.max(0, Math.ceil((target.getTime() - today.getTime()) / 86400000));
        const totalSections = lessons.length || 1;
        const readySections = lessons.filter(l => {
          const arr = pitchAttempts.filter(a => a.lessonId === l.id);
          return arr.length && Math.max(...arr.map(a => a.overallScore)) >= 75;
        }).length;
        const readinessPct = Math.round((readySections / totalSections) * 100);
        // assume prep window = 180 days; time-elapsed % since today vs full window
        const PREP_DAYS = 180;
        const timePct = Math.min(100, Math.max(0, Math.round(((PREP_DAYS - daysLeft) / PREP_DAYS) * 100)));
        const onTrack = readinessPct >= timePct - 10;
        const statusColor = daysLeft === 0 ? colors.amber : onTrack ? colors.good : colors.bad;
        const statusLabel = daysLeft === 0 ? "It's today! 🎉" : onTrack ? 'On track' : 'Step it up';
        return (
          <View style={[styles.countdownCard, { borderColor: statusColor }]}>
            <View style={styles.countdownTop}>
              <View>
                <Text style={styles.cardEyebrowSmall}>📅  BARMI DAY</Text>
                <Text style={styles.countdownDate}>
                  {target.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
                {profile.parsha ? <Text style={styles.countdownSub}>Parasha {profile.parsha}</Text> : null}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.countdownDays, { color: accentTextAlt }]}>{daysLeft}</Text>
                <Text style={styles.countdownDaysLabel}>days to go</Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${readinessPct}%`, backgroundColor: fillColor }]} />
              <View style={[styles.progressMarker, { left: `${timePct}%` }]} />
            </View>
            <View style={styles.progressFooter}>
              <Text style={styles.progressLabel}>{readinessPct}% ready · {readySections}/{totalSections} tracks at 75%+</Text>
              <Text style={[styles.progressStatus, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
        );
      })() : null}

      {/* Today's Practice */}
      <View style={styles.featureCard}>
        <Text style={styles.cardEyebrow}>📖  TODAY'S PRACTICE</Text>
        <Text style={styles.cardTitle}>{nextLesson?.title ?? 'Add your first track'}</Text>
        <Text style={styles.cardSub}>
          {nextLesson ? 'Sing along and lock in the tune' : 'Upload a teacher recording to start'}
        </Text>
        <Pressable
          style={[styles.primaryBtn, { backgroundColor: teamPrimary, shadowColor: teamPrimary }]}
          onPress={() => nextLesson ? navigation.navigate('Lesson', { lessonId: nextLesson.id }) : setShowAdd(true)}
        >
          <Text style={styles.primaryBtnText}>{nextLesson ? "▶  Let's Go" : '+  Add Track'}</Text>
        </Pressable>
      </View>

      {/* Latest Badge */}
      {latestBadge ? (
        <View style={styles.badgeCard}>
          <View style={styles.badgeIconWrap}>
            <Text style={styles.badgeIcon}>⚡</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardEyebrowSmall}>🏅  LATEST BADGE EARNED</Text>
            <Text style={styles.badgeTitle}>{latestBadge.label}</Text>
          </View>
        </View>
      ) : null}

      {/* My sections — surfaced above the leaderboard so + Add is visible */}
      <View style={styles.sectionHeader}>
        <Text style={styles.section}>My Parasha Tracks</Text>
        <View style={styles.sectionBtns}>
          {lessons.length > 0 && (
            <Pressable
              style={styles.deleteSecBtn}
              onPress={() => Alert.alert('Delete section', 'Which section do you want to remove?', [
                ...lessons.map(l => ({
                  text: l.title, style: 'destructive' as const,
                  onPress: () => Alert.alert('Delete?', `Remove "${l.title}"?`, [
                    { text: 'Cancel' },
                    { text: 'Delete', style: 'destructive', onPress: async () => { await storage.deleteLesson(l.id); load(); } },
                  ]),
                })),
                { text: 'Cancel', style: 'cancel' },
              ])}
            >
              <Text style={styles.deleteSecBtnText}>Delete</Text>
            </Pressable>
          )}
          <Pressable style={[styles.addBtn, { backgroundColor: teamPrimary, shadowColor: teamPrimary }]} onPress={() => setShowAdd(s => !s)}>
            <Text style={styles.addBtnText}>{showAdd ? 'Cancel' : '+ Add'}</Text>
          </Pressable>
        </View>
      </View>

      {showAdd && (
        <View style={styles.formCard}>
          <Text style={styles.formHint}>
            Got a recording from your teacher? Drop it here — then you can sing along.
          </Text>
          <Text style={styles.label}>Track name</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. First aliyah, lines 1–3"
            placeholderTextColor={colors.textMuted}
          />
          <Pressable style={styles.pickBtn} onPress={pickAudio} disabled={picking}>
            <Text style={styles.pickBtnText}>
              {picking ? 'Loading…' : pickedName ? `🎵 ${pickedName}` : '⬆️ Upload teacher recording'}
            </Text>
          </Pressable>
          <Text style={styles.pickHint}>
            On iPhone, save the audio to the Files app first (in WhatsApp / Voice Memos: Share → Save to Files), then pick it here.
          </Text>
          <Pressable style={[styles.saveBtn, (!title.trim() || !pickedUri) && { opacity: 0.4 }]} onPress={saveSection}>
            <Text style={styles.saveBtnText}>Save Track</Text>
          </Pressable>
        </View>
      )}

      {lessons.map(l => {
        const arr = pitchAttempts.filter(a => a.lessonId === l.id);
        const best = arr.length ? Math.max(...arr.map(a => a.overallScore)) : null;
        const scoreColor = best == null ? colors.textDim : best >= 85 ? colors.good : best >= 65 ? colors.okay : colors.bad;
        return (
          <Pressable key={l.id} style={styles.lessonRow} onPress={() => navigation.navigate('Lesson', { lessonId: l.id })}>
            <View style={{ flex: 1 }}>
              <Text style={styles.lessonTitle}>{l.title}</Text>
              <Text style={styles.lessonSub}>{best != null ? `Best ${best}%` : 'Untouched — sing it'}</Text>
            </View>
            <View style={[styles.scoreBadge, { borderColor: scoreColor }]}>
              <Text style={[styles.scoreText, { color: scoreColor }]}>{best != null ? `${best}%` : '—'}</Text>
            </View>
          </Pressable>
        );
      })}

      {/* Weekly Leaderboard */}
      <View style={styles.leaderCard}>
        <Text style={styles.leaderHeader}>WEEKLY LEADERBOARD — YOUR SHUL</Text>
        {fakeLeaderboard.map(row => {
          const isMe = (row as any).isMe;
          return (
            <View key={row.name} style={[styles.lbRow, isMe && { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: teamPrimary }]}>
              <Text style={styles.lbRank}>{row.rank}</Text>
              {isMe ? (
                <View style={[styles.lbAvCharRing, { borderColor: teamSecondary, backgroundColor: teamPrimary }]}>
                  <CharacterAvatar
                    character={profile?.character ?? DEFAULT_CHARACTER}
                    size={28}
                    teamPrimary={profile?.teamPrimary}
                    teamSecondary={profile?.teamSecondary}
                  />
                </View>
              ) : (
                <View style={[styles.lbAv, { backgroundColor: row.color }]}>
                  <Text style={styles.lbAvText}>{row.name.split(' ').map(p => p[0]).join('').slice(0, 2)}</Text>
                </View>
              )}
              <Text style={[styles.lbName, isMe && { color: colors.text }]}>{isMe ? 'You' : row.name}</Text>
              <Text style={[styles.lbPts, isMe && { color: accentTextAlt }]}>{row.xp.toLocaleString()} XP</Text>
            </View>
          );
        })}
      </View>

      {pitchAttempts.length > 0 && (
        <Pressable style={[styles.reportBtn, { backgroundColor: teamPrimary, shadowColor: teamPrimary }]} onPress={sendReportToTeacher}>
          <Text style={styles.reportBtnIcon}>📤</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.reportBtnTitle}>Send progress to teacher</Text>
            <Text style={styles.reportBtnSub}>
              {profile?.teacherContact ? `Sends to ${profile.teacherContact}` : 'Generates a report and emails it'}
            </Text>
          </View>
        </Pressable>
      )}

      <Pressable style={styles.settingsBtn} onPress={() => navigation.navigate('Settings')}>
        <Text style={styles.settingsText}>Settings</Text>
      </Pressable>
    </View>
    </ScrollView>
  );
}

function blendBg(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c * 0.10 + 8 * 0.90);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

function buildReport(profile: Profile, lessons: Lesson[], attempts: PitchAttempt[], streak: StreakState): string {
  const lines: string[] = [];
  lines.push(`Hi! Here's ${profile.username}'s BarmiBuddy progress.`);
  lines.push('');
  lines.push(`Day streak: ${streak.count}`);
  lines.push(`Total practices: ${attempts.length}`);
  if (attempts.length) {
    const avg = Math.round(attempts.reduce((s, a) => s + a.overallScore, 0) / attempts.length);
    const best = Math.max(...attempts.map(a => a.overallScore));
    lines.push(`Average score: ${avg}%`);
    lines.push(`Best score: ${best}%`);
  }
  lines.push('');
  lines.push('Per section:');
  for (const l of lessons) {
    const lessonAttempts = attempts.filter(a => a.lessonId === l.id);
    if (!lessonAttempts.length) { lines.push(`• ${l.title} — not practiced yet`); continue; }
    const lessonBest = Math.max(...lessonAttempts.map(a => a.overallScore));
    const lessonAvg = Math.round(lessonAttempts.reduce((s, a) => s + a.overallScore, 0) / lessonAttempts.length);
    lines.push(`• ${l.title} — ${lessonAttempts.length} practices, best ${lessonBest}%, avg ${lessonAvg}%`);
  }
  lines.push('');
  lines.push(`— sent from BarmiBuddy by ${profile.username}`);
  return lines.join('\n');
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollPad: { padding: spacing.lg, paddingBottom: spacing.xl * 2, alignItems: 'center' },
  inner: { width: '100%', maxWidth: 520, zIndex: 1 },
  orbsLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.18 },
  orbA: { width: 520, height: 520, top: -200, left: -120 },
  orbB: { width: 380, height: 380, top: 240, right: -160, opacity: 0.14 },
  lbAvCharRing: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.md, marginBottom: spacing.lg },
  greeting: { color: colors.textDim, fontSize: 14, fontWeight: '700' },
  name: { color: colors.text, fontSize: 30, fontWeight: '900', letterSpacing: -0.8, marginTop: 2 },
  wave: { fontSize: 24 },
  teamLine: { fontSize: 12, fontWeight: '700', marginTop: 4, letterSpacing: 0.3 },
  streakBadge: {
    backgroundColor: 'rgba(251,146,60,0.15)',
    borderWidth: 1, borderColor: 'rgba(251,146,60,0.4)',
    paddingHorizontal: spacing.md, paddingVertical: 8,
    borderRadius: radii.pill,
  },
  streakText: { color: colors.orange, fontSize: 14, fontWeight: '900', letterSpacing: 0.3 },
  streakLabelSm: { color: colors.orange, fontSize: 9, fontWeight: '800', opacity: 0.85 },
  avatarRing: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },

  xpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  xpLabel: { color: colors.text, fontSize: 13, fontWeight: '800' },
  xpVal: { color: colors.textDim, fontSize: 12, fontWeight: '700' },
  xpTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 6, overflow: 'hidden', marginBottom: spacing.lg },
  xpFill: { height: '100%' },
  xpFillTop: { position: 'absolute', height: '100%', top: 0, left: 0 },

  countdownCard: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    marginBottom: spacing.md,
  },
  countdownTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  countdownDate: { color: colors.text, fontSize: 18, fontWeight: '900', letterSpacing: -0.4, marginTop: 4 },
  countdownSub: { color: colors.textDim, fontSize: 12, fontWeight: '700', marginTop: 2 },
  countdownDays: { fontSize: 38, fontWeight: '900', letterSpacing: -1, lineHeight: 40 },
  countdownDaysLabel: { color: colors.textDim, fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  progressTrack: {
    height: 10, backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 6, overflow: 'visible', marginBottom: spacing.sm, position: 'relative',
  },
  progressFill: { height: '100%', borderRadius: 6 },
  progressMarker: {
    position: 'absolute', top: -3, width: 2, height: 16,
    backgroundColor: colors.text, opacity: 0.55, borderRadius: 1,
  },
  progressFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { color: colors.textDim, fontSize: 11, fontWeight: '700' },
  progressStatus: { fontSize: 11, fontWeight: '900', letterSpacing: 0.3, textTransform: 'uppercase' },

  featureCard: {
    backgroundColor: colors.card,
    padding: spacing.lg, borderRadius: radii.lg, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  cardEyebrow: {
    color: colors.textDim, fontSize: 11, fontWeight: '800',
    letterSpacing: 1, textAlign: 'center', marginBottom: spacing.sm,
  },
  cardEyebrowSmall: { color: colors.textDim, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  cardTitle: { color: colors.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.5, textAlign: 'center' },
  cardSub: { color: colors.textDim, fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 6, marginBottom: spacing.md },
  primaryBtn: { paddingVertical: spacing.md, borderRadius: radii.pill, alignItems: 'center', ...shadows.primaryGlow },
  primaryBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },

  battleCard: {
    backgroundColor: 'rgba(251,146,60,0.08)',
    borderWidth: 1, borderColor: 'rgba(251,146,60,0.4)',
    padding: spacing.lg, borderRadius: radii.lg, marginBottom: spacing.md,
  },
  battleBtn: {
    backgroundColor: colors.orangeDark, paddingVertical: spacing.md,
    borderRadius: radii.pill, alignItems: 'center',
    shadowColor: colors.orangeDark, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 18, elevation: 6,
  },
  battleBtnText: { color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 0.3 },

  badgeCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.card, padding: spacing.md, borderRadius: radii.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  badgeIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  badgeIcon: { fontSize: 22 },
  badgeTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 2 },

  leaderCard: {
    backgroundColor: colors.card, padding: spacing.md, borderRadius: radii.lg,
    marginTop: spacing.md, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  leaderHeader: { color: colors.textDim, fontSize: 11, fontWeight: '800', letterSpacing: 1, textAlign: 'center', marginBottom: spacing.md },
  lbRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.sm,
    borderRadius: radii.sm, borderWidth: 1, borderColor: 'transparent',
    marginBottom: 2,
  },
  lbRank: { color: colors.text, fontWeight: '900', width: 18, fontSize: 13 },
  lbAv: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  lbAvText: { color: '#FFF', fontWeight: '900', fontSize: 9 },
  lbName: { flex: 1, color: colors.textDim, fontWeight: '800', fontSize: 13 },
  lbPts: { color: colors.text, fontWeight: '900', fontSize: 13 },

  sectionHeader: { marginTop: spacing.xl, marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  section: { color: colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
  sectionBtns: { flexDirection: 'row', gap: spacing.sm },
  addBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.pill },
  addBtnText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  deleteSecBtn: {
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.35)',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.pill,
  },
  deleteSecBtnText: { color: colors.bad, fontWeight: '700', fontSize: 13 },

  formCard: { backgroundColor: colors.card, padding: spacing.md, borderRadius: radii.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  formHint: { color: colors.textDim, marginBottom: spacing.md, lineHeight: 20, fontWeight: '600' },
  label: { color: colors.textDim, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginTop: spacing.md, marginBottom: spacing.xs, fontWeight: '700' },
  input: { backgroundColor: colors.cardAlt, color: colors.text, padding: spacing.md, borderRadius: radii.sm, fontSize: 15, fontWeight: '600', borderWidth: 1, borderColor: colors.border },
  pickBtn: { backgroundColor: colors.cardAlt, padding: spacing.md, borderRadius: radii.md, alignItems: 'center', marginTop: spacing.md, borderWidth: 1, borderColor: colors.borderStrong },
  pickBtnText: { color: colors.text, fontWeight: '700' },
  saveBtn: { backgroundColor: colors.good, padding: spacing.md, borderRadius: radii.pill, alignItems: 'center', marginTop: spacing.md },
  saveBtnText: { color: '#08090D', fontWeight: '900', fontSize: 16 },

  lessonRow: {
    backgroundColor: colors.card, padding: spacing.md, borderRadius: radii.md,
    flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  lessonTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  lessonSub: { color: colors.textDim, marginTop: 2, fontWeight: '600', fontSize: 12 },
  scoreBadge: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radii.pill, borderWidth: 1.5 },
  scoreText: { fontWeight: '900', fontSize: 13 },

  reportBtn: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radii.md, marginTop: spacing.lg, gap: spacing.md, ...shadows.primaryGlow },
  reportBtnIcon: { fontSize: 28 },
  reportBtnTitle: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  reportBtnSub: { color: '#FFF', opacity: 0.85, fontSize: 12, marginTop: 2, fontWeight: '600' },

  settingsBtn: { marginTop: spacing.xl, alignItems: 'center', padding: spacing.md },
  settingsText: { color: colors.textDim, fontWeight: '600' },
});
