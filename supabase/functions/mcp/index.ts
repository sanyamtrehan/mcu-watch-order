import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { createMcpHandler, McpServer } from 'npm:@modelcontextprotocol/server@^2.0.0'
import { pipeline } from 'npm:@supabase/middleware@1'
import { withOAuthProtectedResource, withSupabase } from 'npm:@supabase/server@1'
import type { SupabaseClient } from 'npm:@supabase/supabase-js@^2.117.2'
import { z } from 'npm:zod@^4.3.6'
import { summarizeProgress, summarizeTitleProgress, type CatalogUnit } from './catalog.ts'

type Embedded<T> = T | T[] | null
const oauthMeta = {
  securitySchemes: [{ type: 'oauth2', scopes: ['openid', 'profile', 'email'] }],
}

type OrderingRecord = {
  position: number
  watch_unit: Embedded<{
    id: string
    title_id: string
    kind: CatalogUnit['kind']
    release_date: string
    runtime_minutes: number
    title: Embedded<{ id: string; title: string; kind: CatalogUnit['titleKind'] }>
    episode: Embedded<{
      episode_number: string
      season: Embedded<{ season_number: number }>
    }>
  }>
}

const one = <T>(value: Embedded<T>) => Array.isArray(value) ? value[0] ?? null : value

async function loadCatalog(supabase: SupabaseClient): Promise<CatalogUnit[]> {
  // shortcut: the catalog currently has 916 units, paginate when it exceeds 1,000.
  const { data, error } = await supabase
    .from('ordering_entries')
    .select(`
      position,
      watch_unit:watch_units!inner(
        id, title_id, kind, release_date, runtime_minutes,
        title:catalog_titles!inner(id, title, kind),
        episode:catalog_episodes(episode_number, season:catalog_seasons(season_number))
      )
    `)
    .eq('ordering_id', 'release')
    .order('position')
    .limit(1000)

  if (error) throw new Error(`Unable to load the catalog: ${error.message}`)

  return ((data ?? []) as unknown as OrderingRecord[]).flatMap((record) => {
    const unit = one(record.watch_unit)
    const title = unit ? one(unit.title) : null
    if (!unit || !title) return []
    const episode = one(unit.episode)
    const season = episode ? one(episode.season) : null
    return [{
      id: unit.id,
      position: record.position,
      titleId: title.id,
      title: title.title,
      titleKind: title.kind,
      kind: unit.kind,
      releaseDate: unit.release_date,
      runtimeMinutes: unit.runtime_minutes,
      seasonNumber: season?.season_number ?? null,
      episodeNumber: episode?.episode_number ?? null,
    }]
  })
}

async function loadWatchedIds(supabase: SupabaseClient) {
  const { data, error } = await supabase.from('watch_progress').select('watch_unit_id').eq('status', 'watched')
  if (error) throw new Error(`Unable to load watch progress: ${error.message}`)
  return new Set((data ?? []).map(({ watch_unit_id }) => watch_unit_id as string))
}

function unitResult(unit: CatalogUnit) {
  return {
    id: unit.id,
    position: unit.position,
    title: unit.title,
    type: unit.kind,
    releaseDate: unit.releaseDate,
    runtimeMinutes: unit.runtimeMinutes,
    season: unit.seasonNumber,
    episode: unit.episodeNumber,
  }
}

function result(value: Record<string, unknown>) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(value) }],
    structuredContent: value,
  }
}

