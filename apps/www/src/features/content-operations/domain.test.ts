import assert from "node:assert/strict";
import test from "node:test";
import { canTransitionContentWorkflow, normalizeHttpUrl } from "./domain";
import { parseContentWorkflowCreate, parseContentWorkflowUpdate } from "./server/input";

test("content workflow permits only adjacent or explicit recovery transitions", () => {
  assert.equal(canTransitionContentWorkflow("proposed", "approved"), true);
  assert.equal(canTransitionContentWorkflow("approved", "production_ready"), true);
  assert.equal(canTransitionContentWorkflow("production_ready", "completed"), false);
  assert.equal(canTransitionContentWorkflow("completed", "proposed"), false);
  assert.equal(canTransitionContentWorkflow("hold", "production_ready"), true);
});

test("proposal create input derives an idempotent Drive source key", () => {
  const parsed = parseContentWorkflowCreate({
    title: "새로운 진로 제안",
    contentAxis: "진로 실행",
    proposedPublishDate: "2026-09-28",
    proposedCta: "20분 무료 콜백",
    driveFolderUrl: "https://drive.google.com/drive/folders/abcDEF_123456789",
    adminNote: "검토 필요",
  });
  assert.equal(parsed.sourceKey, "drive:abcDEF_123456789:2026-09-28");
  assert.equal(parsed.driveFolderUrl, "https://drive.google.com/drive/folders/abcDEF_123456789");
});

test("workflow update rejects unknown gate values and unsafe URLs", () => {
  assert.throws(() => parseContentWorkflowUpdate({ status: "approved", duplicateGate: "yes", siteFirstStatus: "hold" }), /CONTENT_DUPLICATE_GATE_INVALID/);
  assert.throws(() => normalizeHttpUrl("javascript:alert(1)", "URL_INVALID"), /URL_INVALID/);
});
