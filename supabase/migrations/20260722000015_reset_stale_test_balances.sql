-- supabase/migrations/20260722000015_reset_stale_test_balances.sql
-- Reset all existing test wallets that were seeded with initial 1000/1001 balance to clean 0.

update public.wallets
set balance = 0
where balance >= 1000;

delete from public.transactions
where description like '%Welcome bonus%';
