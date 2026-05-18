-- 1. Restrict promo_codes SELECT to admins only.
-- Redemption still works because redeem_promo_code is SECURITY DEFINER.
DROP POLICY IF EXISTS "Authenticated users can read active promo codes" ON public.promo_codes;

CREATE POLICY "Admins can read promo codes"
ON public.promo_codes
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Revoke EXECUTE on internal/trigger-only SECURITY DEFINER functions
--    from anon and authenticated roles. They are still callable by the
--    database itself (triggers / other security definer functions).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;

-- consume_premium_cards and redeem_promo_code remain callable by authenticated users only.
REVOKE EXECUTE ON FUNCTION public.consume_premium_cards(integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.redeem_promo_code(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.consume_premium_cards(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_promo_code(text) TO authenticated;