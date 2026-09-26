import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <Pressable onPress={onPress}><Text style={styles.sectionAction}>{action}</Text></Pressable> : null}
    </View>
  );
}

export function StatCard({ label, value, hint, tone = 'primary' }: { label: string; value: string; hint?: string; tone?: 'primary' | 'success' | 'warning' | 'danger' }) {
  const toneMap = {
    primary: { bg: '#EEF0FF', fg: theme.colors.primary },
    success: { bg: theme.colors.successSoft, fg: theme.colors.success },
    warning: { bg: theme.colors.warningSoft, fg: '#C57D00' },
    danger: { bg: theme.colors.dangerSoft, fg: theme.colors.danger },
  };
  const c = toneMap[tone];
  return (
    <View style={[styles.statCard, { backgroundColor: c.bg }]}> 
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: c.fg }]}>{value}</Text>
      {hint ? <Text style={styles.statHint}>{hint}</Text> : null}
    </View>
  );
}

export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'primary' | 'danger' }) {
  const colors = {
    neutral: ['#F1F3F8', '#687089'],
    success: [theme.colors.successSoft, theme.colors.success],
    warning: [theme.colors.warningSoft, '#B36A00'],
    primary: ['#EEF0FF', theme.colors.primary],
    danger: [theme.colors.dangerSoft, theme.colors.danger],
  } as const;
  return <View style={[styles.pill, { backgroundColor: colors[tone][0] }]}><Text style={[styles.pillText, { color: colors[tone][1] }]}>{children}</Text></View>;
}

export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${pct}%` }]} /></View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 16, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadow },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  sectionAction: { color: theme.colors.primary, fontWeight: '700' },
  statCard: { minWidth: 148, flex: 1, borderRadius: theme.radius.md, padding: 14, minHeight: 110, justifyContent: 'space-between' },
  statLabel: { color: theme.colors.textMuted, fontWeight: '700', fontSize: 12 },
  statValue: { fontSize: 28, fontWeight: '900', marginVertical: 4 },
  statHint: { color: theme.colors.textMuted, fontSize: 11 },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: '800' },
  progressTrack: { height: 8, backgroundColor: '#ECEFF6', borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 99 },
});
