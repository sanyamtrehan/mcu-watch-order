import assert from "node:assert/strict";
import test from "node:test";
import { safeRedirectPath } from "./safe-redirect.ts";

test("keeps a local OAuth continuation", () => {
  assert.equal(safeRedirectPath("/oauth/consent?authorization_id=abc"), "/oauth/consent?authorization_id=abc");
});

test("rejects external and protocol-relative redirects", () => {
  assert.equal(safeRedirectPath("https://example.com"), "/dashboard");
  assert.equal(safeRedirectPath("//example.com"), "/dashboard");
  assert.equal(safeRedirectPath("/\\example.com"), "/dashboard");
});
