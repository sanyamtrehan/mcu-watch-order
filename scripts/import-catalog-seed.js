require("dotenv").config();

const fs = require("node:fs");
const path = require("node:path");
const { Client } = require("pg");

const catalog = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../data/mcu-release-catalog.json"), "utf8"),
);

async function bulkUpsert(client, table, columns, rows, conflictColumns, updateColumns, extraUpdates = []) {
  if (rows.length === 0) return;

  const parameters = [];
  const values = rows.map((row) => `(${row.map((value) => {
    parameters.push(value);
    return `$${parameters.length}`;
  }).join(", ")})`).join(", ");
  const quotedColumns = columns.map((column) => `"${column}"`).join(", ");
  const updates = [...updateColumns.map((column) => `"${column}" = EXCLUDED."${column}"`), ...extraUpdates].join(", ");

  await client.query(
    `INSERT INTO ${table} (${quotedColumns}) VALUES ${values}
     ON CONFLICT (${conflictColumns.map((column) => `"${column}"`).join(", ")})
     DO UPDATE SET ${updates}`,
    parameters,
  );
}

async function importCatalog() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required to import the catalog.");

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    await client.query("BEGIN");

    const titleRows = [
      ...catalog.movies.map((item) => [item.id, item.title, "movie", item.releaseDate]),
      ...catalog.specials.map((item) => [item.id, item.title, "special", item.releaseDate]),
      ...catalog.series.map((item) => [item.id, item.title, "series", item.seasons.flatMap((season) => season.episodes).map((episode) => episode.releaseDate).sort()[0]]),
    ];
    const seasonRows = catalog.series.flatMap((series) => series.seasons.map((season) => [season.id, series.id, season.number]));
    const episodeRows = catalog.series.flatMap((series) => series.seasons.flatMap((season) => season.episodes.map((episode) => [episode.id, season.id, episode.number, episode.releaseDate])));
    const watchUnitRows = [
      ...catalog.movies.map((item) => [item.watchUnitId, item.id, "movie", item.releaseDate, null]),
      ...catalog.specials.map((item) => [item.watchUnitId, item.id, "special", item.releaseDate, null]),
      ...catalog.series.flatMap((series) => series.seasons.flatMap((season) => season.episodes.map((episode) => [episode.watchUnitId, series.id, "episode", episode.releaseDate, episode.id]))),
    ];

    await bulkUpsert(client, "catalog_titles", ["id", "title", "kind", "release_date"], titleRows, ["id"], ["title", "kind", "release_date"], ["\"updated_at\" = now()"]);
    await bulkUpsert(client, "catalog_seasons", ["id", "title_id", "season_number"], seasonRows, ["id"], ["title_id", "season_number"]);
    await bulkUpsert(client, "catalog_episodes", ["id", "season_id", "episode_number", "release_date"], episodeRows, ["id"], ["season_id", "episode_number", "release_date"]);
    await bulkUpsert(client, "watch_units", ["id", "title_id", "kind", "release_date", "episode_id"], watchUnitRows, ["id"], ["title_id", "kind", "release_date", "episode_id"]);
    await bulkUpsert(client, "catalog_orderings", ["id", "label", "status", "description"], catalog.orderingDefinitions.map((item) => [item.id, item.label, item.status, item.description]), ["id"], ["label", "status", "description"]);

    await client.query("DELETE FROM title_relations");
    await bulkUpsert(client, "title_relations", ["from_title_id", "to_title_id", "type"], catalog.titleRelations.map((item) => [item.fromTitleId, item.toTitleId, item.type]), ["from_title_id", "to_title_id", "type"], ["type"]);

    const { rows: releaseUnits } = await client.query(
      `SELECT watch_units.id
       FROM watch_units
       LEFT JOIN catalog_episodes ON catalog_episodes.id = watch_units.episode_id
       LEFT JOIN catalog_seasons ON catalog_seasons.id = catalog_episodes.season_id
       ORDER BY watch_units.release_date ASC,
                watch_units.title_id ASC,
                catalog_seasons.season_number ASC NULLS FIRST,
                CASE
                  WHEN catalog_episodes.episode_number ~ '^[0-9]+$'
                    THEN catalog_episodes.episode_number::integer
                END ASC NULLS FIRST,
                watch_units.id ASC`,
    );
    await client.query("DELETE FROM ordering_entries WHERE ordering_id = 'release'");
    await bulkUpsert(client, "ordering_entries", ["ordering_id", "watch_unit_id", "position"], releaseUnits.map((unit, index) => ["release", unit.id, index + 1]), ["ordering_id", "watch_unit_id"], ["position"]);

    await client.query("COMMIT");
    console.log(`Catalog imported: ${titleRows.length} titles, ${releaseUnits.length} release-order watch units, ${catalog.titleRelations.length} relations.`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

importCatalog().catch((error) => {
  console.error(error);
  process.exit(1);
});
