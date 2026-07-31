-- ==============================================================================
-- CRONOBASH COMPLETE ONBOARDING & PROFILE SCHEMA MIGRATION
-- Migration: 20260731000018_complete_users_onboarding_schema.sql
-- Description: Guarantees all onboarding preference columns, unique username index, 
--              and RLS policies exist on public.users table for production deployment.
-- ==============================================================================

-- 1. Ensure public.users table exists
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Arena Fighter',
  email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add all onboarding & user preference columns
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

-- 3. Create unique index for fast case-insensitive username lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower ON public.users (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_users_gamer_tag ON public.users (gamer_tag);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 5. Row Level Security Policies
DROP POLICY IF EXISTS "Users profiles are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

CREATE POLICY "Users profiles are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
