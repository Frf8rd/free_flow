const test = require("node:test");
const assert = require("node:assert/strict");

process.env.JWT_SECRET = "test-only-secret-that-is-at-least-32-bytes-long";
process.env.NODE_ENV = "test";

const app = require("./app");
delete process.env.GOOGLE_CLIENT_ID;

async function withServer(t, run) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  return run(`http://127.0.0.1:${server.address().port}/api`);
}

test("health and protected authentication routes return expected access control", async (t) => {
  await withServer(t, async (baseUrl) => {
    const health = await fetch(`${baseUrl}/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: "ok" });

    const protectedRoute = await fetch(`${baseUrl}/auth/me`);
    assert.equal(protectedRoute.status, 401);

    const deleteAccount = await fetch(`${baseUrl}/auth/me`, { method: "DELETE" });
    assert.equal(deleteAccount.status, 401);

    const removedProfileRoute = await fetch(`${baseUrl}/clients/me`);
    assert.equal(removedProfileRoute.status, 404);

    const protectedRoleRoute = await fetch(`${baseUrl}/access/client`);
    assert.equal(protectedRoleRoute.status, 401);

    const missingRefreshCookie = await fetch(`${baseUrl}/auth/refresh`, { method: "POST" });
    assert.equal(missingRefreshCookie.status, 401);
  });
});

test("CORS permits credentialed requests only from the configured frontend", async (t) => {
  await withServer(t, async (baseUrl) => {
    const allowed = await fetch(`${baseUrl}/auth/refresh`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
      },
    });
    assert.equal(allowed.status, 204);
    assert.equal(allowed.headers.get("access-control-allow-credentials"), "true");
    assert.equal(allowed.headers.get("access-control-allow-origin"), "http://localhost:5173");

    const refresh = await fetch(`${baseUrl}/auth/refresh`, {
      method: "POST",
      headers: { Origin: "http://localhost:5173" },
    });
    assert.equal(refresh.status, 401);
    assert.equal(refresh.headers.get("access-control-allow-credentials"), "true");
    assert.equal(refresh.headers.get("access-control-allow-origin"), "http://localhost:5173");

    const rejected = await fetch(`${baseUrl}/health`, {
      headers: { Origin: "https://not-the-app.example" },
    });
    assert.equal(rejected.status, 403);
  });
});

test("session restore has its own limit above the login attempt limit", async (t) => {
  await withServer(t, async (baseUrl) => {
    const responses = await Promise.all(
      Array.from({ length: 11 }, () =>
        fetch(`${baseUrl}/auth/refresh`, { method: "POST" }),
      ),
    );
    assert.ok(responses.every((response) => response.status === 401));
    assert.equal(responses[0].headers.get("ratelimit-limit"), "60");
  });
});

test("social registration cannot assign admin role", async (t) => {
  await withServer(t, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/auth/oauth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: "invalid", nonce: "invalid", role: "ADMIN" }),
    });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, "VALIDATION_ERROR");
  });
});

test("social login reports missing Google configuration instead of accepting an unverified token", async (t) => {
  await withServer(t, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/auth/oauth/google/challenge`, {
      method: "POST",
    });
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error.code, "PROVIDER_NOT_CONFIGURED");
  });
});

test("public registration rejects attempts to self-assign the admin role", async (t) => {
  await withServer(t, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/auth/register`, {
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
});
