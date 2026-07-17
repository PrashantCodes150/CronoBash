-- ==========================================
-- FocusArena Sample Queries
-- ==========================================
-- HOW TO USE:
-- 1. Uncomment ONE query at a time
-- 2. Replace placeholder UUIDs with real values
-- 3. Run that single query
--
-- Queries marked [AUTH] need auth.uid() - only work
-- from your app or when logged in via the dashboard.
-- ==========================================


-- ==========================================
-- UTILITIES (run in SQL Editor, no auth needed)
-- ==========================================

-- List all users
select id, name, email from public.users;

-- List all rooms
select id, name, type, is_active from public.rooms;

-- List all wallets
select user_id, balance from public.wallets;

-- Manually settle money rooms
select public.settle_money_rooms();

-- Manually reset daily focus counters
select public.reset_daily_focus();


-- ==========================================
-- USER QUERIES [AUTH]
-- ==========================================

-- Get own profile
-- select * from public.users where id = auth.uid();

-- Update own daily goal
-- update public.users set daily_goal_minutes = 180 where id = auth.uid();


-- ==========================================
-- TODAY'S FOCUS TIME [AUTH]
-- ==========================================

-- select public.get_user_today_focus(auth.uid());


-- ==========================================
-- WALLET & TRANSACTIONS [AUTH]
-- ==========================================

-- select balance from public.wallets where user_id = auth.uid();

-- select * from public.transactions
-- where user_id = auth.uid()
-- order by created_at desc limit 20;


-- ==========================================
-- ROOM QUERIES
-- ==========================================

-- List public rooms
-- select * from public.rooms where type = 'public' and is_active = true;

-- List money rooms
-- select * from public.rooms where type = 'money' and is_active = true;

-- Get rooms you have joined [AUTH]
-- select r.* from public.rooms r
-- join public.room_members rm on rm.room_id = r.id
-- where rm.user_id = auth.uid();


-- ==========================================
-- ROOM LEADERBOARD
-- ==========================================

-- Replace ROOM_UUID with a real room id
-- select * from public.get_room_leaderboard('ROOM_UUID_HERE');

-- select public.get_room_stats('ROOM_UUID_HERE');


-- ==========================================
-- STUDY SESSIONS [AUTH]
-- ==========================================

-- Start a session (solo)
-- insert into public.study_sessions (user_id, room_id, start_time)
-- values (auth.uid(), NULL, now()) returning id;

-- End a session (replace SESSION_UUID)
-- update public.study_sessions
-- set end_time = now(),
--     focus_seconds = extract(epoch from (now() - start_time))::integer,
--     total_seconds = extract(epoch from (now() - start_time))::integer
-- where id = 'SESSION_UUID_HERE' and user_id = auth.uid()
-- returning *;

-- Get today's sessions [AUTH]
-- select * from public.study_sessions
-- where user_id = auth.uid()
--   and start_time >= (current_date at time zone 'UTC')
-- order by start_time desc;


-- ==========================================
-- TASKS
-- ==========================================

-- Create a task [AUTH]
-- insert into public.tasks (user_id, title, subject, planned_minutes, date)
-- values (auth.uid(), 'Review Chapter 5', 'Mathematics', 60, current_date);

-- Toggle task completion (replace TASK_UUID)
-- update public.tasks set completed = not completed
-- where id = 'TASK_UUID_HERE' and user_id = auth.uid();


-- ==========================================
-- TIMETABLES
-- ==========================================

-- Create a timetable entry [AUTH]
-- insert into public.timetables (user_id, day_of_week, start_time, end_time, subject)
-- values (auth.uid(), 1, '09:00', '11:00', 'Mathematics');


-- ==========================================
-- DASHBOARD
-- ==========================================

-- select public.get_user_dashboard(auth.uid()) as dashboard;


-- ==========================================
-- REAL-TIME (TypeScript, not SQL)
-- ==========================================
-- const channel = supabase
--   .channel('room-leaderboard')
--   .on('postgres_changes', {
--     event: 'UPDATE',
--     schema: 'public',
--     table: 'room_members',
--     filter: `room_id=eq.${roomId}`
--   }, (payload) => console.log(payload.new))
--   .subscribe();
