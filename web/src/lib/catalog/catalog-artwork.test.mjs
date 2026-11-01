import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { catalogArtworkForTitle } from "./catalog-artwork.ts";

test("maps franchise sequels to shared catalog artwork", () => {
  assert.equal(catalogArtworkForTitle("Iron Man 3"), "iron-man");
  assert.equal(catalogArtworkForTitle("Captain America: Civil War"), "captain-america");
  assert.equal(catalogArtworkForTitle("Marvel's The Avengers"), "avengers");
  assert.equal(catalogArtworkForTitle("Avengers: Endgame"), "avengers");
  assert.equal(catalogArtworkForTitle("Thor"), "thor");
});

test("covers every title in the release catalog", () => {
  const catalog = JSON.parse(readFileSync(new URL("../../../../data/mcu-release-catalog.json", import.meta.url)));
  const titles = [...catalog.movies, ...catalog.specials, ...catalog.series].map((entry) => entry.title);
  assert.deepEqual(titles.filter((title) => !catalogArtworkForTitle(title)), []);
});
