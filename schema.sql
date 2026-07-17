-- ==========================================
-- FocusArena Supabase Database Schema
-- ==========================================
-- Run this in the Supabase SQL Editor or via `supabase db push`
-- Requires: Supabase project with Auth enabled

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. USERS TABLE
-- ==========================================
create table public.users (
    id uuid references auth.users on delete cascade primary key,
    name text not null,
    email text not null,
    avatar_url text,
    daily_goal_minutes integer not null default 120,
    is_pro boolean not null default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.users enable row level security;

create policy "Users profiles are viewable by everyone"
    on public.users for select
    using (true);

create policy "Users can update their own profile"
    on public.users for update
    using (auth.uid() = id);

create policy "Users can insert their own profile"
    on public.users for insert
    with check (auth.uid() = id);

-- ==========================================
-- 2. WALLETS TABLE
-- ==========================================
create table public.wallets (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) on delete cascade not null unique,
    balance integer not null default 0 check (balance >= 0)
);

alter table public.wallets enable row level security;

create policy "Users can view their own wallet"
    on public.wallets for select
    using (auth.uid() = user_id);

-- Wallets can only be updated securely by backend RPC database functions.

-- ==========================================
-- 3. TRANSACTIONS TABLE
-- ==========================================
create table public.transactions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    type text not null check (type in ('deposit', 'withdrawal', 'entry_fee', 'winning', 'platform_fee')),
    amount integer not null,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.transactions enable row level security;

create policy "Users can view their own transactions"
    on public.transactions for select
    using (auth.uid() = user_id);

-- Transactions ledger can only be written securely via database functions.

-- ==========================================
-- 4. ROOMS TABLE
-- ==========================================
create table public.rooms (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    type text not null check (type in ('public', 'private', 'money')),
    owner_id uuid references public.users(id) on delete set null,
    max_members integer not null default 10,
    entry_fee integer not null default 0 check (entry_fee >= 0),
    platform_fee_percent integer not null default 10 check (platform_fee_percent >= 0 and platform_fee_percent <= 100),
    subject_tags text[] not null default '{}'::text[],
    description text,
    is_active boolean not null default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 5. ROOM MEMBERS TABLE
-- ==========================================
-- Created before rooms RLS policies because the private-room policy references this table.
create table public.room_members (
    id uuid default uuid_generate_v4() primary key,
    room_id uuid references public.rooms(id) on delete cascade not null,
    user_id uuid references public.users(id) on delete cascade not null,
    joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
    total_focus_seconds_today integer not null default 0,
    unique (room_id, user_id)
);

-- ==========================================
-- ROOMS RLS
-- ==========================================
alter table public.rooms enable row level security;

-- Public and money rooms visible to all authenticated users
create policy "Public and money rooms are visible to everyone"
    on public.rooms for select
    using (
        type in ('public', 'money')
        or owner_id = auth.uid()
    );

-- Private rooms visible only to owner and members
create policy "Private rooms are visible to members"
    on public.rooms for select
    using (
        type = 'private' and (
            owner_id = auth.uid()
            or exists (
                select 1 from public.room_members
                where room_members.room_id = id
                  and room_members.user_id = auth.uid()
            )
        )
    );

create policy "Authenticated users can create rooms"
    on public.rooms for insert
    with check (auth.uid() is not null and auth.uid() = owner_id);

create policy "Owners can update their rooms"
    on public.rooms for update
    using (owner_id = auth.uid());

create policy "Owners can delete their rooms"
    on public.rooms for delete
    using (owner_id = auth.uid());

-- ==========================================
-- ROOM MEMBERS RLS
-- ==========================================
alter table public.room_members enable row level security;

create policy "Room members are viewable by everyone"
    on public.room_members for select
    using (true);

create policy "Users can join rooms"
    on public.room_members for insert
    with check (auth.uid() = user_id);

create policy "Users can leave rooms"
    on public.room_members for delete
    using (auth.uid() = user_id);

create policy "Members can update own focus seconds"
    on public.room_members for update
    using (auth.uid() = user_id);

-- ==========================================
-- 6. STUDY SESSIONS TABLE
-- ==========================================
create table public.study_sessions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    room_id uuid references public.rooms(id) on delete set null,
    start_time timestamp with time zone default timezone('utc'::text, now()) not null,
    end_time timestamp with time zone,
    focus_seconds integer not null default 0,
    total_seconds integer not null default 0,
    mode_changes jsonb not null default '[]'::jsonb,
    screen_focus_seconds integer not null default 0,
    paper_focus_seconds integer not null default 0
);

