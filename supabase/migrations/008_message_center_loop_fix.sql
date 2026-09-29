-- DersTakip+ v0.4.1
-- Message Center read-receipt loop fix. Safe to re-run.

create or replace function public.mark_student_messages_read(p_student_id uuid)
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare
  v_count integer;
begin
  if not public.can_access_student(p_student_id) then
    raise exception 'Yetkiniz yok.';
  end if;

  -- Read receipts are immutable first-read markers. Existing rows are left
  -- untouched so reopening a conversation does not create database churn.
  insert into public.message_reads(message_id,user_id,read_at)
  select m.id,auth.uid(),now()
  from public.messages m
  where m.student_id=p_student_id
    and m.sender_id<>auth.uid()
  on conflict(message_id,user_id) do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function public.mark_student_messages_read(uuid) to authenticated;
