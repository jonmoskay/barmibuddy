import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { storage } from '../storage';
import { Role } from '../types';
import { colors, radii, spacing } from '../theme';

const AVATAR_COLORS = ['#6366F1', '#EC4899', '#22C55E', '#F97316', '#06B6D4', '#A855F7'];

export default function Onboarding({ onDone }: { onDone: (role: Role) => void }) {
  const [username, setUsername] = useState('');
  const [city, setCity] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [showOtherRoles, setShowOtherRoles] = useState(false);

  const submit = async (role: Role = 'student') => {
    if (!username.trim()) return;
    await storage.setRole(role);
    await storage.setProfile({
      username: username.trim(),
      city: city.trim(),
      teamName: '',
      avatarColor,
    });
    onDone(role);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.title}>BarmiBuddy</Text>
      <Text style={styles.subtitle}>Practice your Parsha. Build streaks. Crush it.</Text>

      <Text style={styles.label}>Your name</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="Jeremy"
        placeholderTextColor={colors.textDim}
        autoFocus
      />

      <Text style={styles.label}>City (optional)</Text>
      <TextInput
        style={styles.input}
        value={city}
        onChangeText={setCity}
        placeholder="Melbourne, Australia"
        placeholderTextColor={colors.textDim}
      />

      <Text style={styles.label}>Pick your colour</Text>
      <View style={styles.swatchRow}>
        {AVATAR_COLORS.map(c => (
          <Pressable
            key={c}
            onPress={() => setAvatarColor(c)}
            style={[styles.swatch, { backgroundColor: c }, avatarColor === c && styles.swatchActive]}
          />
        ))}
      </View>

      <Pressable
        onPress={() => submit('student')}
        style={[styles.cta, !username.trim() && { opacity: 0.4 }]}
        disabled={!username.trim()}
      >
        <Text style={styles.ctaText}>Let's go 🚀</Text>
      </Pressable>

      {/* Secondary roles — tucked away for parents / pilot helpers */}
      <Pressable onPress={() => setShowOtherRoles(s => !s)} style={styles.otherToggle}>
        <Text style={styles.otherToggleText}>
          {showOtherRoles ? 'Hide other roles ▲' : 'Parent or pilot helper? ▼'}
        </Text>
      </Pressable>

      {showOtherRoles && (
        <View style={styles.otherRoles}>
          <Text style={styles.otherHint}>
            Read-only view. The student does everything — uploading recordings, practicing, scoring, and sending progress to the teacher.
          </Text>
          <Pressable style={styles.roleBtn} onPress={() => submit('parent')}>
            <Text style={styles.roleBtnText}>Continue as Parent</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 36, fontWeight: '900', marginTop: spacing.xl * 1.5, letterSpacing: -1 },
  subtitle: { color: colors.textDim, fontSize: 16, marginTop: spacing.sm, marginBottom: spacing.xl },
  label: { color: colors.textDim, fontSize: 13, marginTop: spacing.lg, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 1 },
  input: { backgroundColor: colors.card, color: colors.text, padding: spacing.md, borderRadius: radii.md, fontSize: 16 },
  swatchRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  swatch: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: 'transparent' },
  swatchActive: { borderColor: colors.text },
  cta: { backgroundColor: colors.primary, padding: spacing.md + 2, borderRadius: radii.md, marginTop: spacing.xl, alignItems: 'center' },
  ctaText: { color: colors.text, fontSize: 18, fontWeight: '800' },
  otherToggle: { marginTop: spacing.xl, alignItems: 'center', padding: spacing.sm },
  otherToggleText: { color: colors.textDim, fontSize: 14 },
  otherRoles: { backgroundColor: colors.card, padding: spacing.md, borderRadius: radii.md, marginTop: spacing.sm, gap: spacing.sm },
  otherHint: { color: colors.textDim, fontSize: 13, lineHeight: 18, marginBottom: spacing.sm },
  roleBtn: { backgroundColor: colors.cardAlt, padding: spacing.md, borderRadius: radii.sm, alignItems: 'center' },
  roleBtnText: { color: colors.text, fontWeight: '600' },
});
