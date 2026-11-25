const test = require("node:test");
const assert = require("node:assert/strict");
const { AppError } = require("../utils/errors");
const {
  createNotification,
  listNotifications,
  markRead,
  markAllRead,
  markConversationRead,
  notifyEngagementRequested,
  notifyEngagementUpdated,
  notifyNewMessage,
} = require("./notifications.service");

function expectAppError(promise, status, code) {
  return assert.rejects(promise, (error) => {
    assert.ok(error instanceof AppError, `expected AppError, got ${error}`);
    assert.equal(error.status, status);
    assert.equal(error.code, code);
    return true;
  });
}

function fakeDb({ existing = null, recent = 0, created = [] } = {}) {
  return {
    notification: {
      findFirst: async () => existing,
      count: async () => recent,
      create: async (args) => {
        created.push(args);
        return { id: `n${created.length}`, ...args.data };
      },
    },
  };
}

test("createNotification creates a notification with its data", async () => {
  const created = [];
  const result = await createNotification(
    { userId: "u1", type: "X", title: "T", body: "B", data: { a: 1 } },
    fakeDb({ created }),
  );
  assert.equal(created.length, 1);
  assert.equal(created[0].data.userId, "u1");
  assert.deepEqual(created[0].data.data, { a: 1 });
  assert.equal(result.title, "T");
});

test("createNotification skips when an unread one with the same dedupeKey exists", async () => {
  const created = [];
  const result = await createNotification(
    { userId: "u1", type: "NEW_MESSAGE", title: "T", dedupeKey: "message:c1" },
    fakeDb({ existing: { id: "old" }, created }),
  );
  assert.equal(result, null);
  assert.equal(created.length, 0);
});

test("createNotification enforces the daily limit (default 50)", async () => {
  const created = [];
  assert.equal(await createNotification({ userId: "u1", type: "X", title: "T" }, fakeDb({ recent: 50, created })), null);
  assert.equal(created.length, 0);
  assert.ok(await createNotification({ userId: "u1", type: "X", title: "T" }, fakeDb({ recent: 49, created })));
  assert.equal(created.length, 1);
});

test("the daily limit can be configured with NOTIFICATIONS_DAILY_LIMIT", async (t) => {
  process.env.NOTIFICATIONS_DAILY_LIMIT = "2";
  t.after(() => { delete process.env.NOTIFICATIONS_DAILY_LIMIT; });
  const created = [];
  assert.equal(await createNotification({ userId: "u1", type: "X", title: "T" }, fakeDb({ recent: 2, created })), null);
  assert.ok(await createNotification({ userId: "u1", type: "X", title: "T" }, fakeDb({ recent: 1, created })));
});

test("listNotifications scopes to the user, filters unread and paginates", async () => {
  const calls = [];
  const db = {
    notification: {
      count: async ({ where }) => { calls.push(["count", where]); return where.readAt === null && !("unread" in where) ? 3 : 7; },
      findMany: async (args) => { calls.push(["findMany", args]); return [{ id: "n1" }]; },
    },
  };
  const result = await listNotifications("u1", { unread: "true", page: "2", limit: "5" }, db);
  const findMany = calls.find(([name]) => name === "findMany")[1];
  assert.deepEqual(findMany.where, { userId: "u1", readAt: null });
  assert.equal(findMany.skip, 5);
  assert.equal(findMany.take, 5);
  assert.equal(result.page, 2);
  assert.equal(result.limit, 5);
  assert.deepEqual(result.data, [{ id: "n1" }]);
  assert.equal(typeof result.total, "number");
  assert.equal(typeof result.unreadCount, "number");

  await listNotifications("u1", {}, db);
  const all = calls.filter(([name]) => name === "findMany").pop()[1];
  assert.deepEqual(all.where, { userId: "u1" });
  assert.equal(all.take, 20);
});

test("listNotifications rejects invalid query parameters", async () => {
  const db = { notification: { count: async () => 0, findMany: async () => [] } };
  for (const query of [{ unread: "maybe" }, { page: "0" }, { page: "x" }, { limit: "0" }, { limit: "101" }, { limit: "2.5" }]) {
    await expectAppError(listNotifications("u1", query, db), 400, "VALIDATION_ERROR");
  }
});

test("markRead checks existence and ownership, and is idempotent", async () => {
  let updates = 0;
  const make = (found) => ({
    notification: {
      findUnique: async () => found,
      update: async () => { updates += 1; return { id: "n1", readAt: new Date() }; },
    },
  });
  await expectAppError(markRead("u1", "n1", make(null)), 404, "NOTIFICATION_NOT_FOUND");
  await expectAppError(markRead("u1", "  ", make(null)), 400, "VALIDATION_ERROR");
  await expectAppError(markRead("u2", "n1", make({ id: "n1", userId: "u1", readAt: null })), 403, "FORBIDDEN");
  assert.equal(updates, 0);

  const already = await markRead("u1", "n1", make({ id: "n1", userId: "u1", readAt: new Date(0), title: "T" }));
  assert.equal(updates, 0);
  assert.equal("userId" in already, false);
  assert.equal(already.title, "T");

  await markRead("u1", "n1", make({ id: "n1", userId: "u1", readAt: null }));
  assert.equal(updates, 1);
});

