const test = require("node:test");
const assert = require("node:assert/strict");
const { AppError } = require("../utils/errors");
const { createReport, MAX_REPORTS_PER_DAY } = require("./reports.service");

function expectAppError(promise, status, code) {
  return assert.rejects(promise, (error) => {
    assert.ok(error instanceof AppError, `expected AppError, got ${error}`);
    assert.equal(error.status, status);
    assert.equal(error.code, code);
    return true;
  });
}

function fakeDb({ user = { id: "u2" }, project = { id: "p1", clientId: "c1" }, duplicate = null, recent = 0, created = [] } = {}) {
  return {
    user: { findUnique: async () => user },
    project: { findUnique: async () => project },
    report: {
      findFirst: async () => duplicate,
      count: async () => recent,
      create: async (args) => { created.push(args); return { id: "r1", status: "OPEN", ...args.data }; },
    },
  };
}

const valid = { targetType: "USER", targetId: "u2", reason: "Spam", details: "  Trimite reclame  " };

test("createReport validates the input before touching the database", async () => {
  let touched = false;
  const db = {
    user: { findUnique: async () => { touched = true; return null; } },
    project: { findUnique: async () => { touched = true; return null; } },
    report: { findFirst: async () => { touched = true; }, count: async () => { touched = true; }, create: async () => { touched = true; } },
  };
  const bad = [
    null,
    [],
    {},
    { ...valid, targetType: "MESSAGE" },
    { ...valid, targetId: "" },
    { ...valid, targetId: 5 },
    { ...valid, reason: "ab" },
    { ...valid, reason: "x".repeat(121) },
    { ...valid, details: "x".repeat(1001) },
    { ...valid, details: 5 },
    { ...valid, status: "RESOLVED" },
    { ...valid, reporterId: "other" },
  ];
  for (const input of bad) {
    await expectAppError(createReport("u1", input, db), 400, "VALIDATION_ERROR");
  }
  assert.equal(touched, false);
});

test("createReport stores a trimmed report for an existing user", async () => {
  const created = [];
  const report = await createReport("u1", valid, fakeDb({ created }));
  assert.equal(created[0].data.reporterId, "u1");
  assert.equal(created[0].data.targetType, "USER");
  assert.equal(created[0].data.details, "Trimite reclame");
  assert.equal(report.status, "OPEN");
});

test("createReport leaves details null when they are missing or empty", async () => {
  const created = [];
  await createReport("u1", { targetType: "USER", targetId: "u2", reason: "Spam" }, fakeDb({ created }));
  await createReport("u1", { targetType: "USER", targetId: "u2", reason: "Spam", details: "   " }, fakeDb({ created }));
  assert.equal(created[0].data.details, null);
  assert.equal(created[1].data.details, null);
});

test("createReport rejects missing targets and self reports", async () => {
  await expectAppError(createReport("u1", valid, fakeDb({ user: null })), 404, "REPORT_TARGET_NOT_FOUND");
  await expectAppError(createReport("u1", { ...valid, targetId: "u1" }, fakeDb()), 400, "SELF_REPORT");

  const project = { targetType: "PROJECT", targetId: "p1", reason: "Înșelătorie" };
  await expectAppError(createReport("u1", project, fakeDb({ project: null })), 404, "REPORT_TARGET_NOT_FOUND");
  await expectAppError(createReport("c1", project, fakeDb()), 400, "SELF_REPORT");

  const created = [];
  await createReport("u1", project, fakeDb({ created }));
  assert.equal(created[0].data.targetType, "PROJECT");
});

test("createReport blocks duplicate open reports and enforces the daily limit", async () => {
  const created = [];
  await expectAppError(createReport("u1", valid, fakeDb({ duplicate: { id: "r0" }, created })), 409, "REPORT_EXISTS");
  await expectAppError(createReport("u1", valid, fakeDb({ recent: MAX_REPORTS_PER_DAY, created })), 429, "REPORT_LIMIT_REACHED");
  assert.equal(created.length, 0);
  await createReport("u1", valid, fakeDb({ recent: MAX_REPORTS_PER_DAY - 1, created }));
  assert.equal(created.length, 1);
});