Deno.serve(
  pipeline(
    [withOAuthProtectedResource(), withSupabase({ auth: 'user' })],
    async (request, { supabase }) => {
      const handler = createMcpHandler(() => {
        const server = new McpServer(
          { name: 'mcu-watch-order', version: '1.0.0' },
          { instructions: 'Use search_catalog to find stable watch-unit IDs. Use get_title_progress for watched status within a movie, special, or series. Use set_watch_status only after the user clearly asks to change progress. get_next_unwatched returns release order.' },
        )

        server.registerTool(
          'search_catalog',
          {
            description: 'Search the MCU watch-order catalog by title. Use this when the user asks whether a movie, special, series, season, or episode is in the catalog.',
            inputSchema: z.object({
              query: z.string().max(100).default(''),
              type: z.enum(['all', 'movie', 'special', 'episode']).default('all'),
              limit: z.number().int().min(1).max(50).default(20),
            }),
            annotations: { readOnlyHint: true },
            _meta: oauthMeta,
          },
          async ({ query, type, limit }) => {
            const needle = query.trim().toLocaleLowerCase()
            const units = (await loadCatalog(supabase))
              .filter((unit) => type === 'all' || unit.kind === type)
              .filter((unit) => !needle || unit.title.toLocaleLowerCase().includes(needle))
              .slice(0, limit)
              .map(unitResult)
            return result({ units, count: units.length })
          },
        )

        server.registerTool(
          'get_title_progress',
          {
            description: 'Return watched status for every unit in one movie, special, or series, plus totals and the next unwatched unit. Use this when the user asks what episode they are on or their progress within a specific title.',
            inputSchema: z.object({ title: z.string().trim().min(1).max(100) }),
            annotations: { readOnlyHint: true },
            _meta: oauthMeta,
          },
          async ({ title }) => {
            const [units, watchedIds] = await Promise.all([loadCatalog(supabase), loadWatchedIds(supabase)])
            return result(summarizeTitleProgress(units, watchedIds, title))
          },
        )

        server.registerTool(
          'get_progress_summary',
          {
            description: 'Summarize the signed-in user’s MCU watch progress, including watched and remaining runtime. Use this for progress, percentage, or time-watched questions.',
            inputSchema: z.object({}),
            annotations: { readOnlyHint: true },
            _meta: oauthMeta,
          },
          async () => {
            const [units, watchedIds] = await Promise.all([loadCatalog(supabase), loadWatchedIds(supabase)])
            const summary = summarizeProgress(units, watchedIds)
            return result({
              ...summary,
              next: summary.next ? unitResult(summary.next) : null,
            })
          },
        )

        server.registerTool(
          'get_next_unwatched',
          {
            description: 'Return the signed-in user’s next unwatched entries in release order. Use this when the user asks what to watch next.',
            inputSchema: z.object({ limit: z.number().int().min(1).max(25).default(10) }),
            annotations: { readOnlyHint: true },
            _meta: oauthMeta,
          },
          async ({ limit }) => {
            const [units, watchedIds] = await Promise.all([loadCatalog(supabase), loadWatchedIds(supabase)])
            const unitsToWatch = units.filter((unit) => !watchedIds.has(unit.id)).slice(0, limit).map(unitResult)
            return result({ units: unitsToWatch, count: unitsToWatch.length })
          },
        )

        server.registerTool(
          'set_watch_status',
          {
            description: 'Mark one or more catalog watch-unit IDs as watched or unwatched for the signed-in user. Call only after the user explicitly asks to change progress.',
            inputSchema: z.object({
              watchUnitIds: z.array(z.string().min(1)).min(1).max(100),
              watched: z.boolean(),
            }),
            annotations: { destructiveHint: true },
            _meta: oauthMeta,
          },
          async ({ watchUnitIds, watched }) => {
            const ids = [...new Set(watchUnitIds)]
            const catalogIds = new Set((await loadCatalog(supabase)).map(({ id }) => id))
            const unknownIds = ids.filter((id) => !catalogIds.has(id))
            if (unknownIds.length) throw new Error(`Unknown watch-unit IDs: ${unknownIds.join(', ')}`)

            const { data: auth, error: authError } = await supabase.auth.getUser()
            if (authError || !auth.user) throw new Error('Authentication is required to update progress.')

            if (watched) {
              const timestamp = new Date().toISOString()
              const { error } = await supabase.from('watch_progress').upsert(
                ids.map((watchUnitId) => ({ user_id: auth.user.id, watch_unit_id: watchUnitId, status: 'watched', watched_at: timestamp })),
                { onConflict: 'user_id,watch_unit_id' },
              )
              if (error) throw new Error(`Unable to save progress: ${error.message}`)
            } else {
              const { error } = await supabase.from('watch_progress').delete().in('watch_unit_id', ids)
              if (error) throw new Error(`Unable to remove progress: ${error.message}`)
            }

            return result({ updated: ids, watched })
          },
        )

        return server
      })

      return handler.fetch(request)
    },
  ),
)
