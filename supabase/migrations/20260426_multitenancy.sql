-- Multi-tenancy hardening
-- 1. Add user_id to activities and school_applications, enforce per-user RLS.
-- 2. Move per-user `completed` flag off application_deadlines onto deadline_progress.
-- 3. Backfill the existing 5 activity rows to averyallen@utexas.edu and seed
--    a curated handful of school_applications in varied progress states for demo.

------------------------------------------------------------
-- activities: per-user scope
------------------------------------------------------------
alter table public.activities
  add column if not exists user_id uuid references public.users(id) on delete cascade;

-- Backfill legacy activity rows to the most likely real account.
-- Prefer the demo account, otherwise use the profile with the most onboarding hours.
do $$
declare
  target_user_id uuid;
begin
  select id
    into target_user_id
    from public.users
   where email = 'averyallen@utexas.edu'
   limit 1;

  if target_user_id is null then
    select id
      into target_user_id
      from public.users
     order by (
       coalesce(clinical_hours, 0) +
       coalesce(research_hours, 0) +
       coalesce(volunteer_hours, 0) +
       coalesce(shadowing_hours, 0) +
       coalesce(leadership_hours, 0)
     ) desc, created_at desc
     limit 1;
  end if;

  if target_user_id is not null then
    update public.activities set user_id = target_user_id where user_id is null;
  elsif exists (select 1 from public.activities where user_id is null) then
    -- No demo user yet — drop orphan seed rows so RLS doesn't show ghosts.
    raise exception 'Cannot backfill activities.user_id because no public.users row exists yet. Sign in once, complete onboarding, then rerun.';
  end if;
end $$;

alter table public.activities alter column user_id set not null;

drop policy if exists "Activities are publicly readable" on public.activities;
drop policy if exists "Activities are publicly writable" on public.activities;
create policy "Users see own activities"
  on public.activities for select using (auth.uid() = user_id);
create policy "Users insert own activities"
  on public.activities for insert with check (auth.uid() = user_id);
create policy "Users update own activities"
  on public.activities for update using (auth.uid() = user_id);
create policy "Users delete own activities"
  on public.activities for delete using (auth.uid() = user_id);

create index if not exists idx_activities_user on public.activities(user_id);

------------------------------------------------------------
-- school_applications: per-user scope
------------------------------------------------------------
alter table public.school_applications
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- The 304 existing rows are a global catalog dump (no progress data). Drop them.
delete from public.school_applications where user_id is null;

-- Seed a curated 6-school demo set for averyallen if she exists.
do $$
declare
  demo_user_id uuid;
begin
  select id into demo_user_id from auth.users where email = 'averyallen@utexas.edu' limit 1;
  if demo_user_id is not null then
    insert into public.school_applications
      (user_id, school_name, school_abbr, system, applied, secondary_received, secondary_submitted, interview_invite, interview_date, decision)
    values
      (demo_user_id, 'Dell Medical School at The University of Texas at Austin', 'DELL',  'TMDSAS', '2026-05-15', '2026-06-01', '2026-06-20', '2026-09-10', '2026-10-05', null),
      (demo_user_id, 'McGovern Medical School (Houston)',                        'MCGOV', 'TMDSAS', '2026-05-15', '2026-06-04', '2026-06-22', null,         null,         null),
      (demo_user_id, 'Texas A&M College of Medicine',                            'TAMU',  'TMDSAS', '2026-05-15', '2026-06-08', null,         null,         null,         null),
      (demo_user_id, 'Long Medical School San Antonio',                          'LONG',  'TMDSAS', '2026-05-15', '2026-06-12', '2026-07-01', '2026-09-22', '2026-11-08', 'accepted'),
      (demo_user_id, 'Icahn School of Medicine at Mount Sinai',                  'ICAHN', 'AMCAS',  '2026-06-01', null,         null,         null,         null,         null),
      (demo_user_id, 'New York University Grossman School of Medicine',          'NYU',   'AMCAS',  '2026-06-01', '2026-07-10', '2026-07-25', null,         null,         'rejected');
  end if;
end $$;

alter table public.school_applications alter column user_id set not null;

drop policy if exists "School applications are publicly readable" on public.school_applications;
drop policy if exists "School applications are publicly writable" on public.school_applications;
create policy "Users see own school apps"
  on public.school_applications for select using (auth.uid() = user_id);
create policy "Users insert own school apps"
  on public.school_applications for insert with check (auth.uid() = user_id);
create policy "Users update own school apps"
  on public.school_applications for update using (auth.uid() = user_id);
create policy "Users delete own school apps"
  on public.school_applications for delete using (auth.uid() = user_id);

create index if not exists idx_school_applications_user on public.school_applications(user_id);

------------------------------------------------------------
-- application_deadlines: drop the global `completed` flag.
-- Per-user progress moves to deadline_progress.
------------------------------------------------------------
alter table public.application_deadlines drop column if exists completed;
drop policy if exists "Deadlines are publicly writable" on public.application_deadlines;

create table if not exists public.deadline_progress (
  user_id uuid not null references public.users(id) on delete cascade,
  deadline_key text not null references public.application_deadlines(key) on delete cascade,
  completed boolean not null default false,
  updated_at timestamp with time zone default now(),
  primary key (user_id, deadline_key)
);
alter table public.deadline_progress enable row level security;
drop policy if exists "Users see own deadline progress" on public.deadline_progress;
drop policy if exists "Users insert own deadline progress" on public.deadline_progress;
drop policy if exists "Users update own deadline progress" on public.deadline_progress;
create policy "Users see own deadline progress"
  on public.deadline_progress for select using (auth.uid() = user_id);
create policy "Users insert own deadline progress"
  on public.deadline_progress for insert with check (auth.uid() = user_id);
create policy "Users update own deadline progress"
  on public.deadline_progress for update using (auth.uid() = user_id);
