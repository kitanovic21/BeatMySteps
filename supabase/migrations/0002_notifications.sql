-- BeatMySteps: in-app notifications (friend requests and accepted requests)
-- Run in Supabase SQL Editor after 0001_init.sql.

create table public.notifications (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  actor_id      uuid not null references public.profiles (id) on delete cascade,
  type          text not null check (type in ('friend_request', 'friend_accepted')),
  -- Declining / cancelling a request deletes the friendship and with it the notification.
  friendship_id bigint references public.friendships (id) on delete cascade,
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications own read" on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy "notifications own update" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications own delete" on public.notifications
  for delete to authenticated using (user_id = auth.uid());
-- Inserts only happen through the triggers below.

create or replace function public.notify_friendship_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.status = 'pending' then
    insert into public.notifications (user_id, actor_id, type, friendship_id)
    values (new.addressee_id, new.requester_id, 'friend_request', new.id);
  elsif tg_op = 'UPDATE' and old.status = 'pending' and new.status = 'accepted' then
    -- The request has been handled, so it no longer belongs in the addressee's inbox.
    delete from public.notifications
    where friendship_id = new.id and type = 'friend_request';
    insert into public.notifications (user_id, actor_id, type, friendship_id)
    values (new.requester_id, new.addressee_id, 'friend_accepted', new.id);
  end if;
  return new;
end;
$$;

create trigger on_friendship_change
  after insert or update on public.friendships
  for each row execute function public.notify_friendship_change();

-- Live updates: the app listens for new rows to update badges instantly.
alter publication supabase_realtime add table public.notifications;
