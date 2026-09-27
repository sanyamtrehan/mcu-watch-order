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

`watch_progress` should reference a user and a watch unit. It records watched/unwatched status and watched-at time. Aggregates are calculated, not stored as competing counters:

- Overall progress: watched units divided by all units in the selected ordering.
- Title progress: watched units belonging to one title divided by that title's units.
- Season progress: watched episodes divided by that season's episodes.
- Next item: the first unwatched ordering entry after the user's most recently completed position.

The current migration creates the initial `watch_progress` table. A follow-up migration will make it reference the normalized `watch_units` table rather than the temporary catalog table.

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
4. Upsert the resulting catalog through an admin-only Nest endpoint or migration seed.
5. Preserve stable IDs and source references so catalog refreshes do not erase user progress.

The repository's current flat data is useful as a starting source, but it is not the production catalog model.

## Delivery Order

1. Complete the Postgres and JWT foundation. Done.
2. Add the normalized catalog schema and seed/import pipeline. Done.
3. Add authenticated progress and dashboard API endpoints.
4. Build the dashboard UI, filters, and order switcher.
