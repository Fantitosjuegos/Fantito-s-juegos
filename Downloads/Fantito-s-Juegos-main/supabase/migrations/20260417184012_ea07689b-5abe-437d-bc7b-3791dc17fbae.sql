-- Drop overly permissive policies on skipped_cards
DROP POLICY IF EXISTS "Anyone can read skipped cards" ON public.skipped_cards;
DROP POLICY IF EXISTS "Anyone can insert skipped cards" ON public.skipped_cards;

-- Add a length check to prevent abuse / oversized writes
ALTER TABLE public.skipped_cards
  ADD CONSTRAINT skipped_cards_question_length CHECK (char_length(question) <= 1000);

ALTER TABLE public.skipped_cards
  ADD CONSTRAINT skipped_cards_session_id_length CHECK (char_length(session_id) <= 100);

-- Allow anonymous inserts but with validation; reads only via service role (edge function)
CREATE POLICY "Public can insert validated skipped cards"
ON public.skipped_cards
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(question) > 0
  AND char_length(question) <= 1000
  AND char_length(session_id) > 0
  AND char_length(session_id) <= 100
  AND action IN ('skip', 'done', 'star')
);
-- No SELECT policy: edge function uses service role, clients cannot read others' data.