-- supabase/migrations/20260721000011_connections_notifications_indexes.sql
-- Add performance tuning indexes for connections and notifications query columns.

create index if not exists idx_connections_sender_id on public.connections(sender_id);
create index if not exists idx_connections_receiver_id on public.connections(receiver_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
