import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Card, Pill, SectionTitle } from '../components/UI';
import { DashboardData, Homework, NotificationPreferences, Profile, TeacherActionRequest, UserRole } from '../types';
import { defaultNotificationPreferences, deleteMyAccount, getNotificationPreferences, saveNotificationPreferences, setStudentArchived } from '../services/appData';
import { pickAndUploadAvatar, removeAvatar } from '../services/profile';
import { HomeworkDetailModal } from './HomeworkDetailModal';
import { theme } from '../theme';

export function StudentsScreen({ data, onAction, onSelectStudent, onChanged }: { data: DashboardData; onAction: (request: TeacherActionRequest) => void; onSelectStudent?: (studentId: string) => void; onChanged?:()=>Promise<void>|void }) {
  const [mode,setMode]=useState<'active'|'archived'>('active');
  const visible=data.students.filter(s=>mode==='active'?s.active:!s.active);
  const changeArchive=(id:string,archived:boolean)=>Alert.alert(archived?'Öğrenciyi arşivle':'Arşivden çıkar',archived?'Geçmiş veriler korunur; öğrenci aktif listeden kaldırılır.':'Öğrenci yeniden aktif listeye alınsın mı?',[{text:'Vazgeç',style:'cancel'},{text:archived?'Arşivle':'Aktifleştir',onPress:async()=>{try{await setStudentArchived(id,archived);await onChanged?.()}catch(e:any){Alert.alert('İşlem yapılamadı',e?.message??'Bilinmeyen hata')}}}]);
  return (
    <View>
      <SectionTitle title="Öğrenciler" action="+ Öğrenci ekle" onPress={() => onAction({ type: 'student' })} />
      <View style={styles.filterRow}><Pressable onPress={()=>setMode('active')} style={[styles.filter,mode==='active'&&styles.filterActive]}><Text style={[styles.filterText,mode==='active'&&styles.filterTextActive]}>Aktif ({data.students.filter(s=>s.active).length})</Text></Pressable><Pressable onPress={()=>setMode('archived')} style={[styles.filter,mode==='archived'&&styles.filterActive]}><Text style={[styles.filterText,mode==='archived'&&styles.filterTextActive]}>Arşiv ({data.students.filter(s=>!s.active).length})</Text></Pressable></View>
      <Card>
        {visible.length ? visible.map((s, i) => {
          const pack = data.packages.find((p) => p.student_id === s.id && p.active);
          return (
            <Pressable key={s.id} onPress={() => onSelectStudent?.(s.id)} onLongPress={()=>changeArchive(s.id,s.active)} style={[styles.row, i > 0 && styles.border]}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{s.full_name.charAt(0)}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{s.full_name}</Text>
                <Text style={styles.meta}>{s.grade_level ?? '—'} · {s.school ?? '—'}</Text>
                <Text style={styles.meta}>{pack ? `${pack.remaining_lessons}/${pack.total_lessons} ders kaldı` : 'Aktif paket yok'}</Text>
                <Text style={styles.tapHint}>Basılı tut → {s.active?'arşivle':'aktifleştir'}</Text>
              </View>
              <Pill tone={s.active ? 'success' : 'neutral'}>{s.active ? 'Aktif' : 'Arşiv'}</Pill>
            </Pressable>
          );
        }) : <Empty text={mode==='active'?'Henüz aktif öğrenci yok.':'Arşivde öğrenci yok.'} />}
      </Card>
      <View style={styles.inlineActions}>
        <Pressable onPress={() => onAction({ type: 'package' })} style={styles.smallAction}><Text style={styles.smallActionText}>▣ Paket tanımla</Text></Pressable>
        <Pressable onPress={() => onAction({ type: 'invite' })} style={styles.smallAction}><Text style={styles.smallActionText}>↗ Davet kodu</Text></Pressable>
      </View>
    </View>
  );
}

