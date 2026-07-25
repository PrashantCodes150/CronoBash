-- ==========================================
-- CronoBash Migration: Matchmaking, Referrals, & Daily Challenges
-- ==========================================

-- 1. Matchmaking Queue Table
create table if not exists public.matchmaking_queue (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null unique,
    skill_level text not null check (skill_level in ('beginner', 'intermediate', 'advanced')),
    preferred_duration integer not null default 25,
    status text not null check (status in ('searching', 'paired')),
    joined_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.matchmaking_queue enable row level security;

drop policy if exists "Users can view and manage their own matchmaking queue" on public.matchmaking_queue;
drop policy if exists "System role can manage matchmaking queues" on public.matchmaking_queue;

create policy "Users can view and manage their own matchmaking queue"
    on public.matchmaking_queue for all
    using (auth.uid() = user_id);

create policy "System role can manage matchmaking queues"
    on public.matchmaking_queue for select
    using (true);

-- 2. Referrals Table
create table if not exists public.referrals (
    id uuid default gen_random_uuid() primary key,
    referrer_id uuid references public.users(id) on delete cascade not null,
    referred_id uuid references public.users(id) on delete cascade not null unique,
    coins_awarded integer not null default 10 check (coins_awarded >= 0),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.referrals enable row level security;

drop policy if exists "Users can view their own referral earnings" on public.referrals;
create policy "Users can view their own referral earnings"
    on public.referrals for select
    using (auth.uid() = referrer_id or auth.uid() = referred_id);

-- 3. Daily Challenges Table
create table if not exists public.daily_challenges (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    title text not null,
    description text not null,
    reward_coins integer not null default 10,
    badge_name text not null,
    target_minutes integer not null default 25,
    completed boolean not null default false,
    date date default current_date not null
);

alter table public.daily_challenges enable row level security;

drop policy if exists "Users can view and manage their own daily challenges" on public.daily_challenges;
create policy "Users can view and manage their own daily challenges"
    on public.daily_challenges for all
    using (auth.uid() = user_id);

-- Create indexes for performance tuning
create index if not exists idx_matchmaking_queue_skill on public.matchmaking_queue(skill_level, status);
create index if not exists idx_referrals_referrer on public.referrals(referrer_id);
create index if not exists idx_daily_challenges_user_date on public.daily_challenges(user_id, date);
