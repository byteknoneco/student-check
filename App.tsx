import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { AppShell, TabKey } from './src/components/AppShell';
import { demoProfiles } from './src/data/mock';
import { isSupabaseConfigured, supabase } from './src/lib/supabase';
import { loadDashboard } from './src/services/appData';
import { AuthScreen } from './src/screens/AuthScreen';
import { FamilyDashboard } from './src/screens/FamilyDashboard';
import { HomeworkScreen, CalendarScreen, ProfileScreen, StudentsScreen } from './src/screens/ListScreens';
import { TeacherDashboard } from './src/screens/TeacherDashboard';
import { InviteScreen } from './src/screens/InviteScreen';
import { TeacherActionModal } from './src/screens/TeacherActionModal';
import { DashboardData, Profile, TeacherActionRequest, UserRole } from './src/types';
import { theme } from './src/theme';

const emptyData: DashboardData = {
  students: [],
  lessons: [],
  homework: [],
  exams: [],
  packages: [],
  payments: [],
  invites: [],
  packageInfo: null,
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(isSupabaseConfigured ? null : demoProfiles.teacher);
  const [data, setData] = useState<DashboardData>(emptyData);
  const [tab, setTab] = useState<TabKey>('home');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inviteRequired, setInviteRequired] = useState(false);
  const [teacherAction, setTeacherAction] = useState<TeacherActionRequest | null>(null);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data: authData }: any) => setSession(authData.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event: any, next: Session | null) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);

  const fetchProfileAndData = useCallback(async (showSpinner = false) => {
    if (!supabase) {
      if (profile) setData(await loadDashboard(profile.role, profile.id));
      setLoading(false);
      return;
    }
    if (!session) {
      setProfile(null);
      setData(emptyData);
      setLoading(false);
      return;
    }
    if (showSpinner) setRefreshing(true);
    else setLoading(true);
    try {
      const { data: p, error } = await supabase.from('profiles').select('id,full_name,role,avatar_url').eq('id', session.user.id).single();
      if (error) throw error;
      const loadedProfile = p as Profile;
      setProfile(loadedProfile);
      const loaded = await loadDashboard(loadedProfile.role, loadedProfile.id);
      setData(loaded);
      setInviteRequired(loadedProfile.role !== 'teacher' && loaded.students.length === 0);
    } catch (error: any) {
      Alert.alert('Veri yüklenemedi', error.message ?? 'Bilinmeyen hata');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session, profile?.role]);

  useEffect(() => {
    fetchProfileAndData(false);
  }, [session, fetchProfileAndData]);

  const title = useMemo(() => {
    if (!profile) return '';
    if (tab === 'home') return profile.role === 'teacher' ? 'Günaydın 👋' : profile.role === 'parent' ? 'Çocuğumun özeti' : 'Bugünkü planım';
    if (tab === 'students') return 'Öğrenciler';
    if (tab === 'calendar') return 'Ders takvimi';
    if (tab === 'homework') return 'Ödev takibi';
    return 'Profil';
  }, [profile, tab]);

  if (isSupabaseConfigured && !session && !loading) return <AuthScreen />;
  if (loading || !profile) return <View style={styles.loading}><ActivityIndicator size="large" color={theme.colors.primary} /><Text style={styles.loadingText}>DersTakip+ hazırlanıyor...</Text></View>;

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    else { setProfile(demoProfiles.teacher); setTab('home'); }
  };

  const switchDemoRole = (role: UserRole) => { setProfile(demoProfiles[role]); setTab('home'); };

  if (inviteRequired && supabase) {
    return <InviteScreen onDone={() => { setInviteRequired(false); fetchProfileAndData(true); }} onLogout={logout} />;
  }

  return (
    <>
      <AppShell
        title={title}
        subtitle={profile.full_name}
        role={profile.role}
        activeTab={tab}
        onTab={setTab}
        refreshing={refreshing}
        onRefresh={() => fetchProfileAndData(true)}
      >
        {tab === 'home' ? (
          profile.role === 'teacher'
            ? <TeacherDashboard data={data} onAction={setTeacherAction} onTab={setTab} />
            : <FamilyDashboard data={data} role={profile.role} />
        ) : null}
        {tab === 'students' && profile.role === 'teacher' ? <StudentsScreen data={data} onAction={setTeacherAction} /> : null}
        {tab === 'calendar' ? <CalendarScreen data={data} role={profile.role} onAction={profile.role === 'teacher' ? setTeacherAction : undefined} /> : null}
        {tab === 'homework' ? <HomeworkScreen data={data} role={profile.role} onAction={profile.role === 'teacher' ? setTeacherAction : undefined} onChanged={() => fetchProfileAndData(true)} /> : null}
        {tab === 'profile' ? <ProfileScreen role={profile.role} isDemo={!isSupabaseConfigured} onLogout={logout} onSwitchDemoRole={switchDemoRole} /> : null}
      </AppShell>
      {profile.role === 'teacher' ? (
        <TeacherActionModal
          request={teacherAction}
          data={data}
          teacherId={profile.id}
          onClose={() => setTeacherAction(null)}
          onChanged={() => fetchProfileAndData(true)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', gap: 14 },
  loadingText: { color: theme.colors.textMuted, fontWeight: '700' },
});
