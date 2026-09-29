-- DersTakip+ v0.4
-- Daily-use quality upgrade: notification cleanup, messaging controls,
-- notification preferences, profile avatars and student archiving.
-- Run after 006_message_sender_name.sql. Safe to re-run.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Notifications: soft delete + preferences
-- ---------------------------------------------------------------------------
alter table public.notifications add column if not exists deleted_at timestamptz;

grant select, update, delete on table public.notifications to authenticated;

drop policy if exists "notifications_self_delete" on public.notifications;
create policy "notifications_self_delete"
on public.notifications for delete to authenticated
using (user_id = auth.uid());

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  homework boolean not null default true,
  lessons boolean not null default true,
  messages boolean not null default true,
  exams boolean not null default true,
  finance boolean not null default true,
  general boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;
grant select, insert, update on table public.notification_preferences to authenticated;

drop policy if exists "notification_preferences_self_select" on public.notification_preferences;
create policy "notification_preferences_self_select"
on public.notification_preferences for select to authenticated
using (user_id = auth.uid());

drop policy if exists "notification_preferences_self_insert" on public.notification_preferences;
create policy "notification_preferences_self_insert"
on public.notification_preferences for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "notification_preferences_self_update" on public.notification_preferences;
create policy "notification_preferences_self_update"
on public.notification_preferences for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.notification_category(p_type text)
returns text
language sql
immutable
as $$
  select case
    when coalesce(p_type,'') like 'homework%' then 'homework'
    when coalesce(p_type,'') like 'lesson%' then 'lessons'
    when coalesce(p_type,'') = 'message' then 'messages'
    when coalesce(p_type,'') like 'exam%' then 'exams'
    when coalesce(p_type,'') in ('payment','package_low') then 'finance'
    else 'general'
  end;
$$;

