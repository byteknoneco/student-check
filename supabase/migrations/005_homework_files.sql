-- DersTakip+ v0.3.1 - Homework photo/PDF attachments
-- Run once after 004_platform_v03.sql. Safe to re-run.

create extension if not exists pgcrypto;

do $$ begin
  create type public.homework_file_kind as enum ('assignment', 'submission', 'feedback');
exception when duplicate_object then null; end $$;

create table if not exists public.homework_files (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid not null references public.homework(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  kind public.homework_file_kind not null,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null default 0 check (size_bytes >= 0 and size_bytes <= 10485760),
  created_at timestamptz not null default now()
);

alter table public.homework_files enable row level security;

grant select, insert, delete on table public.homework_files to authenticated;

drop policy if exists "homework_files_select" on public.homework_files;
create policy "homework_files_select"
on public.homework_files
for select
to authenticated
using (public.can_access_student(student_id));

drop policy if exists "homework_files_insert" on public.homework_files;
create policy "homework_files_insert"
on public.homework_files
for insert
to authenticated
with check (
  uploaded_by = auth.uid()
  and public.can_access_student(student_id)
  and exists (
    select 1
    from public.homework h
    join public.students s on s.id = h.student_id
    where h.id = homework_id
      and h.student_id = student_id
      and (
        (kind in ('assignment'::public.homework_file_kind, 'feedback'::public.homework_file_kind) and h.teacher_id = auth.uid())
        or
        (kind = 'submission'::public.homework_file_kind and s.user_id = auth.uid() and h.status <> 'reviewed'::public.homework_status)
      )
  )
);

drop policy if exists "homework_files_delete_own" on public.homework_files;
create policy "homework_files_delete_own"
on public.homework_files
for delete
to authenticated
using (uploaded_by = auth.uid());

create index if not exists idx_homework_files_homework_created on public.homework_files(homework_id, created_at);
create index if not exists idx_homework_files_student on public.homework_files(student_id);

-- Private storage bucket. Files are served with short-lived signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'homework-files',
  'homework-files',
  false,
  10485760,
  array['image/jpeg','image/jpg','image/png','image/webp','image/heic','image/heif','application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Path format:
-- student_id/homework_id/kind/user_id/random-file.ext

drop policy if exists "homework_storage_insert" on storage.objects;
create policy "homework_storage_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'homework-files'
  and (storage.foldername(name))[4] = auth.uid()::text
  and exists (
    select 1
    from public.homework h
    join public.students s on s.id = h.student_id
    where s.id::text = (storage.foldername(name))[1]
      and h.id::text = (storage.foldername(name))[2]
      and h.student_id = s.id
      and (
        ((storage.foldername(name))[3] in ('assignment','feedback') and h.teacher_id = auth.uid())
        or
        ((storage.foldername(name))[3] = 'submission' and s.user_id = auth.uid() and h.status <> 'reviewed'::public.homework_status)
      )
  )
);

drop policy if exists "homework_storage_select" on storage.objects;
create policy "homework_storage_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'homework-files'
  and exists (
    select 1
    from public.homework_files hf
    where hf.storage_path = name
      and public.can_access_student(hf.student_id)
  )
);

drop policy if exists "homework_storage_delete_own" on storage.objects;
create policy "homework_storage_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'homework-files'
  and owner_id = auth.uid()::text
);

-- If a student adds extra submission files after already submitting, notify teacher.
-- Initial homework creation/review notifications are already handled by the homework trigger.
create or replace function public.trg_homework_file_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_homework public.homework%rowtype;
begin
  select * into v_homework from public.homework where id = new.homework_id;
  if new.kind = 'submission'::public.homework_file_kind and v_homework.status = 'submitted'::public.homework_status then
    perform public.notify_user(v_homework.teacher_id, 'Yeni odev dosyasi', v_homework.title || ' icin yeni dosya yuklendi.', 'homework_submission_file', jsonb_build_object('homework_id', new.homework_id, 'student_id', new.student_id));
  end if;
  return new;
end;
$$;

drop trigger if exists homework_file_notification_trigger on public.homework_files;
create trigger homework_file_notification_trigger
after insert on public.homework_files
for each row execute function public.trg_homework_file_notify();
