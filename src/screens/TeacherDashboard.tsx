import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Pill, SectionTitle, StatCard } from '../components/UI';
import { DashboardData } from '../types';
import { theme } from '../theme';

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();

export function TeacherDashboard({ data }: { data: DashboardData }) {
  const todayLessons = data.lessons.filter((l) => isToday(l.starts_at) && l.status !== 'cancelled');
  const waitingHomework = data.homework.filter((h) => h.status !== 'reviewed');
  const completed = data.lessons.filter((l) => l.status === 'completed').length;
  return (
    <>
      <View style={styles.hero}>
        <View style={{ flex: 1 }}><Text style={styles.heroEyebrow}>BUGÜN</Text><Text style={styles.heroTitle}>{todayLessons.length} ders planlandı</Text><Text style={styles.heroText}>Ders notlarını aynı gün girersen veli ekranı otomatik güncellenir.</Text></View>
        <View style={styles.heroBadge}><Text style={styles.heroBadgeTop}>{new Date().getDate()}</Text><Text style={styles.heroBadgeBottom}>{new Date().toLocaleDateString('tr-TR', { month: 'short' })}</Text></View>
      </View>
      <View style={styles.grid}>
        <StatCard label="Aktif öğrenci" value={String(data.students.length)} hint="Bu dönem" tone="primary" />
        <StatCard label="Tamamlanan ders" value={String(completed)} hint="Kayıtlı dersler" tone="success" />
      </View>
      <View style={styles.grid}>
        <StatCard label="Bekleyen ödev" value={String(waitingHomework.length)} hint="Takip gerekiyor" tone="warning" />
        <StatCard label="Bugünkü ders" value={String(todayLessons.length)} hint="Takvim" tone="danger" />
      </View>
      <View>
        <SectionTitle title="Bugünkü dersler" action="Takvime git" />
        <Card>
          {todayLessons.length ? todayLessons.map((lesson, index) => (
            <View key={lesson.id} style={[styles.lessonRow, index > 0 && styles.rowBorder]}>
              <View style={styles.timeBox}><Text style={styles.timeText}>{formatTime(lesson.starts_at)}</Text></View>
              <View style={{ flex: 1 }}><Text style={styles.studentName}>{lesson.student_name}</Text><Text style={styles.muted}>{lesson.subject_name} · {lesson.topic ?? 'Konu girilmedi'}</Text></View>
              <Pill tone="primary">{lesson.duration_minutes} dk</Pill>
            </View>
          )) : <Text style={styles.empty}>Bugün için planlanmış ders yok.</Text>}
        </Card>
      </View>
      <View>
        <SectionTitle title="Hızlı işlemler" />
        <View style={styles.actions}>
          {['＋ Yeni ders', '✓ Ödev ver', '★ Sınav sonucu', '₺ Ödeme kaydı'].map((x) => <Pressable key={x} style={styles.action}><Text style={styles.actionText}>{x}</Text></Pressable>)}
        </View>
      </View>
      <View>
        <SectionTitle title="Öğrenci özeti" action="Tümünü gör" />
        <Card>
          {data.students.slice(0, 4).map((s, i) => (
            <View key={s.id} style={[styles.studentRow, i > 0 && styles.rowBorder]}>
              <View style={styles.studentAvatar}><Text style={styles.studentAvatarText}>{s.full_name.charAt(0)}</Text></View>
              <View style={{ flex: 1 }}><Text style={styles.studentName}>{s.full_name}</Text><Text style={styles.muted}>{s.grade_level ?? 'Sınıf bilgisi yok'} · {s.school ?? 'Okul bilgisi yok'}</Text></View>
              <Text style={styles.chev}>›</Text>
            </View>
          ))}
        </Card>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: '#232846', borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', ...theme.shadow },
  heroEyebrow: { color: '#AEB6D7', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { color: 'white', fontWeight: '900', fontSize: 23, marginTop: 5 },
  heroText: { color: '#BFC5DA', fontSize: 12, lineHeight: 18, marginTop: 8, maxWidth: 250 },
  heroBadge: { width: 68, height: 68, borderRadius: 20, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  heroBadgeTop: { color: 'white', fontWeight: '900', fontSize: 24 }, heroBadgeBottom: { color: '#E8E8FF', fontWeight: '800', fontSize: 11, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', gap: 12 },
  lessonRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 }, rowBorder: { borderTopWidth: 1, borderTopColor: theme.colors.border },
  timeBox: { width: 55, backgroundColor: '#F2F4FA', borderRadius: 12, paddingVertical: 9, alignItems: 'center' }, timeText: { fontWeight: '900', color: theme.colors.text },
  studentName: { fontWeight: '900', color: theme.colors.text, fontSize: 14 }, muted: { color: theme.colors.textMuted, fontSize: 11, marginTop: 4 }, empty: { color: theme.colors.textMuted, paddingVertical: 10 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, action: { width: '48%', backgroundColor: 'white', borderRadius: 16, padding: 15, borderWidth: 1, borderColor: theme.colors.border }, actionText: { fontWeight: '800', color: theme.colors.text },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 }, studentAvatar: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#EEF0FF', alignItems: 'center', justifyContent: 'center' }, studentAvatarText: { color: theme.colors.primary, fontWeight: '900' }, chev: { fontSize: 25, color: '#A5AABD' },
});