create or replace function public.notification_allowed(p_user_id uuid, p_type text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pref public.notification_preferences%rowtype;
  v_category text;
begin
  select * into v_pref from public.notification_preferences where user_id = p_user_id;
  if not found then return true; end if;
  v_category := public.notification_category(p_type);
  return case v_category
    when 'homework' then v_pref.homework
    when 'lessons' then v_pref.lessons
    when 'messages' then v_pref.messages
    when 'exams' then v_pref.exams
    when 'finance' then v_pref.finance
    else v_pref.general
  end;
end;
$$;

create or replace function public.notify_user(p_user_id uuid, p_title text, p_body text, p_type text, p_data jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is not null and public.notification_allowed(p_user_id, p_type) then
    insert into public.notifications(user_id, title, body, type, data)
    values (p_user_id, p_title, p_body, p_type, coalesce(p_data, '{}'::jsonb));
  end if;
end;
$$;

create or replace function public.trash_notification(p_notification_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  update public.notifications set deleted_at=now()
  where id=p_notification_id and user_id=auth.uid();
end; $$;

create or replace function public.restore_notification(p_notification_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  update public.notifications set deleted_at=null
  where id=p_notification_id and user_id=auth.uid();
end; $$;

create or replace function public.trash_read_notifications()
returns integer language plpgsql security definer set search_path=public as $$
declare v_count integer; begin
  update public.notifications set deleted_at=now()
  where user_id=auth.uid() and read_at is not null and deleted_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end; $$;

create or replace function public.trash_all_notifications()
returns integer language plpgsql security definer set search_path=public as $$
declare v_count integer; begin
  update public.notifications set deleted_at=now()
  where user_id=auth.uid() and deleted_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end; $$;

grant execute on function public.trash_notification(uuid) to authenticated;
grant execute on function public.restore_notification(uuid) to authenticated;
grant execute on function public.trash_read_notifications() to authenticated;
grant execute on function public.trash_all_notifications() to authenticated;

-- ---------------------------------------------------------------------------
-- Messages: edit, delete for everyone, hide for self, read receipts
-- ---------------------------------------------------------------------------
alter table public.messages add column if not exists edited_at timestamptz;
alter table public.messages add column if not exists deleted_at timestamptz;

create table if not exists public.message_reads (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key(message_id,user_id)
);

create table if not exists public.message_hidden_for (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  hidden_at timestamptz not null default now(),
  primary key(message_id,user_id)
);

alter table public.message_reads enable row level security;
alter table public.message_hidden_for enable row level security;
grant select, insert, update, delete on public.message_reads to authenticated;
grant select, insert, delete on public.message_hidden_for to authenticated;

drop policy if exists "message_reads_select" on public.message_reads;
create policy "message_reads_select"
on public.message_reads for select to authenticated
using (
  user_id=auth.uid()
  or exists(select 1 from public.messages m where m.id=message_id and m.sender_id=auth.uid())
);

drop policy if exists "message_reads_self_insert" on public.message_reads;
create policy "message_reads_self_insert"
on public.message_reads for insert to authenticated
with check (
  user_id=auth.uid()
  and exists(select 1 from public.messages m where m.id=message_id and public.can_access_student(m.student_id))
);

drop policy if exists "message_reads_self_update" on public.message_reads;
create policy "message_reads_self_update"
on public.message_reads for update to authenticated
using (user_id=auth.uid()) with check (user_id=auth.uid());

drop policy if exists "message_hidden_self_all" on public.message_hidden_for;
create policy "message_hidden_self_all"
on public.message_hidden_for for all to authenticated
using (user_id=auth.uid()) with check (user_id=auth.uid());

create or replace function public.edit_message(p_message_id uuid, p_body text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_message public.messages%rowtype; begin
  select * into v_message from public.messages where id=p_message_id for update;
  if not found or v_message.sender_id<>auth.uid() then raise exception 'Mesaj bulunamadi veya yetkiniz yok.'; end if;
  if v_message.deleted_at is not null then raise exception 'Silinmis mesaj duzenlenemez.'; end if;
  if v_message.created_at < now()-interval '15 minutes' then raise exception 'Mesaj yalnizca ilk 15 dakika icinde duzenlenebilir.'; end if;
  if nullif(trim(p_body),'') is null or char_length(trim(p_body))>2000 then raise exception 'Mesaj 1-2000 karakter arasinda olmalidir.'; end if;
  update public.messages set body=trim(p_body),edited_at=now() where id=p_message_id;
  return jsonb_build_object('ok',true,'message_id',p_message_id);
end; $$;

create or replace function public.delete_message_everyone(p_message_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_message public.messages%rowtype; begin
  select * into v_message from public.messages where id=p_message_id for update;
  if not found or v_message.sender_id<>auth.uid() then raise exception 'Mesaj bulunamadi veya yetkiniz yok.'; end if;
  if v_message.created_at < now()-interval '15 minutes' then raise exception 'Mesaj yalnizca ilk 15 dakika icinde herkesten silinebilir.'; end if;
  update public.messages set body='Bu mesaj silindi.',deleted_at=now(),edited_at=null where id=p_message_id;
  return jsonb_build_object('ok',true,'message_id',p_message_id);
end; $$;

create or replace function public.hide_message_for_me(p_message_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from public.messages m where m.id=p_message_id and public.can_access_student(m.student_id)) then
    raise exception 'Mesaj bulunamadi veya yetkiniz yok.';
  end if;
  insert into public.message_hidden_for(message_id,user_id) values(p_message_id,auth.uid()) on conflict do nothing;
  return jsonb_build_object('ok',true,'message_id',p_message_id);
end; $$;

create or replace function public.unhide_message_for_me(p_message_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
begin
  delete from public.message_hidden_for where message_id=p_message_id and user_id=auth.uid();
  return jsonb_build_object('ok',true,'message_id',p_message_id);
end; $$;

create or replace function public.mark_student_messages_read(p_student_id uuid)
returns integer language plpgsql security definer set search_path=public as $$
declare v_count integer; begin
  if not public.can_access_student(p_student_id) then raise exception 'Yetkiniz yok.'; end if;
  insert into public.message_reads(message_id,user_id,read_at)
  select m.id,auth.uid(),now()
  from public.messages m
  where m.student_id=p_student_id and m.sender_id<>auth.uid()
  on conflict(message_id,user_id) do update set read_at=excluded.read_at;
  get diagnostics v_count = row_count;
  return v_count;
end; $$;

grant execute on function public.edit_message(uuid,text) to authenticated;
grant execute on function public.delete_message_everyone(uuid) to authenticated;
grant execute on function public.hide_message_for_me(uuid) to authenticated;
grant execute on function public.unhide_message_for_me(uuid) to authenticated;
grant execute on function public.mark_student_messages_read(uuid) to authenticated;

create index if not exists idx_message_reads_message on public.message_reads(message_id,read_at);
create index if not exists idx_message_hidden_user on public.message_hidden_for(user_id,message_id);

-- ---------------------------------------------------------------------------
-- Student archive + teacher-only note
-- ---------------------------------------------------------------------------
alter table public.students add column if not exists archived_at timestamptz;
alter table public.students add column if not exists private_note text;

create or replace function public.set_student_archived(p_student_id uuid, p_archived boolean)
returns jsonb language plpgsql security definer set search_path=public as $$
begin
  update public.students
  set active=not p_archived, archived_at=case when p_archived then now() else null end
  where id=p_student_id and teacher_id=auth.uid();
  if not found then raise exception 'Ogrenci bulunamadi veya yetkiniz yok.'; end if;
  return jsonb_build_object('ok',true,'student_id',p_student_id,'archived',p_archived);
end; $$;

create or replace function public.update_student_private_note(p_student_id uuid, p_note text)
returns jsonb language plpgsql security definer set search_path=public as $$
begin
  update public.students set private_note=nullif(trim(p_note),'')
  where id=p_student_id and teacher_id=auth.uid();
  if not found then raise exception 'Ogrenci bulunamadi veya yetkiniz yok.'; end if;
  return jsonb_build_object('ok',true,'student_id',p_student_id);
end; $$;

grant execute on function public.set_student_archived(uuid,boolean) to authenticated;
grant execute on function public.update_student_private_note(uuid,text) to authenticated;

-- ---------------------------------------------------------------------------
-- Profile avatars - private bucket, each user owns their folder.
-- profiles.avatar_url stores the storage object path (not a public URL).
-- ---------------------------------------------------------------------------
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('avatars','avatars',false,5242880,array['image/jpeg','image/jpg','image/png','image/webp','image/heic','image/heif'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "avatar_storage_insert_own" on storage.objects;
create policy "avatar_storage_insert_own" on storage.objects for insert to authenticated
with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);

drop policy if exists "avatar_storage_select_own" on storage.objects;
create policy "avatar_storage_select_own" on storage.objects for select to authenticated
using(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);

drop policy if exists "avatar_storage_update_own" on storage.objects;
create policy "avatar_storage_update_own" on storage.objects for update to authenticated
using(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text)
with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);

drop policy if exists "avatar_storage_delete_own" on storage.objects;
create policy "avatar_storage_delete_own" on storage.objects for delete to authenticated
using(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);

-- Helpful indexes.
create index if not exists idx_students_teacher_active_name on public.students(teacher_id,active,full_name);
create index if not exists idx_notifications_user_deleted_created on public.notifications(user_id,deleted_at,created_at desc);