test("markAllRead only touches the caller's unread notifications", async () => {
  let args;
  const db = { notification: { updateMany: async (a) => { args = a; return { count: 4 }; } } };
  assert.deepEqual(await markAllRead("u1", db), { updated: 4 });
  assert.deepEqual(args.where, { userId: "u1", readAt: null });
});

test("markConversationRead targets the message notification of that conversation and never throws", async () => {
  let args;
  await markConversationRead("u1", "c1", { notification: { updateMany: async (a) => { args = a; return { count: 1 }; } } });
  assert.deepEqual(args.where, { userId: "u1", dedupeKey: "message:c1", readAt: null });
  const originalError = console.error;
  console.error = () => {};
  try {
    await markConversationRead("u1", "c1", { notification: { updateMany: async () => { throw new Error("db down"); } } });
  } finally {
    console.error = originalError;
  }
});

const engagement = {
  id: "e1",
  projectId: "p1",
  clientId: "client1",
  freelancerId: "free1",
  status: "PENDING",
  project: { title: "Site" },
  client: { name: "Ion" },
  freelancer: { name: "Ana" },
  conversation: { id: "c1" },
};

test("notifyEngagementRequested notifies the client", async () => {
  const created = [];
  await notifyEngagementRequested(engagement, fakeDb({ created }));
  assert.equal(created[0].data.userId, "client1");
  assert.equal(created[0].data.type, "ENGAGEMENT_REQUESTED");
  assert.match(created[0].data.body, /Ana/);
  assert.match(created[0].data.body, /Site/);
  assert.deepEqual(created[0].data.data, { engagementId: "e1", projectId: "p1", conversationId: "c1" });
});

test("notifyEngagementUpdated notifies the right participant for each status", async () => {
  const cases = [
    ["IN_PROGRESS", "client1", "free1", "ENGAGEMENT_ACCEPTED"],
    ["REJECTED", "client1", "free1", "ENGAGEMENT_REJECTED"],
    ["DELIVERED", "free1", "client1", "ENGAGEMENT_DELIVERED"],
    ["COMPLETED", "client1", "free1", "ENGAGEMENT_COMPLETED"],
    ["CANCELLED", "client1", "free1", "ENGAGEMENT_CANCELLED"],
    ["CANCELLED", "free1", "client1", "ENGAGEMENT_CANCELLED"],
  ];
  for (const [status, actorId, expectedUser, expectedType] of cases) {
    const created = [];
    await notifyEngagementUpdated({ ...engagement, status }, actorId, fakeDb({ created }));
    assert.equal(created.length, 1, `${status} by ${actorId}`);
    assert.equal(created[0].data.userId, expectedUser, `${status} by ${actorId}`);
    assert.equal(created[0].data.type, expectedType);
    assert.notEqual(created[0].data.userId, actorId);
  }
  const created = [];
  await notifyEngagementUpdated({ ...engagement, status: "PENDING" }, "client1", fakeDb({ created }));
  assert.equal(created.length, 0);
});

test("notifyNewMessage notifies the other participant, deduplicated per conversation, without message content", async () => {
  const created = [];
  const db = {
    ...fakeDb({ created }),
    conversation: {
      findUnique: async () => ({
        clientId: "client1",
        freelancerId: "free1",
        engagement: { id: "e1", projectId: "p1", project: { title: "Site" } },
      }),
    },
  };
  await notifyNewMessage({ conversationId: "c1", senderId: "client1", senderName: "Ion" }, db);
  assert.equal(created[0].data.userId, "free1");
  assert.equal(created[0].data.dedupeKey, "message:c1");
  assert.equal(created[0].data.type, "NEW_MESSAGE");

  await notifyNewMessage({ conversationId: "c1", senderId: "free1", senderName: "Ana" }, db);
  assert.equal(created[1].data.userId, "client1");
});

test("event notifications never throw when the database fails", async () => {
  const originalError = console.error;
  console.error = () => {};
  try {
    const broken = {
      notification: { findFirst: async () => { throw new Error("db down"); } },
      conversation: { findUnique: async () => { throw new Error("db down"); } },
    };
    assert.equal(await notifyEngagementRequested(engagement, broken), null);
    assert.equal(await notifyEngagementUpdated({ ...engagement, status: "DELIVERED" }, "free1", broken), null);
    assert.equal(await notifyNewMessage({ conversationId: "c1", senderId: "a", senderName: "A" }, broken), null);
  } finally {
    console.error = originalError;
  }
});