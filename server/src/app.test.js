const test = require("node:test");
const assert = require("node:assert/strict");

process.env.JWT_SECRET = "test-only-secret-that-is-at-least-32-bytes-long";
delete process.env.GOOGLE_CLIENT_ID;

const app = require("./app");

test("health and authentication endpoints respond with expected access control", async (t) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));

  const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
  const health = await fetch(`${baseUrl}/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: "ok" });

  const protectedRoute = await fetch(`${baseUrl}/auth/me`);
  assert.equal(protectedRoute.status, 401);

  const removedProfileRoute = await fetch(`${baseUrl}/clients/me`);
  assert.equal(removedProfileRoute.status, 404);

  const protectedRoleRoute = await fetch(`${baseUrl}/access/client`);
  assert.equal(protectedRoleRoute.status, 401);

  const invalidToken = await fetch(`${baseUrl}/auth/me`, {
    headers: { Authorization: "Bearer not-a-valid-token" },
  });
  assert.equal(invalidToken.status, 401);
});

test("social registration cannot assign admin role", async (t) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));

  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/oauth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential: "invalid", nonce: "invalid", role: "ADMIN" }),
  });

  test("social login reports missing Google configuration instead of accepting an unverified token", async (t) => {
    const server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    t.after(() => new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    }));

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/oauth/google/challenge`, {
      method: "POST",
    });
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error.code, "PROVIDER_NOT_CONFIGURED");
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, "VALIDATION_ERROR");
});

test("public registration rejects attempts to self-assign the admin role", async (t) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));

  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test User",
      email: "test@example.com",
      password: "a-secure-test-password",
      role: "ADMIN",
    }),
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, "VALIDATION_ERROR");
});
