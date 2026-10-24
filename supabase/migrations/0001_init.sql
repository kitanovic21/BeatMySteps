-- BeatMySteps: initial schema
-- Run in Supabase SQL Editor (or `supabase db push`).

-- ───────────────────────── profiles ─────────────────────────
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text not null unique check (username ~ '^[a-z0-9_.]{3,20}$'),
  display_name text not null,
  avatar_url   text,
  daily_goal   integer not null default 10000 check (daily_goal between 1000 and 100000),
  created_at   timestamptz not null default now()
);

-- Creates a profile for every new auth user (email, Google, Apple).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_name text;
  candidate text;
  suffix    int := 0;
begin
  base_name := lower(regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1), 'user'),
    '[^a-zA-Z0-9_.]', '', 'g'));
  if length(base_name) < 3 then
    base_name := base_name || 'user';
  end if;
  base_name := left(base_name, 16);
  candidate := base_name;

  while exists (select 1 from public.profiles where username = candidate) loop
    suffix := suffix + 1;
    candidate := base_name || suffix::text;
  end loop;

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    candidate,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      candidate),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────── friendships ─────────────────────────
create table public.friendships (
  id           bigint generated always as identity primary key,
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at   timestamptz not null default now(),
  check (requester_id <> addressee_id)
);

-- One row per pair regardless of direction.
create unique index friendships_pair_idx on public.friendships (
  least(requester_id, addressee_id),
  greatest(requester_id, addressee_id)
);
create index friendships_addressee_idx on public.friendships (addressee_id);

create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.friendships
    where status = 'accepted'
      and ((requester_id = a and addressee_id = b) or (requester_id = b and addressee_id = a))
  );
$$;

-- ───────────────────────── daily_steps ─────────────────────────
create table public.daily_steps (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  day        date not null,
  steps      integer not null default 0 check (steps >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- ───────────────────────── RLS ─────────────────────────
alter table public.profiles    enable row level security;
alter table public.friendships enable row level security;
alter table public.daily_steps enable row level security;

-- Profiles are public to signed-in users (needed for search and leaderboards).
create policy "profiles readable" on public.profiles
  for select to authenticated using (true);
create policy "profiles self update" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "friendships involved read" on public.friendships
  for select to authenticated
  using (auth.uid() in (requester_id, addressee_id));
create policy "friendships addressee accepts" on public.friendships
  for update to authenticated
  using (addressee_id = auth.uid()) with check (addressee_id = auth.uid() and status = 'accepted');
create policy "friendships involved delete" on public.friendships
  for delete to authenticated
  using (auth.uid() in (requester_id, addressee_id));
-- Inserts go through send_friend_request().

create policy "steps own or friends read" on public.daily_steps
  for select to authenticated
  using (user_id = auth.uid() or public.are_friends(auth.uid(), user_id));
create policy "steps own insert" on public.daily_steps
  for insert to authenticated with check (user_id = auth.uid());
create policy "steps own update" on public.daily_steps
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ───────────────────────── RPC ─────────────────────────

-- Sends a request by username. If the other user already asked us, accepts it.
-- Returns 'sent' | 'accepted' | 'already_friends' | 'already_sent'.
create or replace function public.send_friend_request(p_username text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  me     uuid := auth.uid();
  target uuid;
  fr     public.friendships;
begin
  if me is null then
    raise exception 'not authenticated';
  end if;

  select id into target from public.profiles where username = lower(trim(p_username));
  if target is null then
    raise exception 'user_not_found';
  end if;
  if target = me then
    raise exception 'cannot_add_self';
  end if;

  select * into fr from public.friendships
  where least(requester_id, addressee_id) = least(me, target)
    and greatest(requester_id, addressee_id) = greatest(me, target);

  if fr.id is null then
    insert into public.friendships (requester_id, addressee_id) values (me, target);
    return 'sent';
  elsif fr.status = 'accepted' then
    return 'already_friends';
  elsif fr.addressee_id = me then
    update public.friendships set status = 'accepted' where id = fr.id;
    return 'accepted';
  else
    return 'already_sent';
  end if;
end;
$$;

-- Me + accepted friends with their step totals in [p_start, p_end].
create or replace function public.get_leaderboard(p_start date, p_end date)
returns table (
  user_id      uuid,
  username     text,
  display_name text,
  avatar_url   text,
  steps        bigint,
  is_me        boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with members as (
    select auth.uid() as id
    union
    select case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end
    from public.friendships f
    where f.status = 'accepted' and auth.uid() in (f.requester_id, f.addressee_id)
  )
  select
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    coalesce(sum(s.steps), 0)::bigint as steps,
    p.id = auth.uid() as is_me
  from members m
  join public.profiles p on p.id = m.id
  left join public.daily_steps s
    on s.user_id = p.id and s.day between p_start and p_end
  group by p.id
  order by steps desc, p.display_name;
$$;

grant execute on function public.send_friend_request(text) to authenticated;
grant execute on function public.get_leaderboard(date, date) to authenticated;
revoke execute on function public.are_friends(uuid, uuid) from anon;

-- Used by the sign-up form before the user has a session.
create or replace function public.is_username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (select 1 from public.profiles where username = lower(trim(p_username)));
$$;

grant execute on function public.is_username_available(text) to anon, authenticated;
