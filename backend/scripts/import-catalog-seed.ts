import * as fs from 'fs';
import * as path from 'path';
import { QueryRunner } from 'typeorm';
import dataSource from '../src/database/data-source';

type WatchUnitKind = 'movie' | 'special' | 'episode';

interface Episode {
  id: string;
  number: string;
  releaseDate: string;
  watchUnitId: string;
  runtimeMinutes: number;
}

interface Season {
  id: string;
  number: number;
  episodes: Episode[];
}

interface MovieOrSpecial {
  id: string;
  title: string;
  releaseDate: string;
  watchUnitId: string;
  runtimeMinutes: number;
}

interface Series {
  id: string;
  title: string;
  seasons: Season[];
}

interface CatalogSeed {
  movies: MovieOrSpecial[];
  specials: MovieOrSpecial[];
  series: Series[];
  titleRelations: { fromTitleId: string; toTitleId: string; type: string }[];
  orderingDefinitions: { id: string; label: string; status: string; description: string }[];
}

const seedPath = path.join(
  __dirname,
  '../../data/mcu-release-catalog.json',
);
const catalog: CatalogSeed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

async function bulkUpsert(
  queryRunner: QueryRunner,
  table: string,
  columns: string[],
  rows: unknown[][],
  conflictColumns: string[],
  updateColumns: string[],
  extraUpdates: string[] = [],
) {
  if (!rows.length) return;

  const parameters: unknown[] = [];
  const values = rows
    .map((row) => {
      const placeholders = row.map((value) => {
        parameters.push(value);
        return `$${parameters.length}`;
      });
      return `(${placeholders.join(', ')})`;
    })
    .join(', ');
  const quotedColumns = columns.map((column) => `"${column}"`).join(', ');
  const updates = [
    ...updateColumns.map((column) => `"${column}" = EXCLUDED."${column}"`),
    ...extraUpdates,
  ].join(', ');

  await queryRunner.query(
    `INSERT INTO ${table} (${quotedColumns}) VALUES ${values}
     ON CONFLICT (${conflictColumns.map((column) => `"${column}"`).join(', ')})
     DO UPDATE SET ${updates}`,
    parameters,
  );
}

async function importCatalog() {
  await dataSource.initialize();
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const titleRows: unknown[][] = [
      ...catalog.movies.map((movie) => [movie.id, movie.title, 'movie', movie.releaseDate]),
      ...catalog.specials.map((special) => [special.id, special.title, 'special', special.releaseDate]),
      ...catalog.series.map((series) => [
        series.id,
        series.title,
        'series',
        series.seasons.flatMap((season) => season.episodes).map((episode) => episode.releaseDate).sort()[0],
      ]),
    ];
    const seasonRows = catalog.series.flatMap((series) =>
      series.seasons.map((season) => [season.id, series.id, season.number]),
    );
    const episodeRows = catalog.series.flatMap((series) =>
      series.seasons.flatMap((season) =>
        season.episodes.map((episode) => [episode.id, season.id, episode.number, episode.releaseDate]),
      ),
    );
    const watchUnitRows: unknown[][] = [
      ...catalog.movies.map((movie) => [movie.watchUnitId, movie.id, 'movie', movie.releaseDate, null, movie.runtimeMinutes]),
      ...catalog.specials.map((special) => [special.watchUnitId, special.id, 'special', special.releaseDate, null, special.runtimeMinutes]),
      ...catalog.series.flatMap((series) =>
        series.seasons.flatMap((season) =>
          season.episodes.map((episode) => [
            episode.watchUnitId,
            series.id,
            'episode' as WatchUnitKind,
            episode.releaseDate,
            episode.id,
            episode.runtimeMinutes,
          ]),
        ),
      ),
    ];

    await bulkUpsert(queryRunner, 'catalog_titles', ['id', 'title', 'kind', 'release_date'], titleRows, ['id'], ['title', 'kind', 'release_date'], ['"updated_at" = now()']);
    await bulkUpsert(queryRunner, 'catalog_seasons', ['id', 'title_id', 'season_number'], seasonRows, ['id'], ['title_id', 'season_number']);
    await bulkUpsert(queryRunner, 'catalog_episodes', ['id', 'season_id', 'episode_number', 'release_date'], episodeRows, ['id'], ['season_id', 'episode_number', 'release_date']);
    await bulkUpsert(queryRunner, 'watch_units', ['id', 'title_id', 'kind', 'release_date', 'episode_id', 'runtime_minutes'], watchUnitRows, ['id'], ['title_id', 'kind', 'release_date', 'episode_id', 'runtime_minutes']);
    await bulkUpsert(
      queryRunner,
      'catalog_orderings',
      ['id', 'label', 'status', 'description'],
      catalog.orderingDefinitions.map((ordering) => [ordering.id, ordering.label, ordering.status, ordering.description]),
      ['id'],
      ['label', 'status', 'description'],
    );

    await queryRunner.query('DELETE FROM title_relations');
    await bulkUpsert(
      queryRunner,
      'title_relations',
      ['from_title_id', 'to_title_id', 'type'],
      catalog.titleRelations.map((relation) => [relation.fromTitleId, relation.toTitleId, relation.type]),
      ['from_title_id', 'to_title_id', 'type'],
      ['type'],
    );

    const releaseUnits = await queryRunner.query(
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
    await queryRunner.query(`DELETE FROM ordering_entries WHERE ordering_id = 'release'`);
    await bulkUpsert(
      queryRunner,
      'ordering_entries',
      ['ordering_id', 'watch_unit_id', 'position'],
      releaseUnits.map((unit, index) => ['release', unit.id, index + 1]),
      ['ordering_id', 'watch_unit_id'],
      ['position'],
    );

    await queryRunner.commitTransaction();
    console.log(
      `Catalog imported: ${catalog.movies.length + catalog.specials.length + catalog.series.length} titles, ${releaseUnits.length} release-order watch units, ${catalog.titleRelations.length} relations.`,
    );
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

importCatalog().catch((error) => {
  console.error(error);
  process.exit(1);
});
