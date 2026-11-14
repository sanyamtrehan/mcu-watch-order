import assert from "node:assert/strict";
import test from "node:test";
import { parseLocalWatchHistory } from "./watch-history.ts";

test("keeps valid local history newest first", () => {
  const history = parseLocalWatchHistory(JSON.stringify([
    { id: "old", watchUnitId: "a", action: "watched", occurredAt: "2026-01-01T00:00:00.000Z" },
    { id: "new", watchUnitId: "a", action: "unwatched", occurredAt: "2026-02-01T00:00:00.000Z" },
    { id: "missing", watchUnitId: "b", action: "watched", occurredAt: "2026-03-01T00:00:00.000Z" },
  ]), new Set(["a"]));

  assert.deepEqual(history.map((entry) => entry.id), ["new", "old"]);
});

test("rejects malformed local history", () => {
  assert.deepEqual(parseLocalWatchHistory("broken", new Set()), []);
  assert.deepEqual(parseLocalWatchHistory('{"entries":[]}', new Set()), []);
});
