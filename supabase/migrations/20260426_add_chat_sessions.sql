-- Persist AI advisor chats as discrete sessions so users can revisit prior conversations.

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_chat_sessions_user_updated
  on public.chat_sessions(user_id, updated_at desc);

alter table public.chat_history
  add column if not exists session_id uuid
    references public.chat_sessions(id) on delete cascade;

create index if not exists idx_chat_history_session
  on public.chat_history(session_id, created_at);

alter table public.chat_sessions enable row level security;

drop policy if exists "Users can view own chat sessions" on public.chat_sessions;
create policy "Users can view own chat sessions"
  on public.chat_sessions for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own chat sessions" on public.chat_sessions;
create policy "Users can insert own chat sessions"
  on public.chat_sessions for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own chat sessions" on public.chat_sessions;
create policy "Users can update own chat sessions"
  on public.chat_sessions for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own chat sessions" on public.chat_sessions;
create policy "Users can delete own chat sessions"
  on public.chat_sessions for delete using (auth.uid() = user_id);
