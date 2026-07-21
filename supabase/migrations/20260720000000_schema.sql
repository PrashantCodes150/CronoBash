-- =========================================================================
-- CogniSweep Master Base Schema Migration (20260720000000_schema.sql)
-- =========================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. USERS TABLE
-- ==========================================
create table if not exists public.users (
    id uuid references auth.users on delete cascade primary key,
    name text not null,
    email text not null,
    avatar_url text,
    daily_goal_minutes integer not null default 120,
    is_pro boolean not null default false,
    has_seen_onboarding boolean not null default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.users enable row level security;

drop policy if exists "Users profiles are viewable by everyone" on public.users;
drop policy if exists "Users can update their own profile" on public.users;
drop policy if exists "Users can insert their own profile" on public.users;

create policy "Users profiles are viewable by everyone" on public.users for select using (true);
create policy "Users can update their own profile" on public.users for update using (auth.uid() = id);
create policy "Users can insert their own profile" on public.users for insert with check (auth.uid() = id);

-- ==========================================
-- 2. WALLETS TABLE
-- ==========================================
create table if not exists public.wallets (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null unique,
    balance integer not null default 0 check (balance >= 0)
);

alter table public.wallets enable row level security;

drop policy if exists "Users can view their own wallet" on public.wallets;
create policy "Users can view their own wallet" on public.wallets for select using (auth.uid() = user_id);

-- ==========================================
-- 3. TRANSACTIONS TABLE
-- ==========================================
create table if not exists public.transactions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    type text not null check (type in ('deposit', 'withdrawal', 'entry_fee', 'winning', 'platform_fee', 'payout')),
    amount integer not null,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.transactions enable row level security;

drop policy if exists "Users can view their own transactions" on public.transactions;
create policy "Users can view their own transactions" on public.transactions for select using (auth.uid() = user_id);

-- ==========================================
-- 4. ROOMS TABLE
-- ==========================================
create table if not exists public.rooms (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    type text not null check (type in ('public', 'private', 'money')),
    owner_id uuid references public.users(id) on delete set null,
    max_members integer not null default 10,
    entry_fee integer not null default 0 check (entry_fee >= 0),
    platform_fee_percent integer not null default 10 check (platform_fee_percent >= 0 and platform_fee_percent <= 100),
    subject_tags text[] not null default '{}'::text[],
    description text,
    is_active boolean not null default true,
    invite_code text not null unique,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 5. ROOM MEMBERS TABLE
-- ==========================================
create table if not exists public.room_members (
    id uuid default gen_random_uuid() primary key,
    room_id uuid references public.rooms(id) on delete cascade not null,
    user_id uuid references public.users(id) on delete cascade not null,
    joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
    total_focus_seconds_today integer not null default 0,
    unique (room_id, user_id)
);

-- Rooms security policies
alter table public.rooms enable row level security;

drop policy if exists "Public and money rooms are visible to everyone" on public.rooms;
drop policy if exists "Private rooms are visible to members" on public.rooms;
drop policy if exists "Authenticated users can create rooms" on public.rooms;
drop policy if exists "Owners can update their rooms" on public.rooms;
drop policy if exists "Owners can delete their rooms" on public.rooms;

create policy "Public and money rooms are visible to everyone" on public.rooms for select using (type in ('public', 'money') or owner_id = auth.uid());
create policy "Private rooms are visible to members" on public.rooms for select using (type = 'private' and (owner_id = auth.uid() or exists (select 1 from public.room_members where room_members.room_id = id and room_members.user_id = auth.uid())));
create policy "Authenticated users can create rooms" on public.rooms for insert with check (auth.uid() is not null and auth.uid() = owner_id);
create policy "Owners can update their rooms" on public.rooms for update using (owner_id = auth.uid());
create policy "Owners can delete their rooms" on public.rooms for delete using (owner_id = auth.uid());

-- Room members security policies
alter table public.room_members enable row level security;

drop policy if exists "Room members are viewable by everyone" on public.room_members;
drop policy if exists "Users can join rooms" on public.room_members;
drop policy if exists "Users can leave rooms" on public.room_members;
drop policy if exists "Owners can kick members" on public.room_members;
drop policy if exists "Members can update own focus seconds" on public.room_members;

create policy "Room members are viewable by everyone" on public.room_members for select using (true);
create policy "Users can join rooms" on public.room_members for insert with check (auth.uid() = user_id);
create policy "Users can leave rooms" on public.room_members for delete using (auth.uid() = user_id);
create policy "Owners can kick members" on public.room_members for delete using (exists (select 1 from public.rooms where rooms.id = room_members.room_id and rooms.owner_id = auth.uid() and rooms.type != 'money'));
create policy "Members can update own focus seconds" on public.room_members for update using (auth.uid() = user_id);

-- ==========================================
-- 6. STUDY SESSIONS TABLE
-- ==========================================
create table if not exists public.study_sessions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    room_id uuid references public.rooms(id) on delete set null,
    start_time timestamp with time zone default timezone('utc'::text, now()) not null,
    end_time timestamp with time zone,
    focus_seconds integer not null default 0,
    total_seconds integer not null default 0,
    mode_changes jsonb not null default '[]'::jsonb,
    screen_focus_seconds integer not null default 0,
    paper_focus_seconds integer not null default 0,
    name text,
    is_winner boolean,
    opponent_name text,
    opponent_focus_seconds integer,
    hands_down_forfeited boolean
);

alter table public.study_sessions enable row level security;

drop policy if exists "Users can view their own study sessions" on public.study_sessions;
drop policy if exists "Room members can view sessions in their rooms" on public.study_sessions;
drop policy if exists "Users can insert their own study sessions" on public.study_sessions;
drop policy if exists "Users can update their own study sessions" on public.study_sessions;

create policy "Users can view their own study sessions" on public.study_sessions for select using (auth.uid() = user_id);
create policy "Room members can view sessions in their rooms" on public.study_sessions for select using (exists (select 1 from public.room_members where room_members.room_id = study_sessions.room_id and room_members.user_id = auth.uid()));
create policy "Users can insert their own study sessions" on public.study_sessions for insert with check (auth.uid() = user_id);
create policy "Users can update their own study sessions" on public.study_sessions for update using (auth.uid() = user_id);

-- ==========================================
-- 7. TASKS TABLE
-- ==========================================
create table if not exists public.tasks (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    title text not null,
    subject text not null,
    planned_minutes integer not null default 30 check (planned_minutes > 0),
    completed boolean not null default false,
    date date default current_date not null
);

alter table public.tasks enable row level security;

drop policy if exists "Users can view their own tasks" on public.tasks;
drop policy if exists "Users can insert their own tasks" on public.tasks;
drop policy if exists "Users can update their own tasks" on public.tasks;
drop policy if exists "Users can delete their own tasks" on public.tasks;

create policy "Users can view their own tasks" on public.tasks for select using (auth.uid() = user_id);
create policy "Users can insert their own tasks" on public.tasks for insert with check (auth.uid() = user_id);
create policy "Users can update their own tasks" on public.tasks for update using (auth.uid() = user_id);
create policy "Users can delete their own tasks" on public.tasks for delete using (auth.uid() = user_id);

-- ==========================================
-- 8. TIMETABLES TABLE
-- ==========================================
create table if not exists public.timetables (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    day_of_week integer not null check (day_of_week >= 0 and day_of_week <= 6),
    start_time time not null,
    end_time time not null,
    subject text not null,
    check (start_time < end_time)
);

alter table public.timetables enable row level security;

drop policy if exists "Users can view their own timetables" on public.timetables;
drop policy if exists "Users can insert their own timetables" on public.timetables;
drop policy if exists "Users can update their own timetables" on public.timetables;
drop policy if exists "Users can delete their own timetables" on public.timetables;

create policy "Users can view their own timetables" on public.timetables for select using (auth.uid() = user_id);
create policy "Users can insert their own timetables" on public.timetables for insert with check (auth.uid() = user_id);
create policy "Users can update their own timetables" on public.timetables for update using (auth.uid() = user_id);
create policy "Users can delete their own timetables" on public.timetables for delete using (auth.uid() = user_id);

-- ==========================================
-- 9. CONNECTIONS TABLE
-- ==========================================
create table if not exists public.connections (
    id uuid default gen_random_uuid() primary key,
    sender_id uuid references public.users(id) on delete cascade not null,
    receiver_id uuid references public.users(id) on delete cascade not null,
    status text not null check (status in ('pending', 'accepted')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (sender_id, receiver_id)
);

alter table public.connections enable row level security;

drop policy if exists "Connections are viewable by everyone" on public.connections;
drop policy if exists "Users can send connection requests" on public.connections;
drop policy if exists "Users can accept connection requests" on public.connections;
drop policy if exists "Users can delete connection requests" on public.connections;

create policy "Connections are viewable by everyone" on public.connections for select using (true);
create policy "Users can send connection requests" on public.connections for insert with check (auth.uid() = sender_id);
create policy "Users can accept connection requests" on public.connections for update using (auth.uid() = receiver_id);
create policy "Users can delete connection requests" on public.connections for delete using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- ==========================================
-- 10. NOTIFICATIONS TABLE
-- ==========================================
create table if not exists public.notifications (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    title text not null,
    message text not null,
    type text not null default 'info' check (type in ('info', 'achievement', 'transaction', 'challenge')),
    is_read boolean not null default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.notifications enable row level security;

drop policy if exists "Users can view their own notifications" on public.notifications;
drop policy if exists "Users can update their own notifications" on public.notifications;

create policy "Users can view their own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users can update their own notifications" on public.notifications for update using (auth.uid() = user_id);

-- ==========================================
-- 11. MESSAGES TABLE (Chat messages)
-- ==========================================
create table if not exists public.messages (
    id uuid default gen_random_uuid() primary key,
    room_id uuid references public.rooms(id) on delete cascade not null,
    user_id uuid references public.users(id) on delete cascade not null,
    message_text text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.messages enable row level security;

drop policy if exists "Room members can view messages in their rooms" on public.messages;
drop policy if exists "Users can send messages to their rooms" on public.messages;
drop policy if exists "Users can delete their own messages" on public.messages;

create policy "Room members can view messages in their rooms" on public.messages for select
    using (exists (select 1 from public.room_members rm where rm.room_id = messages.room_id and rm.user_id = auth.uid()));

create policy "Users can send messages to their rooms" on public.messages for insert
    with check (auth.uid() = user_id and exists (select 1 from public.room_members rm where rm.room_id = messages.room_id and rm.user_id = auth.uid()));

create policy "Users can delete their own messages" on public.messages for delete
    using (user_id = auth.uid());

-- ==========================================
-- 12. CHALLENGES TABLE (1v1 Duels)
-- ==========================================
create table if not exists public.challenges (
    id uuid default gen_random_uuid() primary key,
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

drop policy if exists "Challenges are visible to everyone" on public.challenges;
drop policy if exists "Authenticated users can create challenges" on public.challenges;
drop policy if exists "Users can accept or modify challenges" on public.challenges;

create policy "Challenges are visible to everyone" on public.challenges for select using (true);
create policy "Authenticated users can create challenges" on public.challenges for insert with check (auth.uid() = creator_id);
create policy "Users can accept or modify challenges" on public.challenges for update using (status = 'open' or creator_id = auth.uid() or opponent_id = auth.uid());

-- ==========================================
-- 13. ROOM PRESENCE TABLE
-- ==========================================
create table if not exists public.room_presence (
    id uuid default gen_random_uuid() primary key,
    room_id uuid references public.rooms(id) on delete cascade not null,
    user_id uuid references public.users(id) on delete cascade not null,
    session_id uuid references public.study_sessions(id) on delete set null,
    focus_score integer not null default 0,
    focus_seconds integer not null default 0,
    is_active boolean not null default true,
    is_muted boolean not null default false,
    share_camera boolean not null default false,
    share_graphs boolean not null default true,
    share_stats boolean not null default true,
    hands_down boolean default false,
    attention_ratio integer default 100,
    interruptions_count integer default 0,
    current_streak integer default 0,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(room_id, user_id)
);

alter table public.room_presence enable row level security;

drop policy if exists "Room members can view presence" on public.room_presence;
drop policy if exists "Users can upsert their own presence" on public.room_presence;
drop policy if exists "Users can update their own presence" on public.room_presence;
drop policy if exists "Users can delete their own presence" on public.room_presence;

create policy "Room members can view presence" on public.room_presence for select
    using (exists (select 1 from public.room_members rm where rm.room_id = room_presence.room_id and rm.user_id = auth.uid()));

create policy "Users can upsert their own presence" on public.room_presence for insert with check (auth.uid() = user_id);
create policy "Users can update their own presence" on public.room_presence for update using (auth.uid() = user_id);
create policy "Users can delete their own presence" on public.room_presence for delete using (auth.uid() = user_id);

-- ==========================================
-- 14. PERFORMANCE INDEXES
-- ==========================================
create index if not exists idx_users_email on public.users (email);
create index if not exists idx_wallets_user_id on public.wallets (user_id);
create index if not exists idx_transactions_user_id on public.transactions (user_id);
create index if not exists idx_rooms_type on public.rooms (type);
create index if not exists idx_room_members_room_id on public.room_members (room_id);
create index if not exists idx_study_sessions_user_id on public.study_sessions (user_id);
create index if not exists idx_tasks_user_id on public.tasks (user_id);
create index if not exists idx_messages_room_id on public.messages (room_id);
create index if not exists idx_challenges_status on public.challenges (status);
create index if not exists idx_room_presence_room_id on public.room_presence (room_id);

-- ==========================================
-- 15. BASE FUNCTIONS, TRIGGERS & PROCEDURES
-- ==========================================

-- Trigger: create profile and wallet on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.users (id, name, email, avatar_url)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        new.email,
        new.raw_user_meta_data->>'avatar_url'
    );

    insert into public.wallets (user_id, balance)
    values (new.id, 100);

    insert into public.transactions (user_id, type, amount, description)
    values (new.id, 'deposit', 100, 'Welcome bonus tokens credited.');

    return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- Trigger: update room focus seconds
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

-- Transaction notification
create or replace function public.handle_new_transaction_notification()
returns trigger as $$
begin
    insert into public.notifications (user_id, title, message, type)
    values (
        new.user_id,
        'Transaction Posted',
        'A new transaction of type ' || new.type || ' (' || new.amount || ' TKN) was posted to your wallet.',
        'transaction'
    );
    return new;
end;
$$ language plpgsql security definer;

create or replace trigger tr_transaction_notification
    after insert on public.transactions
    for each row
    execute function public.handle_new_transaction_notification();

-- Settle money rooms function
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

            update public.wallets
            set balance = balance + winner_share
            where user_id = winner_rec.user_id;

            insert into public.transactions (user_id, type, amount, description)
            values (
                winner_rec.user_id,
                'winning',
                winner_share,
                'Won room challenge: ' || room_rec.name
            );

            result_item := json_build_object(
                'room_id', room_rec.id,
                'room_name', room_rec.name,
                'winner_name', winner_rec.name,
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

    return json_build_object(
        'settled_at', now(),
        'rooms', results
    );
end;
$$ language plpgsql security definer;

-- Join money room RPC
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
        values (p_user_id, 'entry_fee', -room_rec.entry_fee, 'Entry fee for room: ' || room_rec.name);
    end if;

    insert into public.room_members (room_id, user_id)
    values (p_room_id, p_user_id)
    returning id into new_member_id;

    return json_build_object(
        'success', true,
        'member_id', new_member_id
    );
end;
$$ language plpgsql security definer;

-- Reset daily focus RPC
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

-- Get user today focus RPC
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

-- Get weekly stats RPC
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
        coalesce((select sum(focus_seconds) from public.study_sessions ss where ss.user_id = p_user_id and ss.start_time::date = d::date), 0::bigint) as focus_seconds,
        coalesce((select count(*) from public.tasks t where t.user_id = p_user_id and t.date = d::date and t.completed = true), 0::bigint) as tasks_completed
    from generate_series(
        current_date - interval '6 days',
        current_date,
        '1 day'::interval
    ) d;
end;
$$ language plpgsql stable;

-- Dashboard summary RPC
create or replace function public.get_user_dashboard(p_user_id uuid)
returns json as $$
declare
    result json;
begin
    select json_build_object(
        'today_focus', public.get_user_today_focus(p_user_id),
        'wallet_balance', coalesce((select balance from public.wallets where user_id = p_user_id), 0),
        'tasks_done_today', (select count(*) from public.tasks where user_id = p_user_id and date = current_date and completed),
        'tasks_total_today', (select count(*) from public.tasks where user_id = p_user_id and date = current_date)
    ) into result;

    return result;
end;
$$ language plpgsql stable;

-- Deposit tokens RPC
create or replace function public.deposit_tokens_secure(p_user_id uuid, p_amount integer)
returns json as $$
declare
    v_balance integer;
begin
    update public.wallets
    set balance = balance + p_amount
    where user_id = p_user_id
    returning balance into v_balance;

    insert into public.transactions (user_id, type, amount, description)
    values (p_user_id, 'deposit', p_amount, 'Token credit deposit.');

    return json_build_object('success', true, 'new_balance', v_balance);
end;
$$ language plpgsql security definer;

-- Withdraw tokens RPC
create or replace function public.withdraw_tokens_secure(p_user_id uuid, p_amount integer)
returns json as $$
declare
    v_balance integer;
begin
    select balance into v_balance from public.wallets where user_id = p_user_id;
    if v_balance < p_amount then
        return json_build_object('error', 'Insufficient balance');
    end if;

    update public.wallets
    set balance = balance - p_amount
    where user_id = p_user_id
    returning balance into v_balance;

    insert into public.transactions (user_id, type, amount, description)
    values (p_user_id, 'withdrawal', -p_amount, 'Token withdrawal debit.');

    return json_build_object('success', true, 'new_balance', v_balance);
end;
$$ language plpgsql security definer;

-- Create invite code generator helper
create or replace function public.generate_invite_code()
returns text as $$
declare
    chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result text := '';
    i integer;
begin
    loop
        result := '';
        for i in 1..6 loop
            result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
        end loop;
        exit when not exists (
            select 1 from public.rooms where invite_code = result
        );
    end loop;
    return result;
end;
$$ language plpgsql;
