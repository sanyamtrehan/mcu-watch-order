type CatalogTitle = { id: string; title: string; kind: string };
type CatalogRelationship = { fromTitleId: string; toTitleId: string; type: string };
export type TitleFilterGroup = { id: string; title: string };

function genericCollectionTitle(title: string) {
  return title.split(":", 1)[0].replace(/^Marvel(?: Studios)?['’]s The /i, "").trim();
}

export function buildMovieTitleFilterGroups(titles: CatalogTitle[], relationships: CatalogRelationship[]) {
  const movieTitles = new Map(titles.filter((title) => title.kind === "movie").map((title) => [title.id, title.title]));
  const derivedTitleIds = new Set<string>();
  const connections = new Map<string, Set<string>>();

  for (const relationship of relationships) {
    if (!movieTitles.has(relationship.fromTitleId) || !movieTitles.has(relationship.toTitleId)) continue;
    if (relationship.type === "sequel" || relationship.type === "spin-off") derivedTitleIds.add(relationship.fromTitleId);
    for (const [titleId, relatedId] of [[relationship.fromTitleId, relationship.toTitleId], [relationship.toTitleId, relationship.fromTitleId]]) {
      const related = connections.get(titleId) ?? new Set<string>();
      related.add(relatedId);
      connections.set(titleId, related);
    }
  }

  const groups = new Map<string, TitleFilterGroup>();
  const visited = new Set<string>();
  for (const titleId of connections.keys()) {
    if (visited.has(titleId)) continue;
    const component: string[] = [];
    const pending = [titleId];
    visited.add(titleId);
    while (pending.length > 0) {
      const current = pending.pop()!;
      component.push(current);
      for (const relatedId of connections.get(current) ?? []) {
        if (visited.has(relatedId)) continue;
        visited.add(relatedId);
        pending.push(relatedId);
      }
    }

    const roots = component.filter((id) => !derivedTitleIds.has(id));
    const rootId = (roots.length > 0 ? roots : component).sort((left, right) => {
      const leftTitle = genericCollectionTitle(movieTitles.get(left)!);
      const rightTitle = genericCollectionTitle(movieTitles.get(right)!);
      return leftTitle.length - rightTitle.length
        || movieTitles.get(left)!.length - movieTitles.get(right)!.length
        || left.localeCompare(right);
    })[0];
    const group = { id: `collection-${rootId}`, title: genericCollectionTitle(movieTitles.get(rootId)!) };
    for (const id of component) groups.set(id, group);
  }

  return groups;
}
