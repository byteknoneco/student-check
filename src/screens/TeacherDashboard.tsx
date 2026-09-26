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
  onAction,
  onTab,
}: {
  data: DashboardData;
  onAction: (request: TeacherActionRequest) => void;
  onTab: (tab: TabKey) => void;
}) {
  const now = Date.now();
  const todayLessons = data.lessons.filter((l) => isToday(l.starts_at) && l.status !== 'cancelled');
  const waitingHomework = data.homework.filter((h) => h.status !== 'reviewed');
  const completed = data.lessons.filter((l) => l.status === 'completed').length;
  const overdueHomework = data.homework.filter((h) => h.status === 'assigned' && +new Date(h.due_at) < now);
  const missingReports = data.lessons.filter((l) => l.status === 'planned' && +new Date(l.starts_at) < now);
  const lowPackages = data.packages.filter((p) => p.active && p.remaining_lessons <= 2);
  const monthPayments = data.payments.filter((p) => isThisMonth(p.paid_at)).reduce((sum, p) => sum + p.amount, 0);

  const quickActions: { label: string; request: TeacherActionRequest }[] = [
    { label: '＋ Yeni ders', request: { type: 'lesson' } },
    { label: '✓ Ödev ver', request: { type: 'homework' } },
    { label: '★ Sınav sonucu', request: { type: 'exam' } },
    { label: '₺ Ödeme kaydı', request: { type: 'payment' } },
    { label: '▣ Ders paketi', request: { type: 'package' } },
    { label: '↗ Davet kodu', request: { type: 'invite' } },
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
        <StatCard label="Aktif öğrenci" value={String(data.students.length)} hint="Bu dönem" tone="primary" />
        <StatCard label="Tamamlanan ders" value={String(completed)} hint="Kayıtlı dersler" tone="success" />
      </View>
      <View style={styles.grid}>
        <StatCard label="Bekleyen ödev" value={String(waitingHomework.length)} hint="Takip gerekiyor" tone="warning" />
        <StatCard label="Bu ay tahsilat" value={`${Math.round(monthPayments).toLocaleString('tr-TR')} ₺`} hint="Kayıtlı ödemeler" tone="danger" />
      </View>

      <View>
        <SectionTitle title="Dikkat merkezi" />
        <Card>
          <InsightRow icon="!" tone="danger" title={`${missingReports.length} raporu bekleyen geçmiş ders`} text="Tarihi geçmiş ama tamamlanmamış dersleri kapat." />
          <InsightRow icon="↯" tone="warning" title={`${overdueHomework.length} geciken ödev`} text="Son tarihi geçmiş ve henüz gönderilmemiş ödevler." border />
          <InsightRow icon="▣" tone="primary" title={`${lowPackages.length} azalan paket`} text="2 veya daha az dersi kalan aktif paketler." border />
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
        <SectionTitle title="Hızlı işlemler" />
        <View style={styles.actions}>
          {quickActions.map((item) => <Pressable key={item.label} onPress={() => onAction(item.request)} style={styles.action}><Text style={styles.actionText}>{item.label}</Text></Pressable>)}
        </View>
      </View>

      <View>
        <SectionTitle title="Öğrenci özeti" action="Tümünü gör" onPress={() => onTab('students')} />
        <Card>
          {data.students.length ? data.students.slice(0, 4).map((s, i) => {
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
});
