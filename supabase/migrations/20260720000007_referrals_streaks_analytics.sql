-- ==========================================
-- CogniSweep Migration: Streaks & Analytics Tracking Tables
-- ==========================================

-- 1. Streaks Table
create table if not exists public.streaks (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null unique,
    current_streak_days integer not null default 0 check (current_streak_days >= 0),
    max_streak_days integer not null default 0 check (max_streak_days >= 0),
    last_study_date date,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.streaks enable row level security;

drop policy if exists "Users can view and manage their own streaks" on public.streaks;
create policy "Users can view and manage their own streaks"
    on public.streaks for all
    using (auth.uid() = user_id);

-- 2. Analytics Logs Table
create table if not exists public.analytics_logs (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete set null,
    event_name text not null,
    properties jsonb not null default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.analytics_logs enable row level security;

drop policy if exists "Users can insert analytics logs" on public.analytics_logs;
create policy "Users can insert analytics logs"
    on public.analytics_logs for insert
    with check (true);

-- Indexes for statistics tracking
create index if not exists idx_streaks_days on public.streaks(current_streak_days desc);
create index if not exists idx_analytics_event on public.analytics_logs(event_name, created_at desc);
