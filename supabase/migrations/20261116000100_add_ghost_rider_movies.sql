INSERT INTO public.catalog_titles (id, title, kind, release_date)
VALUES
  ('movie-ghost-rider', 'Ghost Rider', 'movie', '2007-02-16'),
  ('movie-ghost-rider-spirit-of-vengeance', 'Ghost Rider: Spirit of Vengeance', 'movie', '2012-02-17')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  kind = EXCLUDED.kind,
  release_date = EXCLUDED.release_date,
  updated_at = now();

INSERT INTO public.watch_units (id, title_id, episode_id, kind, release_date, runtime_minutes)
VALUES
  ('watch-movie-ghost-rider', 'movie-ghost-rider', NULL, 'movie', '2007-02-16', 110),
  ('watch-movie-ghost-rider-spirit-of-vengeance', 'movie-ghost-rider-spirit-of-vengeance', NULL, 'movie', '2012-02-17', 95)
ON CONFLICT (id) DO UPDATE SET
  title_id = EXCLUDED.title_id,
  episode_id = EXCLUDED.episode_id,
  kind = EXCLUDED.kind,
  release_date = EXCLUDED.release_date,
  runtime_minutes = EXCLUDED.runtime_minutes;

INSERT INTO public.title_relations (from_title_id, to_title_id, type)
VALUES ('movie-ghost-rider-spirit-of-vengeance', 'movie-ghost-rider', 'sequel')
ON CONFLICT (from_title_id, to_title_id, type) DO NOTHING;

DELETE FROM public.ordering_entries WHERE ordering_id = 'release';

INSERT INTO public.ordering_entries (ordering_id, watch_unit_id, position)
SELECT
  'release',
  watch_units.id,
  row_number() OVER (
    ORDER BY watch_units.release_date ASC,
      watch_units.title_id ASC,
      catalog_seasons.season_number ASC NULLS FIRST,
      CASE WHEN catalog_episodes.episode_number ~ '^[0-9]+$' THEN catalog_episodes.episode_number::integer END ASC NULLS FIRST,
      watch_units.id ASC
  )::integer
FROM public.watch_units
LEFT JOIN public.catalog_episodes ON catalog_episodes.id = watch_units.episode_id
LEFT JOIN public.catalog_seasons ON catalog_seasons.id = catalog_episodes.season_id;
