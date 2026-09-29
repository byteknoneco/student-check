-- DersTakip+ v0.3.2
-- Store a trusted sender display name on each message and show it in notifications.
-- Safe to run more than once.

alter table public.messages
  add column if not exists sender_name text;

update public.messages m
set sender_name = coalesce(nullif(trim(p.full_name), ''), 'Kullanici')
from public.profiles p
where p.id = m.sender_id
  and (m.sender_name is null or trim(m.sender_name) = '');

create or replace function public.set_message_sender_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  if auth.uid() is null then
    raise exception 'Oturum bulunamadi.';
  end if;

  select full_name
  into v_name
  from public.profiles
  where id = auth.uid();

  if v_name is null then
    raise exception 'Kullanici profili bulunamadi.';
  end if;

  new.sender_id := auth.uid();
  new.sender_name := coalesce(nullif(trim(v_name), ''), 'Kullanici');
  return new;
end;
$$;

drop trigger if exists message_sender_identity_trigger on public.messages;
create trigger message_sender_identity_trigger
before insert on public.messages
for each row execute function public.set_message_sender_identity();

create or replace function public.trg_message_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher uuid;
  v_student_user uuid;
  v_parent record;
  v_title text;
begin
  select teacher_id, user_id
  into v_teacher, v_student_user
  from public.students
  where id = new.student_id;

  v_title := 'Yeni mesaj - ' || coalesce(nullif(new.sender_name, ''), 'Kullanici');

  if new.sender_id = v_teacher then
    perform public.notify_user(v_student_user, v_title, left(new.body, 140), 'message', jsonb_build_object('student_id', new.student_id, 'message_id', new.id));
    for v_parent in select parent_id from public.parent_students where student_id = new.student_id loop
      perform public.notify_user(v_parent.parent_id, v_title, left(new.body, 140), 'message', jsonb_build_object('student_id', new.student_id, 'message_id', new.id));
    end loop;
  else
    perform public.notify_user(v_teacher, v_title, left(new.body, 140), 'message', jsonb_build_object('student_id', new.student_id, 'message_id', new.id));
  end if;
  return new;
end;
$$;

drop trigger if exists message_notification_trigger on public.messages;
create trigger message_notification_trigger
after insert on public.messages
for each row execute function public.trg_message_notify();
