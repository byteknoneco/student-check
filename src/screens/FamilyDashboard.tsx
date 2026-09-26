import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Pill, ProgressBar, SectionTitle, StatCard } from '../components/UI';
import { DashboardData, UserRole } from '../types';
import { theme } from '../theme';

export function FamilyDashboard({ data, role }: { data: DashboardData; role: Extract<UserRole, 'parent' | 'student'> }) {
  const [selectedStudentId, setSelectedStudentId] = useState(data.students[0]?.id ?? '');

  useEffect(() => {
    if (!data.students.some((s) => s.id === selectedStudentId)) setSelectedStudentId(data.students[0]?.id ?? '');
  }, [data.students, selectedStudentId]);

  const student = data.students.find((s) => s.id === selectedStudentId) ?? data.students[0];
  const studentId = student?.id ?? '';
  const lessons = useMemo(() => data.lessons.filter((x) => x.student_id === studentId), [data.lessons, studentId]);
  const homework = useMemo(() => data.homework.filter((x) => x.student_id === studentId), [data.homework, studentId]);
  const exams = useMemo(() => data.exams.filter((x) => x.student_id === studentId), [data.exams, studentId]);
  const activePackage = data.packages.find((p) => p.student_id === studentId && p.active);
  const payments = data.payments.filter((p) => p.student_id === studentId);

  const recentExam = [...exams].sort((a, b) => +new Date(b.exam_date) - +new Date(a.exam_date))[0];
  const completed = lessons.filter((l) => l.status === 'completed');
  const attended = completed.filter((l) => l.attendance === 'present').length;
  const attendance = completed.length ? Math.round((attended / completed.length) * 100) : 100;
  const reviewed = homework.filter((h) => h.status === 'reviewed').length;
  const hwRate = homework.length ? Math.round((reviewed / homework.length) * 100) : 0;
  const nextLesson = [...lessons].filter((l) => +new Date(l.starts_at) > Date.now() && l.status === 'planned').sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at))[0];
  const lastNote = [...completed].sort((a, b) => +new Date(b.starts_at) - +new Date(a.starts_at))[0]?.teacher_note;
  const lastPayment = role === 'parent' ? [...payments].sort((a, b) => +new Date(b.paid_at) - +new Date(a.paid_at))[0] : undefined;

  return (
    <>
      {role === 'parent' && data.students.length > 1 ? (
        <View>
          <SectionTitle title="Çocuklarım" />
          <View style={styles.switchRow}>
            {data.students.map((s) => <Pressable key={s.id} onPress={() => setSelectedStudentId(s.id)} style={[styles.childChip, s.id === studentId && styles.childChipActive]}><Text style={[styles.childChipText, s.id === studentId && styles.childChipTextActive]}>{s.full_name}</Text></Pressable>)}
          </View>
        </View>
      ) : null}

      <View style={styles.profileHero}>
        <View style={styles.bigAvatar}><Text style={styles.bigAvatarText}>{student?.full_name?.charAt(0) ?? 'Ö'}</Text></View>
        <View style={{ flex: 1 }}><Text style={styles.eyebrow}>{role === 'parent' ? 'ÇOCUĞUM' : 'PROFİLİM'}</Text><Text style={styles.name}>{student?.full_name ?? 'Henüz eşleştirilmedi'}</Text><Text style={styles.meta}>{student?.grade_level ?? '—'} · {student?.school ?? '—'}</Text></View>
        <Pill tone="success">Aktif</Pill>
      </View>

      <View style={styles.grid}>
        <StatCard label="Derse katılım" value={`%${attendance}`} hint="Tamamlanan dersler" tone="success" />
        <StatCard label="Ödev tamamlama" value={`%${hwRate}`} hint="İncelenen ödevler" tone="primary" />
      </View>
      <View style={styles.grid}>
        <StatCard label="Son sınav" value={recentExam ? String(Math.round((recentExam.score / recentExam.max_score) * 100)) : '—'} hint={recentExam?.title ?? 'Sonuç yok'} tone="warning" />
        <StatCard label="Kalan ders" value={String(activePackage?.remaining_lessons ?? '—')} hint={activePackage ? `${activePackage.total_lessons} derslik paket` : 'Paket tanımlı değil'} tone="danger" />
      </View>

      <View>
        <SectionTitle title="Sıradaki ders" />
        <Card>
          {nextLesson ? <View style={styles.nextRow}><View style={styles.calendar}><Text style={styles.calendarDay}>{new Date(nextLesson.starts_at).getDate()}</Text><Text style={styles.calendarMonth}>{new Date(nextLesson.starts_at).toLocaleDateString('tr-TR', { month: 'short' })}</Text></View><View style={{ flex: 1 }}><Text style={styles.itemTitle}>{nextLesson.subject_name}</Text><Text style={styles.itemMeta}>{nextLesson.topic ?? 'Konu girilmedi'}</Text><Text style={styles.itemMeta}>{new Date(nextLesson.starts_at).toLocaleString('tr-TR', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}</Text></View></View> : <Text style={styles.empty}>Yaklaşan ders görünmüyor.</Text>}
        </Card>
      </View>

      <View>
        <SectionTitle title="Gelişim" />
        <Card>
          <Text style={styles.itemTitle}>Sınav başarı trendi</Text>
          {exams.length ? <View style={styles.examRow}>
            {exams.slice(-3).map((e) => {
              const pct = Math.round((e.score / e.max_score) * 100);
              return <View key={e.id} style={styles.examCol}><Text style={styles.examPct}>%{pct}</Text><View style={styles.barBack}><View style={[styles.barFill, { height: `${Math.max(12, pct)}%` }]} /></View><Text numberOfLines={1} style={styles.examLabel}>{e.title.replace('Konu ', '')}</Text></View>;
            })}
          </View> : <Text style={[styles.empty, { marginTop: 12 }]}>Henüz sınav sonucu yok.</Text>}
        </Card>
      </View>

      <View>
        <SectionTitle title="Öğretmen notu" />
        <Card style={styles.noteCard}><Text style={styles.quote}>“</Text><Text style={styles.note}>{lastNote ?? 'Henüz ders notu eklenmedi.'}</Text><View style={{ marginTop: 16 }}><Text style={styles.small}>Son tamamlanan dersten</Text></View></Card>
      </View>

      {activePackage ? <View><SectionTitle title="Ders paketi" /><Card><View style={styles.packageHeader}><Text style={styles.itemTitle}>{activePackage.used_lessons}/{activePackage.total_lessons} ders kullanıldı</Text><Pill tone="primary">{activePackage.remaining_lessons} kaldı</Pill></View><ProgressBar value={(activePackage.used_lessons / activePackage.total_lessons) * 100} /></Card></View> : null}
      {role === 'parent' ? <View><SectionTitle title="Son ödeme" /><Card>{lastPayment ? <View style={styles.paymentRow}><View><Text style={styles.itemTitle}>{lastPayment.amount.toLocaleString('tr-TR')} ₺</Text><Text style={styles.itemMeta}>{new Date(lastPayment.paid_at).toLocaleDateString('tr-TR')} · {lastPayment.note ?? 'Ödeme kaydı'}</Text></View><Pill tone="success">Kaydedildi</Pill></View> : <Text style={styles.empty}>Henüz ödeme kaydı yok.</Text>}</Card></View> : null}
    </>
  );
}

