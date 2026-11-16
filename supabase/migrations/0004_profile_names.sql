-- Names can't be blank. Usernames already need 3–20 characters (see 0001_init.sql).
-- Run in Supabase SQL Editor after 0003_avatars.sql.

-- Existing blank names get the username, otherwise the new rule can't be added.
update public.profiles
set display_name = username
where length(trim(display_name)) = 0;

alter table public.profiles
  add constraint profiles_display_name_not_blank check (length(trim(display_name)) >= 1);

-- Sign-up must never send a blank name either: an empty name from the sign-up
-- form, Google or Apple now falls back to the next option, then to the username.
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
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      candidate),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;
