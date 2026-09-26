-- DersTakip+ Supabase schema
-- Run this file once in Supabase SQL Editor.

create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('teacher', 'parent', 'student');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.lesson_status as enum ('planned', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.attendance_status as enum ('pending', 'present', 'absent');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.homework_status as enum ('assigned', 'submitted', 'reviewed');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.invite_role as enum ('parent', 'student');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role public.user_role not null default 'student',
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  user_id uuid unique references public.profiles(id) on delete set null,
  full_name text not null,
  grade_level text,
  school text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.parent_students (
  parent_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (parent_id, student_id)
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (teacher_id, name)
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  starts_at timestamptz not null,
  duration_minutes integer not null default 60 check (duration_minutes between 15 and 360),
  status public.lesson_status not null default 'planned',
  topic text,
  teacher_note text,
  attendance public.attendance_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.homework (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  description text,
  due_at timestamptz not null,
  status public.homework_status not null default 'assigned',
  created_at timestamptz not null default now()
);

create table if not exists public.exam_results (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  exam_date date not null default current_date,
  score numeric(8,2) not null,
  max_score numeric(8,2) not null default 100 check (max_score > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_packages (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  total_lessons integer not null check (total_lessons > 0),
  used_lessons integer not null default 0 check (used_lessons >= 0),
  price numeric(10,2),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  amount numeric(10,2) not null check (amount >= 0),
  paid_at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  target_role public.invite_role not null,
  code text not null unique,
  expires_at timestamptz not null default (now() + interval '14 days'),
  used_by uuid references public.profiles(id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- Create a profile whenever a Supabase Auth user is created.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case when coalesce(new.raw_user_meta_data->>'role','student') in ('teacher','parent','student')
      then (new.raw_user_meta_data->>'role')::public.user_role else 'student'::public.user_role end
  ) on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Helper: whether current user may view a student's data.
create or replace function public.can_access_student(p_student_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.students s
    where s.id = p_student_id
      and (
        s.teacher_id = auth.uid()
        or s.user_id = auth.uid()
        or exists (select 1 from public.parent_students ps where ps.student_id = s.id and ps.parent_id = auth.uid())
      )
  );
$$;

-- Invite redemption. The client only knows the short code; links are created server-side.
create or replace function public.redeem_invite(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_invite public.invites%rowtype;
  v_role public.user_role;
begin
  select role into v_role from public.profiles where id = auth.uid();
  select * into v_invite from public.invites where upper(code) = upper(trim(p_code)) and used_at is null and expires_at > now() for update;
  if not found then raise exception 'Davet kodu geçersiz veya süresi dolmuş.'; end if;
  if v_role::text <> v_invite.target_role::text then raise exception 'Bu kod hesap rolünüzle uyumlu değil.'; end if;
  if v_invite.target_role = 'student' then
    update public.students set user_id = auth.uid() where id = v_invite.student_id and user_id is null;
    if not found then raise exception 'Öğrenci hesabı daha önce bağlanmış.'; end if;
  else
    insert into public.parent_students(parent_id, student_id) values (auth.uid(), v_invite.student_id) on conflict do nothing;
  end if;
  update public.invites set used_by = auth.uid(), used_at = now() where id = v_invite.id;
  return jsonb_build_object('ok', true, 'student_id', v_invite.student_id);
end; $$;


-- Complete a lesson report and consume one active package credit exactly once.
create or replace function public.complete_lesson(
  p_lesson_id uuid,
  p_attendance text,
  p_topic text default null,
  p_teacher_note text default null
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_lesson public.lessons%rowtype;
  v_package_id uuid;
  v_package_incremented boolean := false;
begin
  if p_attendance not in ('present', 'absent') then raise exception 'Geçersiz katılım durumu.'; end if;
  select * into v_lesson from public.lessons where id = p_lesson_id and teacher_id = auth.uid() for update;
  if not found then raise exception 'Ders bulunamadı veya bu ders için yetkiniz yok.'; end if;

  update public.lessons
  set status = 'completed'::public.lesson_status,
      attendance = p_attendance::public.attendance_status,
      topic = coalesce(nullif(trim(p_topic), ''), topic),
      teacher_note = nullif(trim(p_teacher_note), '')
  where id = p_lesson_id;

  if v_lesson.status <> 'completed'::public.lesson_status and p_attendance = 'present' then
    select id into v_package_id from public.lesson_packages
    where student_id = v_lesson.student_id and teacher_id = auth.uid() and active = true and used_lessons < total_lessons
    order by created_at desc limit 1 for update;
    if v_package_id is not null then
      update public.lesson_packages set used_lessons = used_lessons + 1 where id = v_package_id;
      v_package_incremented := true;
    end if;
  end if;
  return jsonb_build_object('ok', true, 'lesson_id', p_lesson_id, 'package_incremented', v_package_incremented);
end; $$;

-- Allow a linked student to mark only their own homework as submitted.
create or replace function public.submit_homework(p_homework_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_homework public.homework%rowtype;
begin
  select h.* into v_homework
  from public.homework h
  join public.students s on s.id = h.student_id
  where h.id = p_homework_id and s.user_id = auth.uid()
  for update of h;
  if not found then raise exception 'Ödev bulunamadı veya bu ödev için yetkiniz yok.'; end if;
  if v_homework.status = 'reviewed'::public.homework_status then raise exception 'Bu ödev zaten tamamlandı.'; end if;
  update public.homework set status = 'submitted'::public.homework_status where id = p_homework_id;
  return jsonb_build_object('ok', true, 'homework_id', p_homework_id);
end; $$;

grant execute on function public.redeem_invite(text) to authenticated;
grant execute on function public.can_access_student(uuid) to authenticated;
grant execute on function public.complete_lesson(uuid, text, text, text) to authenticated;
grant execute on function public.submit_homework(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.parent_students enable row level security;
alter table public.subjects enable row level security;
alter table public.lessons enable row level security;
alter table public.homework enable row level security;
alter table public.exam_results enable row level security;
alter table public.lesson_packages enable row level security;
alter table public.payments enable row level security;
alter table public.invites enable row level security;

-- Profiles
drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select" on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Students: teacher owns records; linked parent/student can read.
drop policy if exists "students_select_access" on public.students;
create policy "students_select_access" on public.students for select to authenticated using (public.can_access_student(id));
drop policy if exists "students_teacher_insert" on public.students;
create policy "students_teacher_insert" on public.students for insert to authenticated with check (teacher_id = auth.uid());
drop policy if exists "students_teacher_update" on public.students;
create policy "students_teacher_update" on public.students for update to authenticated using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
drop policy if exists "students_teacher_delete" on public.students;
create policy "students_teacher_delete" on public.students for delete to authenticated using (teacher_id = auth.uid());

-- Parent/student links can be read by relevant account or owning teacher.
drop policy if exists "parent_students_select" on public.parent_students;
create policy "parent_students_select" on public.parent_students for select to authenticated using (
  parent_id = auth.uid() or exists (select 1 from public.students s where s.id = student_id and s.teacher_id = auth.uid())
);

-- Subjects
drop policy if exists "subjects_select" on public.subjects;
create policy "subjects_select" on public.subjects for select to authenticated using (
  teacher_id = auth.uid() or exists (select 1 from public.students s where s.teacher_id = subjects.teacher_id and public.can_access_student(s.id))
);
drop policy if exists "subjects_teacher_write" on public.subjects;
create policy "subjects_teacher_write" on public.subjects for all to authenticated using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

-- Shared child-data tables: accessible to linked users, writable by owning teacher.
drop policy if exists "lessons_select" on public.lessons;
create policy "lessons_select" on public.lessons for select to authenticated using (public.can_access_student(student_id));
drop policy if exists "lessons_teacher_write" on public.lessons;
create policy "lessons_teacher_write" on public.lessons for all to authenticated using (teacher_id = auth.uid()) with check (teacher_id = auth.uid() and public.can_access_student(student_id));
drop policy if exists "homework_select" on public.homework;
create policy "homework_select" on public.homework for select to authenticated using (public.can_access_student(student_id));
drop policy if exists "homework_teacher_write" on public.homework;
create policy "homework_teacher_write" on public.homework for all to authenticated using (teacher_id = auth.uid()) with check (teacher_id = auth.uid() and public.can_access_student(student_id));
drop policy if exists "exam_results_select" on public.exam_results;
create policy "exam_results_select" on public.exam_results for select to authenticated using (public.can_access_student(student_id));
drop policy if exists "exam_results_teacher_write" on public.exam_results;
create policy "exam_results_teacher_write" on public.exam_results for all to authenticated using (teacher_id = auth.uid()) with check (teacher_id = auth.uid() and public.can_access_student(student_id));
drop policy if exists "packages_select" on public.lesson_packages;
create policy "packages_select" on public.lesson_packages for select to authenticated using (public.can_access_student(student_id));
drop policy if exists "packages_teacher_write" on public.lesson_packages;
create policy "packages_teacher_write" on public.lesson_packages for all to authenticated using (teacher_id = auth.uid()) with check (teacher_id = auth.uid() and public.can_access_student(student_id));
drop policy if exists "payments_select" on public.payments;
create policy "payments_select" on public.payments for select to authenticated using (
  teacher_id = auth.uid()
  or exists (select 1 from public.parent_students ps where ps.student_id = payments.student_id and ps.parent_id = auth.uid())
);
drop policy if exists "payments_teacher_write" on public.payments;
create policy "payments_teacher_write" on public.payments for all to authenticated using (teacher_id = auth.uid()) with check (teacher_id = auth.uid() and public.can_access_student(student_id));

-- Invites are managed/read only by the teacher. Redemption happens via security-definer RPC.
drop policy if exists "invites_teacher_select" on public.invites;
create policy "invites_teacher_select" on public.invites for select to authenticated using (teacher_id = auth.uid());
drop policy if exists "invites_teacher_insert" on public.invites;
create policy "invites_teacher_insert" on public.invites for insert to authenticated with check (teacher_id = auth.uid());
drop policy if exists "invites_teacher_update" on public.invites;
create policy "invites_teacher_update" on public.invites for update to authenticated using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
drop policy if exists "invites_teacher_delete" on public.invites;
create policy "invites_teacher_delete" on public.invites for delete to authenticated using (teacher_id = auth.uid());

-- Helpful indexes
create index if not exists idx_students_teacher on public.students(teacher_id);
create index if not exists idx_lessons_student_start on public.lessons(student_id, starts_at);
create index if not exists idx_homework_student_due on public.homework(student_id, due_at);
create index if not exists idx_exams_student_date on public.exam_results(student_id, exam_date);
create index if not exists idx_invites_code on public.invites(code);
