-- ==========================================
-- CogniSweep Migration: Advanced Focus Stats Tables
-- ==========================================

-- 1. Distraction Logs Table
create table if not exists public.distraction_logs (
    id uuid default gen_random_uuid() primary key,
    room_id uuid references public.rooms(id) on delete cascade not null,
    user_id uuid references public.users(id) on delete cascade not null,
    type text not null check (type in ('hand-down', 'gaze-away', 'eye-closed', 'face-absent', 'static-frame')),
    duration_sec integer not null default 0 check (duration_sec >= 0),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.distraction_logs enable row level security;

drop policy if exists "Users can select their own distraction logs" on public.distraction_logs;
drop policy if exists "Users can insert their own distraction logs" on public.distraction_logs;

create policy "Users can select their own distraction logs"
    on public.distraction_logs for select
    using (auth.uid() = user_id);

create policy "Users can insert their own distraction logs"
    on public.distraction_logs for insert
    with check (auth.uid() = user_id);

-- 2. Focus Timeline Table
create table if not exists public.focus_timeline (
    id uuid default gen_random_uuid() primary key,
    room_id uuid references public.rooms(id) on delete cascade not null,
    user_id uuid references public.users(id) on delete cascade not null,
    minute_index integer not null check (minute_index >= 0),
    focus_percent integer not null check (focus_percent >= 0 and focus_percent <= 100),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (room_id, user_id, minute_index)
);

alter table public.focus_timeline enable row level security;

drop policy if exists "Users can view their own focus timeline" on public.focus_timeline;
drop policy if exists "Room members can view room focus timelines" on public.focus_timeline;
drop policy if exists "Users can insert their own focus timeline" on public.focus_timeline;

create policy "Users can view their own focus timeline"
    on public.focus_timeline for select
    using (auth.uid() = user_id);

create policy "Room members can view room focus timelines"
    on public.focus_timeline for select
    using (exists (select 1 from public.room_members rm where rm.room_id = focus_timeline.room_id and rm.user_id = auth.uid()));

create policy "Users can insert their own focus timeline"
    on public.focus_timeline for insert
    with check (auth.uid() = user_id);

-- 3. Settlements Table
create table if not exists public.settlements (
    id uuid default gen_random_uuid() primary key,
    room_id uuid references public.rooms(id) on delete cascade not null unique,
    pot integer not null default 0 check (pot >= 0),
    fee integer not null default 0 check (fee >= 0),
    payout integer not null default 0 check (payout >= 0),
    winner_id uuid references public.users(id) on delete set null,
    details_json jsonb not null default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.settlements enable row level security;

drop policy if exists "Settlements are viewable by everyone" on public.settlements;
create policy "Settlements are viewable by everyone"
    on public.settlements for select
    using (true);

-- 4. Leaderboard Cache Table
create table if not exists public.leaderboard_cache (
    user_id uuid references public.users(id) on delete cascade primary key,
    name text not null,
    avatar_url text,
    total_focus_hours numeric(10,2) not null default 0.00,
    avg_focus_percent integer not null default 0 check (avg_focus_percent >= 0 and avg_focus_percent <= 100),
    win_rate numeric(5,2) not null default 0.00,
    verified_badge boolean not null default false,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.leaderboard_cache enable row level security;

drop policy if exists "Leaderboard cache is viewable by everyone" on public.leaderboard_cache;
create policy "Leaderboard cache is viewable by everyone"
    on public.leaderboard_cache for select
    using (true);

-- 5. Indexes
create index if not exists idx_distraction_logs_user_time on public.distraction_logs(user_id, created_at desc);
create index if not exists idx_focus_timeline_lookup on public.focus_timeline(room_id, user_id);
create index if not exists idx_leaderboard_cache_hours on public.leaderboard_cache(total_focus_hours desc);
