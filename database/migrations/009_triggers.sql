-- 009_triggers.sql
-- Description: Defines triggers for automated database synchronization and user signups with native UUID support.
-- Architecture Note: The "public.users" table acts as the Single Source of Truth (SSOT).
-- The "public.profiles" table is a read-only compatibility mirror synchronized automatically via database triggers.

--------------------------------------------------------------------------------
-- 1. Profiles Sync Trigger (From public.users to public.profiles)
--------------------------------------------------------------------------------

-- Cleanup legacy functions/triggers if they exist to prevent orphan collisions
DROP TRIGGER IF EXISTS trg_sync_profiles_from_users ON public.users;
DROP FUNCTION IF EXISTS public.sync_profiles_from_users() CASCADE;
DROP FUNCTION IF EXISTS public.fn_sync_profiles_from_users() CASCADE;

-- Secure, production-grade function with search_path set explicitly to prevent hijacking
CREATE OR REPLACE FUNCTION public.fn_sync_profiles_from_users()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    name, 
    email, 
    role, 
    phone, 
    status, 
    "avatarUrl", 
    created_at, 
    updated_at
  ) VALUES (
    NEW.id,
    NEW.full_name,
    NEW.email,
    NEW.role,
    NEW.phone,
    NEW.status,
    NEW.avatar,
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    status = EXCLUDED.status,
    "avatarUrl" = EXCLUDED."avatarUrl",
    updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$;

-- Ensure safe ownership of security definer function to avoid execution privilege issues
ALTER FUNCTION public.fn_sync_profiles_from_users() OWNER TO postgres;

-- Attach documentation to the function for database administrators
COMMENT ON FUNCTION public.fn_sync_profiles_from_users() IS 'Synchronizes users into profiles automatically. Users table is the Single Source of Truth.';

-- Attach trigger for users to profiles sync (Optimized to fire only on columns mapped to profiles)
CREATE TRIGGER trg_sync_profiles_from_users
    AFTER INSERT OR UPDATE OF full_name, email, role, phone, status, avatar ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.fn_sync_profiles_from_users();


--------------------------------------------------------------------------------
-- 2. Auth User Trigger (From auth.users to public.users)
--------------------------------------------------------------------------------

-- Cleanup legacy functions/triggers if they exist to prevent orphan collisions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trg_handle_new_auth_user_signup ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_auth_user_signup() CASCADE;
DROP FUNCTION IF EXISTS public.fn_handle_new_auth_user_signup() CASCADE;

-- Secure trigger function with search_path set explicitly
CREATE OR REPLACE FUNCTION public.fn_handle_new_auth_user_signup()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    email, 
    full_name, 
    role, 
    phone,
    avatar,
    status, 
    created_at,
    updated_at
  )
  VALUES (
    NEW.id, -- Already a native UUID
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    -- SECURITY: Blindly trusting metadata roles is unsafe. We restrict signup choices strictly to 'client' or 'model'. 
    -- Admins must be provisioned through secure database access or manual verification.
    CASE 
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'client') IN ('client', 'model') 
      THEN COALESCE(NEW.raw_user_meta_data->>'role', 'client')
      ELSE 'client'
    END,
    NEW.raw_user_meta_data->>'phone', -- Correctly keep optional phone as NULL if not supplied instead of empty string
    COALESCE(NEW.raw_user_meta_data->>'avatar', NEW.raw_user_meta_data->>'avatar_url'), -- Support robust avatar synchronization
    'active',
    COALESCE(NEW.created_at, now()),
    COALESCE(NEW.created_at, now())
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    role = COALESCE(EXCLUDED.role, users.role),
    phone = COALESCE(EXCLUDED.phone, users.phone),
    avatar = COALESCE(EXCLUDED.avatar, users.avatar),
    updated_at = now();

  RETURN NEW;
END;
$$;

-- Ensure safe ownership of security definer function to avoid execution privilege issues
ALTER FUNCTION public.fn_handle_new_auth_user_signup() OWNER TO postgres;

-- Attach documentation to the function for database administrators
COMMENT ON FUNCTION public.fn_handle_new_auth_user_signup() IS 'Handles native Supabase Auth signups and provisions corresponding public.users records.';

-- Attach trigger for native auth user signup sync
CREATE TRIGGER trg_handle_new_auth_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.fn_handle_new_auth_user_signup();
