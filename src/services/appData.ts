import { demoData } from '../data/mock';
import { supabase } from '../lib/supabase';
import { DashboardData, ExamResult, Homework, Lesson, Student, UserRole } from '../types';

const empty: DashboardData = { students: [], lessons: [], homework: [], exams: [], packageInfo: null };

const relatedStudentIds = async (role: UserRole, userId: string): Promise<string[]> => {
  if (!supabase) return demoData.students.map((s) => s.id);
  if (role === 'teacher') {
    const { data, error } = await supabase.from('students').select('id').eq('teacher_id', userId).eq('active', true);
    if (error) throw error;
    return (data ?? []).map((row) => row.id as string);
  }
  if (role === 'student') {
    const { data, error } = await supabase.from('students').select('id').eq('user_id', userId);
    if (error) throw error;
    return (data ?? []).map((row) => row.id as string);
  }
  const { data, error } = await supabase.from('parent_students').select('student_id').eq('parent_id', userId);
  if (error) throw error;
  return (data ?? []).map((row) => row.student_id as string);
};

export async function loadDashboard(role: UserRole, userId: string): Promise<DashboardData> {
  if (!supabase) {
    if (role === 'teacher') return demoData;
    return {
      ...demoData,
      students: demoData.students.filter((s) => s.id === 's1'),
      lessons: demoData.lessons.filter((l) => l.student_id === 's1'),
      homework: demoData.homework.filter((h) => h.student_id === 's1'),
      exams: demoData.exams.filter((e) => e.student_id === 's1'),
    };
  }

  const ids = await relatedStudentIds(role, userId);
  if (!ids.length) return empty;

  const [studentsRes, lessonsRes, homeworkRes, examsRes, packageRes] = await Promise.all([
    supabase.from('students').select('id,full_name,grade_level,school,active,user_id').in('id', ids).order('full_name'),
    supabase.from('lessons').select('id,student_id,starts_at,duration_minutes,status,topic,teacher_note,attendance,students(full_name),subjects(name)').in('student_id', ids).order('starts_at'),
    supabase.from('homework').select('id,student_id,title,description,due_at,status,students(full_name),subjects(name)').in('student_id', ids).order('due_at'),
    supabase.from('exam_results').select('id,student_id,title,exam_date,score,max_score,students(full_name),subjects(name)').in('student_id', ids).order('exam_date'),
    supabase.from('lesson_packages').select('total_lessons,used_lessons').in('student_id', ids).eq('active', true).order('created_at', { ascending: false }).limit(1),
  ]);

  for (const result of [studentsRes, lessonsRes, homeworkRes, examsRes, packageRes]) {
    if (result.error) throw result.error;
  }

  const students = (studentsRes.data ?? []) as Student[];
  const lessons: Lesson[] = (lessonsRes.data ?? []).map((row: any) => ({
    id: row.id,
    student_id: row.student_id,
    student_name: row.students?.full_name ?? 'Öğrenci',
    subject_name: row.subjects?.name ?? 'Ders',
    starts_at: row.starts_at,
    duration_minutes: row.duration_minutes,
    status: row.status,
    topic: row.topic,
    teacher_note: row.teacher_note,
    attendance: row.attendance,
  }));
  const homework: Homework[] = (homeworkRes.data ?? []).map((row: any) => ({
    id: row.id,
    student_id: row.student_id,
    student_name: row.students?.full_name ?? 'Öğrenci',
    subject_name: row.subjects?.name ?? 'Ders',
    title: row.title,
    description: row.description,
    due_at: row.due_at,
    status: row.status,
  }));
  const exams: ExamResult[] = (examsRes.data ?? []).map((row: any) => ({
    id: row.id,
    student_id: row.student_id,
    student_name: row.students?.full_name ?? 'Öğrenci',
    subject_name: row.subjects?.name ?? 'Ders',
    title: row.title,
    exam_date: row.exam_date,
    score: Number(row.score),
    max_score: Number(row.max_score),
  }));
  const p = packageRes.data?.[0];
  const packageInfo = p
    ? { total_lessons: p.total_lessons, used_lessons: p.used_lessons, remaining_lessons: Math.max(0, p.total_lessons - p.used_lessons) }
    : null;

  return { students, lessons, homework, exams, packageInfo };
}

export async function createLesson(input: {
  teacherId: string;
  studentId: string;
  subjectId: string;
  startsAt: string;
  durationMinutes: number;
  topic: string;
}) {
  if (!supabase) return { id: `demo-${Date.now()}` };
  const { data, error } = await supabase
    .from('lessons')
    .insert({
      teacher_id: input.teacherId,
      student_id: input.studentId,
      subject_id: input.subjectId,
      starts_at: input.startsAt,
      duration_minutes: input.durationMinutes,
      topic: input.topic,
      status: 'planned',
      attendance: 'pending',
    })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

export async function redeemInvite(code: string) {
  if (!supabase) return { ok: true };
  const { data, error } = await supabase.rpc('redeem_invite', { p_code: code.trim().toUpperCase() });
  if (error) throw error;
  return data;
}