alter table public.study_sessions enable row level security;

create policy "Users can view their own study sessions"
    on public.study_sessions for select
    using (auth.uid() = user_id);

create policy "Room members can view sessions in their rooms"
    on public.study_sessions for select
    using (
        exists (
            select 1 from public.room_members
            where room_members.room_id = study_sessions.room_id
              and room_members.user_id = auth.uid()
        )
    );

create policy "Users can insert their own study sessions"
    on public.study_sessions for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own study sessions"
    on public.study_sessions for update
    using (auth.uid() = user_id);

-- ==========================================
-- 7. TASKS TABLE
-- ==========================================
create table public.tasks (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    title text not null,
    subject text not null,
    planned_minutes integer not null default 30 check (planned_minutes > 0),
    completed boolean not null default false,
    date date default current_date not null
);

alter table public.tasks enable row level security;

create policy "Users can view their own tasks"
    on public.tasks for select
    using (auth.uid() = user_id);

create policy "Users can insert their own tasks"
    on public.tasks for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
    on public.tasks for update
    using (auth.uid() = user_id);

create policy "Users can delete their own tasks"
    on public.tasks for delete
    using (auth.uid() = user_id);

-- ==========================================
-- 8. TIMETABLES TABLE
-- ==========================================
create table public.timetables (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    day_of_week integer not null check (day_of_week >= 0 and day_of_week <= 6),
    start_time time not null,
    end_time time not null,
    subject text not null,
    check (start_time < end_time)
);

alter table public.timetables enable row level security;

create policy "Users can view their own timetables"
    on public.timetables for select
    using (auth.uid() = user_id);

create policy "Users can insert their own timetables"
    on public.timetables for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own timetables"
    on public.timetables for update
    using (auth.uid() = user_id);

create policy "Users can delete their own timetables"
    on public.timetables for delete
    using (auth.uid() = user_id);

-- ==========================================
-- PERFORMANCE INDEXES
-- ==========================================

-- Users
create index idx_users_email on public.users (email);

-- Wallets
create index idx_wallets_user_id on public.wallets (user_id);

-- Transactions
create index idx_transactions_user_id on public.transactions (user_id);
create index idx_transactions_user_type on public.transactions (user_id, type);
create index idx_transactions_created_at on public.transactions (created_at desc);

-- Rooms
create index idx_rooms_type on public.rooms (type);
create index idx_rooms_owner_id on public.rooms (owner_id);
create index idx_rooms_is_active on public.rooms (is_active);
create index idx_rooms_subject_tags on public.rooms using gin (subject_tags);

-- Room Members
create index idx_room_members_room_id on public.room_members (room_id);
create index idx_room_members_user_id on public.room_members (user_id);
create index idx_room_members_room_user on public.room_members (room_id, user_id);
create index idx_room_members_leaderboard on public.room_members (room_id, total_focus_seconds_today desc);

-- Study Sessions
create index idx_study_sessions_user_id on public.study_sessions (user_id);
create index idx_study_sessions_room_id on public.study_sessions (room_id);
create index idx_study_sessions_user_date on public.study_sessions (user_id, start_time);

-- Tasks
create index idx_tasks_user_id on public.tasks (user_id);
create index idx_tasks_user_date on public.tasks (user_id, date);
create index idx_tasks_completed on public.tasks (user_id, completed, date);

-- Timetables
create index idx_timetables_user_id on public.timetables (user_id);
create index idx_timetables_user_day on public.timetables (user_id, day_of_week);

-- Analytics-specific composite indexes
create index idx_study_sessions_user_start on public.study_sessions (user_id, start_time desc);
create index idx_study_sessions_start_cover on public.study_sessions (start_time) include (user_id, focus_seconds, total_seconds);
create index idx_transactions_user_created on public.transactions (user_id, created_at desc);
create index idx_tasks_user_completed on public.tasks (user_id, completed) where completed = true;


