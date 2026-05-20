
-- Roles enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Profiles
CREATE TYPE public.premium_status AS ENUM ('free', 'credits', 'subscribed');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  premium_status premium_status NOT NULL DEFAULT 'free',
  cards_remaining INTEGER NOT NULL DEFAULT 0,
  subscription_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Promo codes
CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  max_uses INTEGER NOT NULL DEFAULT 1,
  current_uses INTEGER NOT NULL DEFAULT 0,
  cards_granted INTEGER NOT NULL DEFAULT 250,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Authenticated users can read active promo codes"
  ON public.promo_codes FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage promo codes"
  ON public.promo_codes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Promo redemptions
CREATE TABLE public.promo_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  cards_granted INTEGER NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, promo_code_id)
);

ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own redemptions"
  ON public.promo_redemptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all redemptions"
  ON public.promo_redemptions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Atomic redeem function
CREATE OR REPLACE FUNCTION public.redeem_promo_code(_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID := auth.uid();
  _promo public.promo_codes%ROWTYPE;
BEGIN
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO _promo
  FROM public.promo_codes
  WHERE code = upper(trim(_code))
    AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_code');
  END IF;

  IF _promo.expires_at IS NOT NULL AND _promo.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'expired');
  END IF;

  IF _promo.current_uses >= _promo.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'max_uses_reached');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.promo_redemptions
    WHERE user_id = _user_id AND promo_code_id = _promo.id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_redeemed');
  END IF;

  INSERT INTO public.promo_redemptions (user_id, promo_code_id, cards_granted)
  VALUES (_user_id, _promo.id, _promo.cards_granted);

  UPDATE public.promo_codes
    SET current_uses = current_uses + 1
    WHERE id = _promo.id;

  UPDATE public.profiles
    SET cards_remaining = cards_remaining + _promo.cards_granted,
        premium_status = CASE
          WHEN premium_status = 'subscribed' THEN 'subscribed'::premium_status
          ELSE 'credits'::premium_status
        END
    WHERE user_id = _user_id;

  RETURN jsonb_build_object(
    'success', true,
    'cards_granted', _promo.cards_granted
  );
END;
$$;

-- Consume cards function
CREATE OR REPLACE FUNCTION public.consume_premium_cards(_amount INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID := auth.uid();
  _profile public.profiles%ROWTYPE;
BEGIN
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  IF _amount IS NULL OR _amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_amount');
  END IF;

  SELECT * INTO _profile FROM public.profiles
    WHERE user_id = _user_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_profile');
  END IF;

  IF _profile.premium_status = 'subscribed'
     AND _profile.subscription_end_date IS NOT NULL
     AND _profile.subscription_end_date > now() THEN
    RETURN jsonb_build_object('success', true, 'cards_remaining', null, 'subscribed', true);
  END IF;

  IF _profile.cards_remaining < _amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_cards', 'cards_remaining', _profile.cards_remaining);
  END IF;

  UPDATE public.profiles
    SET cards_remaining = cards_remaining - _amount,
        premium_status = CASE
          WHEN cards_remaining - _amount <= 0 THEN 'free'::premium_status
          ELSE premium_status
        END
    WHERE user_id = _user_id
    RETURNING * INTO _profile;

  RETURN jsonb_build_object('success', true, 'cards_remaining', _profile.cards_remaining, 'subscribed', false);
END;
$$;
