-- DersTakip+ v0.2.1
-- Fix student creation under RLS by moving ownership assignment to a server-side RPC.
-- Safe to run more than once.

create or replace function public.create_student(
  p_full_name text,
  p_grade_level text default null,
  p_school text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid;
  v_role public.user_role;
begin
  if auth.uid() is null then
    raise exception 'Oturum bulunamadi. Lutfen tekrar giris yapin.';
  end if;

  select role into v_role
  from public.profiles
  where id = auth.uid();

  if v_role is distinct from 'teacher'::public.user_role then
    raise exception 'Yalnizca ogretmen hesaplari ogrenci olusturabilir.';
  end if;

  if nullif(trim(p_full_name), '') is null then
    raise exception 'Ogrenci adi zorunludur.';
  end if;

  insert into public.students (
    teacher_id,
    full_name,
    grade_level,
    school
  )
  values (
    auth.uid(),
    trim(p_full_name),
    nullif(trim(coalesce(p_grade_level, '')), ''),
    nullif(trim(coalesce(p_school, '')), '')
  )
  returning id into v_student_id;

  return v_student_id;
end;
$$;

revoke all on function public.create_student(text, text, text) from public;
grant execute on function public.create_student(text, text, text) to authenticated;

drop policy if exists "students_teacher_insert" on public.students;

create policy "students_teacher_insert"
on public.students
for insert
to authenticated
with check (
  teacher_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'teacher'::public.user_role
  )
);
