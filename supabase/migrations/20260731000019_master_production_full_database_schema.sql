-- ==============================================================================
-- CRONOBASH MASTER PRODUCTION DATABASE SCHEMA & SECURITY POLICIES
-- Migration: 20260731000019_master_production_full_database_schema.sql
-- Description: Complete 1-click idempotent SQL migration for all 19 CronoBash tables,
--              columns, RLS security policies, unique indexes, and triggers.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. USERS & PROFILES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Arena Fighter',
  full_name TEXT DEFAULT 'Arena Fighter',
  username TEXT UNIQUE,
  gamer_tag TEXT,
  email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  daily_goal_minutes INTEGER DEFAULT 120,
  primary_discipline TEXT DEFAULT 'Engineering & Code',
  preferred_stakes TEXT DEFAULT 'Micro-Stakes (₹10 - ₹50)',
  ai_coach_persona TEXT DEFAULT 'Drill Sergeant',
  sound_effects TEXT DEFAULT 'Mechanical Key Clicks',
  leaderboard_privacy TEXT DEFAULT 'Public Profile',
  camera_verified BOOLEAN DEFAULT true,
  has_seen_onboarding BOOLEAN DEFAULT false,
  xp INTEGER DEFAULT 250,
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  is_verified BOOLEAN DEFAULT false,
  followers_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  is_pro BOOLEAN DEFAULT false,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist on public.users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS gamer_tag TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS daily_goal_minutes INTEGER DEFAULT 120,
  ADD COLUMN IF NOT EXISTS primary_discipline TEXT DEFAULT 'Engineering & Code',
  ADD COLUMN IF NOT EXISTS preferred_stakes TEXT DEFAULT 'Micro-Stakes (₹10 - ₹50)',
  ADD COLUMN IF NOT EXISTS ai_coach_persona TEXT DEFAULT 'Drill Sergeant',
  ADD COLUMN IF NOT EXISTS sound_effects TEXT DEFAULT 'Mechanical Key Clicks',
  ADD COLUMN IF NOT EXISTS leaderboard_privacy TEXT DEFAULT 'Public Profile',
  ADD COLUMN IF NOT EXISTS camera_verified BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS has_seen_onboarding BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 250,
  ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower ON public.users (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_users_gamer_tag ON public.users (gamer_tag);

-- Legacy profiles table alias view/table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  daily_goal_minutes INT DEFAULT 120,
  is_pro BOOLEAN DEFAULT FALSE,
  points INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. WALLETS & TRANSACTIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('deposit', 'withdrawal', 'entry_fee', 'winning', 'platform_fee', 'reward')) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'completed',
  reference_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. STUDY ROOMS & ROOM MEMBERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'public',
  owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  max_members INTEGER DEFAULT 10,
  entry_fee NUMERIC(10, 2) DEFAULT 0.00,
  platform_fee_percent NUMERIC(5, 2) DEFAULT 5.00,
  subject_tags TEXT[] DEFAULT '{}',
  description TEXT,
  invite_code TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.room_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  total_focus_seconds_today INTEGER DEFAULT 0,
  UNIQUE(room_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.room_presence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  last_ping TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'online',
  UNIQUE(room_id, user_id)
);

-- ------------------------------------------------------------------------------
-- 4. STUDY SESSIONS & FOCUS TIMELINE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  task_id UUID,
  subject TEXT DEFAULT 'General Study',
  start_time TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  end_time TIMESTAMPTZ,
  focus_seconds INT DEFAULT 0 NOT NULL,
  total_seconds INT DEFAULT 0 NOT NULL,
  distraction_count INT DEFAULT 0 NOT NULL,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.focus_timeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.study_sessions(id) ON DELETE CASCADE,
  focus_score INTEGER DEFAULT 100,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.distraction_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.study_sessions(id) ON DELETE CASCADE,
  reason TEXT,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. SOCIAL CONNECTIONS & NOTIFICATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. TASKS, CHALLENGES, STREAKS & REFERRALS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  subject TEXT DEFAULT 'General',
  completed BOOLEAN DEFAULT false,
  focus_seconds INTEGER DEFAULT 0,
  priority TEXT DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  challenge_date DATE DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT false,
  reward_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_date)
);

CREATE TABLE IF NOT EXISTS public.streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  current_streak INTEGER DEFAULT 1,
  longest_streak INTEGER DEFAULT 1,
  last_activity_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  referred_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  reward_amount NUMERIC(10, 2) DEFAULT 50.00,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  reported_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.analytics_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.leaderboard_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  total_focus_seconds INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distraction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_cache ENABLE ROW LEVEL SECURITY;

-- Helper macro for dropping and re-creating RLS policies
DROP POLICY IF EXISTS "Public read users" ON public.users;
DROP POLICY IF EXISTS "Self update users" ON public.users;
DROP POLICY IF EXISTS "Self insert users" ON public.users;
CREATE POLICY "Public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Self update users" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Self insert users" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Self read wallet" ON public.wallets;
DROP POLICY IF EXISTS "Self update wallet" ON public.wallets;
CREATE POLICY "Self read wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Self update wallet" ON public.wallets FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Self read transactions" ON public.transactions;
CREATE POLICY "Self read transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public read rooms" ON public.rooms;
CREATE POLICY "Public read rooms" ON public.rooms FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read room_members" ON public.room_members;
CREATE POLICY "Public read room_members" ON public.room_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Self read study_sessions" ON public.study_sessions;
DROP POLICY IF EXISTS "Self insert study_sessions" ON public.study_sessions;
CREATE POLICY "Self read study_sessions" ON public.study_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Self insert study_sessions" ON public.study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Self read connections" ON public.connections;
DROP POLICY IF EXISTS "Self insert connections" ON public.connections;
DROP POLICY IF EXISTS "Self update connections" ON public.connections;
CREATE POLICY "Self read connections" ON public.connections FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Self insert connections" ON public.connections FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Self update connections" ON public.connections FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Self read notifications" ON public.notifications;
DROP POLICY IF EXISTS "Self update notifications" ON public.notifications;
CREATE POLICY "Self read notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Self update notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Self tasks read" ON public.tasks;
DROP POLICY IF EXISTS "Self tasks insert" ON public.tasks;
DROP POLICY IF EXISTS "Self tasks update" ON public.tasks;
DROP POLICY IF EXISTS "Self tasks delete" ON public.tasks;
CREATE POLICY "Self tasks read" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Self tasks insert" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Self tasks update" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Self tasks delete" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public read leaderboard_cache" ON public.leaderboard_cache;
CREATE POLICY "Public read leaderboard_cache" ON public.leaderboard_cache FOR SELECT USING (true);

-- ------------------------------------------------------------------------------
-- 8. AUTOMATIC AUTH USER TRIGGER (Creates user + wallet automatically on signup)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'Arena Fighter'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Arena Fighter'),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/bottts/svg?seed=cyber-knight')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 0.00)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
