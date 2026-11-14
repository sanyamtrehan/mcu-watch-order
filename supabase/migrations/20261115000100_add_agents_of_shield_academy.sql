INSERT INTO public.catalog_titles (id, title, kind, release_date)
VALUES ('series-agents-of-shield-academy', 'Agents of S.H.I.E.L.D.: Academy', 'series', '2016-03-09')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  kind = EXCLUDED.kind,
  release_date = EXCLUDED.release_date,
  updated_at = now();

INSERT INTO public.catalog_seasons (id, title_id, season_number)
VALUES ('series-agents-of-shield-academy-season-1', 'series-agents-of-shield-academy', 1)
ON CONFLICT (id) DO UPDATE SET
  title_id = EXCLUDED.title_id,
  season_number = EXCLUDED.season_number;

INSERT INTO public.catalog_episodes (id, season_id, episode_number, release_date)
VALUES
  ('series-agents-of-shield-academy-season-1-episode-1', 'series-agents-of-shield-academy-season-1', '1', '2016-03-09'),
  ('series-agents-of-shield-academy-season-1-episode-2', 'series-agents-of-shield-academy-season-1', '2', '2016-03-23'),
  ('series-agents-of-shield-academy-season-1-episode-3', 'series-agents-of-shield-academy-season-1', '3', '2016-04-06'),
  ('series-agents-of-shield-academy-season-1-episode-4', 'series-agents-of-shield-academy-season-1', '4', '2016-04-20'),
  ('series-agents-of-shield-academy-season-1-episode-5', 'series-agents-of-shield-academy-season-1', '5', '2016-05-04')
ON CONFLICT (id) DO UPDATE SET
  season_id = EXCLUDED.season_id,
  episode_number = EXCLUDED.episode_number,
  release_date = EXCLUDED.release_date;

INSERT INTO public.watch_units (id, title_id, episode_id, kind, release_date, runtime_minutes)
VALUES
  ('watch-series-agents-of-shield-academy-season-1-episode-1', 'series-agents-of-shield-academy', 'series-agents-of-shield-academy-season-1-episode-1', 'episode', '2016-03-09', 5),
  ('watch-series-agents-of-shield-academy-season-1-episode-2', 'series-agents-of-shield-academy', 'series-agents-of-shield-academy-season-1-episode-2', 'episode', '2016-03-23', 5),
  ('watch-series-agents-of-shield-academy-season-1-episode-3', 'series-agents-of-shield-academy', 'series-agents-of-shield-academy-season-1-episode-3', 'episode', '2016-04-06', 5),
  ('watch-series-agents-of-shield-academy-season-1-episode-4', 'series-agents-of-shield-academy', 'series-agents-of-shield-academy-season-1-episode-4', 'episode', '2016-04-20', 5),
  ('watch-series-agents-of-shield-academy-season-1-episode-5', 'series-agents-of-shield-academy', 'series-agents-of-shield-academy-season-1-episode-5', 'episode', '2016-05-04', 5)
ON CONFLICT (id) DO UPDATE SET
  title_id = EXCLUDED.title_id,
  episode_id = EXCLUDED.episode_id,
  kind = EXCLUDED.kind,
  release_date = EXCLUDED.release_date,
  runtime_minutes = EXCLUDED.runtime_minutes;

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
