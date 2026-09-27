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
assertUnique(watchUnits.map(({ watchUnitId }) => watchUnitId), 'Watch-unit IDs');
assertUnique(episodes.map(({ id }) => id), 'Episode IDs');

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