export function CalendarScreen({ data, role, onAction }: { data: DashboardData; role: UserRole; onAction?: (request: TeacherActionRequest) => void }) {
  const [scope,setScope]=useState<'today'|'week'|'all'>('week');
  const now=new Date(); const end=new Date(now);end.setDate(end.getDate()+7);
  const sorted = useMemo(()=>[...data.lessons].filter(l=>{
    const d=new Date(l.starts_at);
    if(scope==='today')return d.toDateString()===now.toDateString();
    if(scope==='week')return d>=new Date(now.getFullYear(),now.getMonth(),now.getDate())&&d<=end;
    return true;
  }).sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at)),[data.lessons,scope]);
  return (
    <View>
      <SectionTitle title="Ders takvimi" action={role === 'teacher' ? '+ Ders planla' : undefined} onPress={() => onAction?.({ type: 'lesson' })} />
      <View style={styles.filterRow}>{([['today','Bugün'],['week','7 gün'],['all','Tümü']] as const).map(([key,label])=><Pressable key={key} onPress={()=>setScope(key)} style={[styles.filter,scope===key&&styles.filterActive]}><Text style={[styles.filterText,scope===key&&styles.filterTextActive]}>{label}</Text></Pressable>)}</View>
      <Card>
        {sorted.length ? sorted.map((l, i) => (
          <Pressable key={l.id} disabled={role !== 'teacher' || l.status === 'completed' || l.status === 'cancelled'} onPress={() => onAction?.({ type: 'completeLesson', lesson: l })} onLongPress={() => onAction?.({ type: 'lessonManage', lesson: l })} style={[styles.row, i > 0 && styles.border]}>
            <View style={styles.dateBox}><Text style={styles.dateDay}>{new Date(l.starts_at).getDate()}</Text><Text style={styles.dateMon}>{new Date(l.starts_at).toLocaleDateString('tr-TR', { month: 'short' })}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{role === 'teacher' ? `${l.student_name} · ` : ''}{l.subject_name}</Text>
              <Text style={styles.meta}>{new Date(l.starts_at).toLocaleString('tr-TR', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}</Text>
              <Text style={styles.meta}>{l.topic ?? 'Konu girilmedi'}</Text>
              {role === 'teacher' && l.status === 'planned' ? <Text style={styles.tapHint}>Dokun: rapor · Basılı tut: iptal/ertele</Text> : null}
            </View>
            <Pill tone={l.status === 'completed' ? 'success' : l.status === 'cancelled' ? 'danger' : 'primary'}>{l.status === 'completed' ? 'Tamamlandı' : l.status === 'cancelled' ? 'İptal' : 'Planlandı'}</Pill>
          </Pressable>
        )) : <Empty text="Bu aralıkta ders yok." />}
      </Card>
    </View>
  );
}

export function HomeworkScreen({ data, role, onAction, onChanged }: { data: DashboardData; role: UserRole; onAction?: (request: TeacherActionRequest) => void; onChanged?: () => Promise<void> | void }) {
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  return (
    <View>
      <SectionTitle title="Ödevler" action={role === 'teacher' ? '+ Ödev ver' : undefined} onPress={() => onAction?.({ type: 'homework' })} />
      <Card>
        {data.homework.length ? data.homework.map((h, i) => {
          const overdue = h.status === 'assigned' && +new Date(h.due_at) < Date.now();
          const files = data.homeworkFiles.filter((file) => file.homework_id === h.id);
          const assignmentCount = files.filter((file) => file.kind === 'assignment').length;
          const submissionCount = files.filter((file) => file.kind === 'submission').length;
          return (
            <Pressable key={h.id} onPress={() => setSelectedHomework(h)} style={[styles.row, i > 0 && styles.border]}>
              <View style={styles.check}><Text style={{ fontWeight: '900', color: overdue ? theme.colors.danger : theme.colors.primary }}>{h.status === 'reviewed' ? '✓' : overdue ? '!' : '•'}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{h.title}</Text>
                <Text style={styles.meta}>{role === 'teacher' ? `${h.student_name} · ` : ''}{h.subject_name}</Text>
                <Text style={[styles.meta, overdue && { color: theme.colors.danger }]}>Son tarih: {new Date(h.due_at).toLocaleDateString('tr-TR')}{overdue ? ' · Gecikti' : ''}</Text>
                {assignmentCount || submissionCount ? <Text style={styles.tapHint}>📎 {assignmentCount} materyal · {submissionCount} teslim dosyası</Text> : <Text style={styles.tapHint}>Dokun → ödev detayı</Text>}
              </View>
              <Pill tone={h.status === 'reviewed' ? 'success' : h.status === 'submitted' ? 'warning' : overdue ? 'danger' : 'primary'}>{h.status === 'reviewed' ? 'Tamam' : h.status === 'submitted' ? 'Gönderildi' : 'Bekliyor'}</Pill>
            </Pressable>
          );
        }) : <Empty text="Ödev kaydı yok." />}
      </Card>
      <HomeworkDetailModal homework={selectedHomework} data={data} role={role} onClose={() => setSelectedHomework(null)} onAction={onAction} onChanged={onChanged}/>
    </View>
  );
}

