-- Auth/account rollout migration
-- Safe to run against an existing project that already has public.users.

alter table public.users
  add column if not exists eid text,
  add column if not exists app_cycle text,
  add column if not exists leadership_hours int default 0,
  add column if not exists personal_statement text,
  add column if not exists app_status text default 'pre-app',
  add column if not exists avatar_url text;

alter table public.users
  alter column leadership_hours set default 0,
  alter column app_status set default 'pre-app';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_app_status_check'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_app_status_check
      check (app_status in ('pre-app', 'applied', 'interviewing', 'accepted'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'users'
      and policyname = 'Users can insert own profile'
  ) then
    create policy "Users can insert own profile"
      on public.users
      for insert
      with check (auth.uid() = id);
  end if;
end $$;
