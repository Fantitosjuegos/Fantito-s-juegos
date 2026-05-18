ALTER TABLE public.profiles ALTER COLUMN cards_remaining SET DEFAULT 250;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, cards_remaining, premium_status)
  VALUES (NEW.id, NEW.email, 250, 'credits');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

UPDATE public.profiles
SET cards_remaining = 250, premium_status = 'credits'
WHERE cards_remaining = 0 AND premium_status = 'free';