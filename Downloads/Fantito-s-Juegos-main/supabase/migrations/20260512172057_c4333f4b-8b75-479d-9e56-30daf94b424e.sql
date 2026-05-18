-- Switch credit accounting from 50-card decks to 25-card decks
-- and add a profile-level "where the money goes" preference.

-- 1) Add money_allocation preference (reinvest into product vs Fantito's Ferrari fund)
DO $$ BEGIN
  CREATE TYPE public.money_allocation AS ENUM ('reinvest', 'ferrari');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS money_allocation public.money_allocation NOT NULL DEFAULT 'reinvest';

-- Allow users to update their own profile (needed for the toggle)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2) New signups now get 5 free games (5 × 25 = 125 cards)
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, cards_remaining, premium_status)
  VALUES (NEW.id, NEW.email, 125, 'credits');
  RETURN NEW;
END;
$function$;