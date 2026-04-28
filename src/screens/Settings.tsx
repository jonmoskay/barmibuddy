import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ScrollView } from 'react-native';
import { storage } from '../storage';
import { Role } from '../types';
import { colors, radii, spacing } from '../theme';

export default function Settings({ navigation }: any) {
  const switchRole = async (r: Role) => {
    await storage.setRole(r);
    navigation.reset({ index: 0, routes: [{ name: 'Root' }] });
  };

  const reset = () => {
    Alert.alert('Reset everything?', 'Clears profile, lessons, and recordings on this device.', [
      { text: 'Cancel' },
      {
        text: 'Reset', style: 'destructive',
        onPress: async () => {
          await storage.reset();
          navigation.reset({ index: 0, routes: [{ name: 'Root' }] });
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.title}>Settings</Text>

      <Text style={styles.label}>Switch role</Text>
      {(['student', 'parent'] as Role[]).map(r => (
        <Pressable key={r} style={styles.row} onPress={() => switchRole(r)}>
          <Text style={styles.rowText}>{r[0].toUpperCase() + r.slice(1)}</Text>
          <Text style={styles.rowArrow}>→</Text>
        </Pressable>
      ))}

      <Text style={[styles.label, { marginTop: spacing.xl }]}>Danger zone</Text>
      <Pressable style={[styles.row, { borderColor: colors.bad, borderWidth: 1 }]} onPress={reset}>
        <Text style={[styles.rowText, { color: colors.bad }]}>Reset all data</Text>
      </Pressable>

      <Text style={styles.note}>
        Pilot v1 — data is stored locally on this device only. Cloud sync, real student/teacher
        accounts, leaderboards, and BarmiBattle come post-pilot.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: spacing.md, marginBottom: spacing.lg },
  label: { color: colors.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },
  row: { backgroundColor: colors.card, padding: spacing.md, borderRadius: radii.md, marginBottom: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  rowArrow: { color: colors.textDim, fontSize: 18 },
  note: { color: colors.textDim, marginTop: spacing.xl, fontSize: 12, lineHeight: 18 },
});
