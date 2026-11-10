import assert from "node:assert/strict";
import test from "node:test";
import { parseProgressBackup, serializeProgressBackup } from "./local-progress.ts";

test("progress backups round-trip and discard catalog IDs that no longer exist", () => {
  const backup = serializeProgressBackup(["a", "b", "b"]);
  assert.deepEqual(parseProgressBackup(backup, new Set(["a"])), ["a"]);
});

test("progress backup import rejects unrelated JSON", () => {
  assert.throws(() => parseProgressBackup('{"watchedUnitIds":[]}', new Set()), /not a supported/);
  assert.throws(() => parseProgressBackup("broken", new Set()), /not a valid JSON/);
});
