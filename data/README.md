# MCU Release Catalog Seed

`mcu-release-catalog.json` is the normalized catalog snapshot used by the
Next.js/Supabase application. It contains 489 release-order entries:

- 33 movies
- 8 specials and one-shots
- 20 series with 448 episodes

Each title, season, episode, and watchable item has a stable ID. Movies and
specials have one watch unit; every TV episode has one watch unit. This lets
future progress rows and ordering entries remain stable when display names or
metadata are corrected.

`titleRelations` contains curated, direct movie-sequel edges. An edge points
from the sequel to its immediate predecessor. It deliberately does not imply
watch order and does not yet include inferred crossovers or spin-offs.

Run `npm run catalog:validate` from the repository root before importing a seed
change.
Run `npm run catalog:import` after migrations to upsert the validated seed into
Supabase Postgres and rebuild the derived release order. The import script reads
`DATABASE_URL` from the environment or root `.env`; it is an admin-only tool and
must never run in the browser or a Vercel runtime.

The source was manually gathered from Wikipedia before this repository was
converted to a Supabase-backed catalog. The snapshot includes the Marvel
Television and Netflix-era series already present in that source.

This is a baseline, not the final catalog. It ends in 2023 and still needs a
review pass for corrected titles, source URLs and revisions, additional
releases, title relationships, and curated chronological ordering.
