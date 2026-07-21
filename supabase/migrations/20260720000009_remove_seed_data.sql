-- ==========================================
-- CogniSweep Rollback: Purge Mock Test Data
-- ==========================================

-- 1. Remove mock entries from distraction_logs
delete from public.distraction_logs 
where user_id in ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b-5c6d7e8f')
   or user_id in (select id from public.users where email like 'scholar%@cognisweep.com');

-- 2. Remove mock entries from room_members
delete from public.room_members 
where user_id in ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b-5c6d7e8f')
   or user_id in (select id from public.users where email like 'scholar%@cognisweep.com');

-- 3. Remove mock entries from rooms
delete from public.rooms 
where owner_id in ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b-5c6d7e8f')
   or owner_id in (select id from public.users where email like 'scholar%@cognisweep.com');

-- 4. Remove mock entries from leaderboard_cache
delete from public.leaderboard_cache 
where user_id in ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b-5c6d7e8f')
   or user_id in (select id from public.users where email like 'scholar%@cognisweep.com');

-- 5. Remove mock entries from public.wallets
delete from public.wallets 
where user_id in ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b-5c6d7e8f')
   or user_id in (select id from public.users where email like 'scholar%@cognisweep.com');

-- 6. Remove mock entries from public.users
delete from public.users 
where id in ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b-5c6d7e8f')
   or email like 'scholar%@cognisweep.com';

-- 7. Remove mock entries from auth.users
delete from auth.users 
where id in ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b-5c6d7e8f')
   or email like 'scholar%@cognisweep.com';
