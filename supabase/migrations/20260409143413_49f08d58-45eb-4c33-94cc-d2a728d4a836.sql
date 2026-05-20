
-- Card type enum
CREATE TYPE public.card_type AS ENUM ('question', 'dare', 'vote', 'scenario');

-- Pre-existing card library table
CREATE TABLE public.card_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_type card_type NOT NULL DEFAULT 'question',
  language TEXT NOT NULL DEFAULT 'en',
  content TEXT NOT NULL,
  choice_a TEXT NOT NULL,
  choice_b TEXT NOT NULL,
  vibes TEXT[] DEFAULT '{}',
  intensity_min INT NOT NULL DEFAULT 1 CHECK (intensity_min BETWEEN 1 AND 5),
  intensity_max INT NOT NULL DEFAULT 5 CHECK (intensity_max BETWEEN 1 AND 5),
  group_types TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.card_library ENABLE ROW LEVEL SECURITY;

-- Anyone can read active cards (public game content)
CREATE POLICY "Anyone can read active cards"
  ON public.card_library
  FOR SELECT
  USING (is_active = true);

-- Index for filtering
CREATE INDEX idx_card_library_language ON public.card_library (language);
CREATE INDEX idx_card_library_vibes ON public.card_library USING GIN (vibes);
CREATE INDEX idx_card_library_group_types ON public.card_library USING GIN (group_types);
CREATE INDEX idx_card_library_intensity ON public.card_library (intensity_min, intensity_max);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_card_library_updated_at
  BEFORE UPDATE ON public.card_library
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