-- ==========================================
-- TRIGGERS & PROCEDURES
-- ==========================================

-- Trigger: automatically create user profile + wallet on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.users (id, name, email, avatar_url)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'name', 'Arena Fighter'),
        new.email,
        coalesce(new.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=150')
    );

    insert into public.wallets (user_id, balance)
    values (new.id, 1000);

    insert into public.transactions (user_id, type, amount, description)
    values (new.id, 'deposit', 1000, 'Welcome bonus tokens credited.');

    return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- Trigger: update room_members total_focus_seconds when a study session ends
create or replace function public.update_room_focus_seconds()
returns trigger as $$
begin
    if new.end_time is not null and new.room_id is not null then
        update public.room_members
        set total_focus_seconds_today = total_focus_seconds_today + new.focus_seconds
        where room_id = new.room_id
          and user_id = new.user_id;
    end if;
    return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_study_session_end
    after update of end_time on public.study_sessions
    for each row
    when (new.end_time is not null and old.end_time is null)
    execute procedure public.update_room_focus_seconds();

-- NOTE: Entry fee deduction for money rooms is handled atomically by
-- the join_money_room() SQL function (see below), NOT by a trigger.
-- This avoids double-deduction when the function inserts into room_members.


-- ==========================================
-- MONEY ROOM SETTLEMENT
-- ==========================================

-- Core settlement function: called by Edge Function or pg_cron
create or replace function public.settle_money_rooms()
returns json as $$
declare
    room_rec record;
    winner_rec record;
    member_count integer;
    total_pool integer;
    plat_fee integer;
    winner_share integer;
    results json[] := '{}';
    result_item json;
begin
    for room_rec in
        select * from public.rooms
        where type = 'money' and is_active = true
    loop
        select count(*) into member_count
        from public.room_members
        where room_id = room_rec.id;

        if member_count < 2 then
            result_item := json_build_object(
                'room_id', room_rec.id,
                'room_name', room_rec.name,
                'status', 'skipped',
                'reason', 'insufficient_members'
            );
            results := results || result_item;
            continue;
        end if;

        -- Find the winner (most focus seconds today; ties broken by earliest join)
        select rm.*, u.name into winner_rec
        from public.room_members rm
        join public.users u on u.id = rm.user_id
        where rm.room_id = room_rec.id
        order by rm.total_focus_seconds_today desc, rm.joined_at asc
        limit 1;

        if winner_rec.total_focus_seconds_today > 0 then
            total_pool := room_rec.entry_fee * member_count;
            plat_fee := (total_pool * room_rec.platform_fee_percent) / 100;
            winner_share := total_pool - plat_fee;

            -- Credit winner
            update public.wallets
            set balance = balance + winner_share
            where user_id = winner_rec.user_id;

            insert into public.transactions (user_id, type, amount, description)
            values (
                winner_rec.user_id,
                'winning',
                winner_share,
                'Won room challenge: ' || room_rec.name || ' (' || winner_rec.total_focus_seconds_today || 's focus)'
            );

            -- Credit platform fee to room owner
            if room_rec.owner_id is not null and plat_fee > 0 then
                update public.wallets
                set balance = balance + plat_fee
                where user_id = room_rec.owner_id;

                insert into public.transactions (user_id, type, amount, description)
                values (
                    room_rec.owner_id,
                    'platform_fee',
                    plat_fee,
                    'Platform fee from room: ' || room_rec.name
                );
            end if;

            result_item := json_build_object(
                'room_id', room_rec.id,
                'room_name', room_rec.name,
                'winner_id', winner_rec.user_id,
                'winner_name', winner_rec.name,
                'focus_seconds', winner_rec.total_focus_seconds_today,
                'total_pool', total_pool,
                'platform_fee', plat_fee,
                'winner_share', winner_share,
                'status', 'settled'
            );
        else
            result_item := json_build_object(
                'room_id', room_rec.id,
                'room_name', room_rec.name,
                'status', 'no_activity'
            );
        end if;

        results := results || result_item;
    end loop;

    -- Reset money room members' daily focus for next day
    update public.room_members
    set total_focus_seconds_today = 0
    where room_id in (
        select id from public.rooms where type = 'money' and is_active = true
    );

    return json_build_object(
        'settled_at', now(),
        'rooms', results
    );
