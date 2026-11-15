INSERT INTO public.catalog_titles (id, title, kind, release_date)
VALUES
  ('movie-hulk-2003', 'Hulk (2003)', 'movie', '2003-06-20'),
  ('movie-the-punisher-2004', 'The Punisher (2004)', 'movie', '2004-04-16'),
  ('movie-punisher-war-zone', 'Punisher: War Zone', 'movie', '2008-12-05'),
  ('movie-spider-man-brand-new-day', 'Spider-Man: Brand New Day', 'movie', '2026-07-31'),
  ('special-the-punisher-dirty-laundry', 'The Punisher: Dirty Laundry', 'special', '2012-07-15'),
  ('special-no-good-deed', 'No Good Deed', 'special', '2017-03-03'),
  ('special-peter-s-to-do-list', 'Peter''s To-Do List', 'special', '2019-10-01'),
  ('special-deadpool-and-korg-react', 'Deadpool and Korg React', 'special', '2021-07-13'),
  ('series-wonder-man', 'Wonder Man', 'series', '2026-01-27'),
  ('series-visionquest', 'VisionQuest', 'series', '2026-10-13')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  kind = EXCLUDED.kind,
  release_date = EXCLUDED.release_date,
  updated_at = now();

INSERT INTO public.catalog_seasons (id, title_id, season_number)
VALUES
  ('series-wonder-man-season-1', 'series-wonder-man', 1),
  ('series-daredevil-born-again-season-2', 'series-daredevil-born-again', 2),
  ('series-visionquest-season-1', 'series-visionquest', 1)
ON CONFLICT (id) DO UPDATE SET
  title_id = EXCLUDED.title_id,
  season_number = EXCLUDED.season_number;

INSERT INTO public.catalog_episodes (id, season_id, episode_number, release_date)
VALUES
  ('series-wonder-man-season-1-episode-1', 'series-wonder-man-season-1', '1', '2026-01-27'),
  ('series-wonder-man-season-1-episode-2', 'series-wonder-man-season-1', '2', '2026-01-27'),
  ('series-wonder-man-season-1-episode-3', 'series-wonder-man-season-1', '3', '2026-01-27'),
  ('series-wonder-man-season-1-episode-4', 'series-wonder-man-season-1', '4', '2026-01-27'),
  ('series-wonder-man-season-1-episode-5', 'series-wonder-man-season-1', '5', '2026-01-27'),
  ('series-wonder-man-season-1-episode-6', 'series-wonder-man-season-1', '6', '2026-01-27'),
  ('series-wonder-man-season-1-episode-7', 'series-wonder-man-season-1', '7', '2026-01-27'),
  ('series-wonder-man-season-1-episode-8', 'series-wonder-man-season-1', '8', '2026-01-27'),
  ('series-daredevil-born-again-season-2-episode-1', 'series-daredevil-born-again-season-2', '1', '2026-03-24'),
  ('series-daredevil-born-again-season-2-episode-2', 'series-daredevil-born-again-season-2', '2', '2026-03-31'),
  ('series-daredevil-born-again-season-2-episode-3', 'series-daredevil-born-again-season-2', '3', '2026-03-31'),
  ('series-daredevil-born-again-season-2-episode-4', 'series-daredevil-born-again-season-2', '4', '2026-04-07'),
  ('series-daredevil-born-again-season-2-episode-5', 'series-daredevil-born-again-season-2', '5', '2026-04-14'),
  ('series-daredevil-born-again-season-2-episode-6', 'series-daredevil-born-again-season-2', '6', '2026-04-21'),
  ('series-daredevil-born-again-season-2-episode-7', 'series-daredevil-born-again-season-2', '7', '2026-04-28'),
  ('series-daredevil-born-again-season-2-episode-8', 'series-daredevil-born-again-season-2', '8', '2026-05-05'),
  ('series-visionquest-season-1-episode-1', 'series-visionquest-season-1', '1', '2026-10-13'),
  ('series-visionquest-season-1-episode-2', 'series-visionquest-season-1', '2', '2026-10-13'),
  ('series-visionquest-season-1-episode-3', 'series-visionquest-season-1', '3', '2026-10-20'),
  ('series-visionquest-season-1-episode-4', 'series-visionquest-season-1', '4', '2026-10-20'),
  ('series-visionquest-season-1-episode-5', 'series-visionquest-season-1', '5', '2026-10-27'),
  ('series-visionquest-season-1-episode-6', 'series-visionquest-season-1', '6', '2026-10-27'),
  ('series-visionquest-season-1-episode-7', 'series-visionquest-season-1', '7', '2026-11-03'),
  ('series-visionquest-season-1-episode-8', 'series-visionquest-season-1', '8', '2026-11-10')
ON CONFLICT (id) DO UPDATE SET
  season_id = EXCLUDED.season_id,
  episode_number = EXCLUDED.episode_number,
  release_date = EXCLUDED.release_date;

