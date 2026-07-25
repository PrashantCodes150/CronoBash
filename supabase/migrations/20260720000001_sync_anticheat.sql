-- ==========================================
-- CronoBash Migration: Sync Logs & Anti-Cheat Reporting
-- ==========================================

-- 1. Sync Logs Table (Realtime telemetry debugging)
create table if not exists public.sync_logs (
    id uuid default gen_random_uuid() primary key,
    room_id uuid references public.rooms(id) on delete cascade not null,
    user_id uuid references public.users(id) on delete cascade not null,
    event_type text not null check (event_type in ('focus', 'distraction')),
    payload jsonb not null default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.sync_logs enable row level security;

drop policy if exists "Users can view their own sync logs" on public.sync_logs;
drop policy if exists "System role can insert sync logs" on public.sync_logs;

create policy "Users can view their own sync logs"
    on public.sync_logs for select
    using (auth.uid() = user_id);

create policy "System role can insert sync logs"
    on public.sync_logs for insert
    with check (true);

-- 2. Anti-Cheat Cheat Reports Table
create table if not exists public.reports (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    reported_by uuid references public.users(id) on delete set null,
    reason text not null,
    details jsonb not null default '{}'::jsonb,
    resolved boolean not null default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.reports enable row level security;

drop policy if exists "Users can view reports filed about or by them" on public.reports;
drop policy if exists "System role can insert reports" on public.reports;

create policy "Users can view reports filed about or by them"
    on public.reports for select
    using (auth.uid() = user_id or auth.uid() = reported_by);

create policy "System role can insert reports"
    on public.reports for insert
    with check (true);

-- Create index on foreign keys for query acceleration
create index if not exists idx_sync_logs_room_id on public.sync_logs(room_id);
create index if not exists idx_sync_logs_user_id on public.sync_logs(user_id);
create index if not exists idx_reports_user_id on public.reports(user_id);
