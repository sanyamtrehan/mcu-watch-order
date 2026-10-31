import assert from "node:assert/strict";
import test from "node:test";
import { validatePasswordReset } from "./password-reset.ts";

test("requires the minimum password length", () => {
  assert.equal(validatePasswordReset("short", "short"), "Password must be at least 6 characters.");
});

test("requires matching passwords", () => {
  assert.equal(validatePasswordReset("new-password", "different-password"), "Passwords do not match.");
});

test("accepts a valid confirmed password", () => {
  assert.equal(validatePasswordReset("new-password", "new-password"), null);
});
