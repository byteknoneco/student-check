-- DersTakip+ v0.2 core feature migration
-- Run ONCE in Supabase SQL Editor after the original schema.sql.
-- Safe to run again: functions are replaced and grants are re-applied.

create or replace function public.complete_lesson(
  p_lesson_id uuid,
  p_attendance text,
  p_topic text default null,
  p_teacher_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lesson public.lessons%rowtype;
  v_package_id uuid;
  v_package_incremented boolean := false;
begin
  if p_attendance not in ('present', 'absent') then
    raise exception 'Geçersiz katılım durumu.';
  end if;

  select * into v_lesson
  from public.lessons
  where id = p_lesson_id
    and teacher_id = auth.uid()
  for update;

  if not found then
    raise exception 'Ders bulunamadı veya bu ders için yetkiniz yok.';
  end if;

  update public.lessons
  set
    status = 'completed'::public.lesson_status,
    attendance = p_attendance::public.attendance_status,
    topic = coalesce(nullif(trim(p_topic), ''), topic),
    teacher_note = nullif(trim(p_teacher_note), '')
  where id = p_lesson_id;

  -- A package credit is consumed only the first time a planned lesson is
  -- completed as attended. Re-saving the report does not consume another credit.
  if v_lesson.status <> 'completed'::public.lesson_status and p_attendance = 'present' then
    select id into v_package_id
    from public.lesson_packages
    where student_id = v_lesson.student_id
      and teacher_id = auth.uid()
      and active = true
      and used_lessons < total_lessons
    order by created_at desc
    limit 1
    for update;

    if v_package_id is not null then
      update public.lesson_packages
      set used_lessons = used_lessons + 1
      where id = v_package_id;
      v_package_incremented := true;
    end if;
  end if;

  return jsonb_build_object(
    'ok', true,
    'lesson_id', p_lesson_id,
    'package_incremented', v_package_incremented
  );
end;
$$;

create or replace function public.submit_homework(p_homework_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_homework public.homework%rowtype;
begin
  select h.* into v_homework
  from public.homework h
  join public.students s on s.id = h.student_id
  where h.id = p_homework_id
    and s.user_id = auth.uid()
  for update of h;

  if not found then
    raise exception 'Ödev bulunamadı veya bu ödev için yetkiniz yok.';
  end if;

  if v_homework.status = 'reviewed'::public.homework_status then
    raise exception 'Bu ödev öğretmen tarafından zaten tamamlandı olarak işaretlenmiş.';
  end if;

  update public.homework
  set status = 'submitted'::public.homework_status
  where id = p_homework_id;

  return jsonb_build_object('ok', true, 'homework_id', p_homework_id);
end;
$$;

grant execute on function public.complete_lesson(uuid, text, text, text) to authenticated;
grant execute on function public.submit_homework(uuid) to authenticated;

-- Payment privacy: students do not need to see financial records.
drop policy if exists "payments_select" on public.payments;
create policy "payments_select" on public.payments for select to authenticated using (
  teacher_id = auth.uid()
  or exists (
    select 1 from public.parent_students ps
    where ps.student_id = payments.student_id and ps.parent_id = auth.uid()
  )
);