end;
$$ language plpgsql security definer;


-- ==========================================
-- LEADERBOARD FUNCTION
-- ==========================================

-- Get room leaderboard with user details
create or replace function public.get_room_leaderboard(p_room_id uuid)
returns table (
    rank bigint,
    user_id uuid,
    user_name text,
    avatar_url text,
    focus_seconds_today integer,
    joined_at timestamp with time zone,
    is_pro boolean
) as $$
begin
    return query
    select
        row_number() over (order by rm.total_focus_seconds_today desc, rm.joined_at asc) as rank,
        rm.user_id,
        u.name as user_name,
        u.avatar_url,
        rm.total_focus_seconds_today as focus_seconds_today,
        rm.joined_at,
        u.is_pro
    from public.room_members rm
    join public.users u on u.id = rm.user_id
    where rm.room_id = p_room_id
    order by rm.total_focus_seconds_today desc, rm.joined_at asc;
end;
$$ language plpgsql stable;


-- ==========================================
-- USER STATS FUNCTIONS
-- ==========================================

-- Get today's total focus time for a user (across all rooms + solo)
create or replace function public.get_user_today_focus(p_user_id uuid)
returns integer as $$
declare
    total integer;
begin
    select coalesce(sum(focus_seconds), 0) into total
    from public.study_sessions
    where user_id = p_user_id
      and start_time >= (current_date at time zone 'UTC');

    return total;
end;
$$ language plpgsql stable;

-- Get user's weekly stats
create or replace function public.get_user_weekly_stats(p_user_id uuid)
returns table (
    day date,
    focus_seconds bigint,
    tasks_completed bigint
) as $$
begin
    return query
    select
        d::date as day,
        coalesce((
            select sum(ss.focus_seconds)
            from public.study_sessions ss
            where ss.user_id = p_user_id
              and ss.start_time::date = d::date
        ), 0) as focus_seconds,
        coalesce((
            select count(*)
            from public.tasks t
            where t.user_id = p_user_id
              and t.date = d::date
              and t.completed = true
        ), 0) as tasks_completed
    from generate_series(
        current_date - interval '6 days',
        current_date,
        '1 day'::interval
    ) d;
end;
$$ language plpgsql stable;

-- Get room stats for the room detail page
create or replace function public.get_room_stats(p_room_id uuid)
returns json as $$
declare
    room_rec record;
    member_cnt integer;
    today_pool integer;
begin
    select * into room_rec from public.rooms where id = p_room_id;

    select count(*) into member_cnt
    from public.room_members where room_id = p_room_id;

    if room_rec.type = 'money' then
        today_pool := room_rec.entry_fee * member_cnt;
    else
        today_pool := 0;
    end if;

    return json_build_object(
        'room_id', room_rec.id,
        'member_count', member_cnt,
        'max_members', room_rec.max_members,
        'entry_fee', room_rec.entry_fee,
        'today_pool', today_pool,
        'platform_fee_percent', room_rec.platform_fee_percent,
        'total_focus_today', (
            select coalesce(sum(total_focus_seconds_today), 0)
            from public.room_members where room_id = p_room_id
        )
    );
end;
$$ language plpgsql stable;

-- Join a money room: deducts entry fee atomically, then inserts membership.
-- This is the ONLY way to join money rooms (no trigger-based deduction).
create or replace function public.join_money_room(p_user_id uuid, p_room_id uuid)
returns json as $$
declare
    room_rec record;
    wallet_rec record;
    new_member_id uuid;
