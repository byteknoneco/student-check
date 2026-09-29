import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Pill, SectionTitle } from '../components/UI';
import { DashboardData, Homework, Lesson, TeacherActionRequest, UserRole } from '../types';
import { deleteMyAccount } from '../services/appData';
import { HomeworkDetailModal } from './HomeworkDetailModal';
import { theme } from '../theme';

export function StudentsScreen({ data, onAction, onSelectStudent }: { data: DashboardData; onAction: (request: TeacherActionRequest) => void; onSelectStudent?: (studentId: string) => void }) {
  return (
    <View>
      <SectionTitle title="Öğrenciler" action="+ Öğrenci ekle" onPress={() => onAction({ type: 'student' })} />
      <Card>
        {data.students.length ? data.students.map((s, i) => {
          const pack = data.packages.find((p) => p.student_id === s.id && p.active);
          return (
            <Pressable key={s.id} onPress={() => onSelectStudent?.(s.id)} style={[styles.row, i > 0 && styles.border]}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{s.full_name.charAt(0)}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{s.full_name}</Text>
                <Text style={styles.meta}>{s.grade_level ?? '—'} · {s.school ?? '—'}</Text>
                <Text style={styles.meta}>{pack ? `${pack.remaining_lessons}/${pack.total_lessons} ders kaldı` : 'Aktif paket yok'}</Text>
              </View>
              <Pill tone={s.active ? 'success' : 'neutral'}>{s.active ? 'Aktif' : 'Pasif'}</Pill>
            </Pressable>
          );
        }) : <Empty text="Henüz öğrenci eklenmedi." />}
      </Card>
      <View style={styles.inlineActions}>
        <Pressable onPress={() => onAction({ type: 'package' })} style={styles.smallAction}><Text style={styles.smallActionText}>▣ Paket tanımla</Text></Pressable>
        <Pressable onPress={() => onAction({ type: 'invite' })} style={styles.smallAction}><Text style={styles.smallActionText}>↗ Davet kodu</Text></Pressable>
      </View>
    </View>
  );
}

export function CalendarScreen({
  data,
  role,
  onAction,
}: {
  data: DashboardData;
  role: UserRole;
  onAction?: (request: TeacherActionRequest) => void;
}) {
  const sorted = [...data.lessons].sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));
  return (
    <View>
      <SectionTitle title="Ders takvimi" action={role === 'teacher' ? '+ Ders planla' : undefined} onPress={() => onAction?.({ type: 'lesson' })} />
      <Card>
        {sorted.length ? sorted.map((l, i) => (
          <Pressable
            key={l.id}
            disabled={role !== 'teacher' || l.status === 'completed' || l.status === 'cancelled'}
            onPress={() => onAction?.({ type: 'completeLesson', lesson: l })}
            onLongPress={() => onAction?.({ type: 'lessonManage', lesson: l })}
            style={[styles.row, i > 0 && styles.border]}
          >
            <View style={styles.dateBox}><Text style={styles.dateDay}>{new Date(l.starts_at).getDate()}</Text><Text style={styles.dateMon}>{new Date(l.starts_at).toLocaleDateString('tr-TR', { month: 'short' })}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{role === 'teacher' ? `${l.student_name} · ` : ''}{l.subject_name}</Text>
              <Text style={styles.meta}>{new Date(l.starts_at).toLocaleString('tr-TR', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}</Text>
              <Text style={styles.meta}>{l.topic ?? 'Konu girilmedi'}</Text>
              {role === 'teacher' && l.status === 'planned' ? <Text style={styles.tapHint}>Dokun: rapor / Basili tut: iptal-ertele</Text> : null}
            </View>
            <Pill tone={l.status === 'completed' ? 'success' : l.status === 'cancelled' ? 'danger' : 'primary'}>{l.status === 'completed' ? 'Tamamlandı' : l.status === 'cancelled' ? 'İptal' : 'Planlandı'}</Pill>
          </Pressable>
        )) : <Empty text="Ders kaydı yok." />}
      </Card>
    </View>
  );
}

export function HomeworkScreen({
  data,
  role,
  onAction,
  onChanged,
}: {
  data: DashboardData;
  role: UserRole;
  onAction?: (request: TeacherActionRequest) => void;
  onChanged?: () => Promise<void> | void;
}) {
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
                {assignmentCount || submissionCount ? <Text style={styles.tapHint}>📎 {assignmentCount} materyal · {submissionCount} teslim dosyasi</Text> : <Text style={styles.tapHint}>Dokun → odev detayi</Text>}
              </View>
              <Pill tone={h.status === 'reviewed' ? 'success' : h.status === 'submitted' ? 'warning' : overdue ? 'danger' : 'primary'}>{h.status === 'reviewed' ? 'Tamam' : h.status === 'submitted' ? 'Gönderildi' : 'Bekliyor'}</Pill>
            </Pressable>
          );
        }) : <Empty text="Ödev kaydı yok." />}
      </Card>
      <HomeworkDetailModal
        homework={selectedHomework}
        data={data}
        role={role}
        onClose={() => setSelectedHomework(null)}
        onAction={onAction}
        onChanged={onChanged}
      />
    </View>
  );
}

