CREATE TABLE public.watch_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  watch_unit_id character varying NOT NULL REFERENCES public.watch_units(id) ON DELETE CASCADE,
  action character varying NOT NULL CHECK (action IN ('watched', 'unwatched')),
  occurred_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX watch_history_user_time_index
  ON public.watch_history (user_id, occurred_at DESC);

ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.watch_history FROM anon, authenticated;
GRANT SELECT ON TABLE public.watch_history TO authenticated;

CREATE POLICY "Users can read their own watch history"
  ON public.watch_history FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE FUNCTION public.log_watch_progress_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.watch_history (user_id, watch_unit_id, action, occurred_at)
    VALUES (OLD.user_id, OLD.watch_unit_id, 'unwatched', statement_timestamp());
    RETURN OLD;
  END IF;

  INSERT INTO public.watch_history (user_id, watch_unit_id, action, occurred_at)
  VALUES (NEW.user_id, NEW.watch_unit_id, NEW.status, statement_timestamp());
  RETURN NEW;
END;
$$;

CREATE TRIGGER watch_progress_history_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.watch_progress
FOR EACH ROW EXECUTE FUNCTION public.log_watch_progress_change();

INSERT INTO public.watch_history (user_id, watch_unit_id, action, occurred_at)
SELECT user_id, watch_unit_id, 'watched', COALESCE(watched_at, updated_at, created_at)
FROM public.watch_progress
WHERE status = 'watched';