begin
    select * into room_rec from public.rooms where id = p_room_id;

    if room_rec is null then
        return json_build_object('error', 'Room not found');
    end if;

    if room_rec.type != 'money' then
        return json_build_object('error', 'Not a money room');
    end if;

    if room_rec.entry_fee > 0 then
        select * into wallet_rec from public.wallets where user_id = p_user_id;

        if wallet_rec is null or wallet_rec.balance < room_rec.entry_fee then
            return json_build_object('error', 'Insufficient balance');
        end if;

        update public.wallets
        set balance = balance - room_rec.entry_fee
        where user_id = p_user_id;

        insert into public.transactions (user_id, type, amount, description)
        values (p_user_id, 'entry_fee', room_rec.entry_fee, 'Entry fee for room: ' || room_rec.name);
    end if;

    insert into public.room_members (room_id, user_id)
    values (p_room_id, p_user_id)
    returning id into new_member_id;

    return json_build_object(
        'success', true,
        'member_id', new_member_id,
        'entry_fee_deducted', room_rec.entry_fee
    );
end;
$$ language plpgsql security definer;


-- ==========================================
-- DAILY RESET FUNCTION
-- ==========================================

-- Reset all room members' daily focus counters (called at midnight UTC)
create or replace function public.reset_daily_focus()
returns json as $$
declare
    reset_count integer;
begin
    update public.room_members
    set total_focus_seconds_today = 0
    where total_focus_seconds_today > 0;

    get diagnostics reset_count = row_count;

    return json_build_object(
        'reset_at', now(),
        'members_reset', reset_count
    );
end;
$$ language plpgsql security definer;


-- ==========================================
-- USER DASHBOARD FUNCTION
-- ==========================================

-- Single-query dashboard summary for the frontend
create or replace function public.get_user_dashboard(p_user_id uuid)
returns json as $$
declare
    result json;
begin
    select json_build_object(
        'today_focus', coalesce((
            select sum(focus_seconds)
            from public.study_sessions
            where user_id = p_user_id
              and start_time >= (current_date at time zone 'UTC')
        ), 0),
        'wallet_balance', coalesce((
            select balance from public.wallets where user_id = p_user_id
        ), 0),
        'tasks_done_today', (
            select count(*) from public.tasks
            where user_id = p_user_id and date = current_date and completed
        ),
        'tasks_total_today', (
            select count(*) from public.tasks
            where user_id = p_user_id and date = current_date
        ),
        'active_rooms', (
            select count(*) from public.room_members rm
            join public.rooms r on r.id = rm.room_id
            where rm.user_id = p_user_id and r.is_active
        )
    ) into result;

    return result;
end;
$$ language plpgsql stable;


