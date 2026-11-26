const test = require("node:test");
const assert = require("node:assert/strict");
const { AppError } = require("../utils/errors");
const {
  listUsers,
  updateUser,
  updateProject,
  deleteProject,
  listReports,
  resolveReport,
  getStats,
} = require("./admin.service");

function expectAppError(promise, status, code) {
  return assert.rejects(promise, (error) => {
    assert.ok(error instanceof AppError, `expected AppError, got ${error}`);
    assert.equal(error.status, status);
    assert.equal(error.code, code);
    return true;
  });
}

test("updateUser blocks a user and invalidates their sessions", async () => {
  let update;
  const db = {
    user: {
      findUnique: async () => ({ id: "u2", email: "u2@x.md", role: "FREELANCER", isBlocked: false }),
      update: async (args) => { update = args; return { id: "u2", isBlocked: true }; },
    },
  };
  await updateUser("admin1", "u2", { isBlocked: true }, db);
  assert.equal(update.data.isBlocked, true);
  assert.deepEqual(update.data.tokenVersion, { increment: 1 });
});

test("updateUser unblocks without invalidating sessions", async () => {
  let update;
  const db = {
    user: {
      findUnique: async () => ({ id: "u2", email: "u2@x.md", role: "FREELANCER", isBlocked: true }),
      update: async (args) => { update = args; return {}; },
    },
  };
  await updateUser("admin1", "u2", { isBlocked: false }, db);
  assert.equal("tokenVersion" in update.data, false);
});

test("updateUser rejects invalid input, self changes and unknown users", async () => {
  const db = { user: { findUnique: async () => null, update: async () => { throw new Error("must not write"); } } };
  for (const input of [null, [], {}, { role: "ROOT" }, { isBlocked: "yes" }, { name: "x" }]) {
    await expectAppError(updateUser("admin1", "u2", input, db), 400, "VALIDATION_ERROR");
  }
  await expectAppError(updateUser("admin1", "admin1", { isBlocked: true }, db), 400, "SELF_ADMIN_CHANGE");
  await expectAppError(updateUser("admin1", "admin1", { role: "CLIENT" }, db), 400, "SELF_ADMIN_CHANGE");
  await expectAppError(updateUser("admin1", "u2", { isBlocked: true }, db), 404, "USER_NOT_FOUND");
});

test("updateUser only grants ADMIN to allowlisted emails", async () => {
  const make = (allowlisted) => ({
    user: {
      findUnique: async () => ({ id: "u2", email: "u2@x.md", role: "CLIENT", isBlocked: false }),
      update: async () => ({ id: "u2", role: "ADMIN" }),
    },
    admin: { findUnique: async () => (allowlisted ? { email: "u2@x.md" } : null) },
  });
  await expectAppError(updateUser("admin1", "u2", { role: "ADMIN" }, make(false)), 403, "ADMIN_NOT_ALLOWLISTED");
  assert.equal((await updateUser("admin1", "u2", { role: "ADMIN" }, make(true))).role, "ADMIN");
});

test("listUsers validates filters and paginates", async () => {
  let where;
  let findMany;
  const db = {
    user: {
      count: async (args) => { where = args.where; return 3; },
      findMany: async (args) => { findMany = args; return [{ id: "u1" }]; },
    },
  };
  const result = await listUsers({ role: "CLIENT", blocked: "true", search: " ana ", page: "2", limit: "10" }, db);
  assert.equal(where.role, "CLIENT");
  assert.equal(where.isBlocked, true);
  assert.equal(findMany.skip, 10);
  assert.equal(findMany.take, 10);
  assert.deepEqual(result, { data: [{ id: "u1" }], page: 2, limit: 10, total: 3 });

  for (const query of [{ role: "X" }, { blocked: "maybe" }, { page: "0" }, { limit: "101" }, { search: "x".repeat(101) }]) {
    await expectAppError(listUsers(query, db), 400, "VALIDATION_ERROR");
  }
});

test("deleteProject requires an existing project", async () => {
  let deleted = false;
  const make = (found) => ({
    project: { findUnique: async () => found, delete: async () => { deleted = true; } },
  });
  await expectAppError(deleteProject("  ", make(null)), 400, "VALIDATION_ERROR");
  await expectAppError(deleteProject("p1", make(null)), 404, "PROJECT_NOT_FOUND");
  assert.equal(deleted, false);
  await deleteProject("p1", make({ id: "p1" }));
  assert.equal(deleted, true);
});

test("listReports filters by status", async () => {
  let where;
  const db = { report: { count: async (a) => { where = a.where; return 0; }, findMany: async () => [] } };
  await listReports({ status: "OPEN" }, db);
  assert.deepEqual(where, { status: "OPEN" });
  await expectAppError(listReports({ status: "DONE" }, db), 400, "VALIDATION_ERROR");
});

test("resolveReport validates status/resolution and records the admin", async () => {
  let update;
  const db = {
    report: {
      findUnique: async () => ({ id: "r1" }),
      update: async (args) => { update = args; return { id: "r1" }; },
    },
  };
  for (const input of [null, {}, { status: "OPEN" }, { status: "RESOLVED", resolution: 5 }, { status: "RESOLVED", extra: 1 }, { status: "RESOLVED", resolution: "x".repeat(1001) }]) {
    await expectAppError(resolveReport("admin1", "r1", input, db), 400, "VALIDATION_ERROR");
  }
  await resolveReport("admin1", "r1", { status: "DISMISSED", resolution: "  Fără temei  " }, db);
  assert.equal(update.data.status, "DISMISSED");
  assert.equal(update.data.resolution, "Fără temei");
  assert.equal(update.data.resolvedById, "admin1");
  assert.ok(update.data.resolvedAt instanceof Date);

  const missing = { report: { findUnique: async () => null } };
  await expectAppError(resolveReport("admin1", "r9", { status: "RESOLVED" }, missing), 404, "REPORT_NOT_FOUND");
});

test("getStats aggregates totals and group counts", async () => {
  const db = {
    user: { count: async () => 5, groupBy: async () => [{ role: "CLIENT", _count: { _all: 3 } }, { role: "FREELANCER", _count: { _all: 2 } }] },
    project: { count: async () => 4, groupBy: async () => [{ status: "OPEN", _count: { _all: 4 } }] },
    report: { count: async () => 1, groupBy: async () => [{ status: "OPEN", _count: { _all: 1 } }] },
    engagement: { count: async () => 2 },
  };
  assert.deepEqual(await getStats(db), {
    totals: { users: 5, projects: 4, reports: 1, engagements: 2 },
    usersByRole: { CLIENT: 3, FREELANCER: 2 },
    projectsByStatus: { OPEN: 4 },
    reportsByStatus: { OPEN: 1 },
  });
});
test("updateProject validates status and updates existing projects", async () => {
  let update;
  const make = (found) => ({
    project: { findUnique: async () => found, update: async (args) => { update = args; return { id: "p1" }; } },
  });
  for (const input of [null, [], {}, { status: "DONE" }, { status: "OPEN", title: "x" }]) {
    await expectAppError(updateProject("p1", input, make({ id: "p1" })), 400, "VALIDATION_ERROR");
  }
  await expectAppError(updateProject(" ", { status: "CLOSED" }, make(null)), 400, "VALIDATION_ERROR");
  await expectAppError(updateProject("p1", { status: "CLOSED" }, make(null)), 404, "PROJECT_NOT_FOUND");
  await updateProject("p1", { status: "CLOSED" }, make({ id: "p1" }));
  assert.equal(update.data.status, "CLOSED");
});
