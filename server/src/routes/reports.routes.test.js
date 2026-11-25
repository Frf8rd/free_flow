const test = require("node:test");
const assert = require("node:assert/strict");

process.env.JWT_SECRET = "test-only-secret-that-is-at-least-32-bytes-long";
process.env.NODE_ENV = "test";

const app = require("../app");

test("report and admin routes require authentication", async (t) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const json = { "Content-Type": "application/json" };

  const calls = [
    ["POST", "/reports", { targetType: "USER", targetId: "u1", reason: "Spam" }],
    ["GET", "/admin/users"],
    ["PATCH", "/admin/users/u1", { isBlocked: true }],
    ["GET", "/admin/projects"],
    ["DELETE", "/admin/projects/p1"],
    ["GET", "/admin/reports"],
    ["PATCH", "/admin/reports/r1", { status: "RESOLVED" }],
    ["GET", "/admin/stats"],
  ];
  for (const [method, path, body] of calls) {
    const response = await fetch(base + path, { method, headers: json, body: body ? JSON.stringify(body) : undefined });
    assert.equal(response.status, 401, `${method} ${path}`);
  }
});