export function ProfileScreen({ profile, avatarUri, isDemo, onLogout, onSwitchDemoRole, onProfileChanged }: { profile:Profile; avatarUri?:string|null; isDemo:boolean; onLogout:()=>void; onSwitchDemoRole?:(role:UserRole)=>void; onProfileChanged?:()=>Promise<void>|void }) {
  const [prefs,setPrefs]=useState<NotificationPreferences>(defaultNotificationPreferences); const [prefsBusy,setPrefsBusy]=useState(false); const [avatarBusy,setAvatarBusy]=useState(false);
  useEffect(()=>{if(!isDemo)getNotificationPreferences().then(setPrefs).catch(()=>undefined)},[isDemo]);
  const changePref=async(key:keyof NotificationPreferences,value:boolean)=>{const next={...prefs,[key]:value};setPrefs(next);try{setPrefsBusy(true);await saveNotificationPreferences(next)}catch(e:any){Alert.alert('Kaydedilemedi',e?.message??'Bildirim tercihi kaydedilemedi.');setPrefs(prefs)}finally{setPrefsBusy(false)}};
  const avatarAction=async()=>{if(isDemo)return;try{setAvatarBusy(true);await pickAndUploadAvatar(profile.id);await onProfileChanged?.()}catch(e:any){Alert.alert('Fotoğraf yüklenemedi',e?.message??'Bilinmeyen hata')}finally{setAvatarBusy(false)}};
  const removeAvatarAction=()=>Alert.alert('Profil fotoğrafını kaldır','Fotoğraf kaldırılsın mı?',[{text:'Vazgeç',style:'cancel'},{text:'Kaldır',style:'destructive',onPress:async()=>{try{await removeAvatar(profile.id,profile.avatar_url);await onProfileChanged?.()}catch(e:any){Alert.alert('Kaldırılamadı',e?.message??'Bilinmeyen hata')}}}]);
  const role=profile.role;
  return <View>
    <SectionTitle title="Hesap ve ayarlar" />
    <Card>
      <View style={styles.profileHeader}>{avatarUri?<Image source={{uri:avatarUri}} style={styles.profileImage}/>:<View style={styles.profileAvatar}><Text style={styles.profileLetter}>{profile.full_name.charAt(0).toUpperCase()}</Text></View>}<View style={{flex:1}}><Text style={styles.title}>{profile.full_name}</Text><Text style={styles.meta}>{role==='teacher'?'Öğretmen':role==='parent'?'Veli':'Öğrenci'} hesabı</Text></View>{!isDemo?<Pressable onPress={avatarAction} disabled={avatarBusy} style={styles.photoButton}><Text style={styles.photoText}>{avatarBusy?'...':'Fotoğraf'}</Text></Pressable>:null}</View>
      {!isDemo&&avatarUri?<Pressable onPress={removeAvatarAction}><Text style={styles.removePhoto}>Profil fotoğrafını kaldır</Text></Pressable>:null}
      {!isDemo ? <View style={styles.infoBox}><Text style={styles.infoTitle}>Oturum hatırlama aktif</Text><Text style={styles.meta}>Uygulamayı normal şekilde kapatıp açtığında oturum cihazda korunur. Çıkış yaparsan veya uygulamayı kaldırırsan yeniden giriş gerekir.</Text></View> : null}
      {!isDemo?<View style={styles.settingsBox}><Text style={styles.demoTitle}>Bildirim tercihleri</Text>{([
        ['homework','Ödevler'],['lessons','Dersler'],['messages','Mesajlar'],['exams','Sınav sonuçları'],['finance','Paket / ödeme'],['general','Diğer bildirimler']
      ] as [keyof NotificationPreferences,string][]).map(([key,label])=><View key={key} style={styles.settingRow}><Text style={styles.settingLabel}>{label}</Text><Switch value={prefs[key]} onValueChange={v=>{void changePref(key,v)}} disabled={prefsBusy} trackColor={{false:'#D6DAE4',true:'#BFC1FF'}} thumbColor={prefs[key]?theme.colors.primary:'#FFFFFF'}/></View>)}</View>:null}
      {isDemo ? <View style={styles.demoBox}><Text style={styles.demoTitle}>Rolleri önizle</Text><View style={styles.roleRow}>{(['teacher','parent','student'] as UserRole[]).map(r => <Pressable key={r} onPress={() => onSwitchDemoRole?.(r)} style={[styles.roleButton, role === r && styles.roleButtonActive]}><Text style={[styles.roleButtonText, role === r && styles.roleButtonTextActive]}>{r === 'teacher' ? 'Öğretmen' : r === 'parent' ? 'Veli' : 'Öğrenci'}</Text></Pressable>)}</View></View> : null}
      <Text style={styles.version}>DersTakip+ v0.4</Text>
      <Pressable style={styles.logoutButton} onPress={onLogout}><Text style={styles.logoutText}>{isDemo ? 'Demo başlangıcına dön' : 'Çıkış yap'}</Text></Pressable>
      {!isDemo ? <Pressable style={styles.deleteButton} onPress={() => Alert.alert('Hesabı sil', 'Bu işlem hesabını ve bağlı verilerini kalıcı olarak siler. Devam edilsin mi?', [{ text: 'Vazgeç', style: 'cancel' }, { text: 'Hesabı sil', style: 'destructive', onPress: async () => { try { await deleteMyAccount(); await onLogout(); } catch (error: any) { Alert.alert('Silinemedi', error?.message ?? 'Hesap silinemedi.'); } } }])}><Text style={styles.deleteText}>Hesabımı kalıcı olarak sil</Text></Pressable> : null}
    </Card>
  </View>;
}

