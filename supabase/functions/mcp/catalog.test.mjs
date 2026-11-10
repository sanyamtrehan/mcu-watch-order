import assert from 'node:assert/strict'
import test from 'node:test'
import { summarizeProgress } from './catalog.ts'

const unit = (id, runtimeMinutes) => ({
  id,
  position: Number(id),
  titleId: id,
  title: `Title ${id}`,
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
