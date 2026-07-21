-- supabase/migrations/20260720000010_missing_policies.sql
-- Add missing RLS policies to allow authenticated users to manage their own wallets and transactions.

-- Wallets Update & Insert Policies
drop policy if exists "Users can update their own wallet" on public.wallets;
create policy "Users can update their own wallet" on public.wallets 
    for update using (auth.uid() = user_id);

drop policy if exists "Users can insert their own wallet" on public.wallets;
create policy "Users can insert their own wallet" on public.wallets 
    for insert with check (auth.uid() = user_id);

-- Transactions Insert Policy
drop policy if exists "Users can insert their own transactions" on public.transactions;
create policy "Users can insert their own transactions" on public.transactions 
    for insert with check (auth.uid() = user_id);
