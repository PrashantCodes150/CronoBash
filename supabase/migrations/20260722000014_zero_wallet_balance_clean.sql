-- supabase/migrations/20260722000014_zero_wallet_balance_clean.sql
-- Remove all hardcoded default welcome bonus balances from database triggers.
-- Force all newly created user wallets to start at 0 balance.

create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.users (id, name, email, avatar_url)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        new.email,
        new.raw_user_meta_data->>'avatar_url'
    );

    -- New wallets start at clean 0 balance
    insert into public.wallets (user_id, balance)
    values (new.id, 0);

    return new;
end;
$$ language plpgsql security definer;
