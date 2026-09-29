import { demoData } from '../data/mock';
import { supabase } from '../lib/supabase';
import {
  AppNotification,
  DashboardData,
  ExamResult,
  Homework,
  HomeworkFile,
  HomeworkStatus,
  Invite,
  Lesson,
  LessonPackage,
  Payment,
  Message,
  Student,
  StudyGoal,
  TopicProgress,
  UserRole,
} from '../types';

const empty: DashboardData = {
  students: [], lessons: [], homework: [], homeworkFiles: [], exams: [], packages: [], payments: [], invites: [],
  notifications: [], topicProgress: [], goals: [], messages: [], packageInfo: null,
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
      packages: [], payments: [], invites: [], notifications: [], topicProgress: [], goals: [], messages: [], homeworkFiles: [],
    } as DashboardData;
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
  const notificationQuery = supabase.from('notifications').select('id,user_id,title,body,type,data,read_at,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(100);
  if (!ids.length) {
    const notificationsRes = await notificationQuery;
    if (notificationsRes.error) throw notificationsRes.error;
    return { ...empty, notifications: (notificationsRes.data ?? []) as AppNotification[] };
  }

  const queries: any[] = [
    supabase.from('students').select('id,full_name,grade_level,school,active,user_id').in('id', ids).order('full_name'),
    supabase.from('lessons').select('id,student_id,starts_at,duration_minutes,status,topic,teacher_note,attendance,preparation_score,participation_score,mastery_score,homework_score,cancel_reason,series_id,students(full_name),subjects(name)').in('student_id', ids).order('starts_at'),
    supabase.from('homework').select('id,student_id,title,description,due_at,status,teacher_feedback,submitted_at,reviewed_at,students(full_name),subjects(name)').in('student_id', ids).order('due_at'),
    supabase.from('homework_files').select('id,homework_id,student_id,uploaded_by,kind,storage_path,file_name,mime_type,size_bytes,created_at').in('student_id', ids).order('created_at'),
    supabase.from('exam_results').select('id,student_id,title,exam_date,score,max_score,correct_count,wrong_count,blank_count,note,students(full_name),subjects(name)').in('student_id', ids).order('exam_date'),
    supabase.from('lesson_packages').select('id,student_id,total_lessons,used_lessons,price,active,created_at,students(full_name)').in('student_id', ids).order('created_at', { ascending: false }),
    supabase.from('payments').select('id,student_id,amount,paid_at,note,students(full_name)').in('student_id', ids).order('paid_at', { ascending: false }),
    notificationQuery,
    supabase.from('topic_progress').select('id,student_id,subject_name,topic_name,mastery_percent,note,updated_at').in('student_id', ids).order('updated_at', { ascending: false }),
    supabase.from('study_goals').select('id,student_id,title,target_value,current_value,due_date,completed').in('student_id', ids).order('created_at', { ascending: false }),
    supabase.from('messages').select('id,teacher_id,student_id,sender_id,sender_name,body,created_at').in('student_id', ids).order('created_at'),
  ];
  if (role === 'teacher') queries.push(supabase.from('invites').select('id,student_id,target_role,code,expires_at,used_at,students(full_name)').eq('teacher_id', userId).order('created_at', { ascending: false }).limit(50));

  const results = await Promise.all(queries);
  for (const result of results) if (result.error) throw result.error;
  const [studentsRes, lessonsRes, homeworkRes, homeworkFilesRes, examsRes, packagesRes, paymentsRes, notificationsRes, progressRes, goalsRes, messagesRes, invitesRes] = results;

  const students = (studentsRes.data ?? []) as Student[];
  const lessons: Lesson[] = (lessonsRes.data ?? []).map((r: any) => ({
    id:r.id, student_id:r.student_id, student_name:r.students?.full_name ?? 'Ogrenci', subject_name:r.subjects?.name ?? 'Ders', starts_at:r.starts_at,
    duration_minutes:r.duration_minutes, status:r.status, topic:r.topic, teacher_note:r.teacher_note, attendance:r.attendance,
    preparation_score:r.preparation_score, participation_score:r.participation_score, mastery_score:r.mastery_score, homework_score:r.homework_score,
    cancel_reason:r.cancel_reason, series_id:r.series_id,
  }));
  const homework: Homework[] = (homeworkRes.data ?? []).map((r: any) => ({
    id:r.id, student_id:r.student_id, student_name:r.students?.full_name ?? 'Ogrenci', subject_name:r.subjects?.name ?? 'Ders', title:r.title,
    description:r.description, due_at:r.due_at, status:r.status, teacher_feedback:r.teacher_feedback, submitted_at:r.submitted_at, reviewed_at:r.reviewed_at,
  }));
  const homeworkFiles = (homeworkFilesRes.data ?? []).map((r:any)=>({ ...r, size_bytes:Number(r.size_bytes) })) as HomeworkFile[];
  const exams: ExamResult[] = (examsRes.data ?? []).map((r:any)=>({ id:r.id, student_id:r.student_id, student_name:r.students?.full_name ?? 'Ogrenci', subject_name:r.subjects?.name ?? 'Ders', title:r.title, exam_date:r.exam_date, score:Number(r.score), max_score:Number(r.max_score), correct_count:r.correct_count, wrong_count:r.wrong_count, blank_count:r.blank_count, note:r.note }));
  const packages: LessonPackage[] = (packagesRes.data ?? []).map((r:any)=>({ id:r.id, student_id:r.student_id, student_name:r.students?.full_name ?? 'Ogrenci', total_lessons:r.total_lessons, used_lessons:r.used_lessons, remaining_lessons:Math.max(0,r.total_lessons-r.used_lessons), price:r.price===null?null:Number(r.price), active:r.active }));
  const payments: Payment[] = (paymentsRes.data ?? []).map((r:any)=>({ id:r.id, student_id:r.student_id, student_name:r.students?.full_name ?? 'Ogrenci', amount:Number(r.amount), paid_at:r.paid_at, note:r.note }));
  const invites: Invite[] = (invitesRes?.data ?? []).map((r:any)=>({ id:r.id, student_id:r.student_id, student_name:r.students?.full_name ?? 'Ogrenci', target_role:r.target_role, code:r.code, expires_at:r.expires_at, used_at:r.used_at }));
  const notifications = (notificationsRes.data ?? []) as AppNotification[];
  const topicProgress = (progressRes.data ?? []).map((r:any)=>({ ...r, mastery_percent:Number(r.mastery_percent) })) as TopicProgress[];
  const goals = (goalsRes.data ?? []).map((r:any)=>({ ...r, target_value:Number(r.target_value), current_value:Number(r.current_value) })) as StudyGoal[];
  const messages = (messagesRes.data ?? []) as Message[];
  const firstActivePackage = packages.find((p) => p.active && (role === 'teacher' || p.student_id === ids[0]));
  const packageInfo = firstActivePackage ? { total_lessons:firstActivePackage.total_lessons, used_lessons:firstActivePackage.used_lessons, remaining_lessons:firstActivePackage.remaining_lessons } : null;
  return { students, lessons, homework, homeworkFiles, exams, packages, payments, invites, notifications, topicProgress, goals, messages, packageInfo };
}

