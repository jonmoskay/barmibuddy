import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Image, Platform, useWindowDimensions } from 'react-native';
import { storage } from '../storage';
import { Character, Role } from '../types';
import { colors, radii, spacing, shadows, type } from '../theme';
import { LEAGUES, League, Team } from '../lib/leagues';
import CharacterAvatar, { CHARACTER_OPTIONS, DEFAULT_CHARACTER, OPTION_LABELS } from '../components/Character';
import BackgroundFX from '../components/BackgroundFX';
import { readableAccent, luminance } from '../lib/colorUtils';

type Step = 1 | 2 | 3 | 4;

export default function Onboarding({ onDone }: { onDone: (role: Role) => void }) {
  const { width } = useWindowDimensions();
  const teamCols = width > 900 ? 5 : width > 600 ? 3 : 2;
  const [step, setStep] = useState<Step>(1);
  const [username, setUsername] = useState('');
  const [city, setCity] = useState('');
  const [synagogue, setSynagogue] = useState('');
  const [parsha, setParsha] = useState('');
  const [barmiDate, setBarmiDate] = useState('');
  const [league, setLeague] = useState<League | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [character, setCharacter] = useState<Character>(DEFAULT_CHARACTER);
  const [showOtherRoles, setShowOtherRoles] = useState(false);

  const accent = team?.primary ?? colors.primary;
  const accentSecondary = team?.secondary ?? colors.skyLight;
  const wordmarkColor = readableAccent(team?.primary, team?.secondary, colors.primaryLight);
  const subtitleAccentColor = readableAccent(team?.secondary, team?.primary, colors.orange);

  const submit = async (role: Role = 'student') => {
    if (!username.trim() || !team || !league) return;
    await storage.setRole(role);
    await storage.setProfile({
      username: username.trim(),
      city: city.trim(),
      synagogue: synagogue.trim(),
      parsha: parsha.trim(),
      barmiDate: barmiDate || undefined,
      teamName: team.short,
      teamId: team.id,
      teamPrimary: team.primary,
      teamSecondary: team.secondary,
      avatarColor: team.primary,
      character,
    });
    onDone(role);
  };

  const randomize = () => {
    const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];
    setCharacter({
      skin: pick(CHARACTER_OPTIONS.skin),
      hair: pick(CHARACTER_OPTIONS.hair),
      yarmulke: pick(CHARACTER_OPTIONS.yarmulke),
      glasses: pick(CHARACTER_OPTIONS.glasses),
      mouth: pick(CHARACTER_OPTIONS.mouth),
      peiyot: pick(CHARACTER_OPTIONS.peiyot),
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollPad}>

      <View style={styles.inner}>
        <View style={styles.eyebrow}>
          <View style={[styles.eyebrowDot, { backgroundColor: accentSecondary }]} />
          <Text style={[styles.eyebrowText, { color: accentSecondary }]}>PARASHA PRACTICE, LEVELLED UP</Text>
        </View>

        <Text style={styles.title}>
          Barmi<Text style={[styles.titleAccent, { color: wordmarkColor }]}>Buddy</Text>
        </Text>
        <Text style={styles.subtitle}>
          Practice. Battle. <Text style={[styles.subtitleAccent, { color: subtitleAccentColor }]}>Crush it.</Text>
        </Text>

        {step === 1 && (
          <>
            <Text style={styles.label}>Your name</Text>
            <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="Jeremy" placeholderTextColor={colors.textMuted} autoFocus />
            <Text style={styles.label}>Where you live</Text>
            <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="Melbourne, Australia" placeholderTextColor={colors.textMuted} />
            <Text style={styles.label}>Your synagogue</Text>
            <TextInput style={styles.input} value={synagogue} onChangeText={setSynagogue} placeholder="Caulfield Shule" placeholderTextColor={colors.textMuted} />

            <Text style={styles.label}>Your Parasha</Text>
            <TextInput style={styles.input} value={parsha} onChangeText={setParsha} placeholder="e.g. Bereishit" placeholderTextColor={colors.textMuted} />

            <Text style={styles.label}>Your Barmi date</Text>
            <DateInput value={barmiDate} onChange={setBarmiDate} />

            <Pressable
              onPress={() => setStep(2)}
              style={[styles.cta, (!username.trim() || !city.trim() || !synagogue.trim() || !parsha.trim() || !barmiDate) && { opacity: 0.4 }]}
              disabled={!username.trim() || !city.trim() || !synagogue.trim() || !parsha.trim() || !barmiDate}
            >
              <Text style={styles.ctaText}>Next  →</Text>
            </Pressable>

            <Pressable onPress={() => setShowOtherRoles(s => !s)} style={styles.otherToggle}>
              <Text style={styles.otherToggleText}>{showOtherRoles ? 'Hide other roles ▲' : 'Parent or pilot helper? ▼'}</Text>
            </Pressable>
            {showOtherRoles && (
              <View style={styles.otherRoles}>
                <Text style={styles.otherHint}>Read-only view. The student does everything.</Text>
                <Pressable
                  style={[styles.roleBtn, !username.trim() && { opacity: 0.4 }]}
                  disabled={!username.trim()}
                  onPress={async () => {
                    await storage.setRole('parent');
                    await storage.setProfile({ username: username.trim() || 'Parent', city: city.trim(), synagogue: synagogue.trim(), teamName: '', avatarColor: colors.primary });
                    onDone('parent');
                  }}
                >
                  <Text style={styles.roleBtnText}>Continue as Parent</Text>
                </Pressable>
              </View>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.label}>Which sport do you like the most?</Text>
            <Text style={styles.helper}>Pick a league — we'll show you their teams next.</Text>

            <View style={styles.leagueList}>
              {LEAGUES.map(l => {
                const active = league?.id === l.id;
                return (
                  <Pressable
                    key={l.id}
                    onPress={() => { setLeague(l); setTeam(null); }}
                    style={[
                      styles.leagueCard,
                      active && { borderColor: colors.primaryLight, backgroundColor: colors.cardAlt },
                    ]}
                  >
                    <Text style={styles.leagueEmoji}>{l.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.leagueName}>{l.name}</Text>
                      <Text style={styles.leagueBlurb}>{l.blurb}</Text>
                    </View>
                    {active && <Text style={styles.leagueCheck}>✓</Text>}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.navRow}>
              <Pressable style={styles.secondaryCta} onPress={() => setStep(1)}>
                <Text style={styles.secondaryCtaText}>← Back</Text>
              </Pressable>
              <Pressable
                onPress={() => setStep(3)}
                style={[styles.cta, { flex: 1, marginTop: 0 }, !league && { opacity: 0.4 }]}
                disabled={!league}
              >
                <Text style={styles.ctaText}>Next  →</Text>
              </Pressable>
            </View>
          </>
        )}

        {step === 3 && league && (
          <>
            <Text style={styles.label}>Pick your {league.name} team</Text>
            <Text style={styles.helper}>We'll deck the app out in your team's colours.</Text>

            <View style={styles.teamGrid}>
              {league.teams.map(t => {
                const active = team?.id === t.id;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => setTeam(t)}
                    style={[
                      styles.teamCard,
                      { width: `${100 / teamCols - 2}%` as any, borderColor: active ? t.secondary : colors.border, backgroundColor: active ? t.primary : colors.card },
                      active && { transform: [{ scale: 1.02 }] },
                    ]}
                  >
                    <View style={[styles.teamSwatch, { backgroundColor: t.primary, borderColor: t.secondary }]}>
                      <View style={[styles.teamSwatchInner, { backgroundColor: t.secondary }]} />
                    </View>
                    <Text style={[styles.teamShort, active && { color: '#FFF' }]} numberOfLines={2}>{t.name}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.navRow}>
              <Pressable style={styles.secondaryCta} onPress={() => setStep(2)}>
                <Text style={styles.secondaryCtaText}>← Back</Text>
              </Pressable>
              <Pressable
                onPress={() => setStep(4)}
                style={[
                  styles.cta,
                  { flex: 1, marginTop: 0, backgroundColor: team?.primary ?? colors.primary, shadowColor: team?.primary ?? colors.primary },
                  !team && { opacity: 0.4 },
                ]}
                disabled={!team}
              >
                <Text style={styles.ctaText}>Next  →</Text>
              </Pressable>
            </View>
          </>
        )}

        {step === 4 && (
          <>
            <Text style={styles.label}>Build your character</Text>
            <Text style={styles.helper}>Make him you. Or make him weird. Up to you.</Text>

            <View style={styles.previewWrap}>
              <View style={[styles.previewRing, { borderColor: team?.secondary ?? colors.primary, backgroundColor: team?.primary ?? colors.card }]}>
                <CharacterAvatar character={character} size={160} teamPrimary={team?.primary} teamSecondary={team?.secondary} />
              </View>
              <Pressable onPress={randomize} style={styles.diceBtn}>
                <Text style={styles.diceText}>🎲  Surprise me</Text>
              </Pressable>
            </View>

            {(['skin','hair','headwear','glasses','mouth','peiyot'] as const).map(key => (
              <CharacterRow
                key={key}
                label={key === 'peiyot' ? 'Peiyot' : key === 'headwear' ? 'Headwear' : key[0].toUpperCase() + key.slice(1)}
                current={character[key] as any}
                options={CHARACTER_OPTIONS[key] as readonly any[]}
                onPick={(v: any) => setCharacter(c => ({ ...c, [key]: v }))}
                character={character}
                render={key}
                teamPrimary={team?.primary}
                teamSecondary={team?.secondary}
              />
            ))}

            <View style={styles.navRow}>
              <Pressable style={styles.secondaryCta} onPress={() => setStep(3)}>
                <Text style={styles.secondaryCtaText}>← Back</Text>
              </Pressable>
              <Pressable
                onPress={() => submit('student')}
                style={[styles.cta, { flex: 1, marginTop: 0, backgroundColor: team?.primary ?? colors.primary, shadowColor: team?.primary ?? colors.primary }]}
              >
                <Text style={styles.ctaText}>Let's go  →</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  if (Platform.OS === 'web') {
    return (
      // @ts-ignore — react-native-web allows raw HTML elements
      <input
        type="date"
        value={value}
        min="2025-01-01"
        max="2030-12-31"
        onChange={(e: any) => onChange(e.target.value)}
        style={{
          backgroundColor: colors.card,
          color: colors.text,
          padding: '14px 16px',
          borderRadius: 14,
          fontSize: 16,
          fontWeight: 600,
          border: `1px solid ${colors.border}`,
          width: '100%',
          boxSizing: 'border-box',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          letterSpacing: '-0.2px',
          colorScheme: 'dark',
          outline: 'none',
        }}
      />
    );
  }
  return (
    <TextInput
      style={{ backgroundColor: colors.card, color: colors.text, padding: spacing.md, borderRadius: radii.md, fontSize: 16, fontWeight: '600', borderWidth: 1, borderColor: colors.border }}
      value={value}
      onChangeText={onChange}
      placeholder="2026-12-15"
      placeholderTextColor={colors.textMuted}
    />
  );
}

function CharacterRow<K extends keyof Character>({
  label, current, options, onPick, character, render, teamPrimary, teamSecondary,
}: {
  label: string;
  current: Character[K];
  options: readonly Character[K][];
  onPick: (v: Character[K]) => void;
  character: Character;
  render: K;
  teamPrimary?: string;
  teamSecondary?: string;
}) {
  return (
    <View style={{ marginTop: spacing.md }}>
      <Text style={rowStyles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
        {options.map(opt => {
          const active = current === opt;
          const preview: Character = { ...character, [render]: opt };
          return (
            <Pressable key={String(opt)} onPress={() => onPick(opt)} style={[rowStyles.chip, active && rowStyles.chipActive]}>
              <CharacterAvatar character={preview} size={56} teamPrimary={teamPrimary} teamSecondary={teamSecondary} />
              <Text style={[rowStyles.chipText, active && rowStyles.chipTextActive]}>
                {OPTION_LABELS[String(opt)] ?? String(opt)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function blendBg(hex: string): string {
  // very dark blend of the team color with the base bg #08090D
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c * 0.12 + 8 * 0.88);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

const rowStyles = StyleSheet.create({
  label: { color: colors.textDim, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  chip: { alignItems: 'center', gap: 4, backgroundColor: colors.card, padding: 8, borderRadius: radii.md, borderWidth: 2, borderColor: colors.border, minWidth: 80 },
  chipActive: { borderColor: colors.primaryLight, backgroundColor: colors.cardAlt },
  chipText: { color: colors.textDim, fontSize: 10, fontWeight: '700' },
  chipTextActive: { color: colors.text },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollPad: { padding: spacing.lg, paddingBottom: spacing.xl * 2, alignItems: 'center' },
  inner: { width: '100%', maxWidth: 520, zIndex: 1 },
  orbsLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.28 },
  orbA: { width: 520, height: 520, top: -160, left: -120 },
  orbB: { width: 420, height: 420, top: 80, right: -160, opacity: 0.22 },
  orbC: { width: 360, height: 360, bottom: -120, left: '20%' },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  logo: { width: 72, height: 72 },
  eyebrow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radii.pill,
    marginTop: spacing.xl,
  },
  eyebrowDot: { width: 7, height: 7, borderRadius: 4 },
  eyebrowText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  title: { color: colors.text, fontSize: 56, ...type.display, marginTop: spacing.lg },
  titleAccent: { color: colors.primaryLight },
  subtitle: { color: colors.textDim, fontSize: 18, fontWeight: '700', marginTop: spacing.sm, marginBottom: spacing.xl },
  subtitleAccent: { color: colors.orange },
  label: { color: colors.textDim, fontSize: 11, marginTop: spacing.lg, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  helper: { color: colors.textDim, fontSize: 13, marginTop: -4, marginBottom: spacing.md, fontWeight: '600' },
  input: { backgroundColor: colors.card, color: colors.text, paddingHorizontal: spacing.md, paddingVertical: spacing.md + 2, borderRadius: radii.md, fontSize: 16, fontWeight: '600', borderWidth: 1, borderColor: colors.border },

  // League list
  leagueList: { gap: spacing.sm, marginTop: spacing.sm },
  leagueCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.card, padding: spacing.md, borderRadius: radii.md,
    borderWidth: 2, borderColor: colors.border,
  },
  leagueEmoji: { fontSize: 32 },
  leagueName: { color: colors.text, fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },
  leagueBlurb: { color: colors.textDim, fontSize: 12, fontWeight: '600', marginTop: 2 },
  leagueCheck: { color: colors.primaryLight, fontSize: 22, fontWeight: '900' },

  // Team grid
  teamGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  teamCard: {
    paddingVertical: spacing.md, paddingHorizontal: spacing.sm,
    borderRadius: radii.md, borderWidth: 2,
    alignItems: 'center', gap: 8,
  },
  teamSwatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  teamSwatchInner: { width: 14, height: 14, borderRadius: 7 },
  teamShort: { color: colors.text, fontSize: 13, fontWeight: '800', letterSpacing: -0.2, textAlign: 'center', lineHeight: 16 },

  // CTAs — primary and secondary share size/shape so they pair visually
  navRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl, alignItems: 'stretch' },
  cta: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    marginTop: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.primaryGlow,
  },
  ctaText: { color: '#FFF', fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
  secondaryCta: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  secondaryCtaText: { color: colors.text, fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },

  // Character preview
  previewWrap: { alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.md, gap: spacing.sm },
  previewRing: { width: 184, height: 184, borderRadius: 92, borderWidth: 4, alignItems: 'center', justifyContent: 'center', ...shadows.primaryGlow },
  diceBtn: { backgroundColor: colors.card, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.borderStrong },
  diceText: { color: colors.text, fontWeight: '800', fontSize: 13 },

  otherToggle: { marginTop: spacing.xl, alignItems: 'center', padding: spacing.sm },
  otherToggleText: { color: colors.textDim, fontSize: 14, fontWeight: '600' },
  otherRoles: { backgroundColor: colors.card, padding: spacing.md, borderRadius: radii.md, marginTop: spacing.sm, gap: spacing.sm, borderWidth: 1, borderColor: colors.border },
  otherHint: { color: colors.textDim, fontSize: 13, lineHeight: 18, marginBottom: spacing.sm },
  roleBtn: { backgroundColor: colors.cardAlt, paddingVertical: spacing.md, borderRadius: radii.pill, alignItems: 'center', borderWidth: 1, borderColor: colors.borderStrong },
  roleBtnText: { color: colors.text, fontWeight: '700' },
});
