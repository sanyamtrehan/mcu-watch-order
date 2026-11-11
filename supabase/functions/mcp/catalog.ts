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

export function summarizeTitleProgress(units: CatalogUnit[], watchedIds: Set<string>, query: string) {
  const needle = query.trim().toLocaleLowerCase()
  const matches = new Map<string, { titleId: string; title: string; type: CatalogUnit['titleKind']; totalUnits: number }>()

  for (const unit of units) {
    if (!unit.title.toLocaleLowerCase().includes(needle)) continue
    const match = matches.get(unit.titleId)
    matches.set(unit.titleId, {
      titleId: unit.titleId,
      title: unit.title,
      type: unit.titleKind,
      totalUnits: (match?.totalUnits ?? 0) + 1,
    })
  }

  const choices = [...matches.values()]
  const exact = choices.filter(({ title }) => title.toLocaleLowerCase() === needle)
  const selected = exact.length === 1 ? exact[0] : choices.length === 1 ? choices[0] : null
  if (!selected) return { matches: choices }

  const titleUnits = units.filter(({ titleId }) => titleId === selected.titleId)
  const summary = summarizeProgress(titleUnits, watchedIds)
  return {
    titleId: selected.titleId,
    title: selected.title,
    type: selected.type,
    ...summary,
    units: titleUnits.map((unit) => ({ ...unit, watched: watchedIds.has(unit.id) })),
  }
}
