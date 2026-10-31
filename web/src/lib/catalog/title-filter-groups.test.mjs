import assert from "node:assert/strict";
import test from "node:test";
import { buildMovieTitleFilterGroups } from "./title-filter-groups.ts";

test("groups connected movie sequels under the original title", () => {
  const groups = buildMovieTitleFilterGroups([
    { id: "iron-man", title: "Iron Man", kind: "movie" },
    { id: "iron-man-2", title: "Iron Man 2", kind: "movie" },
    { id: "iron-man-3", title: "Iron Man 3", kind: "movie" },
    { id: "team-thor", title: "Team Thor", kind: "special" },
  ], [
    { fromTitleId: "iron-man-2", toTitleId: "iron-man", type: "sequel" },
    { fromTitleId: "iron-man-3", toTitleId: "iron-man-2", type: "sequel" },
    { fromTitleId: "team-thor", toTitleId: "iron-man", type: "sequel" },
  ]);

  assert.deepEqual(groups.get("iron-man"), { id: "collection-iron-man", title: "Iron Man" });
  assert.deepEqual(groups.get("iron-man-2"), groups.get("iron-man"));
  assert.deepEqual(groups.get("iron-man-3"), groups.get("iron-man"));
  assert.equal(groups.has("team-thor"), false);
});

test("uses a generic franchise label instead of the first movie subtitle", () => {
  const groups = buildMovieTitleFilterGroups([
    { id: "captain-america-1", title: "Captain America: The First Avenger", kind: "movie" },
    { id: "captain-america-2", title: "Captain America: The Winter Soldier", kind: "movie" },
    { id: "spider-man-1", title: "Spider-Man: Homecoming", kind: "movie" },
    { id: "spider-man-2", title: "Spider-Man: Far From Home", kind: "movie" },
    { id: "avengers-1", title: "Marvel's The Avengers", kind: "movie" },
    { id: "avengers-2", title: "Avengers: Age of Ultron", kind: "movie" },
  ], [
    { fromTitleId: "captain-america-2", toTitleId: "captain-america-1", type: "sequel" },
    { fromTitleId: "spider-man-2", toTitleId: "spider-man-1", type: "sequel" },
    { fromTitleId: "avengers-2", toTitleId: "avengers-1", type: "sequel" },
  ]);

  assert.equal(groups.get("captain-america-1").title, "Captain America");
  assert.equal(groups.get("spider-man-1").title, "Spider-Man");
  assert.equal(groups.get("avengers-1").title, "Avengers");
});
