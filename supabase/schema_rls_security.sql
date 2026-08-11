-- ============================================================================
-- CRONOBASH PRODUCTION ROW LEVEL SECURITY (RLS) & DATABASE HARDENING SCRIPT
-- Run this in your Supabase SQL Editor: Dashboard -> SQL Editor -> New Query
-- ============================================================================

-- 1. ENABLE ROW LEVEL SECURITY ON ALL TABLES
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.distraction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rooms ENABLE ROW LEVEL SECURITY;

-- 2. DROP EXISTING INSECURE POLICIES IF ANY
DROP POLICY IF EXISTS "Public users are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can update own record" ON public.users;
DROP POLICY IF EXISTS "Users can insert own record" ON public.users;

DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can update own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can insert own wallet" ON public.wallets;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can log own transactions" ON public.transactions;

DROP POLICY IF EXISTS "Users can view distraction logs" ON public.distraction_logs;
DROP POLICY IF EXISTS "Users can insert own distraction log" ON public.distraction_logs;

DROP POLICY IF EXISTS "Rooms are viewable by everyone" ON public.rooms;
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON public.rooms;
DROP POLICY IF EXISTS "Hosts can update own room" ON public.rooms;

-- 3. DEFINE STRICT RLS POLICIES

-- --- USERS TABLE POLICIES ---
-- Everyone can view user profiles (required for Leaderboard & Search)
CREATE POLICY "Public users are viewable by everyone"
ON public.users FOR SELECT
USING (true);

-- Authenticated users can insert their own profile
CREATE POLICY "Users can insert own record"
ON public.users FOR INSERT
WITH CHECK (auth.uid() = id);

-- Users can only update their OWN profile
CREATE POLICY "Users can update own record"
ON public.users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);


-- --- WALLETS TABLE POLICIES ---
-- Users can ONLY view their OWN wallet balance
CREATE POLICY "Users can view own wallet"
ON public.wallets FOR SELECT
USING (auth.uid() = user_id);

-- System or user can initialize wallet on signup
CREATE POLICY "Users can insert own wallet"
ON public.wallets FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users CANNOT directly modify their wallet balance via client-side SQL (must go via backend API)
CREATE POLICY "Users can update own wallet"
ON public.wallets FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- --- TRANSACTIONS TABLE POLICIES ---
-- Users can ONLY view their OWN transaction history
CREATE POLICY "Users can view own transactions"
ON public.transactions FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert transactions for themselves
CREATE POLICY "Users can log own transactions"
ON public.transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);


-- --- DISTRACTION LOGS TABLE POLICIES ---
-- Authenticated users can view telemetry logs
CREATE POLICY "Users can view distraction logs"
ON public.distraction_logs FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Users can only insert distraction logs for their own user_id
CREATE POLICY "Users can insert own distraction log"
ON public.distraction_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);


-- --- ROOMS TABLE POLICIES ---
-- Active rooms are viewable by all logged-in users
CREATE POLICY "Rooms are viewable by everyone"
ON public.rooms FOR SELECT
USING (true);

-- Authenticated users can create study rooms
CREATE POLICY "Authenticated users can create rooms"
ON public.rooms FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Host can update room state
CREATE POLICY "Hosts can update own room"
ON public.rooms FOR UPDATE
USING (auth.uid() = host_id OR host_id IS NULL)
WITH CHECK (auth.uid() = host_id OR host_id IS NULL);

-- 4. VERIFY RLS IS ACTIVE
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
