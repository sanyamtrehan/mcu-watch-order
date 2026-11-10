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
