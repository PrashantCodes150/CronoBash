-- ==============================================================================
-- DISABLE HARDCODED TRANSACTION NOTIFICATION TRIGGER
-- Migration: 20260731000021_disable_transaction_notification_trigger.sql
-- Description: Drops noisy auto-generated transaction trigger and cleans up 
--              hardcoded "Transaction Posted" notifications.
-- ==============================================================================

-- 1. Drop trigger on public.transactions
DROP TRIGGER IF EXISTS tr_transaction_notification ON public.transactions;

-- 2. Drop function
DROP FUNCTION IF EXISTS public.handle_new_transaction_notification();

-- 3. Delete existing hardcoded Transaction Posted notification rows
DELETE FROM public.notifications WHERE title = 'Transaction Posted' OR message LIKE '%posted to your wallet%';
