import assert from "node:assert/strict";
import test from "node:test";
import { catalogArtworkForTitle } from "./catalog-artwork.ts";

test("maps franchise sequels to shared catalog artwork", () => {
  assert.equal(catalogArtworkForTitle("Iron Man 3"), "iron-man");
  assert.equal(catalogArtworkForTitle("Captain America: Civil War"), "captain-america");
  assert.equal(catalogArtworkForTitle("Marvel's The Avengers"), "avengers");
  assert.equal(catalogArtworkForTitle("Avengers: Endgame"), "avengers");
  assert.equal(catalogArtworkForTitle("Thor"), null);
});
