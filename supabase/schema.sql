-- UT Austin Premed AI Copilot — Database Schema
-- Run this in your Supabase SQL editor to create all tables

-- Users (extends Supabase auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  gpa numeric(4,2),
  science_gpa numeric(4,2),
  mcat_score int check (mcat_score between 472 and 528),
  mcat_breakdown jsonb,  -- {chem_phys, cars, bio, psych}
  major text,
  residency_state text,
  graduation_year int,
  clinical_hours int default 0,
  research_hours int default 0,
  volunteer_hours int default 0,
  shadowing_hours int default 0,
  created_at timestamp with time zone default now()
);

-- Medical schools
create table if not exists public.schools (
  id serial primary key,
  name text not null unique,
  type text not null check (type in ('MD', 'DO')),
  system text not null check (system in ('TMDSAS', 'AMCAS', 'AACOMAS')),
  state text not null,
  median_gpa numeric(4,2),
  median_mcat int,
  acceptance_rate numeric(5,2),
  class_size int,
  in_state_bias numeric(5,2),
  tuition_in_state int,
  tuition_oos int,
  avg_debt int,
  mission_keywords text[],
  prereqs jsonb,
  website_url text,
  logo_url text,
  updated_at timestamp with time zone default now()
);

-- UT Austin HPO outcome data
create table if not exists public.ut_outcomes (
  id serial primary key,
  report_year int not null,
  application_system text not null check (application_system in ('TMDSAS', 'AMCAS', 'AACOMAS')),
  school_name text not null,
  gpa_band text,
  mcat_band text,
  applicants int default 0,
  matriculants int default 0,
  major text
);

-- AAMC/AACOM acceptance grids
create table if not exists public.acceptance_grid (
  id serial primary key,
  gpa_range text not null,
  mcat_range text not null,
  acceptance_rate numeric(5,2) not null,
  source text not null check (source in ('AAMC', 'AACOM')),
  year int not null
);

-- Interview format and questions by school
create table if not exists public.interview_data (
  id serial primary key,
  school_id int not null references public.schools(id) on delete cascade,
  format text not null check (format in ('MMI', 'Traditional', 'Panel')),
  sample_questions text[],
  tips text,
  source text
);

-- User saved schools
create table if not exists public.saved_schools (
  user_id uuid not null references public.users(id) on delete cascade,
  school_id int not null references public.schools(id) on delete cascade,
  tier text not null check (tier in ('reach', 'target', 'safety')),
  notes text,
  primary key (user_id, school_id)
);

-- Chat sessions (groups of related chat_history rows for one conversation)
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Chat history
create table if not exists public.chat_history (
  id serial primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  session_id uuid references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  context_used jsonb,
  created_at timestamp with time zone default now()
);

-- Activity entries used by Activities + Timeline pages
create table if not exists public.activities (
  id serial primary key,
  name text not null,
  category text not null check (category in ('Clinical', 'Research', 'Volunteering', 'Shadowing', 'Leadership', 'Other')),
  hours int not null default 0 check (hours >= 0),
  start_date date not null,
  end_date date,
  organization text not null,
  description text not null default '',
  most_meaningful boolean not null default false,
  created_at timestamp with time zone default now()
);

-- Official AMCAS/TMDSAS cycle milestones and deadlines
create table if not exists public.application_deadlines (
  id serial primary key,
  key text not null unique,
  label text not null,
  date date not null,
  system text not null check (system in ('AMCAS', 'TMDSAS', 'Both')),
  type text not null check (type in ('milestone', 'submission', 'deadline')),
  description text not null,
  completed boolean not null default false
);

-- Per-school application tracking records
create table if not exists public.school_applications (
  id serial primary key,
  school_name text not null,
  school_abbr text not null,
  system text not null check (system in ('AMCAS', 'TMDSAS')),
  applied date,
  secondary_received date,
  secondary_submitted date,
  interview_invite date,
  interview_date date,
  decision text check (decision in ('accepted', 'waitlisted', 'rejected'))
);

-- Curated opportunity listings for app enrichment recommendations
create table if not exists public.opportunities (
  id serial primary key,
  name text not null,
  org text not null,
  category text not null check (category in ('Clinical', 'Research', 'Volunteering', 'Shadowing', 'Leadership')),
  mode text not null check (mode in ('In-Person', 'Remote', 'Hybrid')),
  affiliation text not null check (affiliation in ('UT-Affiliated', 'Community')),
  location text not null,
  weekly_hours int not null check (weekly_hours >= 0),
  metric text not null check (metric in ('Clinical Hours', 'Research Hours', 'Volunteer Hours', 'Shadowing Hours', 'GPA', 'MCAT')),
  competitive int not null check (competitive between 1 and 5),
  description text not null,
  requirements text[] not null default '{}',
  apply_url text not null,
  recommended boolean not null default false,
  recommend_reason text
);

-- Canonical UT benchmark medians by metric (from HPO reports)
create table if not exists public.ut_benchmarks (
  metric text primary key check (metric in ('gpa', 'mcat', 'clinical_hours', 'research_hours', 'volunteer_hours', 'shadowing_hours')),
  median_value numeric(10,2) not null,
  source text not null,
  updated_at timestamp with time zone default now()
);

