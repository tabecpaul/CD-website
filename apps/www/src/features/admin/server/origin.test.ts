import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's strip-types test runner requires the explicit source extension.
import { isTrustedAdminOrigin } from "./origin.ts";

test("accepts both Career Direct production origins", () => {
  assert.equal(isTrustedAdminOrigin("https://start.careerdirect.kr", []), true);
  assert.equal(isTrustedAdminOrigin("https://www.careerdirect.kr", []), true);
});

test("accepts an explicitly configured HTTPS origin", () => {
  assert.equal(isTrustedAdminOrigin("https://admin.example.com", ["https://admin.example.com/path"]), true);
});

test("rejects insecure, malformed, and lookalike origins", () => {
  assert.equal(isTrustedAdminOrigin("http://www.careerdirect.kr", []), false);
  assert.equal(isTrustedAdminOrigin("https://evil.www.careerdirect.kr", []), false);
  assert.equal(isTrustedAdminOrigin("https://www.careerdirect.kr.evil.example", []), false);
  assert.equal(isTrustedAdminOrigin("https://www.careerdirect.kr/path", []), false);
  assert.equal(isTrustedAdminOrigin(null, []), false);
});
