import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { HomeworkAttachmentPicker } from '../components/HomeworkAttachmentPicker';
import { submitHomework } from '../services/appData';
import {
  PickedHomeworkFile,
  formatHomeworkFileSize,
  getHomeworkFileSignedUrl,
  openHomeworkFile,
  uploadHomeworkFiles,
} from '../services/homeworkFiles';
import { DashboardData, Homework, HomeworkFile, TeacherActionRequest, UserRole } from '../types';
import { theme } from '../theme';

export function HomeworkDetailModal({
  homework,
  data,
  role,
  onClose,
  onAction,
  onChanged,
}: {
  homework: Homework | null;
  data: DashboardData;
  role: UserRole;
  onClose: () => void;
  onAction?: (request: TeacherActionRequest) => void;
  onChanged?: () => Promise<void> | void;
}) {
  const [picked, setPicked] = useState<PickedHomeworkFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const files = useMemo(() => homework ? data.homeworkFiles.filter((file) => file.homework_id === homework.id) : [], [data.homeworkFiles, homework?.id]);
  if (!homework) return null;

  const assignment = files.filter((file) => file.kind === 'assignment');
  const submission = files.filter((file) => file.kind === 'submission');
  const feedback = files.filter((file) => file.kind === 'feedback');

  const openFile = async (file: HomeworkFile) => {
    try {
      if (file.mime_type.startsWith('image/')) {
        const url = await getHomeworkFileSignedUrl(file);
        if (url) setPreview({ url, title: file.file_name });
      } else {
        await openHomeworkFile(file);
      }
    } catch (error: any) {
      Alert.alert('Dosya acilamadi', error?.message ?? 'Dosya acilamadi.');
    }
  };

  const uploadTeacherMaterial = async () => {
    if (!picked.length) return;
    try {
      setBusy(true);
      await uploadHomeworkFiles({ homeworkId: homework.id, studentId: homework.student_id, kind: 'assignment', files: picked });
      setPicked([]);
      await onChanged?.();
      Alert.alert('Dosyalar eklendi', 'Odev materyalleri ogrenci ve veli tarafinda gorunebilir.');
    } catch (error: any) {
      Alert.alert('Yuklenemedi', error?.message ?? 'Dosyalar yuklenemedi.');
    } finally { setBusy(false); }
  };

  const submitStudentHomework = async () => {
    try {
      setBusy(true);
      if (picked.length) await uploadHomeworkFiles({ homeworkId: homework.id, studentId: homework.student_id, kind: 'submission', files: picked });
      await submitHomework(homework.id);
      setPicked([]);
      await onChanged?.();
      Alert.alert('Odev gonderildi', picked.length ? 'Cozum dosyalarin ogretmenine iletildi.' : 'Odev gonderildi olarak isaretlendi.');
      onClose();
    } catch (error: any) {
      Alert.alert('Gonderilemedi', error?.message ?? 'Odev gonderilemedi.');
    } finally { setBusy(false); }
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.safe}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}><Text style={styles.eyebrow}>ODEV DETAYI</Text><Text style={styles.title}>{homework.title}</Text><Text style={styles.meta}>{homework.subject_name} · {homework.student_name}</Text></View>
          <Pressable onPress={onClose} style={styles.close}><Text style={styles.closeText}>x</Text></Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          {homework.description ? <View style={styles.info}><Text style={styles.sectionTitle}>Aciklama</Text><Text style={styles.body}>{homework.description}</Text></View> : null}
          <Text style={styles.deadline}>Son tarih: {new Date(homework.due_at).toLocaleString('tr-TR')}</Text>

          <FileSection title="Ogretmenin materyalleri" files={assignment} onOpen={openFile} empty="Ek materyal yok." />
          <FileSection title="Ogrenci teslimi" files={submission} onOpen={openFile} empty={homework.status === 'assigned' ? 'Henuz teslim dosyasi yok.' : 'Dosyasiz teslim edildi.'} />
          <FileSection title="Ogretmen geri bildirimi" files={feedback} onOpen={openFile} empty="Dosyali geri bildirim yok." />

          {homework.teacher_feedback ? <View style={styles.info}><Text style={styles.sectionTitle}>Ogretmen notu</Text><Text style={styles.body}>{homework.teacher_feedback}</Text></View> : null}

          {role === 'teacher' && homework.status !== 'reviewed' ? <>
            <HomeworkAttachmentPicker files={picked} onChange={setPicked} label="Odeve yeni materyal ekle" />
            {picked.length ? <Pressable disabled={busy} onPress={uploadTeacherMaterial} style={[styles.primary, busy && styles.disabled]}>{busy ? <ActivityIndicator color="white" /> : <Text style={styles.primaryText}>Materyalleri yukle</Text>}</Pressable> : null}
          </> : null}

          {role === 'student' && homework.status !== 'reviewed' ? <>
            <HomeworkAttachmentPicker files={picked} onChange={setPicked} label="Cozumunu ekle" />
            <Pressable disabled={busy} onPress={submitStudentHomework} style={[styles.primary, busy && styles.disabled]}>{busy ? <ActivityIndicator color="white" /> : <Text style={styles.primaryText}>{homework.status === 'submitted' ? 'Yeni dosyalari yukle ve tekrar gonder' : 'Odevi gonder'}</Text>}</Pressable>
          </> : null}

          {role === 'teacher' && homework.status === 'submitted' ? <Pressable onPress={() => { onClose(); onAction?.({ type: 'reviewHomework', homework }); }} style={styles.review}><Text style={styles.reviewText}>Odevi degerlendir</Text></Pressable> : null}
          <View style={{ height: 30 }} />
        </ScrollView>
      </View>
      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <Pressable style={styles.previewBack} onPress={() => setPreview(null)}>
          {preview ? <><Image source={{ uri: preview.url }} style={styles.previewImage} resizeMode="contain" /><Text style={styles.previewTitle}>{preview.title}</Text></> : null}
        </Pressable>
      </Modal>
    </Modal>
  );
}

