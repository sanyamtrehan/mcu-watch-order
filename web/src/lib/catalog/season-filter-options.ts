type SeasonUnit = {
  seasonId: string | null;
  seasonNumber: number | null;
};

export function buildSeasonFilterOptions(units: SeasonUnit[]) {
  const seasons = new Map<string, { number: number; episodeCount: number }>();

  for (const unit of units) {
    if (!unit.seasonId || unit.seasonNumber === null) continue;

    const season = seasons.get(unit.seasonId);
    if (season) season.episodeCount += 1;
    else seasons.set(unit.seasonId, { number: unit.seasonNumber, episodeCount: 1 });
  }

  return [...seasons.entries()]
    .sort(([, a], [, b]) => a.number - b.number)
    .map(([value, season]) => ({
      value,
      label: `Season ${season.number} (${season.episodeCount} ${season.episodeCount === 1 ? "episode" : "episodes"})`,
    }));
}
