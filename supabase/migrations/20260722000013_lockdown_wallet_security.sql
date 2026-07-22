-- supabase/migrations/20260722000013_lockdown_wallet_security.sql
-- Lock down wallets and transactions tables against client-side balance manipulation.
-- Force all financial balance updates through SECURITY DEFINER server RPC functions.

-- 1. Drop client-side direct update/insert policies on wallets
drop policy if exists "Users can update their own wallet" on public.wallets;
drop policy if exists "Users can insert their own wallet" on public.wallets;

-- Only allow SELECT on wallets for the owner
drop policy if exists "Users can read their own wallet" on public.wallets;
create policy "Users can read their own wallet" on public.wallets 
    for select using (auth.uid() = user_id);

-- 2. Drop direct client-side insert policies on transactions (only server functions can write transaction history)
drop policy if exists "Users can insert their own transactions" on public.transactions;
drop policy if exists "Users can read their own transactions" on public.transactions;
create policy "Users can read their own transactions" on public.transactions 
    for select using (auth.uid() = user_id);

-- 3. Update deposit_tokens_secure with strict auth & non-negative amount checks
create or replace function public.deposit_tokens_secure(p_user_id uuid, p_amount integer)
returns json as $$
declare
    v_balance integer;
begin
    -- Security Check: Verify user identity matches auth token
    if auth.uid() is null or auth.uid() <> p_user_id then
        return json_build_object('error', 'Unauthorized identity token');
    end if;

    -- Security Check: Non-negative amount
    if p_amount <= 0 then
        return json_build_object('error', 'Deposit amount must be positive');
    end if;

    update public.wallets
    set balance = balance + p_amount
    where user_id = p_user_id
    returning balance into v_balance;

    insert into public.transactions (user_id, type, amount, description)
    values (p_user_id, 'deposit', p_amount, 'Token credit deposit.');

    return json_build_object('success', true, 'new_balance', v_balance);
end;
$$ language plpgsql security definer;

-- 4. Update withdraw_tokens_secure with strict auth, non-negative amount, & balance validation checks
create or replace function public.withdraw_tokens_secure(p_user_id uuid, p_amount integer)
returns json as $$
declare
    v_balance integer;
begin
    -- Security Check: Verify user identity matches auth token
    if auth.uid() is null or auth.uid() <> p_user_id then
        return json_build_object('error', 'Unauthorized identity token');
    end if;

    -- Security Check: Non-negative amount
    if p_amount <= 0 then
        return json_build_object('error', 'Withdrawal amount must be positive');
    end if;

    select balance into v_balance from public.wallets where user_id = p_user_id;
    if v_balance is null or v_balance < p_amount then
        return json_build_object('error', 'Insufficient wallet balance');
    end if;

    update public.wallets
    set balance = balance - p_amount
    where user_id = p_user_id
    returning balance into v_balance;

    insert into public.transactions (user_id, type, amount, description)
    values (p_user_id, 'withdrawal', p_amount, 'Token withdrawal debit.');

    return json_build_object('success', true, 'new_balance', v_balance);
end;
$$ language plpgsql security definer;
