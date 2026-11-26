const test = require("node:test");
const assert = require("node:assert/strict");
const { getAttachment } = require("./project-attachments.service");
const storage = require("../utils/projectAttachmentStorage");

test("closed project attachments require a participant session", async () => {
  const db = {
    project: { findUnique: async () => ({ id: "project-1", clientId: "client-1", status: "CLOSED" }) },
    engagement: { findFirst: async () => null },
  };

  await assert.rejects(getAttachment(null, "project-1", "attachment-1", db), {
    status: 404,
    code: "PROJECT_NOT_FOUND",
  });
  await assert.rejects(getAttachment({ id: "outsider" }, "project-1", "attachment-1", db), {
    status: 403,
    code: "FORBIDDEN",
  });
});

test("attachment URLs point to the API route without exposing Cloudinary delivery URLs", () => {
  const url = storage.imageUrl("project-1", "attachment-1");
  assert.equal(url, "/projects/project-1/attachments/attachment-1/file");
  assert.equal(url.includes("res.cloudinary.com"), false);
});
