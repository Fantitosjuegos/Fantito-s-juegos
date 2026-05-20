-- Remove the overly permissive UPDATE policy that allowed users to modify
-- entitlement columns (premium_status, cards_remaining, subscription_end_date)
-- directly via PostgREST, bypassing the paywall. All legitimate writes happen
-- through SECURITY DEFINER RPCs (consume_premium_cards, redeem_promo_code,
-- handle_new_user), which remain unaffected.
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;