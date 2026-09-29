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
  preparation_score?: number | null;
  participation_score?: number | null;
  mastery_score?: number | null;
  homework_score?: number | null;
  cancel_reason?: string | null;
  series_id?: string | null;
};

export type HomeworkStatus = 'assigned' | 'submitted' | 'reviewed';
export type HomeworkFileKind = 'assignment' | 'submission' | 'feedback';

export type HomeworkFile = {
  id: string;
  homework_id: string;
  student_id: string;
  uploaded_by: string;
  kind: HomeworkFileKind;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

export type Homework = {
  id: string;
  student_id: string;
  student_name: string;
  subject_name: string;
  title: string;
  description: string | null;
  due_at: string;
  status: HomeworkStatus;
  teacher_feedback?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
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
  correct_count?: number | null;
  wrong_count?: number | null;
  blank_count?: number | null;
  note?: string | null;
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

export type AppNotification = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

export type TopicProgress = {
  id: string;
  student_id: string;
  subject_name: string;
  topic_name: string;
  mastery_percent: number;
  note: string | null;
  updated_at: string;
};

export type StudyGoal = {
  id: string;
  student_id: string;
  title: string;
  target_value: number;
  current_value: number;
  due_date: string | null;
  completed: boolean;
};


export type Message = {
  id: string;
  teacher_id: string;
  student_id: string;
  sender_id: string;
  sender_name: string | null;
  body: string;
  created_at: string;
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
  homeworkFiles: HomeworkFile[];
  exams: ExamResult[];
  packages: LessonPackage[];
  payments: Payment[];
  invites: Invite[];
  notifications: AppNotification[];
  topicProgress: TopicProgress[];
  goals: StudyGoal[];
  messages: Message[];
  packageInfo: PackageInfo | null;
};

export type TeacherActionRequest =
  | { type: 'student' }
  | { type: 'lesson'; studentId?: string }
  | { type: 'homework'; studentId?: string }
  | { type: 'exam'; studentId?: string }
  | { type: 'payment'; studentId?: string }
  | { type: 'package'; studentId?: string }
  | { type: 'invite'; studentId?: string }
  | { type: 'topicProgress'; studentId?: string }
  | { type: 'goal'; studentId?: string }
  | { type: 'completeLesson'; lesson: Lesson }
  | { type: 'lessonManage'; lesson: Lesson }
  | { type: 'reviewHomework'; homework: Homework };