-- ==========================================
-- 9. 1v1 CHALLENGES TABLE
-- ==========================================
create table public.challenges (
    id uuid default uuid_generate_v4() primary key,
    creator_id uuid references public.users(id) on delete cascade not null,
    opponent_id uuid references public.users(id) on delete cascade,
    stake_amount integer not null default 0 check (stake_amount >= 0),
    duration_minutes integer not null default 30 check (duration_minutes > 0),
    subject text,
    status text not null default 'open' check (status in ('open', 'accepted', 'completed')),
    winner_id uuid references public.users(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    completed_at timestamp with time zone
);

alter table public.challenges enable row level security;

create policy "Challenges are visible to everyone"
    on public.challenges for select
    using (true);

create policy "Authenticated users can create challenges"
    on public.challenges for insert
    with check (auth.uid() = creator_id);

create policy "Users can accept or modify challenges"
    on public.challenges for update
    using (status = 'open' or creator_id = auth.uid() or opponent_id = auth.uid());


-- ==========================================
-- 10. ROOM CHAT MESSAGES TABLE
-- ==========================================
create table public.messages (
    id uuid default uuid_generate_v4() primary key,
    room_id uuid references public.rooms(id) on delete cascade not null,
    user_id uuid references public.users(id) on delete cascade not null,
    message_text text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.messages enable row level security;

create policy "Room members can view messages in their rooms"
    on public.messages for select
    using (
        exists (
            select 1 from public.room_members rm
            where rm.room_id = messages.room_id
              and rm.user_id = auth.uid()
        )
    );

create policy "Users can send messages to their rooms"
    on public.messages for insert
    with check (
        auth.uid() = user_id
        and exists (
            select 1 from public.room_members rm
            where rm.room_id = messages.room_id
              and rm.user_id = auth.uid()
        )
    );

create policy "Users can delete their own messages"
    on public.messages for delete
    using (user_id = auth.uid());


-- ==========================================
-- 11. INDEXES FOR CHAT & CHALLENGES
-- ==========================================
create index idx_messages_room_id on public.messages (room_id);
create index idx_messages_user_id on public.messages (user_id);
create index idx_messages_created_at on public.messages (created_at desc);

create index idx_challenges_creator_id on public.challenges (creator_id);
create index idx_challenges_opponent_id on public.challenges (opponent_id);
create index idx_challenges_status on public.challenges (status);


-- ==========================================
-- 12. CHALLENGE PROCEDURES (RPCs)
-- ==========================================

-- RPC: create a 1v1 challenge (locks stakes from creator's wallet)
create or replace function public.create_1v1_challenge(
    p_creator_id uuid,
    p_stake_amount integer,
    p_duration_minutes integer,
    p_subject text
)
returns json as $$
declare
    wallet_rec record;
    new_challenge_id uuid;
begin
    select * into wallet_rec from public.wallets where user_id = p_creator_id;
    if wallet_rec is null or wallet_rec.balance < p_stake_amount then
        return json_build_object('error', 'Insufficient stakes balance');
    end if;

    update public.wallets
    set balance = balance - p_stake_amount
    where user_id = p_creator_id;

    insert into public.transactions (user_id, type, amount, description)
    values (p_creator_id, 'entry_fee', p_stake_amount, '1v1 challenge stakes locked');

    insert into public.challenges (creator_id, stake_amount, duration_minutes, subject, status)
    values (p_creator_id, p_stake_amount, p_duration_minutes, p_subject, 'open')
    returning id into new_challenge_id;

    return json_build_object('success', true, 'challenge_id', new_challenge_id);
end;
$$ language plpgsql security definer;

-- RPC: accept an open challenge (locks stakes from opponent's wallet)
create or replace function public.accept_1v1_challenge(
    p_challenge_id uuid,
    p_opponent_id uuid
)
returns json as $$
declare
    challenge_rec record;
    wallet_rec record;
begin
    select * into challenge_rec from public.challenges where id = p_challenge_id;
    if challenge_rec is null then
        return json_build_object('error', 'Challenge record not found');
    end if;
    if challenge_rec.status != 'open' then
        return json_build_object('error', 'Challenge is not open');
    end if;
    if challenge_rec.creator_id = p_opponent_id then
        return json_build_object('error', 'You cannot accept your own challenge');
    end if;

    select * into wallet_rec from public.wallets where user_id = p_opponent_id;
    if wallet_rec is null or wallet_rec.balance < challenge_rec.stake_amount then
        return json_build_object('error', 'Insufficient stakes to match challenge');
    end if;

    update public.wallets
    set balance = balance - challenge_rec.stake_amount
    where user_id = p_opponent_id;

    insert into public.transactions (user_id, type, amount, description)
    values (p_opponent_id, 'entry_fee', challenge_rec.stake_amount, 'Stakes matched for 1v1 challenge');

    update public.challenges
    set opponent_id = p_opponent_id,
        status = 'accepted'
    where id = p_challenge_id;

    return json_build_object('success', true);
end;
$$ language plpgsql security definer;

-- RPC: settle completed challenge (declares winner, credits earnings)
create or replace function public.settle_1v1_challenge(p_challenge_id uuid)
returns json as $$
declare
    challenge_rec record;
    creator_focus bigint := 0;
    opponent_focus bigint := 0;
    v_winner_id uuid;
    total_pool integer;
    winner_share integer;
    plat_fee integer;
begin
    select * into challenge_rec from public.challenges where id = p_challenge_id;
    if challenge_rec is null then
        return json_build_object('error', 'Challenge not found');
    end if;
    if challenge_rec.status != 'accepted' then
        return json_build_object('error', 'Challenge is not in accepted state');
    end if;

    -- Calculate total focus seconds study logs since challenge creation
    select coalesce(sum(focus_seconds), 0) into creator_focus
    from public.study_sessions
    where user_id = challenge_rec.creator_id
      and start_time >= challenge_rec.created_at;

    select coalesce(sum(focus_seconds), 0) into opponent_focus
    from public.study_sessions
    where user_id = challenge_rec.opponent_id
      and start_time >= challenge_rec.created_at;

    if creator_focus > opponent_focus then
        v_winner_id := challenge_rec.creator_id;
    elsif opponent_focus > creator_focus then
        v_winner_id := challenge_rec.opponent_id;
    else
        v_winner_id := challenge_rec.creator_id; -- Tie goes to creator
    end if;

    total_pool := challenge_rec.stake_amount * 2;
    plat_fee := (total_pool * 10) / 100;
    winner_share := total_pool - plat_fee;

    update public.wallets
    set balance = balance + winner_share
    where user_id = v_winner_id;

    insert into public.transactions (user_id, type, amount, description)
    values (v_winner_id, 'winning', winner_share, 'Stakes won in 1v1 focus challenge');

    -- Credit owner commission fee
    if challenge_rec.creator_id is not null and plat_fee > 0 then
        update public.wallets
        set balance = balance + plat_fee
        where user_id = challenge_rec.creator_id;

        insert into public.transactions (user_id, type, amount, description)
        values (challenge_rec.creator_id, 'platform_fee', plat_fee, '1v1 challenge platform commission fee');
    end if;

    update public.challenges
    set status = 'completed',
        winner_id = v_winner_id,
        completed_at = now()
    where id = p_challenge_id;

    return json_build_object(
        'success', true,
        'winner_id', v_winner_id,
        'total_pool', total_pool,
        'winner_share', winner_share
    );
end;
$$ language plpgsql security definer;


-- RPC: secure token deposit (credits wallet and logs transaction)
create or replace function public.deposit_tokens_secure(
    p_user_id uuid,
    p_amount integer
)
returns json as $$
declare
    v_balance integer;
begin
    if p_amount <= 0 then
        return json_build_object('error', 'Amount must be positive');
    end if;

    update public.wallets
    set balance = balance + p_amount
    where user_id = p_user_id
    returning balance into v_balance;

    insert into public.transactions (user_id, type, amount, description)
    values (p_user_id, 'deposit', p_amount, 'Secure deposit credit transaction');

    return json_build_object('success', true, 'new_balance', v_balance);
end;
$$ language plpgsql security definer;


-- RPC: secure token withdrawal (deducts wallet and logs transaction)
create or replace function public.withdraw_tokens_secure(
    p_user_id uuid,
    p_amount integer
)
returns json as $$
declare
    v_balance integer;
begin
    if p_amount <= 0 then
        return json_build_object('error', 'Amount must be positive');
    end if;

    select balance into v_balance from public.wallets where user_id = p_user_id;
    if v_balance is null or v_balance < p_amount then
        return json_build_object('error', 'Insufficient wallet balance');
    end if;

    update public.wallets
    set balance = balance - p_amount
    where user_id = p_user_id
    returning balance into v_balance;

    insert into public.transactions (user_id, type, amount, description)
    values (p_user_id, 'withdrawal', p_amount, 'Secure withdrawal debit transaction');

    return json_build_object('success', true, 'new_balance', v_balance);
end;
$$ language plpgsql security definer;


-- ==========================================
-- 10. NOTIFICATIONS TABLE
-- ==========================================
create table public.notifications (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    title text not null,
    message text not null,
    type text not null default 'info', -- 'info', 'achievement', 'transaction', 'challenge'
    is_read boolean not null default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
    on public.notifications for select
    using (auth.uid() = user_id);

create policy "Users can update their own notifications"
    on public.notifications for update
    using (auth.uid() = user_id);


-- Trigger: Create notification on transaction insertion
create or replace function public.handle_new_transaction_notification()
returns trigger as $$
begin
    insert into public.notifications (user_id, title, message, type)
    values (
        new.user_id,
        'Transaction Posted',
        'A new transaction of type ' || new.type || ' (' || new.amount || ' TKN) was posted to your wallet: "' || coalesce(new.description, '') || '".',
        'transaction'
    );
    return new;
end;
$$ language plpgsql security definer;

create trigger tr_transaction_notification
    after insert on public.transactions
    for each row
    execute function public.handle_new_transaction_notification();


