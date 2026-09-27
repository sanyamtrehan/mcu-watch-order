# Catalog And Progress Model

## Goal

Support several valid watch orders while preserving enough hierarchy to answer:

- What should I watch next in release or chronological order?
- How much of the whole catalog have I completed?
- How much of a movie, series, or season have I completed?
- What is the relationship between connected movies?

Dates alone are not sufficient for chronological order. Narrative chronology is curated editorial data.

## Canonical Catalog

The normalized catalog should contain these records:

| Record | Purpose |
| --- | --- |
| `titles` | A movie, series, special, short, or one-shot. Stores title-level metadata and type. |
| `seasons` | A numbered season belonging to a series. |
| `episodes` | An episode belonging to one season, with an episode number and release date. |
| `watch_units` | The smallest thing that can be marked watched: a movie/special or one TV episode. |
| `title_relations` | Explicit links such as sequel, prequel, spin-off, and crossover between titles. |
| `orderings` | Named sequences, beginning with `release` and `chronological`. |
| `ordering_entries` | A curated ordinal for each watch unit in an ordering. |

Movies and specials have one watch unit directly under their title. Series contain seasons and episodes, and every episode has its own watch unit. This makes completion calculations consistent without pretending a full series is a single item.

## Progress

The canonical cloud table, `watch_progress`, references `auth.users(id)` and a
watch unit. It records watched/unwatched status and watched-at time. Supabase
Row Level Security ensures an authenticated user can only read or change their
own progress rows. Aggregates are calculated, not stored as competing counters:

- Overall progress: watched units divided by all units in the selected ordering.
- Title progress: watched units belonging to one title divided by that title's units.
- Season progress: watched episodes divided by that season's episodes.
- Next item: the first unwatched ordering entry in the selected ordering.

## Anonymous-First Tracking

The tracker should work before someone creates or signs into an account. The
dashboard is therefore a public catalog experience, not an auth gate.

For an anonymous visitor, progress is stored in versioned browser
`localStorage`, keyed by stable `watch_unit` IDs. The local record should hold
only what is needed to reconstruct progress, for example:

```ts
type LocalProgress = {
  version: 1;
  watchedUnitIds: string[];
  updatedAt: string;
};
```

The dashboard derives the same totals from local IDs that it does from cloud
progress: overall completion, movie completion, episode completion, title and
season completion, and the next item in the chosen ordering. It must tolerate
catalog changes by ignoring IDs that no longer exist in the current catalog.

Authentication is an optional sync feature:

1. Visitors can browse, mark units watched, and undo marks without an account.
2. Signing in reads that user's Supabase progress.
3. If anonymous progress exists, the app presents a deliberate merge step and
   uploads the union of watched unit IDs to that user's `watch_progress` rows.
4. After a successful merge, Supabase becomes the source of truth for that
   browser session. Local data is retained only until the merge is confirmed.

The first account workflow is administrator-created Supabase Auth users with
email/password sign-in. Public sign-up can be added later without changing the
progress schema or RLS rules.

This anonymous-local tracker and merge flow are documented design decisions;
they are not implemented in the current Next.js UI yet.

## Dashboard Contract

The initial dashboard should prioritize tracking over catalog polish:

- A selectable ordering, beginning with release order. Chronological order is
  unavailable until it has curated positions for every watch unit.
- Overall watched/total progress and percentage for the selected ordering.
- Scoped totals for movies, episodes, completed titles, series, and seasons.
- The next unwatched watch unit, plus a practical continuation queue.
- Mark watched and undo controls for movies, specials, and individual episodes.
- Filters by media kind, series, title, and season once the visual system is
  defined.

Sequel, spin-off, and crossover links enrich title detail; they never silently
change the selected watch order.

## Ordering Rules

- Release order is based on release dates, with a manually maintained tie-breaker for same-day releases.
- Chronological order is manually curated with an explicit ordinal. It is never inferred from release date.
- Ordering entries point to watch units, so an episode can appear at the correct point between films.
- Sequel data is a relationship graph, not an ordering. A film can have a sequel and appear in several valid viewing orders.
- A direct `sequel` edge points from a sequel to its immediate predecessor. `spin-off` and `crossover` edges are separate relationship types and must be curated rather than inferred.

## Data Pipeline

1. Import source data into a staging format.
2. Normalize and validate titles, seasons, episodes, and dates.
3. Review exceptions and manually assign chronological placements and title relationships.
4. Upsert the resulting catalog through an admin-only import script or migration seed.
5. Preserve stable IDs and source references so catalog refreshes do not erase user progress.

The repository's current flat data is useful as a starting source, but it is not the production catalog model.

## Delivery Order

1. Complete the Postgres foundation, normalized schema, and seed/import pipeline. Done.
2. Move cloud identities and progress access to Supabase Auth and RLS. Done.
3. Build the anonymous local-progress store and explicit account-merge flow.
4. Build the dashboard UI, filters, order switcher, and title detail around the
   agreed design system.
5. Retire the legacy Angular/Nest applications after the new experience has
   production parity.
