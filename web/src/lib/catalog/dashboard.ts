import { createClient } from "@/lib/supabase/server";

type TitleRow = { id: string; title: string; kind: "movie" | "special" | "series" };
type SeasonRow = { id: string; season_number: number };
type EpisodeRow = { id: string; season_id: string; episode_number: string };
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
};

export async function getReleaseOrderUnits(): Promise<DashboardUnit[]> {
  const supabase = await createClient();
  const [orderingResult, unitsResult, titlesResult, episodesResult, seasonsResult] = await Promise.all([
    supabase.from("ordering_entries").select("position, watch_unit_id").eq("ordering_id", "release").order("position"),
    supabase.from("watch_units").select("id, title_id, episode_id, kind, release_date"),
    supabase.from("catalog_titles").select("id, title, kind"),
    supabase.from("catalog_episodes").select("id, season_id, episode_number"),
    supabase.from("catalog_seasons").select("id, season_number"),
  ]);

  const errors = [orderingResult.error, unitsResult.error, titlesResult.error, episodesResult.error, seasonsResult.error].filter(Boolean);
  if (errors.length > 0) throw new Error(`Unable to load catalog: ${errors[0]?.message}`);

  const unitsById = new Map(((unitsResult.data ?? []) as WatchUnitRow[]).map((unit) => [unit.id, unit]));
  const titlesById = new Map(((titlesResult.data ?? []) as TitleRow[]).map((title) => [title.id, title]));
  const episodesById = new Map(((episodesResult.data ?? []) as EpisodeRow[]).map((episode) => [episode.id, episode]));
  const seasonsById = new Map(((seasonsResult.data ?? []) as SeasonRow[]).map((season) => [season.id, season]));

  return (orderingResult.data ?? []).flatMap((entry) => {
    const unit = unitsById.get(entry.watch_unit_id);
    const title = unit ? titlesById.get(unit.title_id) : undefined;
    if (!unit || !title) return [];

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
    }];
  });
}
