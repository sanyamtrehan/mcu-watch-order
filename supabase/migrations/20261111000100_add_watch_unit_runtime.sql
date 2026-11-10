ALTER TABLE public.watch_units
  ADD COLUMN IF NOT EXISTS runtime_minutes integer
    CHECK (runtime_minutes > 0);
