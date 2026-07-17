-- ==========================================
-- FocusArena Schema Teardown
-- ==========================================
-- Run this BEFORE schema.sql to cleanly re-create everything.
-- WARNING: This destroys all data in the FocusArena tables.

-- Drop tables first (CASCADE removes triggers automatically)
drop table if exists public.messages cascade;
drop table if exists public.challenges cascade;
drop table if exists public.timetables cascade;
drop table if exists public.tasks cascade;
drop table if exists public.study_sessions cascade;
drop table if exists public.room_members cascade;
drop table if exists public.rooms cascade;
drop table if exists public.transactions cascade;
drop table if exists public.wallets cascade;
drop table if exists public.users cascade;

-- Drop functions
drop function if exists public.create_1v1_challenge(uuid, integer, integer, text) cascade;
drop function if exists public.accept_1v1_challenge(uuid, uuid) cascade;
drop function if exists public.settle_1v1_challenge(uuid) cascade;
drop function if exists public.deposit_tokens_secure(uuid, integer) cascade;
drop function if exists public.withdraw_tokens_secure(uuid, integer) cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.update_room_focus_seconds() cascade;
drop function if exists public.settle_money_rooms() cascade;
drop function if exists public.get_room_leaderboard(uuid) cascade;
drop function if exists public.get_user_today_focus(uuid) cascade;
drop function if exists public.get_user_weekly_stats(uuid) cascade;
drop function if exists public.get_room_stats(uuid) cascade;
drop function if exists public.join_money_room(uuid, uuid) cascade;
drop function if exists public.get_user_dashboard(uuid) cascade;
drop function if exists public.reset_daily_focus() cascade;
