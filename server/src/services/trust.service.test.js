const test = require("node:test");
const assert = require("node:assert/strict");
const { AppError } = require("../utils/errors");
const {
  CRITERIA,
  computeTrust,
  getTrustSummaries,
  getMyTrust,
  getPublicTrust,
} = require("./trust.service");

const NOW = new Date("2026-11-24T12:00:00Z");
const daysAgo = (days) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);

function facts(overrides = {}) {
  return {
    createdAt: daysAgo(0),
    emailVerifiedAt: new Date(),
    completedEngagements: 0,
    upheldReports: 0,
    ...overrides,
  };
}

test("an unverified account is NEW whatever else it has done", () => {
  const trust = computeTrust(facts({ emailVerifiedAt: null, createdAt: daysAgo(400), completedEngagements: 50 }), NOW);
  assert.equal(trust.level, "NEW");
  assert.equal(trust.label, "Nou");
  assert.deepEqual(trust.nextLevel, { level: "VERIFIED", label: "Verificat" });
  assert.deepEqual(trust.requirements, [{ key: "emailVerified", label: "Adresa de email verificată", met: false }]);
});

test("a verified new account is VERIFIED", () => {
  const trust = computeTrust(facts(), NOW);
  assert.equal(trust.level, "VERIFIED");
  assert.deepEqual(trust.nextLevel, { level: "TRUSTED", label: "De încredere" });
});

test("TRUSTED needs age and completed engagements, both at their threshold", () => {
  const { minAccountDays, minCompletedEngagements } = CRITERIA.TRUSTED;
  assert.equal(computeTrust(facts({ createdAt: daysAgo(minAccountDays), completedEngagements: minCompletedEngagements }), NOW).level, "TRUSTED");
  assert.equal(computeTrust(facts({ createdAt: daysAgo(minAccountDays - 1), completedEngagements: minCompletedEngagements }), NOW).level, "VERIFIED");
  assert.equal(computeTrust(facts({ createdAt: daysAgo(minAccountDays), completedEngagements: minCompletedEngagements - 1 }), NOW).level, "VERIFIED");
});

test("TOP needs the higher thresholds", () => {
  const { minAccountDays, minCompletedEngagements } = CRITERIA.TOP;
  const top = computeTrust(facts({ createdAt: daysAgo(minAccountDays), completedEngagements: minCompletedEngagements }), NOW);
  assert.equal(top.level, "TOP");
  assert.equal(top.nextLevel, null);
  assert.deepEqual(top.requirements, []);
  assert.equal(computeTrust(facts({ createdAt: daysAgo(minAccountDays), completedEngagements: minCompletedEngagements - 1 }), NOW).level, "TRUSTED");
  assert.equal(computeTrust(facts({ createdAt: daysAgo(minAccountDays - 1), completedEngagements: minCompletedEngagements }), NOW).level, "TRUSTED");
});

test("an upheld report caps the level at VERIFIED", () => {
  const trust = computeTrust(facts({ createdAt: daysAgo(500), completedEngagements: 40, upheldReports: 1 }), NOW);
  assert.equal(trust.level, "VERIFIED");
  const missing = trust.requirements.find((r) => r.key === "noUpheldReports");
  assert.equal(missing.met, false);
});

test("requirements for the next level show progress", () => {
  const trust = computeTrust(facts({ createdAt: daysAgo(10), completedEngagements: 1 }), NOW);
  const byKey = Object.fromEntries(trust.requirements.map((r) => [r.key, r]));
  assert.equal(byKey.accountAge.current, 10);
  assert.equal(byKey.accountAge.target, CRITERIA.TRUSTED.minAccountDays);
  assert.equal(byKey.accountAge.met, false);
  assert.equal(byKey.completedEngagements.current, 1);
  assert.equal(byKey.completedEngagements.target, CRITERIA.TRUSTED.minCompletedEngagements);
  assert.equal(byKey.emailVerified.met, true);
  assert.equal(byKey.noUpheldReports.met, true);
});

function fakeDb({ users, asClient = [], asFreelancer = [], reports = [] }) {
  const calls = [];
  return {
    calls,
    user: { findMany: async (args) => { calls.push(["user", args]); return users; } },
    engagement: {
      groupBy: async (args) => {
        calls.push(["engagement", args]);
        return args.by[0] === "clientId" ? asClient : asFreelancer;
      },
    },
    report: { groupBy: async (args) => { calls.push(["report", args]); return reports; } },
  };
}

test("getTrustSummaries counts completed engagements on both sides and upheld user reports", async () => {
  const db = fakeDb({
    users: [
      { id: "a", createdAt: daysAgo(200), emailVerifiedAt: new Date() },
      { id: "b", createdAt: daysAgo(200), emailVerifiedAt: new Date() },
    ],
    asClient: [{ clientId: "a", _count: { _all: 6 } }],
    asFreelancer: [{ freelancerId: "a", _count: { _all: 5 } }, { freelancerId: "b", _count: { _all: 20 } }],
    reports: [{ targetId: "b", _count: { _all: 1 } }],
  });
  const result = await getTrustSummaries(["a", "b", "a"], db, NOW);
  assert.equal(result.get("a").level, "TOP");
  assert.equal(result.get("b").level, "VERIFIED");

  const engagementCalls = db.calls.filter(([name]) => name === "engagement");
  for (const [, args] of engagementCalls) assert.equal(args.where.status, "COMPLETED");
  const reportCall = db.calls.find(([name]) => name === "report")[1];
  assert.equal(reportCall.where.targetType, "USER");
  assert.equal(reportCall.where.status, "RESOLVED");
  assert.deepEqual(db.calls.find(([name]) => name === "user")[1].where.id.in, ["a", "b"]);
});

test("getTrustSummaries returns an empty map without touching the database for no ids", async () => {
  const db = { user: { findMany: async () => { throw new Error("no query expected"); } } };
  assert.equal((await getTrustSummaries([], db)).size, 0);
});

test("getMyTrust returns full details, getPublicTrust only level and label", async () => {
  const db = fakeDb({ users: [{ id: "a", createdAt: daysAgo(5), emailVerifiedAt: new Date() }] });
  const mine = await getMyTrust("a", db);
  assert.equal(mine.level, "VERIFIED");
  assert.ok(Array.isArray(mine.requirements));
  assert.deepEqual(await getPublicTrust("a", db), { level: "VERIFIED", label: "Verificat" });
});

test("unknown users give 404", async () => {
  const db = fakeDb({ users: [] });
  for (const call of [() => getMyTrust("x", db), () => getPublicTrust("x", db)]) {
    await assert.rejects(call(), (error) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.status, 404);
      assert.equal(error.code, "USER_NOT_FOUND");
      return true;
    });
  }
});