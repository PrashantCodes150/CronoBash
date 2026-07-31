-- Migration: 20260731000017_add_username_unique.sql
-- Description: Adds unique username column and index to public.users table

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Create index for fast case-insensitive username lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower ON public.users (LOWER(username));
