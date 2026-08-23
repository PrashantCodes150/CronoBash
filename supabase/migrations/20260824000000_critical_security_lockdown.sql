-- ==============================================================================
-- CRONOBASH PRODUCTION SECURITY HARDENING MIGRATION
-- Migration: 20260824000000_critical_security_lockdown.sql
-- ==============================================================================

-- 1. FIX JOIN_MONEY_ROOM IDENTITY VERIFICATION
-- Prevents malicious users from forcing other users into rooms and draining their balance
CREATE OR REPLACE FUNCTION public.join_money_room(p_user_id uuid, p_room_id uuid)
RETURNS json AS $$
DECLARE
    room_rec record;
    wallet_rec record;
    new_member_id uuid;
BEGIN
    -- Security Check: Verify caller identity matches target user
    IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
        RETURN json_build_object('error', 'Unauthorized: Cannot join room on behalf of another user');
    END IF;

    SELECT * INTO room_rec FROM public.rooms WHERE id = p_room_id;

    IF room_rec IS NULL THEN
        RETURN json_build_object('error', 'Room not found');
    END IF;

    IF room_rec.type != 'money' THEN
        RETURN json_build_object('error', 'Not a money room');
    END IF;

    IF room_rec.entry_fee > 0 THEN
        SELECT * INTO wallet_rec FROM public.wallets WHERE user_id = p_user_id;

        IF wallet_rec IS NULL OR wallet_rec.balance < room_rec.entry_fee THEN
            RETURN json_build_object('error', 'Insufficient balance');
        END IF;

        UPDATE public.wallets
        SET balance = balance - room_rec.entry_fee
        WHERE user_id = p_user_id;

        INSERT INTO public.transactions (user_id, type, amount, description)
        VALUES (p_user_id, 'entry_fee', -room_rec.entry_fee, 'Entry fee for room: ' || room_rec.name);
    END IF;

    INSERT INTO public.room_members (room_id, user_id)
    VALUES (p_room_id, p_user_id)
    RETURNING id INTO new_member_id;

    RETURN json_build_object(
        'success', true,
        'member_id', new_member_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. LOCK DOWN SENSITIVE FINANCIAL & SYSTEM RPC FUNCTIONS
-- Revoke public execution of deposit, settlement, and reset functions
-- Grant execute permissions strictly to service_role (Edge Functions & Server API routes)
DO $$
BEGIN
    -- Revoke & Grant deposit_tokens_secure if exists
    BEGIN
        REVOKE EXECUTE ON FUNCTION public.deposit_tokens_secure(uuid, integer) FROM PUBLIC, anon, authenticated;
        GRANT EXECUTE ON FUNCTION public.deposit_tokens_secure(uuid, integer) TO service_role;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- Revoke & Grant settle_money_rooms if exists
    BEGIN
        REVOKE EXECUTE ON FUNCTION public.settle_money_rooms() FROM PUBLIC, anon, authenticated;
        GRANT EXECUTE ON FUNCTION public.settle_money_rooms() TO service_role;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- Revoke & Grant withdraw_tokens_secure if exists
    BEGIN
        REVOKE EXECUTE ON FUNCTION public.withdraw_tokens_secure(uuid, integer) FROM PUBLIC, anon, authenticated;
        GRANT EXECUTE ON FUNCTION public.withdraw_tokens_secure(uuid, integer) TO service_role;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- Revoke & Grant reset_daily_focus if exists
    BEGIN
        REVOKE EXECUTE ON FUNCTION public.reset_daily_focus() FROM PUBLIC, anon, authenticated;
        GRANT EXECUTE ON FUNCTION public.reset_daily_focus() TO service_role;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- Revoke & Grant process_room_settlement if exists
    BEGIN
        REVOKE EXECUTE ON FUNCTION public.process_room_settlement(uuid, uuid, integer, integer, integer, integer) FROM PUBLIC, anon, authenticated;
        GRANT EXECUTE ON FUNCTION public.process_room_settlement(uuid, uuid, integer, integer, integer, integer) TO service_role;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
END $$;

-- 3. ENSURE STRICT ROW LEVEL SECURITY (RLS) ON ALL SENSITIVE TABLES
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.room_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_challenge_progress ENABLE ROW LEVEL SECURITY;

-- Ensure reports columns exist
ALTER TABLE IF EXISTS public.reports ADD COLUMN IF NOT EXISTS reported_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.reports ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

-- 4. REPORT SUBMISSION & READING SECURITY
DROP POLICY IF EXISTS "Users can insert reports" ON public.reports;
CREATE POLICY "Users can insert reports" ON public.reports
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
    );

DROP POLICY IF EXISTS "Users can read own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can view reports filed about or by them" ON public.reports;
CREATE POLICY "Users can view reports filed about or by them" ON public.reports
    FOR SELECT USING (
        auth.uid() = reported_by OR
        auth.uid() = user_id OR
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.is_pro = true
        )
    );