export function ProfileScreen({ role, isDemo, onLogout, onSwitchDemoRole }: { role: UserRole; isDemo: boolean; onLogout: () => void; onSwitchDemoRole?: (role: UserRole) => void }) {
  return (
    <View>
      <SectionTitle title="Hesap ve ayarlar" />
      <Card>
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}><Text style={styles.profileLetter}>{role === 'teacher' ? 'Ö' : role === 'parent' ? 'V' : 'A'}</Text></View>
          <View><Text style={styles.title}>{role === 'teacher' ? 'Öğretmen hesabı' : role === 'parent' ? 'Veli hesabı' : 'Öğrenci hesabı'}</Text><Text style={styles.meta}>{isDemo ? 'Demo mod · Supabase bağlı değil' : 'Supabase hesabı · Ortak veritabanı'}</Text></View>
        </View>
        {!isDemo ? <View style={styles.infoBox}><Text style={styles.infoTitle}>Bulut senkronizasyonu aktif</Text><Text style={styles.meta}>Bu telefondaki işlemler ortak Supabase veritabanına kaydedilir ve bağlı hesaplara yansır.</Text></View> : null}
        {isDemo ? <View style={styles.demoBox}><Text style={styles.demoTitle}>Rolleri önizle</Text><View style={styles.roleRow}>{(['teacher','parent','student'] as UserRole[]).map(r => <Pressable key={r} onPress={() => onSwitchDemoRole?.(r)} style={[styles.roleButton, role === r && styles.roleButtonActive]}><Text style={[styles.roleButtonText, role === r && styles.roleButtonTextActive]}>{r === 'teacher' ? 'Öğretmen' : r === 'parent' ? 'Veli' : 'Öğrenci'}</Text></Pressable>)}</View></View> : null}
        <Pressable style={styles.logoutButton} onPress={onLogout}><Text style={styles.logoutText}>{isDemo ? 'Demo başlangıcına dön' : 'Çıkış yap'}</Text></Pressable>
        {!isDemo ? <Pressable style={styles.deleteButton} onPress={() => Alert.alert('Hesabi sil', 'Bu islem hesabini ve bagli verilerini kalici olarak siler. Devam edilsin mi?', [{ text: 'Vazgec', style: 'cancel' }, { text: 'Hesabi sil', style: 'destructive', onPress: async () => { try { await deleteMyAccount(); await onLogout(); } catch (error: any) { Alert.alert('Silinemedi', error?.message ?? 'Hesap silinemedi.'); } } }])}><Text style={styles.deleteText}>Hesabimi kalici olarak sil</Text></Pressable> : null}
      </Card>
    </View>
  );
}

function Empty({ text }: { text: string }) {
  return <View style={styles.emptyBox}><Text style={styles.empty}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  border: { borderTopWidth: 1, borderTopColor: theme.colors.border },
  avatar: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#EEF0FF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: theme.colors.primary, fontWeight: '900' },
  title: { color: theme.colors.text, fontWeight: '900', fontSize: 13 },
  meta: { color: theme.colors.textMuted, marginTop: 4, fontSize: 10.5 },
  tapHint: { color: theme.colors.primary, fontSize: 10, fontWeight: '800', marginTop: 5 },
  dateBox: { width: 46, height: 50, borderRadius: 13, backgroundColor: '#242946', alignItems: 'center', justifyContent: 'center' },
  dateDay: { color: 'white', fontWeight: '900', fontSize: 17 },
  dateMon: { color: '#BFC5DA', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  check: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#EEF0FF', alignItems: 'center', justifyContent: 'center' },
  emptyBox: { paddingVertical: 16, alignItems: 'center' },
  empty: { color: theme.colors.textMuted },
  inlineActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  smallAction: { flex: 1, backgroundColor: 'white', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  smallActionText: { color: theme.colors.primary, fontWeight: '900', fontSize: 11 },
  profileHeader: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  profileAvatar: { width: 54, height: 54, borderRadius: 17, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  profileLetter: { color: 'white', fontWeight: '900', fontSize: 20 },
  infoBox: { marginTop: 20, backgroundColor: theme.colors.successSoft, borderRadius: 14, padding: 14 },
  infoTitle: { color: theme.colors.success, fontWeight: '900', fontSize: 12 },
  demoBox: { marginTop: 22, paddingTop: 18, borderTopWidth: 1, borderTopColor: theme.colors.border },
  demoTitle: { fontWeight: '900', color: theme.colors.text, marginBottom: 10 },
  roleRow: { flexDirection: 'row', gap: 8 },
  roleButton: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  roleButtonActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  roleButtonText: { color: theme.colors.textMuted, fontWeight: '800', fontSize: 11 },
  roleButtonTextActive: { color: 'white' },
  logoutButton: { marginTop: 20, borderWidth: 1, borderColor: '#F2C7CD', backgroundColor: '#FFF6F7', padding: 14, borderRadius: 14, alignItems: 'center' },
  logoutText: { color: theme.colors.danger, fontWeight: '900' },
  deleteButton: { marginTop: 10, padding: 12, borderRadius: 12, alignItems: 'center' },
  deleteText: { color: theme.colors.textMuted, fontWeight: '800', fontSize: 11, textDecorationLine: 'underline' },
});
