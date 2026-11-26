const test = require("node:test");
const assert = require("node:assert/strict");
const projectsService = require("./services/projects.service");

process.env.JWT_SECRET = "test-only-secret-that-is-at-least-32-bytes-long";
process.env.NODE_ENV = "test";
process.env.SMTP_HOST = "";

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

test("health, public browse, and protected routes return expected access control", async (t) => {
  const originalListProjects = projectsService.listProjects;
  projectsService.listProjects = async () => ({ data: [], page: 1, limit: 20, total: 0 });
  t.after(() => { projectsService.listProjects = originalListProjects; });
  await withServer(t, async (baseUrl) => {
    const health = await fetch(`${baseUrl}/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: "ok" });
    assert.equal(health.headers.get("permissions-policy"), "camera=(), microphone=(), geolocation=()");
    assert.equal(health.headers.get("x-dns-prefetch-control"), "off");

    const protectedRoute = await fetch(`${baseUrl}/auth/me`);
    assert.equal(protectedRoute.status, 401);

    const deleteAccount = await fetch(`${baseUrl}/auth/me`, { method: "DELETE" });
    assert.equal(deleteAccount.status, 401);

    const protectedClientProfile = await fetch(`${baseUrl}/clients/me`);
    assert.equal(protectedClientProfile.status, 401);

    const protectedRoleRoute = await fetch(`${baseUrl}/access/client`);
    assert.equal(protectedRoleRoute.status, 401);

    const publicProjects = await fetch(`${baseUrl}/projects`);
    assert.equal(publicProjects.status, 200);
    assert.deepEqual(await publicProjects.json(), { data: [], page: 1, limit: 20, total: 0 });
    const createProject = await fetch(`${baseUrl}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test" }),
    });
    assert.equal(createProject.status, 401);
    const updateProject = await fetch(`${baseUrl}/projects/project-1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated" }),
    });
    assert.equal(updateProject.status, 401);
    const closeProject = await fetch(`${baseUrl}/projects/project-1/close`, { method: "PATCH" });
    assert.equal(closeProject.status, 401);
    const reopenProject = await fetch(`${baseUrl}/projects/project-1/reopen`, { method: "PATCH" });
    assert.equal(reopenProject.status, 401);
    const deleteProject = await fetch(`${baseUrl}/projects/project-1`, { method: "DELETE" });
    assert.equal(deleteProject.status, 401);

    const missingRefreshCookie = await fetch(`${baseUrl}/auth/refresh`, { method: "POST" });
    assert.equal(missingRefreshCookie.status, 401);
  });
});

test("email security endpoints reject invalid input and fail explicitly when SMTP is unavailable", async (t) => {
  await withServer(t, async (baseUrl) => {
    const registration = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        password: "a-secure-test-password",
        role: "CLIENT",
      }),
    });
    assert.equal(registration.status, 503);
    assert.equal((await registration.json()).error.code, "EMAIL_NOT_CONFIGURED");
    assert.equal(registration.headers.get("cache-control"), "no-store");

    const verify = await fetch(`${baseUrl}/auth/email-verification/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "invalid" }),
    });
    assert.equal(verify.status, 400);
    assert.equal((await verify.json()).error.code, "INVALID_EMAIL_TOKEN");

    const reset = await fetch(`${baseUrl}/auth/password-reset/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "invalid", newPassword: "short" }),
    });
    assert.equal(reset.status, 400);
    assert.equal((await reset.json()).error.code, "VALIDATION_ERROR");
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
    assert.equal(response.headers.get("ratelimit-limit"), "300");
  });
});

test("Apple OAuth endpoints are not exposed", async (t) => {
  await withServer(t, async (baseUrl) => {
    const challenge = await fetch(`${baseUrl}/auth/oauth/apple/challenge`, { method: "POST" });
    const login = await fetch(`${baseUrl}/auth/oauth/apple`, { method: "POST" });

    assert.equal(challenge.status, 404);
    assert.equal(login.status, 404);
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
