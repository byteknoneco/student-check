import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  completeLessonReport,
  createExamResult,
  createHomework,
  createInvite,
  createLesson,
  createLessonPackage,
  createPayment,
  createStudent,
  setHomeworkStatus,
} from '../services/appData';
import { theme } from '../theme';
import { DashboardData, Student, TeacherActionRequest } from '../types';

const today = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const plusDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

function localDateTimeToIso(date: string, time: string) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!dateMatch || !timeMatch) throw new Error('Tarih YYYY-MM-DD, saat HH:MM formatında olmalı.');
  const d = new Date(
    Number(dateMatch[1]),
    Number(dateMatch[2]) - 1,
    Number(dateMatch[3]),
    Number(timeMatch[1]),
    Number(timeMatch[2]),
  );
  if (Number.isNaN(d.getTime())) throw new Error('Geçerli bir tarih/saat girin.');
  return d.toISOString();
}

function dateToIsoEndOfDay(date: string) {
  return localDateTimeToIso(date, '23:59');
}

function StudentPicker({ students, value, onChange }: { students: Student[]; value: string; onChange: (id: string) => void }) {
  return (
    <View style={styles.chips}>
      {students.map((student) => (
        <Pressable key={student.id} onPress={() => onChange(student.id)} style={[styles.chip, value === student.id && styles.chipActive]}>
          <Text style={[styles.chipText, value === student.id && styles.chipTextActive]}>{student.full_name}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false }: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9AA1B4"
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, multiline && styles.textarea]}
      />
    </View>
  );
}