const styles = StyleSheet.create({
  switchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  childChip: { backgroundColor: 'white', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 9 },
  childChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  childChipText: { color: theme.colors.textMuted, fontWeight: '800', fontSize: 11 },
  childChipTextActive: { color: 'white' },
  profileHero: { backgroundColor: 'white', borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 13, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadow },
  bigAvatar: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EDECFF' },
  bigAvatarText: { color: theme.colors.primary, fontWeight: '900', fontSize: 24 },
  eyebrow: { color: theme.colors.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  name: { color: theme.colors.text, fontWeight: '900', fontSize: 18, marginTop: 4 },
  meta: { color: theme.colors.textMuted, fontSize: 11, marginTop: 4 },
  grid: { flexDirection: 'row', gap: 12 },
  nextRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  calendar: { width: 58, height: 64, borderRadius: 15, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  calendarDay: { color: 'white', fontWeight: '900', fontSize: 24 },
  calendarMonth: { color: '#E4E5FF', fontWeight: '800', fontSize: 10, textTransform: 'uppercase' },
  itemTitle: { color: theme.colors.text, fontWeight: '900', fontSize: 14 },
  itemMeta: { color: theme.colors.textMuted, marginTop: 4, fontSize: 11 },
  empty: { color: theme.colors.textMuted },
  examRow: { height: 170, flexDirection: 'row', gap: 14, alignItems: 'flex-end', marginTop: 16 },
  examCol: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  examPct: { fontSize: 11, fontWeight: '900', color: theme.colors.text, marginBottom: 6 },
  barBack: { height: 110, width: 30, borderRadius: 12, backgroundColor: '#EFF1F6', overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%', backgroundColor: theme.colors.primary, borderRadius: 12 },
  examLabel: { color: theme.colors.textMuted, fontSize: 9, marginTop: 7, maxWidth: 80 },
  noteCard: { backgroundColor: '#232846', borderColor: '#232846' },
  quote: { color: '#777DF7', fontSize: 44, lineHeight: 40, fontWeight: '900' },
  note: { color: 'white', fontSize: 15, lineHeight: 23, fontWeight: '700' },
  small: { color: '#AEB6D7', fontSize: 10 },
  packageHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, alignItems: 'center' },
  paymentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
});
