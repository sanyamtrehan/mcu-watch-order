-- Supabase Auth owns identities. Keep the legacy users table temporarily so
-- the previous application can be retired only after the replacement is live.
ALTER TABLE public.watch_progress
  DROP CONSTRAINT watch_progress_user_id_fkey;

ALTER TABLE public.watch_progress
  ADD CONSTRAINT watch_progress_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Every public table is protected by RLS. The catalog is shared, but progress
-- belongs exclusively to the signed-in user represented by auth.uid().
ALTER TABLE public.catalog_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_orderings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordering_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.title_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_units ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.catalog_episodes FROM anon, authenticated;
REVOKE ALL ON TABLE public.catalog_items FROM anon, authenticated;
REVOKE ALL ON TABLE public.catalog_orderings FROM anon, authenticated;
REVOKE ALL ON TABLE public.catalog_seasons FROM anon, authenticated;
REVOKE ALL ON TABLE public.catalog_titles FROM anon, authenticated;
REVOKE ALL ON TABLE public.migrations FROM anon, authenticated;
REVOKE ALL ON TABLE public.ordering_entries FROM anon, authenticated;
REVOKE ALL ON TABLE public.title_relations FROM anon, authenticated;
REVOKE ALL ON TABLE public.users FROM anon, authenticated;
REVOKE ALL ON TABLE public.watch_progress FROM anon, authenticated;
REVOKE ALL ON TABLE public.watch_units FROM anon, authenticated;

GRANT SELECT ON TABLE public.catalog_episodes TO authenticated;
GRANT SELECT ON TABLE public.catalog_orderings TO authenticated;
GRANT SELECT ON TABLE public.catalog_seasons TO authenticated;
GRANT SELECT ON TABLE public.catalog_titles TO authenticated;
GRANT SELECT ON TABLE public.ordering_entries TO authenticated;
GRANT SELECT ON TABLE public.title_relations TO authenticated;
GRANT SELECT ON TABLE public.watch_units TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.watch_progress TO authenticated;

CREATE POLICY "Authenticated users can read catalog episodes"
  ON public.catalog_episodes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read catalog orderings"
  ON public.catalog_orderings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read catalog seasons"
  ON public.catalog_seasons FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read catalog titles"
  ON public.catalog_titles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read ordering entries"
  ON public.ordering_entries FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read title relations"
  ON public.title_relations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read watch units"
  ON public.watch_units FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can read their own progress"
  ON public.watch_progress FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create their own progress"
  ON public.watch_progress FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.watch_progress FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own progress"
  ON public.watch_progress FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);
