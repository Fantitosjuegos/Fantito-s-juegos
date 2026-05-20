CREATE TABLE public.skipped_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  card_type text NOT NULL,
  category text NOT NULL,
  source_emoji text,
  question text NOT NULL,
  target_player text,
  language text NOT NULL DEFAULT 'en',
  vibes text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.skipped_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert skipped cards"
ON public.skipped_cards FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "Anyone can read skipped cards"
ON public.skipped_cards FOR SELECT TO public
USING (true);