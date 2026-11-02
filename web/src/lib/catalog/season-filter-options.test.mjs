import assert from "node:assert/strict";
import test from "node:test";
import { buildSeasonFilterOptions } from "./season-filter-options.ts";

test("sorts seasons and includes their episode counts", () => {
  assert.deepEqual(buildSeasonFilterOptions([
    { seasonId: "season-2", seasonNumber: 2 },
    { seasonId: "season-1", seasonNumber: 1 },
    { seasonId: "season-1", seasonNumber: 1 },
    { seasonId: null, seasonNumber: null },
  ]), [
    { value: "season-1", label: "Season 1 (2 episodes)" },
    { value: "season-2", label: "Season 2 (1 episode)" },
  ]);
});
