type EpisodeRunUnit = {
  id: string;
  titleId: string;
  unitKind: string;
  seasonId: string | null;
};

export type EpisodeRun<T> = {
  id: string;
  units: T[];
};

export function groupAdjacentEpisodeRuns<T extends EpisodeRunUnit>(units: T[]): EpisodeRun<T>[] {
  const runs: EpisodeRun<T>[] = [];

  for (const unit of units) {
    const current = runs.at(-1);
    const previous = current?.units.at(-1);
    if (unit.unitKind === "episode" && unit.seasonId !== null && previous?.unitKind === "episode" && unit.titleId === previous.titleId && unit.seasonId === previous.seasonId) {
      current!.units.push(unit);
    } else {
      runs.push({ id: unit.id, units: [unit] });
    }
  }

  return runs;
}