async function ensureSubject(teacherId: string, subjectName: string) {
  if (!supabase) return `demo-subject-${subjectName}`;
  const clean = subjectName.trim() || 'Genel';
  const existing = await supabase.from('subjects').select('id').eq('teacher_id', teacherId).ilike('name', clean).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data?.id) return existing.data.id as string;
  const insert = await supabase.from('subjects').insert({ teacher_id: teacherId, name: clean }).select('id').single();
  if (!insert.error && insert.data?.id) return insert.data.id as string;
  if ((insert.error as any)?.code === '23505') {
    const retry = await supabase.from('subjects').select('id').eq('teacher_id', teacherId).ilike('name', clean).single();
    if (retry.error) throw retry.error;
    return retry.data.id as string;
  }
  throw insert.error;
}

export async function createStudent(input:{fullName:string;gradeLevel?:string;school?:string}) {
  if (!supabase) return { id:`demo-${Date.now()}` };
  const { data,error } = await supabase.rpc('create_student',{ p_full_name:input.fullName.trim(),p_grade_level:input.gradeLevel?.trim()||null,p_school:input.school?.trim()||null });
  if (error) throw error; return { id:data as string };
}

export async function createLesson(input:{teacherId:string;studentId:string;subjectName:string;startsAt:string;durationMinutes:number;topic:string;repeatWeeks?:number}) {
  if (!supabase) return { id:`demo-${Date.now()}` };
  const subjectId = await ensureSubject(input.teacherId,input.subjectName);
  const repeatWeeks = Math.max(1, Math.min(52, input.repeatWeeks ?? 1));
  if (repeatWeeks > 1) {
    const { data,error } = await supabase.rpc('create_recurring_lessons',{ p_student_id:input.studentId,p_subject_id:subjectId,p_starts_at:input.startsAt,p_duration_minutes:input.durationMinutes,p_topic:input.topic.trim()||null,p_weeks:repeatWeeks });
    if (error) throw error; return data;
  }
  const { data,error } = await supabase.from('lessons').insert({ teacher_id:input.teacherId,student_id:input.studentId,subject_id:subjectId,starts_at:input.startsAt,duration_minutes:input.durationMinutes,topic:input.topic.trim()||null,status:'planned',attendance:'pending' }).select('id').single();
  if (error) throw error; return data;
}

