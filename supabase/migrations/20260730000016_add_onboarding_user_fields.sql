-- Migration: 20260730000016_add_onboarding_user_fields.sql
-- Description: Adds onboarding preference fields and XP reward attributes to public.users table

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS gamer_tag TEXT,
  ADD COLUMN IF NOT EXISTS primary_discipline TEXT DEFAULT 'Engineering & Code',
  ADD COLUMN IF NOT EXISTS preferred_stakes TEXT DEFAULT 'Micro-Stakes (₹10 - ₹50)',
  ADD COLUMN IF NOT EXISTS ai_coach_persona TEXT DEFAULT 'Drill Sergeant',
  ADD COLUMN IF NOT EXISTS sound_effects TEXT DEFAULT 'Mechanical Key Clicks',
  ADD COLUMN IF NOT EXISTS leaderboard_privacy TEXT DEFAULT 'Public Profile',
  ADD COLUMN IF NOT EXISTS camera_verified BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS has_seen_onboarding BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 250;

-- Create index for fast gamer_tag search and matchmaking lookups
CREATE INDEX IF NOT EXISTS idx_users_gamer_tag ON public.users(gamer_tag);
