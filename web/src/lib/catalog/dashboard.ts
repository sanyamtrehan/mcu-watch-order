import { createClient } from "@/lib/supabase/server";

type TitleRow = {
  id: string;
  title: string;
  kind: "movie" | "special" | "series";
};

type SeasonRow = {
  id: string;
  season_number: number;
};

type EpisodeRow = {
  id: string;
  season_id: string;
  episode_number: string;
};

type WatchUnitRow = {
  id: string;
  title_id: string;
  episode_id: string | null;
  kind: "movie" | "special" | "episode";
  release_date: string;
};

export type DashboardUnit = {
  id: string;
  position: number;
  title: string;
  titleKind: TitleRow["kind"];
  unitKind: WatchUnitRow["kind"];
  releaseDate: string;
  seasonNumber: number | null;
  episodeNumber: string | null;
  watched: boolean;
};

export type DashboardData = {
  totals: {
    watched: number;
    total: number;
    moviesWatched: number;
    moviesTotal: number;
    episodesWatched: number;
    episodesTotal: number;
    titlesCompleted: number;
    titlesTotal: number;
  };
  next: DashboardUnit | null;
  upcoming: DashboardUnit[];
  recentlyWatched: DashboardUnit[];
};

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();
  const [orderingResult, unitsResult, titlesResult, episodesResult, seasonsResult, progressResult] =
    await Promise.all([
      supabase.from("ordering_entries").select("position, watch_unit_id").eq("ordering_id", "release").order("position"),
      supabase.from("watch_units").select("id, title_id, episode_id, kind, release_date"),
      supabase.from("catalog_titles").select("id, title, kind"),
      supabase.from("catalog_episodes").select("id, season_id, episode_number"),
      supabase.from("catalog_seasons").select("id, season_number"),
      supabase.from("watch_progress").select("watch_unit_id, status").eq("status", "watched"),
    ]);

  const errors = [orderingResult.error, unitsResult.error, titlesResult.error, episodesResult.error, seasonsResult.error, progressResult.error].filter(Boolean);

  if (errors.length > 0) {
    throw new Error(`Unable to load dashboard data: ${errors[0]?.message}`);
  }

  const orderingEntries = orderingResult.data ?? [];
  const progress = progressResult.data ?? [];
  const unitsById = new Map(((unitsResult.data ?? []) as WatchUnitRow[]).map((unit) => [unit.id, unit]));
  const titlesById = new Map(((titlesResult.data ?? []) as TitleRow[]).map((title) => [title.id, title]));
  const episodesById = new Map(((episodesResult.data ?? []) as EpisodeRow[]).map((episode) => [episode.id, episode]));
  const seasonsById = new Map(((seasonsResult.data ?? []) as SeasonRow[]).map((season) => [season.id, season]));
  const watchedUnitIds = new Set(progress.filter((entry) => entry.status === "watched").map((entry) => entry.watch_unit_id));

  const units = orderingEntries.flatMap((entry) => {
    const unit = unitsById.get(entry.watch_unit_id);
    if (!unit) return [];

    const title = titlesById.get(unit.title_id);
    if (!title) return [];

    const episode = unit.episode_id ? episodesById.get(unit.episode_id) : undefined;
    const season = episode ? seasonsById.get(episode.season_id) : undefined;

    return [{
      id: unit.id,
      position: entry.position,
      title: title.title,
      titleKind: title.kind,
      unitKind: unit.kind,
      releaseDate: unit.release_date,
      seasonNumber: season?.season_number ?? null,
      episodeNumber: episode?.episode_number ?? null,
      watched: watchedUnitIds.has(unit.id),
    }];
  });

  const watched = units.filter((unit) => unit.watched);
  const movies = units.filter((unit) => unit.unitKind === "movie");
  const episodes = units.filter((unit) => unit.unitKind === "episode");
  const unitCountsByTitle = new Map<string, { watched: number; total: number }>();

  for (const unit of units) {
    const current = unitCountsByTitle.get(unit.title) ?? { watched: 0, total: 0 };
    current.total += 1;
    current.watched += Number(unit.watched);
    unitCountsByTitle.set(unit.title, current);
  }

  return {
    totals: {
      watched: watched.length,
      total: units.length,
      moviesWatched: movies.filter((unit) => unit.watched).length,
      moviesTotal: movies.length,
      episodesWatched: episodes.filter((unit) => unit.watched).length,
      episodesTotal: episodes.length,
      titlesCompleted: [...unitCountsByTitle.values()].filter((count) => count.total > 0 && count.watched === count.total).length,
      titlesTotal: unitCountsByTitle.size,
    },
    next: units.find((unit) => !unit.watched) ?? null,
    upcoming: units.filter((unit) => !unit.watched).slice(0, 12),
    recentlyWatched: watched.slice(-8).reverse(),
  };
}
