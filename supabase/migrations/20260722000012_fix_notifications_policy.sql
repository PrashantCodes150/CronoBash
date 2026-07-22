-- supabase/migrations/20260722000012_fix_notifications_policy.sql
-- Add missing insert policy on public.notifications table so authenticated users can send buddy requests and lobby invites.

drop policy if exists "Authenticated users can insert notifications" on public.notifications;
create policy "Authenticated users can insert notifications" on public.notifications 
    for insert with check (auth.role() = 'authenticated');
