import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { AppShell, TabKey } from './src/components/AppShell';
import { demoProfiles } from './src/data/mock';
import { isSupabaseConfigured, supabase } from './src/lib/supabase';
import { loadDashboard, markAllNotificationsRead, markNotificationRead } from './src/services/appData';
import { presentLocalNotification, registerPushToken } from './src/services/notifications';
import { AuthScreen } from './src/screens/AuthScreen';
import { FamilyDashboard } from './src/screens/FamilyDashboard';
import { HomeworkScreen, CalendarScreen, ProfileScreen, StudentsScreen } from './src/screens/ListScreens';
import { TeacherDashboard } from './src/screens/TeacherDashboard';
import { InviteScreen } from './src/screens/InviteScreen';
import { TeacherActionModal } from './src/screens/TeacherActionModal';
import { NotificationCenter } from './src/screens/NotificationCenter';
import { StudentDetailScreen } from './src/screens/StudentDetailScreen';
import { MessageCenter } from './src/screens/MessageCenter';
import { DashboardData, Profile, TeacherActionRequest, UserRole } from './src/types';
import { theme } from './src/theme';

const emptyData: DashboardData = { students:[],lessons:[],homework:[],exams:[],packages:[],payments:[],invites:[],notifications:[],topicProgress:[],goals:[],messages:[],packageInfo:null };

