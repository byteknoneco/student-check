import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Pill, SectionTitle, StatCard } from '../components/UI';
import { DashboardData, TeacherActionRequest } from '../types';
import { theme } from '../theme';
import { TabKey } from '../components/AppShell';

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();
const isThisMonth = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
};

export function TeacherDashboard({
  data,
  profileId,
  onAction,
  onTab,
  onMessages,
  onNotifications,
}: {
  data: DashboardData;
  profileId: string;
  onAction: (request: TeacherActionRequest) => void;
  onTab: (tab: TabKey) => void;
  onMessages: () => void;
  onNotifications: () => void;
}) {
  const now = Date.now();
  const activeStudents=data.students.filter(s=>s.active);
  const submittedHomework=data.homework.filter(h=>h.status==='submitted');
  const unreadNotifications=data.notifications.filter(n=>!n.read_at);
  const unreadMessages=data.messages.filter(m=>m.sender_id!==profileId&&!m.deleted_at&&!data.messageReads.some(r=>r.message_id===m.id&&r.user_id===profileId));
  const todayLessons = data.lessons.filter((l) => isToday(l.starts_at) && l.status !== 'cancelled');
  const waitingHomework = data.homework.filter((h) => h.status !== 'reviewed');
  const completed = data.lessons.filter((l) => l.status === 'completed').length;
  const overdueHomework = data.homework.filter((h) => h.status === 'assigned' && +new Date(h.due_at) < now);
  const missingReports = data.lessons.filter((l) => l.status === 'planned' && +new Date(l.starts_at) < now);
  const lowPackages = data.packages.filter((p) => p.active && p.remaining_lessons <= 2);
  const monthPayments = data.payments.filter((p) => isThisMonth(p.paid_at)).reduce((sum, p) => sum + p.amount, 0);
  const staleExamStudents = activeStudents.filter((student) => {
    const exams = data.exams.filter((e) => e.student_id === student.id);
    if (!exams.length) return true;
    const latest = Math.max(...exams.map((e) => +new Date(e.exam_date)));
    return now - latest > 30 * 24 * 60 * 60 * 1000;
  });
  const decliningStudents = activeStudents.filter((student) => {
    const exams = data.exams.filter((e) => e.student_id === student.id).sort((a,b) => +new Date(a.exam_date)-+new Date(b.exam_date)).slice(-3);
    if (exams.length < 3) return false;
    const pct = exams.map((e) => e.score / e.max_score);
    const [first, second, third] = pct;
    return first !== undefined && second !== undefined && third !== undefined
      && first > second && second > third;
  });

  const quickActions: { label: string; request: TeacherActionRequest }[] = [
    { label: '＋ Yeni ders', request: { type: 'lesson' } },
    { label: '✓ Ödev ver', request: { type: 'homework' } },
    { label: '★ Sınav sonucu', request: { type: 'exam' } },
    { label: '₺ Ödeme kaydı', request: { type: 'payment' } },
    { label: '▣ Ders paketi', request: { type: 'package' } },
    { label: '↗ Davet kodu', request: { type: 'invite' } },
    { label: '+ Konu gelisimi', request: { type: 'topicProgress' } },
    { label: '+ Calisma hedefi', request: { type: 'goal' } },
  ];

  return (
    <>
      <View style={styles.hero}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroEyebrow}>BUGÜN</Text>
          <Text style={styles.heroTitle}>{todayLessons.length} ders planlandı</Text>
          <Text style={styles.heroText}>Ders sonu raporunu kaydettiğinde veli ve öğrenci tarafı otomatik güncellenir.</Text>
        </View>
        <View style={styles.heroBadge}><Text style={styles.heroBadgeTop}>{new Date().getDate()}</Text><Text style={styles.heroBadgeBottom}>{new Date().toLocaleDateString('tr-TR', { month: 'short' })}</Text></View>
      </View>

      <View style={styles.grid}>
        <StatCard label="Aktif öğrenci" value={String(activeStudents.length)} hint="Bu dönem" tone="primary" />
        <StatCard label="Tamamlanan ders" value={String(completed)} hint="Kayıtlı dersler" tone="success" />
      </View>
      <View style={styles.grid}>
        <StatCard label="Bekleyen ödev" value={String(waitingHomework.length)} hint="Takip gerekiyor" tone="warning" />
        <StatCard label="Bu ay tahsilat" value={`${Math.round(monthPayments).toLocaleString('tr-TR')} ₺`} hint="Kayıtlı ödemeler" tone="danger" />
      </View>

      <View>
        <SectionTitle title="Bugünün işleri" />
        <Card>
          <TaskRow count={submittedHomework.length} title="Değerlendirme bekleyen ödev" onPress={()=>onTab('homework')}/>
          <TaskRow count={unreadMessages.length} title="Okunmamış mesaj" onPress={onMessages} border/>
          <TaskRow count={unreadNotifications.length} title="Okunmamış bildirim" onPress={onNotifications} border/>
          <TaskRow count={missingReports.length} title="Raporu kapanmamış geçmiş ders" onPress={()=>onTab('calendar')} border/>
        </Card>
      </View>

      <View>
        <SectionTitle title="Dikkat merkezi" />
        <Card>
          <InsightRow icon="!" tone="danger" title={`${missingReports.length} raporu bekleyen geçmiş ders`} text="Tarihi geçmiş ama tamamlanmamış dersleri kapat." />
          <InsightRow icon="↯" tone="warning" title={`${overdueHomework.length} geciken ödev`} text="Son tarihi geçmiş ve henüz gönderilmemiş ödevler." border />
          <InsightRow icon="▣" tone="primary" title={`${lowPackages.length} azalan paket`} text="2 veya daha az dersi kalan aktif paketler." border />
          <InsightRow icon="30" tone="warning" title={`${staleExamStudents.length} sinav takibi gereken ogrenci`} text="Son 30 gunde sinav sonucu olmayan ogrenciler." border />
          <InsightRow icon="v" tone="danger" title={`${decliningStudents.length} dusen sinav trendi`} text="Son 3 sonucu arka arkaya dusen ogrenciler." border />
        </Card>
      </View>

      <View>
        <SectionTitle title="Bugünkü dersler" action="Takvime git" onPress={() => onTab('calendar')} />
        <Card>
          {todayLessons.length ? todayLessons.map((lesson, index) => (
            <Pressable
              key={lesson.id}
              onPress={() => lesson.status !== 'completed' && onAction({ type: 'completeLesson', lesson })}
              style={[styles.lessonRow, index > 0 && styles.rowBorder]}
            >
              <View style={styles.timeBox}><Text style={styles.timeText}>{formatTime(lesson.starts_at)}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.studentName}>{lesson.student_name}</Text>
                <Text style={styles.muted}>{lesson.subject_name} · {lesson.topic ?? 'Konu girilmedi'}</Text>
                {lesson.status !== 'completed' ? <Text style={styles.reportHint}>Dokun → ders sonu raporu</Text> : null}
              </View>
              <Pill tone={lesson.status === 'completed' ? 'success' : 'primary'}>{lesson.status === 'completed' ? 'Tamam' : `${lesson.duration_minutes} dk`}</Pill>
            </Pressable>
          )) : <Text style={styles.empty}>Bugün için planlanmış ders yok.</Text>}
        </Card>
      </View>

      <View>
        <SectionTitle title="Son hareketler" />
        <Card>
          {buildActivity(data).slice(0,6).map((a,i)=><View key={a.key} style={[styles.activityRow,i>0&&styles.rowBorder]}><View style={styles.activityDot}/><View style={{flex:1}}><Text style={styles.activityTitle}>{a.title}</Text><Text style={styles.muted}>{a.meta}</Text></View><Text style={styles.activityTime}>{a.time}</Text></View>)}
          {!buildActivity(data).length?<Text style={styles.empty}>Henüz hareket yok.</Text>:null}
        </Card>
      </View>

      <View>
        <SectionTitle title="Hızlı işlemler" />
        <View style={styles.actions}>
          {quickActions.map((item) => <Pressable key={item.label} onPress={() => onAction(item.request)} style={styles.action}><Text style={styles.actionText}>{item.label}</Text></Pressable>)}
        </View>
      </View>

      <View>
        <SectionTitle title="Öğrenci özeti" action="Tümünü gör" onPress={() => onTab('students')} />
        <Card>
          {activeStudents.length ? activeStudents.slice(0, 4).map((s, i) => {
            const activePackage = data.packages.find((p) => p.student_id === s.id && p.active);
            return (
              <View key={s.id} style={[styles.studentRow, i > 0 && styles.rowBorder]}>
                <View style={styles.studentAvatar}><Text style={styles.studentAvatarText}>{s.full_name.charAt(0)}</Text></View>
                <View style={{ flex: 1 }}><Text style={styles.studentName}>{s.full_name}</Text><Text style={styles.muted}>{s.grade_level ?? 'Sınıf bilgisi yok'} · {activePackage ? `${activePackage.remaining_lessons} ders kaldı` : 'Paket yok'}</Text></View>
                <Text style={styles.chev}>›</Text>
              </View>
            );
          }) : <View style={styles.emptyState}><Text style={styles.emptyTitle}>Henüz öğrenci yok</Text><Text style={styles.empty}>İlk öğrencini ekleyerek gerçek takibe başlayabilirsin.</Text><Pressable onPress={() => onAction({ type: 'student' })} style={styles.addFirst}><Text style={styles.addFirstText}>+ İlk öğrenciyi ekle</Text></Pressable></View>}
        </Card>
      </View>
    </>
  );
}