function Empty({ text }: { text: string }) { return <View style={styles.emptyBox}><Text style={styles.empty}>{text}</Text></View>; }

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }, border: { borderTopWidth: 1, borderTopColor: theme.colors.border },
  filterRow:{flexDirection:'row',gap:8,marginBottom:12},filter:{paddingHorizontal:13,paddingVertical:9,borderRadius:12,backgroundColor:'white',borderWidth:1,borderColor:theme.colors.border},filterActive:{backgroundColor:theme.colors.primary,borderColor:theme.colors.primary},filterText:{color:theme.colors.textMuted,fontWeight:'800',fontSize:10},filterTextActive:{color:'white'},
  avatar: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#EEF0FF', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: theme.colors.primary, fontWeight: '900' },
  title: { color: theme.colors.text, fontWeight: '900', fontSize: 13 }, meta: { color: theme.colors.textMuted, marginTop: 4, fontSize: 10.5 }, tapHint: { color: theme.colors.primary, fontSize: 10, fontWeight: '800', marginTop: 5 },
  dateBox: { width: 46, height: 50, borderRadius: 13, backgroundColor: '#242946', alignItems: 'center', justifyContent: 'center' }, dateDay: { color: 'white', fontWeight: '900', fontSize: 17 }, dateMon: { color: '#BFC5DA', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  check: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#EEF0FF', alignItems: 'center', justifyContent: 'center' }, emptyBox: { paddingVertical: 16, alignItems: 'center' }, empty: { color: theme.colors.textMuted },
  inlineActions: { flexDirection: 'row', gap: 10, marginTop: 12 }, smallAction: { flex: 1, backgroundColor: 'white', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, paddingVertical: 13, alignItems: 'center' }, smallActionText: { color: theme.colors.primary, fontWeight: '900', fontSize: 11 },
  profileHeader: { flexDirection: 'row', gap: 14, alignItems: 'center' }, profileAvatar: { width: 58, height: 58, borderRadius: 18, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' }, profileLetter: { color: 'white', fontWeight: '900', fontSize: 20 },profileImage:{width:58,height:58,borderRadius:18,backgroundColor:'#ECEEF5'},photoButton:{paddingHorizontal:12,paddingVertical:9,borderRadius:11,backgroundColor:'#EEF0FF'},photoText:{color:theme.colors.primary,fontWeight:'900',fontSize:10},removePhoto:{color:theme.colors.textMuted,fontSize:9,textDecorationLine:'underline',marginTop:8,marginLeft:72},
  infoBox: { marginTop: 20, backgroundColor: theme.colors.successSoft, borderRadius: 14, padding: 14 }, infoTitle: { color: theme.colors.success, fontWeight: '900', fontSize: 12 }, settingsBox:{marginTop:18,paddingTop:16,borderTopWidth:1,borderTopColor:theme.colors.border},settingRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:9},settingLabel:{color:theme.colors.text,fontWeight:'700',fontSize:11},
  demoBox: { marginTop: 22, paddingTop: 18, borderTopWidth: 1, borderTopColor: theme.colors.border }, demoTitle: { fontWeight: '900', color: theme.colors.text, marginBottom: 10 }, roleRow: { flexDirection: 'row', gap: 8 }, roleButton: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, paddingVertical: 11, alignItems: 'center' }, roleButtonActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }, roleButtonText: { color: theme.colors.textMuted, fontWeight: '800', fontSize: 11 }, roleButtonTextActive: { color: 'white' },
  version:{color:'#A0A6B8',fontSize:9,textAlign:'center',marginTop:20},logoutButton: { marginTop: 12, borderWidth: 1, borderColor: '#F2C7CD', backgroundColor: '#FFF6F7', padding: 14, borderRadius: 14, alignItems: 'center' }, logoutText: { color: theme.colors.danger, fontWeight: '900' }, deleteButton: { marginTop: 10, padding: 12, borderRadius: 12, alignItems: 'center' }, deleteText: { color: theme.colors.textMuted, fontWeight: '800', fontSize: 11, textDecorationLine: 'underline' },
});
