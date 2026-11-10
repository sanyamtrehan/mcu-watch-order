import { createClient } from "@/lib/supabase/server";
import { collectPages } from "@/lib/supabase/pagination";

type TitleRow = { id: string; title: string; kind: "movie" | "special" | "series" };
type SeasonRow = { id: string; season_number: number };
type EpisodeRow = { id: string; season_id: string; episode_number: string };
type WatchUnitRow = {
  id: string;
  title_id: string;
  episode_id: string | null;
  kind: "movie" | "special" | "episode";
  release_date: string;
  runtime_minutes: number;
};
type OrderingRow = { position: number; watch_unit_id: string };
type RelationRow = { from_title_id: string; to_title_id: string; type: string };

export type DashboardUnit = {
  id: string;
  position: number;
  titleId: string;
  title: string;
  titleKind: TitleRow["kind"];
  unitKind: WatchUnitRow["kind"];
  releaseDate: string;
  runtimeMinutes: number;
  seasonNumber: number | null;
  seasonId: string | null;
  episodeNumber: string | null;
};

export type TitleRelationship = {
  fromTitleId: string;
  fromTitle: string;
  toTitleId: string;
  toTitle: string;
  type: "sequel" | "spin-off" | "crossover";
};

export type ReleaseOrderCatalog = {
  units: DashboardUnit[];
  relationships: TitleRelationship[];
};

export async function getReleaseOrderCatalog(): Promise<ReleaseOrderCatalog> {
  const supabase = await createClient();
  const [orderingRows, unitRows, titleRows, episodeRows, seasonRows, relationRows] = await Promise.all([
    collectPages<OrderingRow>((from, to) => supabase.from("ordering_entries").select("position, watch_unit_id").eq("ordering_id", "release").order("position").range(from, to)),
    collectPages<WatchUnitRow>((from, to) => supabase.from("watch_units").select("id, title_id, episode_id, kind, release_date, runtime_minutes").order("id").range(from, to)),
    collectPages<TitleRow>((from, to) => supabase.from("catalog_titles").select("id, title, kind").order("id").range(from, to)),
    collectPages<EpisodeRow>((from, to) => supabase.from("catalog_episodes").select("id, season_id, episode_number").order("id").range(from, to)),
    collectPages<SeasonRow>((from, to) => supabase.from("catalog_seasons").select("id, season_number").order("id").range(from, to)),
    collectPages<RelationRow>((from, to) => supabase.from("title_relations").select("from_title_id, to_title_id, type").order("from_title_id").order("to_title_id").range(from, to)),
  ]);

  const unitsById = new Map(unitRows.map((unit) => [unit.id, unit]));
  const titlesById = new Map(titleRows.map((title) => [title.id, title]));
  const episodesById = new Map(episodeRows.map((episode) => [episode.id, episode]));
  const seasonsById = new Map(seasonRows.map((season) => [season.id, season]));

  const units = orderingRows.flatMap((entry) => {
    const unit = unitsById.get(entry.watch_unit_id);
    const title = unit ? titlesById.get(unit.title_id) : undefined;
    if (!unit || !title) return [];

    const episode = unit.episode_id ? episodesById.get(unit.episode_id) : undefined;
    const season = episode ? seasonsById.get(episode.season_id) : undefined;

    return [{
      id: unit.id,
      position: entry.position,
      titleId: title.id,
      title: title.title,
      titleKind: title.kind,
      unitKind: unit.kind,
      releaseDate: unit.release_date,
      runtimeMinutes: unit.runtime_minutes,
      seasonNumber: season?.season_number ?? null,
      seasonId: episode?.season_id ?? null,
      episodeNumber: episode?.episode_number ?? null,
    }];
  });

  const relationships = relationRows.flatMap((relation) => {
    const fromTitle = titlesById.get(relation.from_title_id);
    const toTitle = titlesById.get(relation.to_title_id);
    if (!fromTitle || !toTitle) return [];

    return [{
      fromTitleId: fromTitle.id,
      fromTitle: fromTitle.title,
      toTitleId: toTitle.id,
      toTitle: toTitle.title,
      type: relation.type as TitleRelationship["type"],
    }];
  });

  return { units, relationships };
}