export default function App(){
  const [session,setSession]=useState<Session|null>(null); const [profile,setProfile]=useState<Profile|null>(isSupabaseConfigured?null:demoProfiles.teacher); const [data,setData]=useState<DashboardData>(emptyData);
  const [tab,setTab]=useState<TabKey>('home'); const [loading,setLoading]=useState(true); const [refreshing,setRefreshing]=useState(false); const [inviteRequired,setInviteRequired]=useState(false);
  const [teacherAction,setTeacherAction]=useState<TeacherActionRequest|null>(null); const [notificationsOpen,setNotificationsOpen]=useState(false); const [messagesOpen,setMessagesOpen]=useState(false); const [selectedStudentId,setSelectedStudentId]=useState<string|null>(null);

  useEffect(()=>{if(!supabase){setLoading(false);return;}supabase.auth.getSession().then(({data:a}:any)=>setSession(a.session));const{data:l}=supabase.auth.onAuthStateChange((_e:any,n:Session|null)=>setSession(n));return()=>l.subscription.unsubscribe();},[]);

  const fetchProfileAndData=useCallback(async(showSpinner=false)=>{
    if(!supabase){if(profile)setData(await loadDashboard(profile.role,profile.id));setLoading(false);return;}
    if(!session){setProfile(null);setData(emptyData);setLoading(false);return;}
    showSpinner?setRefreshing(true):setLoading(true);
    try{const{data:p,error}=await supabase.from('profiles').select('id,full_name,role,avatar_url').eq('id',session.user.id).single();if(error)throw error;const loaded=p as Profile;setProfile(loaded);const next=await loadDashboard(loaded.role,loaded.id);setData(next);setInviteRequired(loaded.role!=='teacher'&&next.students.length===0);}catch(e:any){Alert.alert('Veri yuklenemedi',e.message??'Bilinmeyen hata');}finally{setLoading(false);setRefreshing(false);}
  },[session,profile?.role]);

  useEffect(()=>{fetchProfileAndData(false)},[session,fetchProfileAndData]);
  useEffect(()=>{
    const sb=supabase;
    if(!profile||!sb)return;
    registerPushToken(profile.id).catch(()=>{});
    const channel=sb.channel(`notifications-${profile.id}`).on(
      'postgres_changes',
      {event:'INSERT',schema:'public',table:'notifications',filter:`user_id=eq.${profile.id}`},
      (payload:any)=>{
        const n=payload.new;
        presentLocalNotification(n?.title??'DersTakip+',n?.body??'Yeni bildirim',n?.data??{});
        fetchProfileAndData(false);
      }
    ).subscribe();
    return()=>{void sb.removeChannel(channel)};
  },[profile?.id,fetchProfileAndData]);

  const title=useMemo(()=>{if(!profile)return'';if(tab==='home')return profile.role==='teacher'?'Bugunun ozeti':profile.role==='parent'?'Cocugumun ozeti':'Bugunku planim';if(tab==='students')return'Ogrenciler';if(tab==='calendar')return'Ders takvimi';if(tab==='homework')return'Odev takibi';return'Profil';},[profile,tab]);
  if(isSupabaseConfigured&&!session&&!loading)return <AuthScreen/>;
  if(loading||!profile)return <View style={styles.loading}><ActivityIndicator size="large" color={theme.colors.primary}/><Text style={styles.loadingText}>DersTakip+ hazirlaniyor...</Text></View>;
  const logout=async()=>{if(supabase)await supabase.auth.signOut();else{setProfile(demoProfiles.teacher);setTab('home')}};
  const switchDemoRole=(role:UserRole)=>{setProfile(demoProfiles[role]);setTab('home')};
  if(inviteRequired&&supabase)return <InviteScreen onDone={()=>{setInviteRequired(false);fetchProfileAndData(true)}} onLogout={logout}/>;
  const unread=data.notifications.filter(n=>!n.read_at).length; const selectedStudent=data.students.find(s=>s.id===selectedStudentId)??null;

  return <>
    <AppShell title={title} subtitle={profile.full_name} role={profile.role} activeTab={tab} onTab={setTab} refreshing={refreshing} onRefresh={()=>fetchProfileAndData(true)} notificationCount={unread} onNotifications={()=>setNotificationsOpen(true)} onMessages={()=>setMessagesOpen(true)}>
      {tab==='home'?(profile.role==='teacher'?<TeacherDashboard data={data} onAction={setTeacherAction} onTab={setTab}/>:<FamilyDashboard data={data} role={profile.role}/>):null}
      {tab==='students'&&profile.role==='teacher'?<StudentsScreen data={data} onAction={setTeacherAction} onSelectStudent={setSelectedStudentId}/>:null}
      {tab==='calendar'?<CalendarScreen data={data} role={profile.role} onAction={profile.role==='teacher'?setTeacherAction:undefined}/>:null}
      {tab==='homework'?<HomeworkScreen data={data} role={profile.role} onAction={profile.role==='teacher'?setTeacherAction:undefined} onChanged={()=>fetchProfileAndData(true)}/>:null}
      {tab==='profile'?<ProfileScreen role={profile.role} isDemo={!isSupabaseConfigured} onLogout={logout} onSwitchDemoRole={switchDemoRole}/>:null}
    </AppShell>
    {profile.role==='teacher'?<TeacherActionModal request={teacherAction} data={data} teacherId={profile.id} onClose={()=>setTeacherAction(null)} onChanged={()=>fetchProfileAndData(true)}/>:null}
    <MessageCenter visible={messagesOpen} profile={profile} data={data} onClose={()=>setMessagesOpen(false)} onChanged={()=>fetchProfileAndData(false)}/>
    <NotificationCenter visible={notificationsOpen} notifications={data.notifications} onClose={()=>setNotificationsOpen(false)} onRead={async id=>{await markNotificationRead(id);await fetchProfileAndData(false)}} onReadAll={async()=>{await markAllNotificationsRead();await fetchProfileAndData(false)}}/>
    {profile.role==='teacher'?<StudentDetailScreen student={selectedStudent} data={data} visible={!!selectedStudent} onClose={()=>setSelectedStudentId(null)} onAction={r=>{setSelectedStudentId(null);setTeacherAction(r)}}/>:null}
  </>;
}

const styles=StyleSheet.create({loading:{flex:1,backgroundColor:theme.colors.background,justifyContent:'center',alignItems:'center',gap:14},loadingText:{color:theme.colors.textMuted,fontWeight:'700'}});
