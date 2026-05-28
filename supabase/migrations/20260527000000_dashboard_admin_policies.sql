-- ================================================================
-- Migration: Dashboard admin policies
-- Project:   Fantito's Juegos (heviosmupgxcyusqcpfm)
-- Created:   2026-05-27
-- Author:    Dev team
-- Purpose:   Grant admin users read access to all analytics tables
--            used by the /dashboard route. Uses has_role() for
--            consistent role checking across the app.
-- ================================================================

-- ----------------------------------------------------------------
-- 0. Safety — drop policies if they already exist so this
--    migration is idempotent (safe to run more than once)
-- ----------------------------------------------------------------
DO $$ BEGIN
  -- user_roles
  DROP POLICY IF EXISTS "Admins can read all user_roles" ON public.user_roles;
  -- skipped_cards
  DROP POLICY IF EXISTS "Admins can read all skipped_cards" ON public.skipped_cards;
  -- game_sessions
  DROP POLICY IF EXISTS "Admins can read all game_sessions" ON public.game_sessions;
  -- promo_codes
  DROP POLICY IF EXISTS "Admins can read all promo_codes" ON public.promo_codes;
  -- user_entitlements
  DROP POLICY IF EXISTS "Admins can read all user_entitlements" ON public.user_entitlements;
  -- profiles / users view
  DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
EXCEPTION WHEN others THEN
  NULL; -- ignore if tables don't exist yet
END $$;

-- ----------------------------------------------------------------
-- 1. Grant execute on has_role() to authenticated users
--    Required so RLS policies can call has_role(auth.uid(), 'admin')
-- ----------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;

-- ----------------------------------------------------------------
-- 2. Make sure RLS is enabled on every table we're adding policies to
--    (safe to call even if already enabled)
-- ----------------------------------------------------------------
ALTER TABLE public.user_roles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skipped_cards     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- 3. Admin SELECT policies
--    Each policy uses has_role() so adding/removing admin access
--    is a single row change in user_roles, not a policy change.
-- ----------------------------------------------------------------

-- user_roles: admins can see who has which role
CREATE POLICY "Admins can read all user_roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- skipped_cards: used for skip rate, star rate, card type analytics
CREATE POLICY "Admins can read all skipped_cards"
  ON public.skipped_cards
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- game_sessions: used for session counts, growth metrics, language split
CREATE POLICY "Admins can read all game_sessions"
  ON public.game_sessions
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- promo_codes: used for promo tab — usage counts and status
CREATE POLICY "Admins can read all promo_codes"
  ON public.promo_codes
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- user_entitlements: used for credits health, subscription breakdown
CREATE POLICY "Admins can read all user_entitlements"
  ON public.user_entitlements
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ----------------------------------------------------------------
-- 4. profiles table (if it exists — optional, graceful skip)
--    Used for user growth metrics on the Users tab
-- ----------------------------------------------------------------
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

    -- Users can always read their own profile
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'profiles'
        AND policyname = 'Users can read own profile'
    ) THEN
      EXECUTE $p$
        CREATE POLICY "Users can read own profile"
          ON public.profiles
          FOR SELECT
          TO authenticated
          USING (id = auth.uid())
      $p$;
    END IF;

    -- Admins can read all profiles
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'profiles'
        AND policyname = 'Admins can read all profiles'
    ) THEN
      EXECUTE $p$
        CREATE POLICY "Admins can read all profiles"
          ON public.profiles
          FOR SELECT
          TO authenticated
          USING (public.has_role(auth.uid(), 'admin'))
      $p$;
    END IF;
  END IF;
END $$;

-- ----------------------------------------------------------------
-- 5. Verify — this will show in migration logs
-- ----------------------------------------------------------------
DO $$ BEGIN
  RAISE NOTICE 'Migration 20260527000000_dashboard_admin_policies applied successfully.';
END $$;