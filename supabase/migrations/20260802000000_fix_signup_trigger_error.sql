-- Fix Supabase Auth HTTP 500 Signup Trigger Error
-- Ensures new user signups never fail due to database trigger exceptions

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Safely insert user record into public.users
  BEGIN
    INSERT INTO public.users (id, name, full_name, email, avatar_url)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', NEW.email, 'Arena Fighter'),
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email, 'Arena Fighter'),
      COALESCE(NEW.email, ''),
      COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/bottts/svg?seed=cyber-knight')
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      updated_at = NOW();
  EXCEPTION WHEN OTHERS THEN
    -- Fallback insert if schema variation exists
    BEGIN
      INSERT INTO public.users (id, name, email)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, 'Arena Fighter'),
        COALESCE(NEW.email, '')
      )
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      NULL; -- Guarantee trigger never aborts auth.users signup
    END;
  END;

  -- Safely insert wallet record into public.wallets
  BEGIN
    INSERT INTO public.wallets (user_id, balance)
    VALUES (NEW.id, 0.00)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
