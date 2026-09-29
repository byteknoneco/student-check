-- DersTakip+ v0.3 platform migration
-- Run after 002_core_features.sql and 003_student_create_rpc.sql.

create extension if not exists pgcrypto;

alter table public.lessons add column if not exists preparation_score integer check (preparation_score between 1 and 5);
alter table public.lessons add column if not exists participation_score integer check (participation_score between 1 and 5);
alter table public.lessons add column if not exists mastery_score integer check (mastery_score between 1 and 5);
alter table public.lessons add column if not exists homework_score integer check (homework_score between 1 and 5);
alter table public.lessons add column if not exists cancel_reason text;
alter table public.lessons add column if not exists series_id uuid;

alter table public.homework add column if not exists teacher_feedback text;
alter table public.homework add column if not exists submitted_at timestamptz;
alter table public.homework add column if not exists reviewed_at timestamptz;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  type text not null default 'general',
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null unique,
  platform text,
  device_name text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.topic_progress (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  subject_name text not null,
  topic_name text not null,
  mastery_percent integer not null default 0 check (mastery_percent between 0 and 100),
  note text,
  updated_at timestamptz not null default now(),
  unique(student_id, subject_name, topic_name)
);

create table if not exists public.study_goals (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  title text not null,
  target_value numeric(10,2) not null default 1 check (target_value > 0),
  current_value numeric(10,2) not null default 0 check (current_value >= 0),
  due_date date,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notifications enable row level security;
alter table public.push_tokens enable row level security;
alter table public.topic_progress enable row level security;
alter table public.study_goals enable row level security;

drop policy if exists "notifications_self_select" on public.notifications;
create policy "notifications_self_select" on public.notifications for select to authenticated using (user_id = auth.uid());
drop policy if exists "notifications_self_update" on public.notifications;
create policy "notifications_self_update" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "push_tokens_self_all" on public.push_tokens;
create policy "push_tokens_self_all" on public.push_tokens for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "topic_progress_select" on public.topic_progress;
create policy "topic_progress_select" on public.topic_progress for select to authenticated using (public.can_access_student(student_id));
drop policy if exists "topic_progress_teacher_write" on public.topic_progress;
create policy "topic_progress_teacher_write" on public.topic_progress for all to authenticated using (teacher_id = auth.uid()) with check (teacher_id = auth.uid() and public.can_access_student(student_id));

drop policy if exists "study_goals_select" on public.study_goals;
create policy "study_goals_select" on public.study_goals for select to authenticated using (public.can_access_student(student_id));
drop policy if exists "study_goals_teacher_write" on public.study_goals;
create policy "study_goals_teacher_write" on public.study_goals for all to authenticated using (teacher_id = auth.uid()) with check (teacher_id = auth.uid() and public.can_access_student(student_id));

create index if not exists idx_notifications_user_created on public.notifications(user_id, created_at desc);
create index if not exists idx_push_tokens_user on public.push_tokens(user_id);
create index if not exists idx_topic_progress_student on public.topic_progress(student_id, updated_at desc);
create index if not exists idx_study_goals_student on public.study_goals(student_id, created_at desc);

create or replace function public.notify_user(p_user_id uuid, p_title text, p_body text, p_type text, p_data jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_user_id is not null then
    insert into public.notifications(user_id, title, body, type, data)
    values (p_user_id, p_title, p_body, p_type, coalesce(p_data, '{}'::jsonb));
  end if;
end; $$;

create or replace function public.notify_student_audience(p_student_id uuid, p_title text, p_body text, p_type text, p_data jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_student_user uuid;
  v_parent record;
begin
  select user_id into v_student_user from public.students where id = p_student_id;
  perform public.notify_user(v_student_user, p_title, p_body, p_type, p_data);
  for v_parent in select parent_id from public.parent_students where student_id = p_student_id loop
    perform public.notify_user(v_parent.parent_id, p_title, p_body, p_type, p_data);
  end loop;
end; $$;

create or replace function public.create_recurring_lessons(
  p_student_id uuid,
  p_subject_id uuid,
  p_starts_at timestamptz,
  p_duration_minutes integer,
  p_topic text default null,
  p_weeks integer default 1
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  i integer;
  v_series uuid := gen_random_uuid();
  v_count integer := greatest(1, least(coalesce(p_weeks,1),52));
begin
  if not exists(select 1 from public.students where id=p_student_id and teacher_id=auth.uid()) then
    raise exception 'Ogrenci bulunamadi veya yetkiniz yok.';
  end if;
  for i in 0..v_count-1 loop
    insert into public.lessons(teacher_id,student_id,subject_id,starts_at,duration_minutes,status,topic,attendance,series_id)
    values(auth.uid(),p_student_id,p_subject_id,p_starts_at+(i*interval '7 days'),p_duration_minutes,'planned',p_topic,'pending',v_series);
  end loop;
  return jsonb_build_object('ok',true,'series_id',v_series,'count',v_count);
end; $$;

create or replace function public.cancel_lesson(p_lesson_id uuid, p_reason text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_student uuid; begin
  update public.lessons set status='cancelled'::public.lesson_status,cancel_reason=nullif(trim(p_reason),'')
  where id=p_lesson_id and teacher_id=auth.uid() returning student_id into v_student;
  if v_student is null then raise exception 'Ders bulunamadi veya yetkiniz yok.'; end if;
  return jsonb_build_object('ok',true);
end; $$;

create or replace function public.reschedule_lesson(p_lesson_id uuid, p_new_starts_at timestamptz)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_student uuid; begin
  update public.lessons set starts_at=p_new_starts_at,status='planned'::public.lesson_status,cancel_reason=null
  where id=p_lesson_id and teacher_id=auth.uid() returning student_id into v_student;
  if v_student is null then raise exception 'Ders bulunamadi veya yetkiniz yok.'; end if;
  return jsonb_build_object('ok',true,'starts_at',p_new_starts_at);
end; $$;

create or replace function public.complete_lesson_v03(
  p_lesson_id uuid,
  p_attendance text,
  p_topic text default null,
  p_teacher_note text default null,
  p_preparation_score integer default null,
  p_participation_score integer default null,
  p_mastery_score integer default null,
  p_homework_score integer default null
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_lesson public.lessons%rowtype;
  v_package_id uuid;
  v_package_incremented boolean := false;
begin
  if p_attendance not in ('present','absent') then raise exception 'Gecersiz katilim durumu.'; end if;
  if coalesce(p_preparation_score,1) not between 1 and 5 or coalesce(p_participation_score,1) not between 1 and 5 or coalesce(p_mastery_score,1) not between 1 and 5 or coalesce(p_homework_score,1) not between 1 and 5 then
    raise exception 'Performans puanlari 1-5 arasinda olmalidir.';
  end if;
  select * into v_lesson from public.lessons where id=p_lesson_id and teacher_id=auth.uid() for update;
  if not found then raise exception 'Ders bulunamadi veya yetkiniz yok.'; end if;
  update public.lessons set status='completed'::public.lesson_status,attendance=p_attendance::public.attendance_status,
    topic=coalesce(nullif(trim(p_topic),''),topic),teacher_note=nullif(trim(p_teacher_note),''),
    preparation_score=p_preparation_score,participation_score=p_participation_score,mastery_score=p_mastery_score,homework_score=p_homework_score
  where id=p_lesson_id;
  if v_lesson.status <> 'completed'::public.lesson_status and p_attendance='present' then
    select id into v_package_id from public.lesson_packages where student_id=v_lesson.student_id and teacher_id=auth.uid() and active=true and used_lessons<total_lessons order by created_at desc limit 1 for update;
    if v_package_id is not null then update public.lesson_packages set used_lessons=used_lessons+1 where id=v_package_id; v_package_incremented:=true; end if;
  end if;
  return jsonb_build_object('ok',true,'package_incremented',v_package_incremented);
end; $$;

create or replace function public.review_homework(p_homework_id uuid, p_feedback text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; begin
  update public.homework set status='reviewed'::public.homework_status,teacher_feedback=nullif(trim(p_feedback),''),reviewed_at=now()
  where id=p_homework_id and teacher_id=auth.uid() returning id into v_id;
  if v_id is null then raise exception 'Odev bulunamadi veya yetkiniz yok.'; end if;
  return jsonb_build_object('ok',true);
end; $$;

create or replace function public.submit_homework(p_homework_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_homework public.homework%rowtype; begin
  select h.* into v_homework from public.homework h join public.students s on s.id=h.student_id where h.id=p_homework_id and s.user_id=auth.uid() for update of h;
  if not found then raise exception 'Odev bulunamadi veya yetkiniz yok.'; end if;
  if v_homework.status='reviewed'::public.homework_status then raise exception 'Bu odev zaten degerlendirildi.'; end if;
  update public.homework set status='submitted'::public.homework_status,submitted_at=now() where id=p_homework_id;
  return jsonb_build_object('ok',true);
end; $$;

create or replace function public.update_study_goal(p_goal_id uuid, p_current_value numeric)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_goal public.study_goals%rowtype; v_allowed boolean; begin
  select * into v_goal from public.study_goals where id=p_goal_id for update;
  if not found then raise exception 'Hedef bulunamadi.'; end if;
  select exists(select 1 from public.students s where s.id=v_goal.student_id and (s.teacher_id=auth.uid() or s.user_id=auth.uid())) into v_allowed;
  if not v_allowed then raise exception 'Bu hedef icin yetkiniz yok.'; end if;
  update public.study_goals set current_value=greatest(0,p_current_value),completed=(p_current_value>=target_value),updated_at=now() where id=p_goal_id;
  return jsonb_build_object('ok',true);
end; $$;

grant execute on function public.create_recurring_lessons(uuid,uuid,timestamptz,integer,text,integer) to authenticated;
grant execute on function public.cancel_lesson(uuid,text) to authenticated;
grant execute on function public.reschedule_lesson(uuid,timestamptz) to authenticated;
grant execute on function public.complete_lesson_v03(uuid,text,text,text,integer,integer,integer,integer) to authenticated;
grant execute on function public.review_homework(uuid,text) to authenticated;
grant execute on function public.submit_homework(uuid) to authenticated;
grant execute on function public.update_study_goal(uuid,numeric) to authenticated;

create or replace function public.trg_lesson_notify() returns trigger language plpgsql security definer set search_path=public as $$
declare n text; begin
  select full_name into n from public.students where id=new.student_id;
  if tg_op='INSERT' then
    perform public.notify_student_audience(new.student_id,'Yeni ders planlandi',coalesce(n,'Ogrenci')||' icin yeni ders takvime eklendi.','lesson_created',jsonb_build_object('lesson_id',new.id,'student_id',new.student_id,'starts_at',new.starts_at));
  elsif old.status is distinct from new.status and new.status='cancelled'::public.lesson_status then
    perform public.notify_student_audience(new.student_id,'Ders iptal edildi',coalesce(new.cancel_reason,'Planlanan ders iptal edildi.'),'lesson_cancelled',jsonb_build_object('lesson_id',new.id,'student_id',new.student_id));
  elsif old.starts_at is distinct from new.starts_at then
    perform public.notify_student_audience(new.student_id,'Ders saati degisti','Ders yeni tarih ve saate tasindi.','lesson_rescheduled',jsonb_build_object('lesson_id',new.id,'student_id',new.student_id,'starts_at',new.starts_at));
  elsif old.status is distinct from new.status and new.status='completed'::public.lesson_status then
    perform public.notify_student_audience(new.student_id,'Ders raporu hazir','Ogretmen ders sonu raporunu kaydetti.','lesson_completed',jsonb_build_object('lesson_id',new.id,'student_id',new.student_id));
  end if;
  return new;
end; $$;

drop trigger if exists lesson_notification_trigger on public.lessons;
create trigger lesson_notification_trigger after insert or update on public.lessons for each row execute function public.trg_lesson_notify();

create or replace function public.trg_homework_notify() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op='INSERT' then
    perform public.notify_student_audience(new.student_id,'Yeni odev','Yeni odev: '||new.title,'homework_created',jsonb_build_object('homework_id',new.id,'student_id',new.student_id));
  elsif old.status is distinct from new.status and new.status='submitted'::public.homework_status then
    perform public.notify_user(new.teacher_id,'Odev gonderildi',new.title||' degerlendirme bekliyor.','homework_submitted',jsonb_build_object('homework_id',new.id,'student_id',new.student_id));
  elsif old.status is distinct from new.status and new.status='reviewed'::public.homework_status then
    perform public.notify_student_audience(new.student_id,'Odev degerlendirildi',coalesce(new.teacher_feedback,'Ogretmenin odevini degerlendirdi.'),'homework_reviewed',jsonb_build_object('homework_id',new.id,'student_id',new.student_id));
  end if;
  return new;
end; $$;

drop trigger if exists homework_notification_trigger on public.homework;
create trigger homework_notification_trigger after insert or update on public.homework for each row execute function public.trg_homework_notify();

create or replace function public.trg_exam_notify() returns trigger language plpgsql security definer set search_path=public as $$
begin
  perform public.notify_student_audience(new.student_id,'Yeni sinav sonucu',new.title||': '||new.score::text||'/'||new.max_score::text,'exam_result',jsonb_build_object('exam_id',new.id,'student_id',new.student_id));
  return new;
end; $$;
drop trigger if exists exam_notification_trigger on public.exam_results;
create trigger exam_notification_trigger after insert on public.exam_results for each row execute function public.trg_exam_notify();

create or replace function public.trg_payment_notify() returns trigger language plpgsql security definer set search_path=public as $$
declare p record; begin
  for p in select parent_id from public.parent_students where student_id=new.student_id loop
    perform public.notify_user(p.parent_id,'Odeme kaydi','Odeme kaydi olusturuldu: '||new.amount::text,'payment',jsonb_build_object('payment_id',new.id,'student_id',new.student_id));
  end loop;
  return new;
end; $$;
drop trigger if exists payment_notification_trigger on public.payments;
create trigger payment_notification_trigger after insert on public.payments for each row execute function public.trg_payment_notify();

create or replace function public.trg_package_low_notify() returns trigger language plpgsql security definer set search_path=public as $$
declare remain integer; begin
  remain:=new.total_lessons-new.used_lessons;
  if remain<=2 and (old.used_lessons is distinct from new.used_lessons) then
    perform public.notify_user(new.teacher_id,'Ders paketi azaldi',remain::text||' ders kaldi.','package_low',jsonb_build_object('package_id',new.id,'student_id',new.student_id,'remaining',remain));
    perform public.notify_student_audience(new.student_id,'Ders paketi azaldi',remain::text||' ders kaldi.','package_low',jsonb_build_object('package_id',new.id,'student_id',new.student_id,'remaining',remain));
  end if;
  return new;
end; $$;
drop trigger if exists package_low_notification_trigger on public.lesson_packages;
create trigger package_low_notification_trigger after update on public.lesson_packages for each row execute function public.trg_package_low_notify();

alter table public.exam_results add column if not exists correct_count integer check (correct_count >= 0);
alter table public.exam_results add column if not exists wrong_count integer check (wrong_count >= 0);
alter table public.exam_results add column if not exists blank_count integer check (blank_count >= 0);
alter table public.exam_results add column if not exists note text;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;
drop policy if exists "messages_select" on public.messages;
create policy "messages_select" on public.messages for select to authenticated using (public.can_access_student(student_id));
drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert" on public.messages for insert to authenticated with check (
  sender_id=auth.uid() and public.can_access_student(student_id)
  and teacher_id=(select s.teacher_id from public.students s where s.id=student_id)
);
create index if not exists idx_messages_student_created on public.messages(student_id, created_at);

create or replace function public.trg_message_notify() returns trigger language plpgsql security definer set search_path=public as $$
declare v_teacher uuid; v_student_user uuid; v_parent record; begin
  select teacher_id,user_id into v_teacher,v_student_user from public.students where id=new.student_id;
  if new.sender_id=v_teacher then
    perform public.notify_user(v_student_user,'Yeni mesaj',left(new.body,140),'message',jsonb_build_object('student_id',new.student_id,'message_id',new.id));
    for v_parent in select parent_id from public.parent_students where student_id=new.student_id loop
      perform public.notify_user(v_parent.parent_id,'Yeni mesaj',left(new.body,140),'message',jsonb_build_object('student_id',new.student_id,'message_id',new.id));
    end loop;
  else
    perform public.notify_user(v_teacher,'Yeni mesaj',left(new.body,140),'message',jsonb_build_object('student_id',new.student_id,'message_id',new.id));
  end if;
  return new;
end; $$;
drop trigger if exists message_notification_trigger on public.messages;
create trigger message_notification_trigger after insert on public.messages for each row execute function public.trg_message_notify();
