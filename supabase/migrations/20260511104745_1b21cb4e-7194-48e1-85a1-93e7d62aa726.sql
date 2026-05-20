
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 0,
  reset_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No client policies: only the service role (edge function) may read/write.

CREATE OR REPLACE FUNCTION public.check_rate_limit(_key text, _max integer, _window_seconds integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _now timestamptz := now();
  _row public.rate_limits%ROWTYPE;
BEGIN
  INSERT INTO public.rate_limits (key, count, reset_at)
    VALUES (_key, 1, _now + make_interval(secs => _window_seconds))
    ON CONFLICT (key) DO UPDATE
      SET count = CASE
            WHEN public.rate_limits.reset_at < _now THEN 1
            ELSE public.rate_limits.count + 1
          END,
          reset_at = CASE
            WHEN public.rate_limits.reset_at < _now THEN _now + make_interval(secs => _window_seconds)
            ELSE public.rate_limits.reset_at
          END
    RETURNING * INTO _row;
  RETURN _row.count <= _max;
END;
$$;
