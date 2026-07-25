-- ==========================================
-- CronoBash Migration: User Challenges Progress Table
-- ==========================================

create table if not exists public.user_challenge_progress (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    challenge_id uuid references public.daily_challenges(id) on delete cascade not null,
    progress integer not null default 0 check (progress >= 0),
    completed boolean not null default false,
    claimed_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, challenge_id)
);

alter table public.user_challenge_progress enable row level security;

drop policy if exists "Users can check and update their own progress" on public.user_challenge_progress;
create policy "Users can check and update their own progress"
    on public.user_challenge_progress for all
    using (auth.uid() = user_id);

create index if not exists idx_challenge_progress_lookup on public.user_challenge_progress(user_id, challenge_id);