export async function createHomework(input:{teacherId:string;studentId:string;subjectName:string;title:string;description?:string;dueAt:string}) {
  if (!supabase) return { id:`demo-${Date.now()}` };
  const subjectId=await ensureSubject(input.teacherId,input.subjectName);
  const { data,error }=await supabase.from('homework').insert({teacher_id:input.teacherId,student_id:input.studentId,subject_id:subjectId,title:input.title.trim(),description:input.description?.trim()||null,due_at:input.dueAt,status:'assigned'}).select('id').single();
  if(error) throw error; return data;
}

export async function createExamResult(input:{teacherId:string;studentId:string;subjectName:string;title:string;examDate:string;score:number;maxScore:number;correctCount?:number|null;wrongCount?:number|null;blankCount?:number|null;note?:string}) {
  if(!supabase) return {id:`demo-${Date.now()}`}; const subjectId=await ensureSubject(input.teacherId,input.subjectName);
  const {data,error}=await supabase.from('exam_results').insert({teacher_id:input.teacherId,student_id:input.studentId,subject_id:subjectId,title:input.title.trim(),exam_date:input.examDate,score:input.score,max_score:input.maxScore,correct_count:input.correctCount??null,wrong_count:input.wrongCount??null,blank_count:input.blankCount??null,note:input.note?.trim()||null}).select('id').single();
  if(error) throw error; return data;
}

export async function createPayment(input:{teacherId:string;studentId:string;amount:number;note?:string}) {
  if(!supabase) return {id:`demo-${Date.now()}`}; const {data,error}=await supabase.from('payments').insert({teacher_id:input.teacherId,student_id:input.studentId,amount:input.amount,note:input.note?.trim()||null}).select('id').single(); if(error) throw error; return data;
}

export async function createLessonPackage(input:{teacherId:string;studentId:string;totalLessons:number;price?:number|null}) {
  if(!supabase) return {id:`demo-${Date.now()}`};
  const d=await supabase.from('lesson_packages').update({active:false}).eq('teacher_id',input.teacherId).eq('student_id',input.studentId).eq('active',true); if(d.error) throw d.error;
  const {data,error}=await supabase.from('lesson_packages').insert({teacher_id:input.teacherId,student_id:input.studentId,total_lessons:input.totalLessons,used_lessons:0,price:input.price??null,active:true}).select('id').single(); if(error) throw error; return data;
}

