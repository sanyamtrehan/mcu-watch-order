const catalog = require('../data/mcu-release-catalog.json');

const relationTypes = new Set(['sequel', 'spin-off', 'crossover']);
const titles = [
  ...catalog.movies,
  ...catalog.specials,
  ...catalog.series,
];
const episodes = catalog.series.flatMap((series) =>
  series.seasons.flatMap((season) => season.episodes),
);
const seasons = catalog.series.flatMap((series) => series.seasons);
const watchUnits = [...catalog.movies, ...catalog.specials, ...episodes];

function assertUnique(values, label) {
  const uniqueValues = new Set(values);
  if (uniqueValues.size !== values.length) {
    throw new Error(`${label} must be unique`);
  }
}

function validateSequelGraph(relations) {
  const predecessorsByTitle = new Map();
  for (const relation of relations.filter(({ type }) => type === 'sequel')) {
    predecessorsByTitle.set(relation.fromTitleId, relation.toTitleId);
  }

  for (const titleId of predecessorsByTitle.keys()) {
    const visited = new Set();
    let currentTitleId = titleId;
    while (predecessorsByTitle.has(currentTitleId)) {
      if (visited.has(currentTitleId)) {
        throw new Error(`Sequel cycle detected for ${titleId}`);
      }
      visited.add(currentTitleId);
      currentTitleId = predecessorsByTitle.get(currentTitleId);
    }
  }
}

assertUnique(titles.map(({ id }) => id), 'Title IDs');
assertUnique(seasons.map(({ id }) => id), 'Season IDs');
assertUnique(watchUnits.map(({ watchUnitId }) => watchUnitId), 'Watch-unit IDs');
assertUnique(episodes.map(({ id }) => id), 'Episode IDs');

for (const item of watchUnits) {
  if (!Number.isInteger(item.runtimeMinutes) || item.runtimeMinutes <= 0) {
    throw new Error(`Invalid runtime for ${item.id}: ${item.runtimeMinutes}`);
  }
  const parsedDate = new Date(`${item.releaseDate}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(item.releaseDate)
    || Number.isNaN(parsedDate.valueOf())
    || parsedDate.toISOString().slice(0, 10) !== item.releaseDate
  ) {
    throw new Error(`Invalid release date for ${item.id}: ${item.releaseDate}`);
  }
}

for (const series of catalog.series) {
  assertUnique(series.seasons.map(({ number }) => number), `${series.id} season numbers`);
  for (const season of series.seasons) {
    assertUnique(
      season.episodes.map(({ number }) => number),
      `${season.id} episode numbers`,
    );
  }
}

const titleIds = new Set(titles.map(({ id }) => id));
const relationKeys = catalog.titleRelations.map(
  ({ fromTitleId, toTitleId, type }) => `${fromTitleId}:${toTitleId}:${type}`,
);
assertUnique(relationKeys, 'Title relations');

for (const relation of catalog.titleRelations) {
  if (!relationTypes.has(relation.type)) {
    throw new Error(`Unsupported relation type: ${relation.type}`);
  }
  if (!titleIds.has(relation.fromTitleId) || !titleIds.has(relation.toTitleId)) {
    throw new Error('Title relation references an unknown title');
  }
  if (relation.fromTitleId === relation.toTitleId) {
    throw new Error('A title cannot relate to itself');
  }
}

validateSequelGraph(catalog.titleRelations);

console.log(
  `Catalog seed is valid: ${titles.length} titles, ${watchUnits.length} watch units, ${catalog.titleRelations.length} title relations.`,
);
