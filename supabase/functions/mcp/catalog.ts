export type CatalogUnit = {
  id: string
  position: number
  titleId: string
  title: string
  titleKind: 'movie' | 'special' | 'series'
  kind: 'movie' | 'special' | 'episode'
  releaseDate: string
  runtimeMinutes: number
  seasonNumber: number | null
  episodeNumber: string | null
}

export function summarizeProgress(units: CatalogUnit[], watchedIds: Set<string>) {
  const watched = units.filter((unit) => watchedIds.has(unit.id))
  const watchedMinutes = watched.reduce((sum, unit) => sum + unit.runtimeMinutes, 0)
  const totalMinutes = units.reduce((sum, unit) => sum + unit.runtimeMinutes, 0)

  return {
    watchedUnits: watched.length,
    totalUnits: units.length,
    percentComplete: units.length ? Math.round(watched.length / units.length * 1000) / 10 : 0,
    watchedMinutes,
    remainingMinutes: totalMinutes - watchedMinutes,
    next: units.find((unit) => !watchedIds.has(unit.id)) ?? null,
  }
}