-- Indexes
create index if not exists idx_ut_outcomes_system on public.ut_outcomes(application_system);
create index if not exists idx_ut_outcomes_school on public.ut_outcomes(school_name);
create index if not exists idx_acceptance_grid_lookup on public.acceptance_grid(gpa_range, mcat_range);
create index if not exists idx_interview_data_school on public.interview_data(school_id);
create index if not exists idx_saved_schools_user on public.saved_schools(user_id);
create index if not exists idx_chat_history_user on public.chat_history(user_id);
create index if not exists idx_chat_history_session on public.chat_history(session_id, created_at);
create index if not exists idx_chat_sessions_user_updated on public.chat_sessions(user_id, updated_at desc);
create index if not exists idx_activities_start_date on public.activities(start_date);
create index if not exists idx_activities_category on public.activities(category);
create index if not exists idx_application_deadlines_date on public.application_deadlines(date);
create index if not exists idx_school_applications_system on public.school_applications(system);
create index if not exists idx_opportunities_category on public.opportunities(category);
create index if not exists idx_opportunities_mode on public.opportunities(mode);

-- Enable Row Level Security
alter table if exists public.users enable row level security;
alter table if exists public.saved_schools enable row level security;
alter table if exists public.chat_history enable row level security;
alter table if exists public.chat_sessions enable row level security;

-- RLS Policies: users can only access their own data
drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
drop policy if exists "Users can insert own profile" on public.users;
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);
drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
drop policy if exists "Users can view own saved schools" on public.saved_schools;
create policy "Users can view own saved schools" on public.saved_schools for select using (auth.uid() = user_id);
drop policy if exists "Users can manage own saved schools" on public.saved_schools;
create policy "Users can manage own saved schools" on public.saved_schools for all using (auth.uid() = user_id);
drop policy if exists "Users can view own chat history" on public.chat_history;
create policy "Users can view own chat history" on public.chat_history for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own chat messages" on public.chat_history;
create policy "Users can insert own chat messages" on public.chat_history for insert with check (auth.uid() = user_id);
drop policy if exists "Users can view own chat sessions" on public.chat_sessions;
create policy "Users can view own chat sessions" on public.chat_sessions for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own chat sessions" on public.chat_sessions;
create policy "Users can insert own chat sessions" on public.chat_sessions for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own chat sessions" on public.chat_sessions;
create policy "Users can update own chat sessions" on public.chat_sessions for update using (auth.uid() = user_id);
drop policy if exists "Users can delete own chat sessions" on public.chat_sessions;
create policy "Users can delete own chat sessions" on public.chat_sessions for delete using (auth.uid() = user_id);

-- Public read access for reference data
alter table if exists public.schools enable row level security;
drop policy if exists "Schools are publicly readable" on public.schools;
create policy "Schools are publicly readable" on public.schools for select using (true);
alter table if exists public.acceptance_grid enable row level security;
drop policy if exists "Acceptance grid is publicly readable" on public.acceptance_grid;
create policy "Acceptance grid is publicly readable" on public.acceptance_grid for select using (true);
alter table if exists public.ut_outcomes enable row level security;
drop policy if exists "UT outcomes are publicly readable" on public.ut_outcomes;
create policy "UT outcomes are publicly readable" on public.ut_outcomes for select using (true);
alter table if exists public.interview_data enable row level security;
drop policy if exists "Interview data is publicly readable" on public.interview_data;
create policy "Interview data is publicly readable" on public.interview_data for select using (true);
alter table if exists public.activities enable row level security;
drop policy if exists "Activities are publicly readable" on public.activities;
create policy "Activities are publicly readable" on public.activities for select using (true);
drop policy if exists "Activities are publicly writable" on public.activities;
create policy "Activities are publicly writable" on public.activities for insert with check (true);
alter table if exists public.application_deadlines enable row level security;
drop policy if exists "Deadlines are publicly readable" on public.application_deadlines;
create policy "Deadlines are publicly readable" on public.application_deadlines for select using (true);
drop policy if exists "Deadlines are publicly writable" on public.application_deadlines;
create policy "Deadlines are publicly writable" on public.application_deadlines for insert with check (true);
alter table if exists public.school_applications enable row level security;
drop policy if exists "School applications are publicly readable" on public.school_applications;
create policy "School applications are publicly readable" on public.school_applications for select using (true);
drop policy if exists "School applications are publicly writable" on public.school_applications;
create policy "School applications are publicly writable" on public.school_applications for insert with check (true);
alter table if exists public.opportunities enable row level security;
drop policy if exists "Opportunities are publicly readable" on public.opportunities;
create policy "Opportunities are publicly readable" on public.opportunities for select using (true);
drop policy if exists "Opportunities are publicly writable" on public.opportunities;
create policy "Opportunities are publicly writable" on public.opportunities for insert with check (true);
alter table if exists public.ut_benchmarks enable row level security;
drop policy if exists "UT benchmarks are publicly readable" on public.ut_benchmarks;
create policy "UT benchmarks are publicly readable" on public.ut_benchmarks for select using (true);
drop policy if exists "UT benchmarks are publicly writable" on public.ut_benchmarks;
create policy "UT benchmarks are publicly writable" on public.ut_benchmarks for insert with check (true);
