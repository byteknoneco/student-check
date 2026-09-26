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
export type AttendanceStatus = 'pending' | 'present' | 'absent';

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
  attendance: AttendanceStatus;
};

export type HomeworkStatus = 'assigned' | 'submitted' | 'reviewed';

export type Homework = {
  id: string;
  student_id: string;
  student_name: string;
  subject_name: string;
  title: string;
  description: string | null;
  due_at: string;
  status: HomeworkStatus;
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

export type LessonPackage = {
  id: string;
  student_id: string;
  student_name: string;
  total_lessons: number;
  used_lessons: number;
  remaining_lessons: number;
  price: number | null;
  active: boolean;
};

export type Payment = {
  id: string;
  student_id: string;
  student_name: string;
  amount: number;
  paid_at: string;
  note: string | null;
};

export type Invite = {
  id: string;
  student_id: string;
  student_name: string;
  target_role: 'parent' | 'student';
  code: string;
  expires_at: string;
  used_at: string | null;
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
  packages: LessonPackage[];
  payments: Payment[];
  invites: Invite[];
  packageInfo: PackageInfo | null;
};

export type TeacherActionRequest =
  | { type: 'student' }
  | { type: 'lesson' }
  | { type: 'homework' }
  | { type: 'exam' }
  | { type: 'payment' }
  | { type: 'package' }
  | { type: 'invite' }
  | { type: 'completeLesson'; lesson: Lesson }
  | { type: 'reviewHomework'; homework: Homework };
