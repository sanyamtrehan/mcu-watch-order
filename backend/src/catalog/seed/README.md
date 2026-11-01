# MCU Release Catalog Seed

[`data/mcu-release-catalog.json`](../../../../data/mcu-release-catalog.json) is
the repository's canonical normalized catalog. It contains 680 release-order
entries across 113 titles:

- 71 movies
- 12 specials and one-shots
- 30 series with 597 episodes

Each title, season, episode, and watchable item has a stable ID. Movies and
specials have one watch unit; every TV episode has one watch unit. This lets
future progress rows and ordering entries remain stable when display names or
metadata are corrected.

`titleRelations` contains curated sequel, spin-off, and crossover edges. A
sequel edge points from the sequel to its immediate predecessor. Relationships
describe franchise connections and never imply watch order.

Run `npm run catalog:validate` from `backend/` before importing a seed change.
Run `npm run catalog:import` after migrations to upsert the validated seed into
Postgres and rebuild the derived release order.

Release dates are manually cross-checked against Wikipedia and the Marvel
Cinematic Universe Wiki/Fandom. Alongside the MCU through Phase Five, the
catalog includes the live-action Raimi Spider-Man, Amazing Spider-Man, Sony
Spider-Man Universe—including the live-action Spider-Noir series and released
animated Spider-Verse films and shorts—Fox X-Men, Fantastic Four, Blade, and
Daredevil/Elektra realities connected through the MCU multiverse. It also
includes The Fantastic Four: First Steps from MCU Phase Six and keeps the Marvel
Television and Netflix-era series already present in the original catalog.

Chronological ordering remains pending editorial review and is intentionally
not inferred from release dates.
