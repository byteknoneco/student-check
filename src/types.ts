export type UserRole = 'teacher' | 'parent' | 'student';

export type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string | null;
};

export type Student = {
  id: string;
  full_name: string;
  grade_level: string | null;
  school: string | null;
  active: boolean;
  user_id?: string | null;
};

export type LessonStatus = 'planned' | 'completed' | 'cancelled';

export type Lesson = {
  id: string;
  student_id: string;
  student_name: string;
  subject_name: string;
  starts_at: string;
  duration_minutes: number;
  status: LessonStatus;
  topic: string | null;
  teacher_note: string | null;
  attendance: 'pending' | 'present' | 'absent';
};

export type Homework = {
  id: string;
  student_id: string;
  student_name: string;
  subject_name: string;
  title: string;
  description: string | null;
  due_at: string;
  status: 'assigned' | 'submitted' | 'reviewed';
};

export type ExamResult = {
  id: string;
  student_id: string;
  student_name: string;
  subject_name: string;
  title: string;
  exam_date: string;
  score: number;
  max_score: number;
};

export type PackageInfo = {
  total_lessons: number;
  used_lessons: number;
  remaining_lessons: number;
};

export type DashboardData = {
  students: Student[];
  lessons: Lesson[];
  homework: Homework[];
  exams: ExamResult[];
  packageInfo: PackageInfo | null;
};
