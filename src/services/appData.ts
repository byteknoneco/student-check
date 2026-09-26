import { demoData } from '../data/mock';
import { supabase } from '../lib/supabase';
import {
  DashboardData,
  ExamResult,
  Homework,
  HomeworkStatus,
  Invite,
  Lesson,
  LessonPackage,
  Payment,
  Student,
  UserRole,
} from '../types';

const empty: DashboardData = {
  students: [],
  lessons: [],
  homework: [],
  exams: [],
  packages: [],
  payments: [],
  invites: [],
  packageInfo: null,
};

const relatedStudentIds = async (role: UserRole, userId: string): Promise<string[]> => {
  if (!supabase) return demoData.students.map((s) => s.id);
  if (role === 'teacher') {
    const { data, error } = await supabase.from('students').select('id').eq('teacher_id', userId).eq('active', true);
    if (error) throw error;
    return (data ?? []).map((row: any) => row.id as string);
  }
  if (role === 'student') {
    const { data, error } = await supabase.from('students').select('id').eq('user_id', userId);
    if (error) throw error;
    return (data ?? []).map((row: any) => row.id as string);
  }
  const { data, error } = await supabase.from('parent_students').select('student_id').eq('parent_id', userId);
  if (error) throw error;
  return (data ?? []).map((row: any) => row.student_id as string);
};

export async function loadDashboard(role: UserRole, userId: string): Promise<DashboardData> {
  if (!supabase) {
    const base: DashboardData = {
      ...demoData,
      packages: [],
      payments: [],
      invites: [],
    };
    if (role === 'teacher') return base;
    return {
      ...base,
      students: base.students.filter((s) => s.id === 's1'),
      lessons: base.lessons.filter((l) => l.student_id === 's1'),
      homework: base.homework.filter((h) => h.student_id === 's1'),
      exams: base.exams.filter((e) => e.student_id === 's1'),
    };
  }

  const ids = await relatedStudentIds(role, userId);
  if (!ids.length) return empty;

  const studentQuery = supabase.from('students').select('id,full_name,grade_level,school,active,user_id').in('id', ids).order('full_name');
  const lessonQuery = supabase.from('lessons').select('id,student_id,starts_at,duration_minutes,status,topic,teacher_note,attendance,students(full_name),subjects(name)').in('student_id', ids).order('starts_at');
  const homeworkQuery = supabase.from('homework').select('id,student_id,title,description,due_at,status,students(full_name),subjects(name)').in('student_id', ids).order('due_at');
  const examQuery = supabase.from('exam_results').select('id,student_id,title,exam_date,score,max_score,students(full_name),subjects(name)').in('student_id', ids).order('exam_date');
  const packageQuery = supabase.from('lesson_packages').select('id,student_id,total_lessons,used_lessons,price,active,created_at,students(full_name)').in('student_id', ids).order('created_at', { ascending: false });
  const paymentQuery = supabase.from('payments').select('id,student_id,amount,paid_at,note,students(full_name)').in('student_id', ids).order('paid_at', { ascending: false });

  const promises: any[] = [studentQuery, lessonQuery, homeworkQuery, examQuery, packageQuery, paymentQuery];
  if (role === 'teacher') {
    promises.push(supabase.from('invites').select('id,student_id,target_role,code,expires_at,used_at,students(full_name)').eq('teacher_id', userId).order('created_at', { ascending: false }).limit(50));
  }

  const results = await Promise.all(promises);
  const [studentsRes, lessonsRes, homeworkRes, examsRes, packagesRes, paymentsRes, invitesRes] = results;
  for (const result of results) if (result.error) throw result.error;

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
  const packages: LessonPackage[] = (packagesRes.data ?? []).map((row: any) => ({
    id: row.id,
    student_id: row.student_id,
    student_name: row.students?.full_name ?? 'Öğrenci',
    total_lessons: row.total_lessons,
    used_lessons: row.used_lessons,
    remaining_lessons: Math.max(0, row.total_lessons - row.used_lessons),
    price: row.price === null ? null : Number(row.price),
    active: row.active,
  }));
  const payments: Payment[] = (paymentsRes.data ?? []).map((row: any) => ({
    id: row.id,
    student_id: row.student_id,
    student_name: row.students?.full_name ?? 'Öğrenci',
    amount: Number(row.amount),
    paid_at: row.paid_at,
    note: row.note,
  }));
  const invites: Invite[] = (invitesRes?.data ?? []).map((row: any) => ({
    id: row.id,
    student_id: row.student_id,
    student_name: row.students?.full_name ?? 'Öğrenci',
    target_role: row.target_role,
    code: row.code,
    expires_at: row.expires_at,
    used_at: row.used_at,
  }));

  const firstActivePackage = packages.find((p) => p.active && (role === 'teacher' || p.student_id === ids[0]));
  const packageInfo = firstActivePackage
    ? {
        total_lessons: firstActivePackage.total_lessons,
        used_lessons: firstActivePackage.used_lessons,
        remaining_lessons: firstActivePackage.remaining_lessons,
      }
    : null;

  return { students, lessons, homework, exams, packages, payments, invites, packageInfo };
}

async function ensureSubject(teacherId: string, subjectName: string) {
  if (!supabase) return `demo-subject-${subjectName}`;
  const clean = subjectName.trim() || 'Genel';
  const { data: existing, error: selectError } = await supabase
    .from('subjects')
    .select('id')
    .eq('teacher_id', teacherId)
    .ilike('name', clean)
    .maybeSingle();
  if (selectError) throw selectError;
  if (existing?.id) return existing.id as string;

  const { data, error } = await supabase.from('subjects').insert({ teacher_id: teacherId, name: clean }).select('id').single();
  if (!error && data?.id) return data.id as string;
  if ((error as any)?.code === '23505') {
    const retry = await supabase.from('subjects').select('id').eq('teacher_id', teacherId).ilike('name', clean).single();
    if (retry.error) throw retry.error;
    return retry.data.id as string;
  }
  throw error;
}

