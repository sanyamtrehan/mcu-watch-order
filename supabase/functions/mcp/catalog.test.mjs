import assert from 'node:assert/strict'
import test from 'node:test'
import { summarizeProgress, summarizeTitleProgress } from './catalog.ts'

const unit = (id, runtimeMinutes, title = `Title ${id}`, titleId = id) => ({
  id,
  position: Number(id),
  titleId,
  title,
  titleKind: 'movie',
  kind: 'movie',
  releaseDate: '2026-01-01',
  runtimeMinutes,
  seasonNumber: null,
  episodeNumber: null,
})

test('summarizes only catalog progress and returns the next release-order item', () => {
  const units = [unit('1', 100), unit('2', 50), unit('3', 25)]
  const summary = summarizeProgress(units, new Set(['1', 'missing']))

  assert.deepEqual({ ...summary, next: summary.next?.id }, {
    watchedUnits: 1,
    totalUnits: 3,
    percentComplete: 33.3,
    watchedMinutes: 100,
    remainingMinutes: 75,
    next: '2',
  })
})

test('reports per-episode watch status and the next unwatched episode for one title', () => {
  const units = [
    unit('1', 45, 'Helstrom', 'helstrom'),
    unit('2', 46, 'Helstrom', 'helstrom'),
    unit('3', 44, 'Helstrom', 'helstrom'),
    unit('4', 120, 'Hellboy', 'hellboy'),
  ]
  const progress = summarizeTitleProgress(units, new Set(['1']), 'Helstrom')

  assert.equal(progress.watchedUnits, 1)
  assert.equal(progress.totalUnits, 3)
  assert.equal(progress.next?.id, '2')
  assert.deepEqual(progress.units?.map(({ id, watched }) => ({ id, watched })), [
    { id: '1', watched: true },
    { id: '2', watched: false },
    { id: '3', watched: false },
  ])
})

test('returns title choices instead of guessing an ambiguous partial match', () => {
  const progress = summarizeTitleProgress([
    unit('1', 120, 'Spider-Man', 'spider-man'),
    unit('2', 130, 'Spider-Man 2', 'spider-man-2'),
  ], new Set(), 'Spider')

  assert.deepEqual(progress.matches?.map(({ title }) => title), ['Spider-Man', 'Spider-Man 2'])
})