INSERT INTO public.watch_units (id, title_id, episode_id, kind, release_date, runtime_minutes)
VALUES
  ('watch-movie-hulk-2003', 'movie-hulk-2003', NULL, 'movie', '2003-06-20', 138),
  ('watch-movie-the-punisher-2004', 'movie-the-punisher-2004', NULL, 'movie', '2004-04-16', 123),
  ('watch-movie-punisher-war-zone', 'movie-punisher-war-zone', NULL, 'movie', '2008-12-05', 103),
  ('watch-movie-spider-man-brand-new-day', 'movie-spider-man-brand-new-day', NULL, 'movie', '2026-07-31', 145),
  ('watch-special-the-punisher-dirty-laundry', 'special-the-punisher-dirty-laundry', NULL, 'special', '2012-07-15', 10),
  ('watch-special-no-good-deed', 'special-no-good-deed', NULL, 'special', '2017-03-03', 4),
  ('watch-special-peter-s-to-do-list', 'special-peter-s-to-do-list', NULL, 'special', '2019-10-01', 4),
  ('watch-special-deadpool-and-korg-react', 'special-deadpool-and-korg-react', NULL, 'special', '2021-07-13', 4),
  ('watch-series-wonder-man-season-1-episode-1', 'series-wonder-man', 'series-wonder-man-season-1-episode-1', 'episode', '2026-01-27', 35),
  ('watch-series-wonder-man-season-1-episode-2', 'series-wonder-man', 'series-wonder-man-season-1-episode-2', 'episode', '2026-01-27', 34),
  ('watch-series-wonder-man-season-1-episode-3', 'series-wonder-man', 'series-wonder-man-season-1-episode-3', 'episode', '2026-01-27', 34),
  ('watch-series-wonder-man-season-1-episode-4', 'series-wonder-man', 'series-wonder-man-season-1-episode-4', 'episode', '2026-01-27', 32),
  ('watch-series-wonder-man-season-1-episode-5', 'series-wonder-man', 'series-wonder-man-season-1-episode-5', 'episode', '2026-01-27', 25),
  ('watch-series-wonder-man-season-1-episode-6', 'series-wonder-man', 'series-wonder-man-season-1-episode-6', 'episode', '2026-01-27', 36),
  ('watch-series-wonder-man-season-1-episode-7', 'series-wonder-man', 'series-wonder-man-season-1-episode-7', 'episode', '2026-01-27', 35),
  ('watch-series-wonder-man-season-1-episode-8', 'series-wonder-man', 'series-wonder-man-season-1-episode-8', 'episode', '2026-01-27', 34),
  ('watch-series-daredevil-born-again-season-2-episode-1', 'series-daredevil-born-again', 'series-daredevil-born-again-season-2-episode-1', 'episode', '2026-03-24', 51),
  ('watch-series-daredevil-born-again-season-2-episode-2', 'series-daredevil-born-again', 'series-daredevil-born-again-season-2-episode-2', 'episode', '2026-03-31', 46),
  ('watch-series-daredevil-born-again-season-2-episode-3', 'series-daredevil-born-again', 'series-daredevil-born-again-season-2-episode-3', 'episode', '2026-03-31', 47),
  ('watch-series-daredevil-born-again-season-2-episode-4', 'series-daredevil-born-again', 'series-daredevil-born-again-season-2-episode-4', 'episode', '2026-04-07', 51),
  ('watch-series-daredevil-born-again-season-2-episode-5', 'series-daredevil-born-again', 'series-daredevil-born-again-season-2-episode-5', 'episode', '2026-04-14', 50),
  ('watch-series-daredevil-born-again-season-2-episode-6', 'series-daredevil-born-again', 'series-daredevil-born-again-season-2-episode-6', 'episode', '2026-04-21', 49),
  ('watch-series-daredevil-born-again-season-2-episode-7', 'series-daredevil-born-again', 'series-daredevil-born-again-season-2-episode-7', 'episode', '2026-04-28', 44),
  ('watch-series-daredevil-born-again-season-2-episode-8', 'series-daredevil-born-again', 'series-daredevil-born-again-season-2-episode-8', 'episode', '2026-05-05', 51),
  ('watch-series-visionquest-season-1-episode-1', 'series-visionquest', 'series-visionquest-season-1-episode-1', 'episode', '2026-10-13', 53),
  ('watch-series-visionquest-season-1-episode-2', 'series-visionquest', 'series-visionquest-season-1-episode-2', 'episode', '2026-10-13', 45),
  ('watch-series-visionquest-season-1-episode-3', 'series-visionquest', 'series-visionquest-season-1-episode-3', 'episode', '2026-10-20', 52),
  ('watch-series-visionquest-season-1-episode-4', 'series-visionquest', 'series-visionquest-season-1-episode-4', 'episode', '2026-10-20', 48),
  ('watch-series-visionquest-season-1-episode-5', 'series-visionquest', 'series-visionquest-season-1-episode-5', 'episode', '2026-10-27', 46),
  ('watch-series-visionquest-season-1-episode-6', 'series-visionquest', 'series-visionquest-season-1-episode-6', 'episode', '2026-10-27', 54),
  ('watch-series-visionquest-season-1-episode-7', 'series-visionquest', 'series-visionquest-season-1-episode-7', 'episode', '2026-11-03', 62),
  ('watch-series-visionquest-season-1-episode-8', 'series-visionquest', 'series-visionquest-season-1-episode-8', 'episode', '2026-11-10', 69)
ON CONFLICT (id) DO UPDATE SET
  title_id = EXCLUDED.title_id,
  episode_id = EXCLUDED.episode_id,
  kind = EXCLUDED.kind,
  release_date = EXCLUDED.release_date,
  runtime_minutes = EXCLUDED.runtime_minutes;

INSERT INTO public.title_relations (from_title_id, to_title_id, type)
VALUES
  ('movie-spider-man-brand-new-day', 'movie-spider-man-no-way-home', 'sequel'),
  ('special-the-punisher-dirty-laundry', 'movie-the-punisher-2004', 'sequel'),
  ('special-no-good-deed', 'movie-deadpool', 'spin-off'),
  ('special-peter-s-to-do-list', 'movie-spider-man-far-from-home', 'spin-off'),
  ('special-deadpool-and-korg-react', 'movie-deadpool-2', 'crossover'),
  ('special-deadpool-and-korg-react', 'movie-thor-ragnarok', 'crossover'),
  ('series-visionquest', 'series-wanda-vision', 'spin-off')
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
