import assert from "node:assert/strict";
import test from "node:test";
import { groupAdjacentEpisodeRuns } from "./episode-runs.ts";

const episode = (id, titleId, seasonId) => ({ id, titleId, seasonId, unitKind: "episode" });
const movie = (id) => ({ id, titleId: id, seasonId: null, unitKind: "movie" });

test("groups only adjacent episodes from the same series and season", () => {
  const runs = groupAdjacentEpisodeRuns([
    episode("a1", "agents-of-shield", "season-3"),
    episode("a2", "agents-of-shield", "season-3"),
    movie("civil-war"),
    episode("a3", "agents-of-shield", "season-3"),
    episode("a4", "agents-of-shield", "season-4"),
    episode("d1", "daredevil", "season-2"),
    episode("unknown-1", "unknown", null),
    episode("unknown-2", "unknown", null),
  ]);

  assert.deepEqual(runs.map((run) => run.units.map((unit) => unit.id)), [
    ["a1", "a2"],
    ["civil-war"],
    ["a3"],
    ["a4"],
    ["d1"],
    ["unknown-1"],
    ["unknown-2"],
  ]);
});

test("rejoins episodes made adjacent by filtering", () => {
  const units = [
    episode("a1", "show-a", "season-1"),
    episode("a2", "show-a", "season-1"),
    episode("b1", "show-b", "season-1"),
    episode("b2", "show-b", "season-1"),
    episode("a3", "show-a", "season-1"),
  ];

  const runs = groupAdjacentEpisodeRuns(units.filter((unit) => unit.titleId !== "show-b"));

  assert.deepEqual(runs.map((run) => run.units.map((unit) => unit.id)), [["a1", "a2", "a3"]]);
});
