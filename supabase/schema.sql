-- UT Austin Premed AI Copilot — Database Schema
-- Run this in your Supabase SQL editor to create all tables

-- Users (extends Supabase auth.users)
create table public.users (
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
create table public.schools (
  id serial primary key,
  name text not null,
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
create table public.ut_outcomes (
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
create table public.acceptance_grid (
  id serial primary key,
  gpa_range text not null,
  mcat_range text not null,
  acceptance_rate numeric(5,2) not null,
  source text not null check (source in ('AAMC', 'AACOM')),
  year int not null
);

-- Interview format and questions by school
create table public.interview_data (
  id serial primary key,
  school_id int not null references public.schools(id) on delete cascade,
  format text not null check (format in ('MMI', 'Traditional', 'Panel')),
  sample_questions text[],
  tips text,
  source text
);

-- User saved schools
create table public.saved_schools (
  user_id uuid not null references public.users(id) on delete cascade,
  school_id int not null references public.schools(id) on delete cascade,
  tier text not null check (tier in ('reach', 'target', 'safety')),
  notes text,
  primary key (user_id, school_id)
);

-- Chat history
create table public.chat_history (
  id serial primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  context_used jsonb,
  created_at timestamp with time zone default now()
);

-- Indexes
create index idx_ut_outcomes_system on public.ut_outcomes(application_system);
create index idx_ut_outcomes_school on public.ut_outcomes(school_name);
create index idx_acceptance_grid_lookup on public.acceptance_grid(gpa_range, mcat_range);
create index idx_interview_data_school on public.interview_data(school_id);
create index idx_saved_schools_user on public.saved_schools(user_id);
create index idx_chat_history_user on public.chat_history(user_id);

-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.saved_schools enable row level security;
alter table public.chat_history enable row level security;

-- RLS Policies: users can only access their own data
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Users can view own saved schools" on public.saved_schools for select using (auth.uid() = user_id);
create policy "Users can manage own saved schools" on public.saved_schools for all using (auth.uid() = user_id);
create policy "Users can view own chat history" on public.chat_history for select using (auth.uid() = user_id);
create policy "Users can insert own chat messages" on public.chat_history for insert with check (auth.uid() = user_id);

-- Public read access for reference data
alter table public.schools enable row level security;
create policy "Schools are publicly readable" on public.schools for select using (true);
alter table public.acceptance_grid enable row level security;
create policy "Acceptance grid is publicly readable" on public.acceptance_grid for select using (true);
alter table public.ut_outcomes enable row level security;
create policy "UT outcomes are publicly readable" on public.ut_outcomes for select using (true);
alter table public.interview_data enable row level security;
create policy "Interview data is publicly readable" on public.interview_data for select using (true);
