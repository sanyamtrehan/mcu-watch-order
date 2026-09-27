# Next.js And Supabase Migration Plan

## Decision

Replace the Angular and Nest applications with a Next.js application deployed
to Vercel. Supabase will provide Postgres, Auth, and database authorization.

Supabase Auth is the only authentication system. Initial accounts are created
by an administrator in the Supabase dashboard; the first Next.js release has
sign-in and sign-out only. Public self-sign-up can be added later without
changing the database authorization model.

The final runtime architecture is:

```text
Next.js on Vercel -> Supabase Auth -> Supabase Postgres with RLS
```

There will be no long-running Nest API. The browser will use the Supabase
publishable key, never a database password or service-role key.

## Current State

- Supabase already contains the normalized catalog schema and imported seed.
- The catalog currently has 61 titles, 489 watch units, 489 release-order
  entries, and 19 direct sequel relationships.
- The custom `users` and `watch_progress` tables are empty.
- Supabase Auth and Row Level Security now own cloud identity and progress.
- The normalized catalog seed and maintenance scripts are root-owned; the old
  Angular and Nest applications have been retired.

## Phase 0: Audit And Baseline

1. Export the current Supabase schema into versioned Supabase SQL migrations.
2. Confirm the custom `users` and `watch_progress` tables are still empty.
3. Record current catalog row counts and verify the seed importer can recreate
   them in a clean database.
4. Add root-level `.env*` ignore rules and checked-in `.env.example` files.

Approval gate: no user progress exists that would need a custom JWT-to-Supabase
Auth migration.

## Phase 1: Move Database Ownership To Supabase

1. Add `supabase/migrations/` as the source of truth for schema changes.
2. Preserve the existing catalog tables and their stable IDs.
3. Replace the custom `users` dependency with Supabase `auth.users`.
4. Add a public `profiles` table only if the application needs user display
   data beyond Auth metadata.
5. Recreate `watch_progress.user_id` as a foreign key to `auth.users(id)`.
6. Enable Row Level Security on all exposed tables and explicitly revoke
   unneeded grants.

Policies:

| Table group | Anonymous | Authenticated user | Server-only |
| --- | --- | --- | --- |
| Catalog, seasons, episodes, watch units, orderings, relations | Read only | Read only | Seed and maintenance |
| Watch progress | No access | Read/write only rows where `user_id = auth.uid()` | Maintenance only |
| Profiles | No access | Read/write own profile | Maintenance only |

The app will use `auth.uid()` in RLS policies. The service-role key is only
permitted in a local/admin import script or protected CI environment.

Approval gate: apply the forward-only migration to Supabase only after its SQL
and RLS policies have been reviewed.

## Phase 2: Catalog Queries And Database Functions

1. Add read-only views or RPC functions for the dashboard:
   - overall progress
   - progress by movie, series, and season
   - next unwatched item in a selected ordering
   - title detail with direct relations
2. Keep release order derived from `ordering_entries`.
3. Leave chronological ordering pending until an editorial source-review pass
   provides explicit positions for every watch unit.
4. Keep direct sequel, spin-off, and crossover data in `title_relations`; do
   not use it to infer watch order.

Approval gate: query contracts return only the current user's progress and
produce correct totals from an empty, partial, and fully watched history.

## Phase 3: Build The Next.js Application

1. Create a root `web/` Next.js App Router project with TypeScript.
2. Add `@supabase/supabase-js` and `@supabase/ssr`.
3. Configure browser and server Supabase clients with cookie-based sessions.
4. Implement Supabase email/password sign-in, sign-out, and protected
   dashboard routes. User creation remains an administrator action in the
   Supabase dashboard for this release.
5. Add public self-sign-up only as a later, explicitly reviewed feature.
6. Implement the tracker workflow before visual polish:
   - select release or chronological order
   - mark a movie or episode watched/unwatched
   - see the next item
   - filter by movies, series, title, and season
   - inspect total and scoped progress
6. Use server-rendered reads where they help the initial dashboard load;
   authenticated routes remain dynamic and are never statically cached.

Environment variables for `web/.env.local` and Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

These values are safe to expose to the browser only because RLS is enabled.
No database URL, JWT secret, or service-role key belongs in the Next.js client.

## Phase 4: Testing And Deployment

1. Test RLS with two distinct Supabase users; neither can read or modify the
   other user's progress.
2. Test all dashboard aggregates and next-item behavior.
3. Add seed validation and database migration checks to CI.
4. Deploy `web/` to Vercel and configure the two public Supabase variables.
5. Verify production sign-in, session refresh, dashboard reads, and progress
   writes.

The Supabase project remains the database host. Vercel deploys only Next.js.

## Phase 5: Retire Legacy Code

The old Angular and Nest runtime code has been retired. The catalog seed and
maintenance scripts were retained at the repository root:

1. `data/mcu-release-catalog.json` is the normalized seed snapshot.
2. `scripts/validate-catalog-seed.js` and `scripts/import-catalog-seed.js`
   replace the Nest/TypeORM maintenance path.
3. [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) records the Vercel and
   two-user RLS checks that require the deployment operator's accounts.

## Risks And Safeguards

- Do not expose a Supabase service-role key in the browser or Vercel public
  environment variables.
- Do not drop the legacy custom-auth tables until the empty-data audit passes.
- Do not use automatic catalog refreshes to rewrite existing ordering or
  progress identifiers.
- Do not add chronological positions based solely on release dates.
- Commit each phase independently so the repository remains deployable and
  reviewable throughout the migration.
