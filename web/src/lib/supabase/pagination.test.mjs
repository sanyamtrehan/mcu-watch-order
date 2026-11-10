import assert from "node:assert/strict";
import test from "node:test";
import { collectPages } from "./pagination.ts";

test("collects every page, including an exact final page", async () => {
  const source = [1, 2, 3, 4];
  const calls = [];
  const rows = await collectPages(async (from, to) => {
    calls.push([from, to]);
    return { data: source.slice(from, to + 1), error: null };
  }, 2);

  assert.deepEqual(rows, source);
  assert.deepEqual(calls, [[0, 1], [2, 3], [4, 5]]);
});

test("stops and reports a page error", async () => {
  await assert.rejects(() => collectPages(async () => ({ data: null, error: { message: "offline" } })), /offline/);
});
