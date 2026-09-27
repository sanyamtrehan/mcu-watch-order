-- The catalog is public product content. Personal progress remains private:
-- watch_progress has no anon grant or anonymous RLS policy.
GRANT SELECT ON TABLE public.catalog_episodes TO anon;
GRANT SELECT ON TABLE public.catalog_orderings TO anon;
GRANT SELECT ON TABLE public.catalog_seasons TO anon;
GRANT SELECT ON TABLE public.catalog_titles TO anon;
GRANT SELECT ON TABLE public.ordering_entries TO anon;
GRANT SELECT ON TABLE public.title_relations TO anon;
GRANT SELECT ON TABLE public.watch_units TO anon;

CREATE POLICY "Anonymous visitors can read catalog episodes"
  ON public.catalog_episodes FOR SELECT TO anon USING (true);

CREATE POLICY "Anonymous visitors can read catalog orderings"
  ON public.catalog_orderings FOR SELECT TO anon USING (true);

CREATE POLICY "Anonymous visitors can read catalog seasons"
  ON public.catalog_seasons FOR SELECT TO anon USING (true);

CREATE POLICY "Anonymous visitors can read catalog titles"
  ON public.catalog_titles FOR SELECT TO anon USING (true);

CREATE POLICY "Anonymous visitors can read ordering entries"
  ON public.ordering_entries FOR SELECT TO anon USING (true);

CREATE POLICY "Anonymous visitors can read title relations"
  ON public.title_relations FOR SELECT TO anon USING (true);

CREATE POLICY "Anonymous visitors can read watch units"
  ON public.watch_units FOR SELECT TO anon USING (true);