function FileSection({ title, files, onOpen, empty }: { title: string; files: HomeworkFile[]; onOpen: (file: HomeworkFile) => void; empty: string }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{files.length ? files.map((file) => <Pressable key={file.id} onPress={() => onOpen(file)} style={styles.fileRow}><Text style={styles.fileIcon}>{file.mime_type === 'application/pdf' ? 'PDF' : 'IMG'}</Text><View style={{ flex: 1 }}><Text numberOfLines={1} style={styles.fileName}>{file.file_name}</Text><Text style={styles.fileMeta}>{formatHomeworkFileSize(file.size_bytes)} · Acmak icin dokun</Text></View></Pressable>) : <Text style={styles.empty}>{empty}</Text>}</View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingTop: 48, paddingHorizontal: 18, paddingBottom: 15, flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  eyebrow: { color: theme.colors.primary, fontWeight: '900', fontSize: 9, letterSpacing: 1 },
  title: { color: theme.colors.text, fontWeight: '900', fontSize: 20, marginTop: 3 },
  meta: { color: theme.colors.textMuted, fontSize: 10, marginTop: 4 },
  close: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#F1F3F8', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: theme.colors.text, fontWeight: '900', fontSize: 17 },
  content: { padding: 18, gap: 15 },
  deadline: { color: theme.colors.textMuted, fontSize: 11, fontWeight: '800' },
  info: { backgroundColor: 'white', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 15, padding: 14 },
  body: { color: theme.colors.text, lineHeight: 20, fontSize: 12 },
  section: { backgroundColor: 'white', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 15, padding: 14, gap: 9 },
  sectionTitle: { color: theme.colors.text, fontWeight: '900', fontSize: 12 },
  fileRow: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 6 },
  fileIcon: { width: 42, textAlign: 'center', backgroundColor: '#EEF0FF', color: theme.colors.primary, paddingVertical: 10, borderRadius: 10, fontWeight: '900', fontSize: 9 },
  fileName: { color: theme.colors.text, fontSize: 11, fontWeight: '800' },
  fileMeta: { color: theme.colors.textMuted, fontSize: 9.5, marginTop: 3 },
  empty: { color: theme.colors.textMuted, fontSize: 10.5 },
  primary: { backgroundColor: theme.colors.primary, borderRadius: 14, minHeight: 50, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: 'white', fontWeight: '900' },
  review: { borderWidth: 1, borderColor: theme.colors.primary, backgroundColor: '#EEF0FF', borderRadius: 14, minHeight: 50, alignItems: 'center', justifyContent: 'center' },
  reviewText: { color: theme.colors.primary, fontWeight: '900' },
  disabled: { opacity: 0.5 },
  previewBack: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center', padding: 18 },
  previewImage: { width: '100%', height: '82%' },
  previewTitle: { color: 'white', marginTop: 12, fontWeight: '800' },
});
