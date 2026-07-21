-- ==========================================
-- CogniSweep Migration: Completed Sessions & Settlements
-- ==========================================

create table if not exists public.sessions (
    id uuid default gen_random_uuid() primary key,
    room_id uuid references public.rooms(id) on delete set null,
    room_name text not null,
    room_type text not null check (room_type in ('public', 'private', 'money')),
    winner_id uuid references public.users(id) on delete set null,
    winner_name text,
    duration_minutes integer not null check (duration_minutes > 0),
    total_participants integer not null default 1 check (total_participants >= 1),
    focus_seconds integer not null default 0 check (focus_seconds >= 0),
    distraction_count integer not null default 0 check (distraction_count >= 0),
    reward_details jsonb not null default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Configuration
alter table public.sessions enable row level security;

-- Drop policies if they already exist to prevent execution errors
drop policy if exists "Completed sessions are viewable by everyone" on public.sessions;
drop policy if exists "System role and authenticated users can insert completed sessions" on public.sessions;

create policy "Completed sessions are viewable by everyone"
    on public.sessions for select
    using (true);

create policy "System role and authenticated users can insert completed sessions"
    on public.sessions for insert
    with check (auth.uid() is not null);

-- Indexes for lightning-fast queries and leaderboards
create index if not exists idx_sessions_winner_id on public.sessions(winner_id);
create index if not exists idx_sessions_room_id on public.sessions(room_id);
create index if not exists idx_sessions_created_at on public.sessions(created_at desc);

-- Stored Procedure to safely settle money rooms inside a single database transaction
create or replace function public.process_room_settlement(
    p_room_id uuid,
    p_winner_id uuid,
    p_duration_minutes integer,
    p_participants integer,
    p_focus_seconds integer,
    p_distraction_count integer
)
returns jsonb as $$
declare
    v_room public.rooms%rowtype;
    v_winner_name text;
    v_total_pot integer;
    v_platform_fee integer;
    v_winner_share integer;
    v_wallet_id uuid;
    v_result jsonb;
begin
    -- 1. Lock room row for update to prevent double settlement
    select * into v_room from public.rooms where id = p_room_id for update;
    if not found then
        raise exception 'Room % not found', p_room_id;
    end if;
    if not v_room.is_active then
        raise exception 'Room % is already inactive/settled', p_room_id;
    end if;

    -- Get winner name
    select name into v_winner_name from public.users where id = p_winner_id;

    -- 2. Handle money room logic
    if v_room.type = 'money' and v_room.entry_fee > 0 then
        v_total_pot := v_room.entry_fee * p_participants;
        v_platform_fee := floor(v_total_pot * (v_room.platform_fee_percent::float / 100.0));
        v_winner_share := v_total_pot - v_platform_fee;

        -- Check wallet existence and update
        select id into v_wallet_id from public.wallets where user_id = p_winner_id for update;
        if v_wallet_id is null then
            raise exception 'Wallet for winner % not found', p_winner_id;
        end if;

        update public.wallets 
        set balance = balance + v_winner_share
        where id = v_wallet_id;

        -- Record transactions ledger entry
        insert into public.transactions (user_id, type, amount, description)
        values (
            p_winner_id,
            'winning',
            v_winner_share,
            'Payout for Room: ' || v_room.name || ' (Net of platform fee)'
        );
        
        -- Record platform fee ledger entry
        insert into public.transactions (user_id, type, amount, description)
        values (
            v_room.owner_id,
            'platform_fee',
            v_platform_fee,
            'Platform fee collected from Room: ' || v_room.name
        );
    else
        v_total_pot := 0;
        v_platform_fee := 0;
        v_winner_share := 0;
    end if;

    -- 3. Log into sessions table
    insert into public.sessions (
        room_id, room_name, room_type, winner_id, winner_name,
        duration_minutes, total_participants, focus_seconds, distraction_count, reward_details
    ) values (
        p_room_id, v_room.name, v_room.type, p_winner_id, v_winner_name,
        p_duration_minutes, p_participants, p_focus_seconds, p_distraction_count,
        jsonb_build_object(
            'total_pot', v_total_pot,
            'platform_fee', v_platform_fee,
            'winner_payout', v_winner_share
        )
    );

    -- 4. Set room inactive
    update public.rooms set is_active = false where id = p_room_id;

    v_result := jsonb_build_object(
        'success', true,
        'room_name', v_room.name,
        'winner_name', v_winner_name,
        'payout', v_winner_share,
        'fee', v_platform_fee
    );
    return v_result;
end;
$$ language plpgsql security definer;
