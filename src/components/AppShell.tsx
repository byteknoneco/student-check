import React, { ReactNode } from 'react';
import { Platform, Pressable, SafeAreaView, ScrollView, StatusBar as RNStatusBar, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../theme';
import { UserRole } from '../types';

export type TabKey = 'home' | 'students' | 'calendar' | 'homework' | 'profile';

const tabLabels: Record<TabKey, { label: string; icon: string }> = {
  home: { label: 'Ana Sayfa', icon: '⌂' },
  students: { label: 'Öğrenciler', icon: '◉' },
  calendar: { label: 'Takvim', icon: '▣' },
  homework: { label: 'Ödevler', icon: '✓' },
  profile: { label: 'Profil', icon: '●' },
};

export function AppShell({
  children,
  title,
  subtitle,
  role,
  activeTab,
  onTab,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  role: UserRole;
  activeTab: TabKey;
  onTab: (tab: TabKey) => void;
}) {
  const tabs: TabKey[] = role === 'teacher'
    ? ['home', 'students', 'calendar', 'homework', 'profile']
    : ['home', 'calendar', 'homework', 'profile'];
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.topbar}>
        <View>
          <Text style={styles.brand}>DersTakip<Text style={{ color: theme.colors.secondary }}>+</Text></Text>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <View style={styles.avatar}><Text style={styles.avatarText}>{role === 'teacher' ? 'Ö' : role === 'parent' ? 'V' : 'A'}</Text></View>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {children}
        <View style={{ height: 100 }} />
      </ScrollView>
      <View style={styles.bottomNav}>
        {tabs.map((tab) => {
          const active = tab === activeTab;
          return (
            <Pressable key={tab} onPress={() => onTab(tab)} style={styles.tab}>
              <Text style={[styles.tabIcon, active && styles.tabActive]}>{tabLabels[tab].icon}</Text>
              <Text style={[styles.tabText, active && styles.tabActive]}>{tabLabels[tab].label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const topPad = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 0) + 8 : 8;
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  topbar: { paddingTop: topPad, paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.colors.background },
  brand: { color: theme.colors.text, fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
  title: { color: theme.colors.text, fontWeight: '900', fontSize: 25, marginTop: 5 },
  subtitle: { color: theme.colors.textMuted, marginTop: 4, fontSize: 12 },
  avatar: { width: 44, height: 44, borderRadius: 15, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', ...theme.shadow },
  avatarText: { color: 'white', fontWeight: '900', fontSize: 17 },
  content: { paddingHorizontal: 18, paddingTop: 6, gap: 16 },
  bottomNav: { position: 'absolute', bottom: 12, left: 12, right: 12, backgroundColor: theme.colors.nav, borderRadius: 22, flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 6, ...theme.shadow },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  tabIcon: { color: '#9096AA', fontSize: 20, fontWeight: '800' },
  tabText: { color: '#9096AA', fontSize: 9, fontWeight: '700' },
  tabActive: { color: '#FFFFFF' },
});