function makeInviteCode(){const a='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let p='';for(let i=0;i<6;i+=1)p+=a[Math.floor(Math.random()*a.length)];return `DT-${p}`;}
export async function createInvite(input:{teacherId:string;studentId:string;targetRole:'parent'|'student'}) {
  if(!supabase) return {code:makeInviteCode()};
  for(let i=0;i<4;i+=1){const code=makeInviteCode();const {data,error}=await supabase.from('invites').insert({teacher_id:input.teacherId,student_id:input.studentId,target_role:input.targetRole,code}).select('code').single();if(!error&&data)return data as {code:string};if((error as any)?.code!=='23505')throw error;}
  throw new Error('Davet kodu uretilemedi. Lutfen tekrar deneyin.');
}

export async function completeLessonReport(input:{lessonId:string;attendance:'present'|'absent';topic?:string;teacherNote?:string;preparationScore?:number;participationScore?:number;masteryScore?:number;homeworkScore?:number}) {
  if(!supabase) return {ok:true};
  const {data,error}=await supabase.rpc('complete_lesson_v03',{p_lesson_id:input.lessonId,p_attendance:input.attendance,p_topic:input.topic?.trim()||null,p_teacher_note:input.teacherNote?.trim()||null,p_preparation_score:input.preparationScore??null,p_participation_score:input.participationScore??null,p_mastery_score:input.masteryScore??null,p_homework_score:input.homeworkScore??null});
  if(error) throw error; return data;
}

export async function cancelLesson(lessonId:string,reason?:string){if(!supabase)return {ok:true};const {data,error}=await supabase.rpc('cancel_lesson',{p_lesson_id:lessonId,p_reason:reason?.trim()||null});if(error)throw error;return data;}
export async function rescheduleLesson(lessonId:string,newStartsAt:string){if(!supabase)return {ok:true};const {data,error}=await supabase.rpc('reschedule_lesson',{p_lesson_id:lessonId,p_new_starts_at:newStartsAt});if(error)throw error;return data;}

export async function submitHomework(homeworkId:string){if(!supabase)return {ok:true};const {data,error}=await supabase.rpc('submit_homework',{p_homework_id:homeworkId});if(error)throw error;return data;}
export async function reviewHomework(homeworkId:string,feedback?:string){if(!supabase)return {ok:true};const {data,error}=await supabase.rpc('review_homework',{p_homework_id:homeworkId,p_feedback:feedback?.trim()||null});if(error)throw error;return data;}
export async function setHomeworkStatus(homeworkId:string,status:HomeworkStatus){if(!supabase)return {id:homeworkId};const {data,error}=await supabase.from('homework').update({status}).eq('id',homeworkId).select('id').single();if(error)throw error;return data;}
export async function redeemInvite(code:string){if(!supabase)return {ok:true};const {data,error}=await supabase.rpc('redeem_invite',{p_code:code.trim().toUpperCase()});if(error)throw error;return data;}

export async function markNotificationRead(id:string){if(!supabase)return;const {error}=await supabase.from('notifications').update({read_at:new Date().toISOString()}).eq('id',id);if(error)throw error;}
export async function markAllNotificationsRead(){if(!supabase)return;const {error}=await supabase.from('notifications').update({read_at:new Date().toISOString()}).is('read_at',null);if(error)throw error;}

export async function upsertTopicProgress(input:{teacherId:string;studentId:string;subjectName:string;topicName:string;masteryPercent:number;note?:string}) {
  if(!supabase)return {id:`demo-${Date.now()}`};
  const {data,error}=await supabase.from('topic_progress').upsert({teacher_id:input.teacherId,student_id:input.studentId,subject_name:input.subjectName.trim(),topic_name:input.topicName.trim(),mastery_percent:input.masteryPercent,note:input.note?.trim()||null,updated_at:new Date().toISOString()},{onConflict:'student_id,subject_name,topic_name'}).select('id').single();
  if(error)throw error;return data;
}

export async function createStudyGoal(input:{teacherId:string;studentId:string;title:string;targetValue:number;dueDate?:string}) {
  if(!supabase)return {id:`demo-${Date.now()}`};
  const {data,error}=await supabase.from('study_goals').insert({teacher_id:input.teacherId,student_id:input.studentId,title:input.title.trim(),target_value:input.targetValue,current_value:0,due_date:input.dueDate||null}).select('id').single(); if(error)throw error;return data;
}

export async function updateStudyGoal(goalId:string,currentValue:number){if(!supabase)return {ok:true};const {data,error}=await supabase.rpc('update_study_goal',{p_goal_id:goalId,p_current_value:currentValue});if(error)throw error;return data;}

export async function deleteMyAccount() {
  if (!supabase) return { ok: true };
  const { data, error } = await supabase.functions.invoke('delete-account', { body: {} });
  if (error) throw error;
  return data;
}

export async function sendMessage(input:{studentId:string;senderId:string;body:string}) {
  if(!supabase)return {id:`demo-${Date.now()}`};
  const student=await supabase.from('students').select('teacher_id').eq('id',input.studentId).single(); if(student.error)throw student.error;
  const {data,error}=await supabase.from('messages').insert({teacher_id:student.data.teacher_id,student_id:input.studentId,sender_id:input.senderId,body:input.body.trim()}).select('id').single(); if(error)throw error; return data;
}