export async function createStudent(input: { teacherId: string; fullName: string; gradeLevel?: string; school?: string }) {
  if (!supabase) return { id: `demo-${Date.now()}` };
  const { data, error } = await supabase
    .from('students')
    .insert({
      teacher_id: input.teacherId,
      full_name: input.fullName.trim(),
      grade_level: input.gradeLevel?.trim() || null,
      school: input.school?.trim() || null,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

export async function createLesson(input: {
  teacherId: string;
  studentId: string;
  subjectName: string;
  startsAt: string;
  durationMinutes: number;
  topic: string;
}) {
  if (!supabase) return { id: `demo-${Date.now()}` };
  const subjectId = await ensureSubject(input.teacherId, input.subjectName);
  const { data, error } = await supabase
    .from('lessons')
    .insert({
      teacher_id: input.teacherId,
      student_id: input.studentId,
      subject_id: subjectId,
      starts_at: input.startsAt,
      duration_minutes: input.durationMinutes,
      topic: input.topic.trim() || null,
      status: 'planned',
      attendance: 'pending',
    })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

export async function createHomework(input: {
  teacherId: string;
  studentId: string;
  subjectName: string;
  title: string;
  description?: string;
  dueAt: string;
}) {
  if (!supabase) return { id: `demo-${Date.now()}` };
  const subjectId = await ensureSubject(input.teacherId, input.subjectName);
  const { data, error } = await supabase
    .from('homework')
    .insert({
      teacher_id: input.teacherId,
      student_id: input.studentId,
      subject_id: subjectId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      due_at: input.dueAt,
      status: 'assigned',
    })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

export async function createExamResult(input: {
  teacherId: string;
  studentId: string;
  subjectName: string;
  title: string;
  examDate: string;
  score: number;
  maxScore: number;
}) {
  if (!supabase) return { id: `demo-${Date.now()}` };
  const subjectId = await ensureSubject(input.teacherId, input.subjectName);
  const { data, error } = await supabase
    .from('exam_results')
    .insert({
      teacher_id: input.teacherId,
      student_id: input.studentId,
      subject_id: subjectId,
      title: input.title.trim(),
      exam_date: input.examDate,
      score: input.score,
      max_score: input.maxScore,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

export async function createPayment(input: { teacherId: string; studentId: string; amount: number; note?: string }) {
  if (!supabase) return { id: `demo-${Date.now()}` };
  const { data, error } = await supabase
    .from('payments')
    .insert({
      teacher_id: input.teacherId,
      student_id: input.studentId,
      amount: input.amount,
      note: input.note?.trim() || null,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

export async function createLessonPackage(input: { teacherId: string; studentId: string; totalLessons: number; price?: number | null }) {
  if (!supabase) return { id: `demo-${Date.now()}` };
  const deactivate = await supabase
    .from('lesson_packages')
    .update({ active: false })
    .eq('teacher_id', input.teacherId)
    .eq('student_id', input.studentId)
    .eq('active', true);
  if (deactivate.error) throw deactivate.error;

  const { data, error } = await supabase
    .from('lesson_packages')
    .insert({
      teacher_id: input.teacherId,
      student_id: input.studentId,
      total_lessons: input.totalLessons,
      used_lessons: 0,
      price: input.price ?? null,
      active: true,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

function makeInviteCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let part = '';
  for (let i = 0; i < 6; i += 1) part += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `DT-${part}`;
}

export async function createInvite(input: { teacherId: string; studentId: string; targetRole: 'parent' | 'student' }) {
  if (!supabase) return { code: makeInviteCode() };
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const code = makeInviteCode();
    const { data, error } = await supabase
      .from('invites')
      .insert({ teacher_id: input.teacherId, student_id: input.studentId, target_role: input.targetRole, code })
      .select('code')
      .single();
    if (!error && data) return data as { code: string };
    if ((error as any)?.code !== '23505') throw error;
  }
  throw new Error('Davet kodu üretilemedi. Lütfen tekrar deneyin.');
}

export async function completeLessonReport(input: {
  lessonId: string;
  attendance: 'present' | 'absent';
  topic?: string;
  teacherNote?: string;
}) {
  if (!supabase) return { ok: true };
  const { data, error } = await supabase.rpc('complete_lesson', {
    p_lesson_id: input.lessonId,
    p_attendance: input.attendance,
    p_topic: input.topic?.trim() || null,
    p_teacher_note: input.teacherNote?.trim() || null,
  });
  if (error) throw error;
  return data;
}

export async function submitHomework(homeworkId: string) {
  if (!supabase) return { ok: true };
  const { data, error } = await supabase.rpc('submit_homework', { p_homework_id: homeworkId });
  if (error) throw error;
  return data;
}

export async function setHomeworkStatus(homeworkId: string, status: HomeworkStatus) {
  if (!supabase) return { id: homeworkId };
  const { data, error } = await supabase.from('homework').update({ status }).eq('id', homeworkId).select('id').single();
  if (error) throw error;
  return data;
}

export async function redeemInvite(code: string) {
  if (!supabase) return { ok: true };
  const { data, error } = await supabase.rpc('redeem_invite', { p_code: code.trim().toUpperCase() });
  if (error) throw error;
  return data;
}
