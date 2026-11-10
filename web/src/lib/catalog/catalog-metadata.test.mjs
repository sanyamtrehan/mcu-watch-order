import assert from "node:assert/strict";
import test from "node:test";
import { catalogMetadata } from "./catalog-metadata.ts";

test("assigns representative titles to their archive collection and source", () => {
  assert.equal(catalogMetadata("movie-iron-man").collectionId, "mcu");
  assert.equal(catalogMetadata("series-agents-of-shield").collectionId, "marvel-tv");
  assert.equal(catalogMetadata("series-daredevil").collectionId, "defenders");
  assert.equal(catalogMetadata("movie-spider-man-2002").collectionId, "spider");
  assert.equal(catalogMetadata("movie-x-men").collectionId, "x-men");
  assert.equal(catalogMetadata("special-the-spider-within-a-spider-verse-story").collectionId, "animation");
  assert.match(catalogMetadata("movie-blade").source.url, /^https:\/\//);
});

test("keeps series formats visibly distinct without changing their universe", () => {
  assert.deepEqual(pickIdentifier("series-mutant-x"), ["MX-TV", "Mutant X series"]);
  assert.deepEqual(pickIdentifier("series-legion"), ["LGN-TV", "Legion series"]);
  assert.deepEqual(pickIdentifier("series-whih-newsfront"), ["WEB", "Web series"]);
  assert.deepEqual(pickIdentifier("series-agents-of-shield"), ["TV", "Live-action TV series"]);
  assert.deepEqual(pickIdentifier("series-hit-monkey"), ["ANM", "Animated series"]);
});

function pickIdentifier(titleId) {
  const { mediaCode, mediaLabel } = catalogMetadata(titleId);
  return [mediaCode, mediaLabel];
}
