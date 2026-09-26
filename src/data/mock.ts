import { DashboardData, Profile, UserRole } from '../types';

export const demoProfiles: Record<UserRole, Profile> = {
  teacher: { id: 'demo-teacher', full_name: 'Öğretmen', role: 'teacher' },
  parent: { id: 'demo-parent', full_name: 'Ayşe Yılmaz', role: 'parent' },
  student: { id: 'demo-student-user', full_name: 'Ahmet Yılmaz', role: 'student' },
};

const today = new Date();
const at = (dayOffset: number, hour: number, minute = 0) => {
  const d = new Date(today);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

export const demoData: DashboardData = {
  students: [
    { id: 's1', full_name: 'Ahmet Yılmaz', grade_level: '11. Sınıf', school: 'Anadolu Lisesi', active: true },
    { id: 's2', full_name: 'Elif Kaya', grade_level: '10. Sınıf', school: 'Fen Lisesi', active: true },
    { id: 's3', full_name: 'Mert Demir', grade_level: '12. Sınıf', school: 'Anadolu Lisesi', active: true },
    { id: 's4', full_name: 'Zeynep Aydın', grade_level: '9. Sınıf', school: 'Kolej', active: true },
  ],
  lessons: [
    { id: 'l1', student_id: 's1', student_name: 'Ahmet Yılmaz', subject_name: 'Matematik', starts_at: at(0, 18), duration_minutes: 60, status: 'planned', topic: 'Türev Uygulamaları', teacher_note: null, attendance: 'pending' },
    { id: 'l2', student_id: 's2', student_name: 'Elif Kaya', subject_name: 'Matematik', starts_at: at(0, 19, 30), duration_minutes: 60, status: 'planned', topic: 'Fonksiyonlar', teacher_note: null, attendance: 'pending' },
    { id: 'l3', student_id: 's1', student_name: 'Ahmet Yılmaz', subject_name: 'Matematik', starts_at: at(-3, 18), duration_minutes: 60, status: 'completed', topic: 'Türev', teacher_note: 'Konu kavrayışı iyi. Problem çözme hızını artıracağız.', attendance: 'present' },
    { id: 'l4', student_id: 's3', student_name: 'Mert Demir', subject_name: 'Matematik', starts_at: at(1, 17), duration_minutes: 90, status: 'planned', topic: 'AYT Deneme Analizi', teacher_note: null, attendance: 'pending' },
  ],
  homework: [
    { id: 'h1', student_id: 's1', student_name: 'Ahmet Yılmaz', subject_name: 'Matematik', title: 'Türev Testi 4', description: '1-25 arası sorular.', due_at: at(2, 21), status: 'assigned' },
    { id: 'h2', student_id: 's2', student_name: 'Elif Kaya', subject_name: 'Matematik', title: 'Fonksiyon Tarama Testi', description: null, due_at: at(3, 21), status: 'submitted' },
    { id: 'h3', student_id: 's1', student_name: 'Ahmet Yılmaz', subject_name: 'Matematik', title: 'Grafik yorumlama', description: '10 karma soru.', due_at: at(-1, 20), status: 'reviewed' },
  ],
  exams: [
    { id: 'e1', student_id: 's1', student_name: 'Ahmet Yılmaz', subject_name: 'Matematik', title: 'Konu Tarama 1', exam_date: at(-40, 12), score: 72, max_score: 100 },
    { id: 'e2', student_id: 's1', student_name: 'Ahmet Yılmaz', subject_name: 'Matematik', title: 'Konu Tarama 2', exam_date: at(-21, 12), score: 78, max_score: 100 },
    { id: 'e3', student_id: 's1', student_name: 'Ahmet Yılmaz', subject_name: 'Matematik', title: 'Konu Tarama 3', exam_date: at(-5, 12), score: 84, max_score: 100 },
  ],
  packageInfo: { total_lessons: 10, used_lessons: 6, remaining_lessons: 4 },
};
