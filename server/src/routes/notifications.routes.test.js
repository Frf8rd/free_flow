const test = require("node:test");
const assert = require("node:assert/strict");

process.env.JWT_SECRET = "test-only-secret-that-is-at-least-32-bytes-long";
process.env.NODE_ENV = "test";

const app = require("../app");

test("notification routes require authentication", async (t) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api/notifications`;

  for (const [method, path] of [
    ["GET", ""],
    ["GET", "?unread=true"],
    ["PATCH", "/read-all"],
    ["PATCH", "/n1/read"],
  ]) {
    const response = await fetch(base + path, { method });
    assert.equal(response.status, 401, `${method} ${path}`);
  }
});