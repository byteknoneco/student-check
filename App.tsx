import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { AppShell, TabKey } from './src/components/AppShell';
import { demoProfiles } from './src/data/mock';
import { isSupabaseConfigured, supabase } from './src/lib/supabase';
import {
  loadDashboard,
  markAllNotificationsRead,
  markNotificationRead,
  restoreNotification,
  trashAllNotifications,
  trashNotification,
  trashReadNotifications,
} from './src/services/appData';
import { presentLocalNotification, registerPushToken } from './src/services/notifications';
import { getAvatarSignedUrl } from './src/services/profile';
import { AuthScreen } from './src/screens/AuthScreen';
import { FamilyDashboard } from './src/screens/FamilyDashboard';
import { HomeworkScreen, CalendarScreen, ProfileScreen, StudentsScreen } from './src/screens/ListScreens';
import { TeacherDashboard } from './src/screens/TeacherDashboard';
import { InviteScreen } from './src/screens/InviteScreen';
import { TeacherActionModal } from './src/screens/TeacherActionModal';
import { NotificationCenter } from './src/screens/NotificationCenter';
import { StudentDetailScreen } from './src/screens/StudentDetailScreen';
import { MessageCenter } from './src/screens/MessageCenter';
import { GlobalSearch } from './src/screens/GlobalSearch';
import { DashboardData, Profile, TeacherActionRequest, UserRole } from './src/types';
import { theme } from './src/theme';

const emptyData: DashboardData = { students:[],lessons:[],homework:[],homeworkFiles:[],exams:[],packages:[],payments:[],invites:[],notifications:[],topicProgress:[],goals:[],messages:[],messageReads:[],hiddenMessageIds:[],packageInfo:null };

