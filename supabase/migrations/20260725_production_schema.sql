-- ==============================================================================
-- CRONOBASH PRODUCTION DATABASE MIGRATION & RLS POLICIES
-- ==============================================================================

-- 1. USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  daily_goal_minutes INT DEFAULT 120,
  is_pro BOOLEAN DEFAULT FALSE,
  points INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USER WALLETS TABLE
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TRANSACTIONS LEDGER TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('deposit', 'withdrawal', 'entry_fee', 'winning', 'platform_fee')) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. STUDY SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  room_id UUID,
  start_time TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  end_time TIMESTAMPTZ,
  focus_seconds INT DEFAULT 0 NOT NULL,
  total_seconds INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- Read policies
CREATE POLICY "Allow public read access on profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow users to read own wallet balance" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow users to read own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow users to read own study sessions" ON public.study_sessions FOR SELECT USING (auth.uid() = user_id);

-- Write policies (Authenticated owners only)
CREATE POLICY "Allow users to update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow users to insert own study sessions" ON public.study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