function TaskRow({count,title,onPress,border=false}:{count:number;title:string;onPress:()=>void;border?:boolean}){return <Pressable onPress={onPress} style={[styles.taskRow,border&&styles.rowBorder]}><View style={[styles.taskCount,count>0&&styles.taskCountActive]}><Text style={[styles.taskCountText,count>0&&styles.taskCountTextActive]}>{count}</Text></View><Text style={styles.taskTitle}>{title}</Text><Text style={styles.chev}>›</Text></Pressable>}

function buildActivity(data:DashboardData){
  const rows:{key:string;title:string;meta:string;at:number;time:string}[]=[];
  for(const h of data.homework){const at=h.reviewed_at?+new Date(h.reviewed_at):h.submitted_at?+new Date(h.submitted_at):0;if(at)rows.push({key:`h-${h.id}-${at}`,title:h.reviewed_at?`Ödev değerlendirildi · ${h.student_name}`:`Ödev gönderildi · ${h.student_name}`,meta:h.title,at,time:new Date(at).toLocaleDateString('tr-TR',{day:'2-digit',month:'short'})});}
  for(const l of data.lessons.filter(x=>x.status==='completed')){const at=+new Date(l.starts_at);rows.push({key:`l-${l.id}`,title:`Ders tamamlandı · ${l.student_name}`,meta:`${l.subject_name} · ${l.topic??'Konu yok'}`,at,time:new Date(at).toLocaleDateString('tr-TR',{day:'2-digit',month:'short'})});}
  for(const e of data.exams){const at=+new Date(e.exam_date);rows.push({key:`e-${e.id}`,title:`Sınav sonucu · ${e.student_name}`,meta:`${e.title} · %${Math.round(e.score/e.max_score*100)}`,at,time:new Date(at).toLocaleDateString('tr-TR',{day:'2-digit',month:'short'})});}
  for(const p of data.payments){const at=+new Date(p.paid_at);rows.push({key:`p-${p.id}`,title:`Ödeme kaydı · ${p.student_name}`,meta:`${Math.round(p.amount).toLocaleString('tr-TR')} ₺`,at,time:new Date(at).toLocaleDateString('tr-TR',{day:'2-digit',month:'short'})});}
  return rows.sort((a,b)=>b.at-a.at);
}