export function TeacherActionModal({
  request,
  data,
  teacherId,
  onClose,
  onChanged,
}: {
  request: TeacherActionRequest | null;
  data: DashboardData;
  teacherId: string;
  onClose: () => void;
  onChanged: () => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [fullName, setFullName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [school, setSchool] = useState('');
  const [subject, setSubject] = useState('Matematik');
  const [date, setDate] = useState(today());
  const [time, setTime] = useState('18:00');
  const [duration, setDuration] = useState('60');
  const [topic, setTopic] = useState('');
  const [teacherNote, setTeacherNote] = useState('');
  const [homeworkTitle, setHomeworkTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(plusDays(7));
  const [examTitle, setExamTitle] = useState('Konu Tarama');
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [amount, setAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [totalLessons, setTotalLessons] = useState('8');
  const [packagePrice, setPackagePrice] = useState('');
  const [targetRole, setTargetRole] = useState<'parent' | 'student'>('parent');
  const [attendance, setAttendance] = useState<'present' | 'absent'>('present');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!request) return;
    setStudentId(request.type === 'completeLesson' ? request.lesson.student_id : request.type === 'reviewHomework' ? request.homework.student_id : data.students[0]?.id ?? '');
    setGeneratedCode(null);
    if (request.type === 'completeLesson') {
      setTopic(request.lesson.topic ?? '');
      setTeacherNote(request.lesson.teacher_note ?? '');
      setAttendance(request.lesson.attendance === 'absent' ? 'absent' : 'present');
    }
  }, [request, data.students]);

  const title = useMemo(() => {
    if (!request) return '';
    const map: Record<TeacherActionRequest['type'], string> = {
      student: 'Yeni öğrenci',
      lesson: 'Yeni ders planla',
      homework: 'Ödev ver',
      exam: 'Sınav sonucu ekle',
      payment: 'Ödeme kaydı',
      package: 'Ders paketi tanımla',
      invite: 'Davet kodu oluştur',
      completeLesson: 'Ders sonu raporu',
      reviewHomework: 'Ödevi değerlendir',
    };
    return map[request.type];
  }, [request]);

  if (!request) return null;

  const requireStudent = () => {
    if (!studentId) throw new Error('Önce bir öğrenci seçin.');
  };

  const submit = async () => {
    try {
      setBusy(true);
      if (request.type === 'student') {
        if (!fullName.trim()) throw new Error('Öğrenci adı zorunlu.');
        await createStudent({ fullName, gradeLevel, school });
        Alert.alert('Öğrenci eklendi', `${fullName.trim()} artık öğrenci listenizde.`);
      } else if (request.type === 'lesson') {
        requireStudent();
        await createLesson({
          teacherId,
          studentId,
          subjectName: subject,
          startsAt: localDateTimeToIso(date, time),
          durationMinutes: Number(duration),
          topic,
        });
        Alert.alert('Ders planlandı', 'Ders takvime eklendi.');
      } else if (request.type === 'homework') {
        requireStudent();
        if (!homeworkTitle.trim()) throw new Error('Ödev başlığı zorunlu.');
        await createHomework({ teacherId, studentId, subjectName: subject, title: homeworkTitle, description, dueAt: dateToIsoEndOfDay(dueDate) });
        Alert.alert('Ödev verildi', 'Ödev öğrenci ve veli ekranında görünecek.');
      } else if (request.type === 'exam') {
        requireStudent();
        const scoreNumber = Number(score);
        const maxNumber = Number(maxScore);
        if (!Number.isFinite(scoreNumber) || !Number.isFinite(maxNumber) || maxNumber <= 0 || scoreNumber < 0 || scoreNumber > maxNumber) throw new Error('Sınav puanlarını kontrol edin.');
        await createExamResult({ teacherId, studentId, subjectName: subject, title: examTitle, examDate: date, score: scoreNumber, maxScore: maxNumber });
        Alert.alert('Sonuç eklendi', 'Gelişim grafiği yeni sonucu kullanacak.');
      } else if (request.type === 'payment') {
        requireStudent();
        const amountNumber = Number(amount.replace(',', '.'));
        if (!Number.isFinite(amountNumber) || amountNumber <= 0) throw new Error('Geçerli bir ödeme tutarı girin.');
        await createPayment({ teacherId, studentId, amount: amountNumber, note: paymentNote });
        Alert.alert('Ödeme kaydedildi', 'Tahsilat kaydı oluşturuldu.');
      } else if (request.type === 'package') {
        requireStudent();
        const total = Number(totalLessons);
        const price = packagePrice.trim() ? Number(packagePrice.replace(',', '.')) : null;
        if (!Number.isInteger(total) || total <= 0) throw new Error('Ders sayısı pozitif tam sayı olmalı.');
        if (price !== null && (!Number.isFinite(price) || price < 0)) throw new Error('Paket fiyatını kontrol edin.');
        await createLessonPackage({ teacherId, studentId, totalLessons: total, price });
        Alert.alert('Paket tanımlandı', `${total} derslik aktif paket oluşturuldu.`);
      } else if (request.type === 'invite') {
        requireStudent();
        const result = await createInvite({ teacherId, studentId, targetRole });
        setGeneratedCode(result.code);
        await onChanged();
        return;
      } else if (request.type === 'completeLesson') {
        await completeLessonReport({ lessonId: request.lesson.id, attendance, topic, teacherNote });
        Alert.alert('Ders raporu kaydedildi', attendance === 'present' ? 'Ders tamamlandı ve aktif paket varsa 1 ders kullanıldı.' : 'Ders devamsız olarak tamamlandı; paket düşülmedi.');
      } else if (request.type === 'reviewHomework') {
        await setHomeworkStatus(request.homework.id, 'reviewed');
        Alert.alert('Ödev değerlendirildi', 'Ödev tamamlandı olarak işaretlendi.');
      }
      await onChanged();
      onClose();
    } catch (error: any) {
      Alert.alert('İşlem tamamlanamadı', error?.message ?? 'Bilinmeyen hata');
    } finally {
      setBusy(false);
    }
  };

  const needsStudent = request.type !== 'student' && request.type !== 'completeLesson' && request.type !== 'reviewHomework';

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>HIZLI İŞLEM</Text>
              <Text style={styles.title}>{title}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            {needsStudent ? (
              <View style={styles.fieldWrap}>
                <Text style={styles.label}>Öğrenci</Text>
                {data.students.length ? <StudentPicker students={data.students} value={studentId} onChange={setStudentId} /> : <Text style={styles.warning}>Önce öğrenci eklemelisiniz.</Text>}
              </View>
            ) : null}

            {request.type === 'student' ? (
              <>
                <Field label="Ad soyad *" value={fullName} onChangeText={setFullName} placeholder="Örn. Ahmet Yılmaz" />
                <Field label="Sınıf" value={gradeLevel} onChangeText={setGradeLevel} placeholder="Örn. 11. Sınıf" />
                <Field label="Okul" value={school} onChangeText={setSchool} placeholder="İsteğe bağlı" />
              </>
            ) : null}

            {request.type === 'lesson' ? (
              <>
                <Field label="Ders" value={subject} onChangeText={setSubject} placeholder="Matematik" />
                <View style={styles.twoCol}><View style={{ flex: 1 }}><Field label="Tarih" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" /></View><View style={{ flex: 0.7 }}><Field label="Saat" value={time} onChangeText={setTime} placeholder="18:00" /></View></View>
                <Field label="Süre (dk)" value={duration} onChangeText={setDuration} keyboardType="numeric" />
                <Field label="Konu" value={topic} onChangeText={setTopic} placeholder="Örn. Türev uygulamaları" />
              </>
            ) : null}

            {request.type === 'homework' ? (
              <>
                <Field label="Ders" value={subject} onChangeText={setSubject} />
                <Field label="Ödev başlığı *" value={homeworkTitle} onChangeText={setHomeworkTitle} placeholder="Örn. Test 4 / Soru 1-25" />
                <Field label="Açıklama" value={description} onChangeText={setDescription} multiline placeholder="Ek açıklama veya kaynak" />
                <Field label="Son tarih" value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" />
              </>
            ) : null}

            {request.type === 'exam' ? (
              <>
                <Field label="Ders" value={subject} onChangeText={setSubject} />
                <Field label="Sınav adı" value={examTitle} onChangeText={setExamTitle} />
                <Field label="Tarih" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
                <View style={styles.twoCol}><View style={{ flex: 1 }}><Field label="Puan" value={score} onChangeText={setScore} keyboardType="decimal-pad" /></View><View style={{ flex: 1 }}><Field label="Maksimum" value={maxScore} onChangeText={setMaxScore} keyboardType="decimal-pad" /></View></View>
              </>
            ) : null}

            {request.type === 'payment' ? (
              <>
                <Field label="Tutar (₺)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="1500" />
                <Field label="Not" value={paymentNote} onChangeText={setPaymentNote} placeholder="Örn. Eylül paketi" />
              </>
            ) : null}

            {request.type === 'package' ? (
              <>
                <Field label="Toplam ders" value={totalLessons} onChangeText={setTotalLessons} keyboardType="numeric" />
                <Field label="Paket fiyatı (₺)" value={packagePrice} onChangeText={setPackagePrice} keyboardType="decimal-pad" placeholder="İsteğe bağlı" />
                <Text style={styles.helper}>Yeni paket tanımlandığında öğrencinin önceki aktif paketi pasif hale getirilir.</Text>
              </>
            ) : null}

            {request.type === 'invite' ? (
              <>
                <Text style={styles.label}>Kimin için?</Text>
                <View style={styles.chips}>
                  <Pressable onPress={() => setTargetRole('parent')} style={[styles.chip, targetRole === 'parent' && styles.chipActive]}><Text style={[styles.chipText, targetRole === 'parent' && styles.chipTextActive]}>Veli</Text></Pressable>
                  <Pressable onPress={() => setTargetRole('student')} style={[styles.chip, targetRole === 'student' && styles.chipActive]}><Text style={[styles.chipText, targetRole === 'student' && styles.chipTextActive]}>Öğrenci</Text></Pressable>
                </View>
                {generatedCode ? <View style={styles.codeBox}><Text style={styles.codeLabel}>DAVET KODU</Text><Text selectable style={styles.code}>{generatedCode}</Text><Text style={styles.helper}>Bu kodu ilgili kişiye gönder. Kod 14 gün geçerlidir ve yalnızca bir kez kullanılabilir.</Text></View> : null}
              </>
            ) : null}

            {request.type === 'completeLesson' ? (
              <>
                <View style={styles.summaryBox}><Text style={styles.summaryName}>{request.lesson.student_name}</Text><Text style={styles.helper}>{request.lesson.subject_name} · {new Date(request.lesson.starts_at).toLocaleString('tr-TR')}</Text></View>
                <Text style={styles.label}>Katılım</Text>
                <View style={styles.chips}>
                  <Pressable onPress={() => setAttendance('present')} style={[styles.chip, attendance === 'present' && styles.chipActive]}><Text style={[styles.chipText, attendance === 'present' && styles.chipTextActive]}>Katıldı</Text></Pressable>
                  <Pressable onPress={() => setAttendance('absent')} style={[styles.chip, attendance === 'absent' && styles.chipDanger]}><Text style={[styles.chipText, attendance === 'absent' && styles.chipTextDanger]}>Katılmadı</Text></Pressable>
                </View>
                <Field label="İşlenen konu" value={topic} onChangeText={setTopic} />
                <Field label="Öğretmen notu" value={teacherNote} onChangeText={setTeacherNote} multiline placeholder="Veliye/öğrenciye görünür kısa gelişim notu" />
              </>
            ) : null}

            {request.type === 'reviewHomework' ? (
              <View style={styles.summaryBox}>
                <Text style={styles.summaryName}>{request.homework.title}</Text>
                <Text style={styles.helper}>{request.homework.student_name} · {request.homework.subject_name}</Text>
                <Text style={styles.helper}>Öğrenci ödevi gönderildi olarak işaretledi. Değerlendirmeyi tamamlamak için aşağıdaki butonu kullan.</Text>
              </View>
            ) : null}

            {request.type === 'invite' && generatedCode ? (
              <Pressable style={styles.secondaryButton} onPress={onClose}><Text style={styles.secondaryText}>Kapat</Text></Pressable>
            ) : (
              <Pressable onPress={submit} disabled={busy || (needsStudent && data.students.length === 0)} style={[styles.primaryButton, (busy || (needsStudent && data.students.length === 0)) && styles.disabled]}>
                {busy ? <ActivityIndicator color="white" /> : <Text style={styles.primaryText}>{request.type === 'completeLesson' ? 'Dersi tamamla ve raporu kaydet' : request.type === 'reviewHomework' ? 'Ödevi tamamlandı olarak işaretle' : request.type === 'invite' ? 'Kod oluştur' : 'Kaydet'}</Text>}
              </Pressable>
            )}
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(18,22,40,0.48)' },
  sheet: { maxHeight: '92%', backgroundColor: theme.colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 10 },
  handle: { alignSelf: 'center', width: 42, height: 5, borderRadius: 99, backgroundColor: '#D5D9E5', marginBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  eyebrow: { fontSize: 10, fontWeight: '900', color: theme.colors.primary, letterSpacing: 1 },
  title: { fontSize: 22, fontWeight: '900', color: theme.colors.text, marginTop: 3 },
  close: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 26, color: theme.colors.textMuted, lineHeight: 28 },
  form: { padding: 20, gap: 15 },
  fieldWrap: { gap: 7 },
  label: { color: theme.colors.text, fontSize: 12, fontWeight: '900' },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, minHeight: 50, paddingHorizontal: 14, color: theme.colors.text, fontWeight: '700' },
  textarea: { minHeight: 96, paddingTop: 14, textAlignVertical: 'top' },
  twoCol: { flexDirection: 'row', gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 13, paddingVertical: 10, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipDanger: { backgroundColor: theme.colors.dangerSoft, borderColor: '#F0B8C0' },
  chipText: { color: theme.colors.textMuted, fontWeight: '800', fontSize: 12 },
  chipTextActive: { color: 'white' },
  chipTextDanger: { color: theme.colors.danger },
  helper: { color: theme.colors.textMuted, fontSize: 11, lineHeight: 17 },
  warning: { color: theme.colors.danger, fontWeight: '800' },
  primaryButton: { minHeight: 54, borderRadius: 15, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  primaryText: { color: 'white', fontWeight: '900', textAlign: 'center' },
  secondaryButton: { minHeight: 52, borderRadius: 15, backgroundColor: 'white', borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: theme.colors.text, fontWeight: '900' },
  disabled: { opacity: 0.45 },
  summaryBox: { backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, padding: 14, gap: 5 },
  summaryName: { fontSize: 16, fontWeight: '900', color: theme.colors.text },
  codeBox: { alignItems: 'center', backgroundColor: '#EEF0FF', borderRadius: 18, padding: 18, gap: 8 },
  codeLabel: { color: theme.colors.primary, fontWeight: '900', fontSize: 10, letterSpacing: 1.4 },
  code: { color: theme.colors.text, fontSize: 28, fontWeight: '900', letterSpacing: 2 },
});