export default function App(){
  const [session,setSession]=useState<Session|null>(null);
  const [authReady,setAuthReady]=useState(!isSupabaseConfigured);
  const [profile,setProfile]=useState<Profile|null>(isSupabaseConfigured?null:demoProfiles.teacher);
  const [avatarUri,setAvatarUri]=useState<string|null>(null);
  const [data,setData]=useState<DashboardData>(emptyData);
  const [tab,setTab]=useState<TabKey>('home');
  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const [inviteRequired,setInviteRequired]=useState(false);
  const [teacherAction,setTeacherAction]=useState<TeacherActionRequest|null>(null);
  const [notificationsOpen,setNotificationsOpen]=useState(false);
  const [messagesOpen,setMessagesOpen]=useState(false);
  const [searchOpen,setSearchOpen]=useState(false);
  const [selectedStudentId,setSelectedStudentId]=useState<string|null>(null);

  useEffect(()=>{
    if(!supabase){setAuthReady(true);setLoading(false);return;}
    let mounted=true;
    supabase.auth.getSession().then(({data:a,error})=>{
      if(!mounted)return;
      if(error) console.warn('Session restore error',error.message);
      setSession(a.session);
      setAuthReady(true);
    });
    const{data:l}=supabase.auth.onAuthStateChange((_event:any,next:Session|null)=>{
      if(!mounted)return;
      setSession(next);
      setAuthReady(true);
    });
    return()=>{mounted=false;l.subscription.unsubscribe();};
  },[]);

  const fetchProfileAndData=useCallback(async(showSpinner=false)=>{
    if(!supabase){if(profile)setData(await loadDashboard(profile.role,profile.id));setLoading(false);return;}
    if(!authReady)return;
    if(!session){setProfile(null);setAvatarUri(null);setData(emptyData);setLoading(false);return;}
    showSpinner?setRefreshing(true):setLoading(true);
    try{
      const{data:p,error}=await supabase.from('profiles').select('id,full_name,role,avatar_url').eq('id',session.user.id).single();
      if(error)throw error;
      const loaded=p as Profile;
      setProfile(loaded);
      setAvatarUri(await getAvatarSignedUrl(loaded.avatar_url));
      const next=await loadDashboard(loaded.role,loaded.id);
      setData(next);
      setInviteRequired(loaded.role!=='teacher'&&next.students.length===0);
    }catch(e:any){Alert.alert('Veri yüklenemedi',e.message??'Bilinmeyen hata');}
    finally{setLoading(false);setRefreshing(false);}
  },[session,authReady,profile?.role]);

  useEffect(()=>{if(authReady)void fetchProfileAndData(false)},[authReady,session,fetchProfileAndData]);
  useEffect(()=>{
    const sb=supabase;
    if(!profile||!sb)return;
    registerPushToken(profile.id).catch(()=>{});
    const channel=sb.channel(`notifications-${profile.id}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:`user_id=eq.${profile.id}`},(payload:any)=>{
      const n=payload.new;
      presentLocalNotification(n?.title??'DersTakip+',n?.body??'Yeni bildirim',n?.data??{});
      void fetchProfileAndData(false);
    }).subscribe();
    return()=>{void sb.removeChannel(channel)};
  },[profile?.id,fetchProfileAndData]);

  const title=useMemo(()=>{if(!profile)return'';if(tab==='home')return profile.role==='teacher'?'Bugünün özeti':profile.role==='parent'?'Çocuğumun özeti':'Bugünkü planım';if(tab==='students')return'Öğrenciler';if(tab==='calendar')return'Ders takvimi';if(tab==='homework')return'Ödev takibi';return'Profil';},[profile,tab]);

  if(isSupabaseConfigured&&!authReady)return <Loading text="Oturum geri yükleniyor..."/>;
  if(isSupabaseConfigured&&authReady&&!session&&!loading)return <AuthScreen/>;
  if(loading||!profile)return <Loading text="DersTakip+ hazırlanıyor..."/>;

  const logout=async()=>{if(supabase)await supabase.auth.signOut();else{setProfile(demoProfiles.teacher);setTab('home')}};
  const switchDemoRole=(role:UserRole)=>{setProfile(demoProfiles[role]);setTab('home')};
  if(inviteRequired&&supabase)return <InviteScreen onDone={()=>{setInviteRequired(false);void fetchProfileAndData(true)}} onLogout={logout}/>;

  const unread=data.notifications.filter(n=>!n.read_at).length;
  const unreadMessages=data.messages.filter(m=>m.sender_id!==profile.id&&!m.deleted_at&&!data.messageReads.some(r=>r.message_id===m.id&&r.user_id===profile.id)).length;
  const selectedStudent=data.students.find(s=>s.id===selectedStudentId)??null;

  return <>
    <AppShell title={title} subtitle={profile.full_name} role={profile.role} activeTab={tab} onTab={setTab} refreshing={refreshing} onRefresh={()=>{void fetchProfileAndData(true)}} notificationCount={unread} messageCount={unreadMessages} onNotifications={()=>setNotificationsOpen(true)} onMessages={()=>setMessagesOpen(true)} onSearch={()=>setSearchOpen(true)} avatarUri={avatarUri}>
      {tab==='home'?(profile.role==='teacher'?<TeacherDashboard data={data} profileId={profile.id} onAction={setTeacherAction} onTab={setTab} onMessages={()=>setMessagesOpen(true)} onNotifications={()=>setNotificationsOpen(true)}/>:<FamilyDashboard data={data} role={profile.role}/>):null}
      {tab==='students'&&profile.role==='teacher'?<StudentsScreen data={data} onAction={setTeacherAction} onSelectStudent={setSelectedStudentId} onChanged={()=>fetchProfileAndData(true)}/>:null}
      {tab==='calendar'?<CalendarScreen data={data} role={profile.role} onAction={profile.role==='teacher'?setTeacherAction:undefined}/>:null}
      {tab==='homework'?<HomeworkScreen data={data} role={profile.role} onAction={profile.role==='teacher'?setTeacherAction:undefined} onChanged={()=>fetchProfileAndData(true)}/>:null}
      {tab==='profile'?<ProfileScreen profile={profile} avatarUri={avatarUri} isDemo={!isSupabaseConfigured} onLogout={logout} onSwitchDemoRole={switchDemoRole} onProfileChanged={()=>fetchProfileAndData(false)}/>:null}
    </AppShell>
    {profile.role==='teacher'?<TeacherActionModal request={teacherAction} data={data} teacherId={profile.id} onClose={()=>setTeacherAction(null)} onChanged={()=>fetchProfileAndData(true)}/>:null}
    <MessageCenter visible={messagesOpen} profile={profile} data={data} onClose={()=>setMessagesOpen(false)} onChanged={()=>fetchProfileAndData(false)}/>
    <NotificationCenter visible={notificationsOpen} notifications={data.notifications} onClose={()=>setNotificationsOpen(false)} onRead={async id=>{await markNotificationRead(id);await fetchProfileAndData(false)}} onReadAll={async()=>{await markAllNotificationsRead();await fetchProfileAndData(false)}} onDelete={async id=>{await trashNotification(id);await fetchProfileAndData(false)}} onRestore={async id=>{await restoreNotification(id);await fetchProfileAndData(false)}} onClearRead={async()=>{await trashReadNotifications();await fetchProfileAndData(false)}} onClearAll={async()=>{await trashAllNotifications();await fetchProfileAndData(false)}}/>
    {profile.role==='teacher'?<StudentDetailScreen student={selectedStudent} data={data} visible={!!selectedStudent} onClose={()=>setSelectedStudentId(null)} onAction={r=>{setSelectedStudentId(null);setTeacherAction(r)}}/>:null}
    <GlobalSearch visible={searchOpen} data={data} role={profile.role} onClose={()=>setSearchOpen(false)} onStudent={id=>setSelectedStudentId(id)} onTab={setTab}/>
  </>;
}

function Loading({text}:{text:string}){return <View style={styles.loading}><ActivityIndicator size="large" color={theme.colors.primary}/><Text style={styles.loadingText}>{text}</Text></View>}
const styles=StyleSheet.create({loading:{flex:1,backgroundColor:theme.colors.background,justifyContent:'center',alignItems:'center',gap:14},loadingText:{color:theme.colors.textMuted,fontWeight:'700'}});