function InsightRow({ icon, title, text, tone, border = false }: { icon: string; title: string; text: string; tone: 'danger' | 'warning' | 'primary'; border?: boolean }) {
  const tones = {
    danger: [theme.colors.dangerSoft, theme.colors.danger],
    warning: [theme.colors.warningSoft, '#B36A00'],
    primary: ['#EEF0FF', theme.colors.primary],
  } as const;
  return (
    <View style={[styles.insightRow, border && styles.rowBorder]}>
      <View style={[styles.insightIcon, { backgroundColor: tones[tone][0] }]}><Text style={[styles.insightIconText, { color: tones[tone][1] }]}>{icon}</Text></View>
      <View style={{ flex: 1 }}><Text style={styles.insightTitle}>{title}</Text><Text style={styles.muted}>{text}</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: '#232846', borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', ...theme.shadow },
  heroEyebrow: { color: '#AEB6D7', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { color: 'white', fontWeight: '900', fontSize: 23, marginTop: 5 },
  heroText: { color: '#BFC5DA', fontSize: 12, lineHeight: 18, marginTop: 8, maxWidth: 250 },
  heroBadge: { width: 68, height: 68, borderRadius: 20, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  heroBadgeTop: { color: 'white', fontWeight: '900', fontSize: 24 },
  heroBadgeBottom: { color: '#E8E8FF', fontWeight: '800', fontSize: 11, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', gap: 12 },
  lessonRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  rowBorder: { borderTopWidth: 1, borderTopColor: theme.colors.border },
  timeBox: { width: 55, backgroundColor: '#F2F4FA', borderRadius: 12, paddingVertical: 9, alignItems: 'center' },
  timeText: { fontWeight: '900', color: theme.colors.text },
  studentName: { fontWeight: '900', color: theme.colors.text, fontSize: 14 },
  muted: { color: theme.colors.textMuted, fontSize: 11, marginTop: 4 },
  reportHint: { color: theme.colors.primary, fontSize: 10, fontWeight: '800', marginTop: 5 },
  empty: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 18 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  action: { width: '48%', minHeight: 62, borderRadius: 17, backgroundColor: 'white', borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 13, justifyContent: 'center', ...theme.shadow },
  actionText: { color: theme.colors.text, fontWeight: '900', fontSize: 12 },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  studentAvatar: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#EEF0FF', alignItems: 'center', justifyContent: 'center' },
  studentAvatarText: { color: theme.colors.primary, fontWeight: '900' },
  chev: { color: '#A8AEBE', fontSize: 24 },
  insightRow: { flexDirection: 'row', gap: 12, paddingVertical: 11, alignItems: 'center' },
  insightIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  insightIconText: { fontWeight: '900', fontSize: 16 },
  insightTitle: { color: theme.colors.text, fontWeight: '900', fontSize: 13 },
  emptyState: { alignItems: 'center', paddingVertical: 10 },
  emptyTitle: { color: theme.colors.text, fontWeight: '900', marginBottom: 5 },
  addFirst: { marginTop: 14, backgroundColor: theme.colors.primary, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 11 },
  addFirstText: { color: 'white', fontWeight: '900', fontSize: 12 },
  taskRow:{flexDirection:'row',alignItems:'center',gap:11,paddingVertical:11},
  taskCount:{width:32,height:32,borderRadius:10,backgroundColor:'#F0F2F7',alignItems:'center',justifyContent:'center'},
  taskCountActive:{backgroundColor:'#EEF0FF'},
  taskCountText:{color:theme.colors.textMuted,fontWeight:'900',fontSize:12},
  taskCountTextActive:{color:theme.colors.primary},
  taskTitle:{flex:1,color:theme.colors.text,fontWeight:'800',fontSize:11},
  activityRow:{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:10},
  activityDot:{width:8,height:8,borderRadius:8,backgroundColor:theme.colors.primary},
  activityTitle:{color:theme.colors.text,fontWeight:'900',fontSize:11},
  activityTime:{color:theme.colors.textMuted,fontSize:9,fontWeight:'800'},
});
