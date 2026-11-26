const test = require("node:test");
const assert = require("node:assert/strict");
const { startConversation, sendMessage } = require("./conversations.service");

test("a conversation cannot start until the match is accepted", async () => {
  let createAttempted = false;
  let statusFilter;
  const db = {
    project: { findUnique: async () => ({ id: "project-1", clientId: "client-1", status: "OPEN" }) },
    match: { findFirst: async ({ where }) => { statusFilter = where.status; return null; } },
    conversation: { upsert: async () => { createAttempted = true; } },
  };

  await assert.rejects(
    startConversation({ id: "freelancer-1", role: "FREELANCER" }, "project-1", "client-1", db),
    (error) => error.status === 409 && error.code === "MATCH_REQUIRED",
  );
  assert.equal(statusFilter, "ACCEPTED");
  assert.equal(createAttempted, false);
});

test("messages are rejected before both sides accept a match", async () => {
  let messageCreated = false;
  const db = {
    $transaction: (operation) => operation({
      conversation: { findFirst: async () => ({ id: "conversation-1", engagement: null, match: { status: "FREELANCER_INTERESTED" } }) },
      message: { create: async () => { messageCreated = true; } },
    }),
  };

  await assert.rejects(
    sendMessage("freelancer-1", "conversation-1", { content: "Salut!" }, db),
    (error) => error.status === 409 && error.code === "CONVERSATION_CLOSED",
  );
  assert.equal(messageCreated, false);
});
