const test = require("node:test");
const assert = require("node:assert/strict");
const { signAccessToken, verifyAccessToken } = require("./jwt");
const { hashPassword, verifyPassword, hashRefreshToken } = require("./hash");
const { isAdminAllowlisted } = require("./adminAccess");
const { linkGoogleAccountToExistingAdmin } = require("../services/auth.service");
const { requireRole } = require("../middlewares/requireRole");
const {
  REFRESH_COOKIE_MAX_AGE_SECONDS,
  getRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
} = require("./refreshCookie");

process.env.JWT_SECRET = "test-only-secret-that-is-at-least-32-bytes-long";

test("access tokens can be verified and reject tampering", () => {
  const token = signAccessToken({ id: "user-1" });
  assert.deepEqual(verifyAccessToken(token), { userId: "user-1", tokenVersion: 0 });
  assert.deepEqual(verifyAccessToken(signAccessToken({ id: "user-1" }, 2)), {
    userId: "user-1",
    tokenVersion: 2,
  });
  assert.equal(verifyAccessToken(`${token.slice(0, -1)}x`), null);
  assert.equal(verifyAccessToken("not-a-token"), null);
});

test("passwords are salted and only the original password verifies", async () => {
  const firstHash = await hashPassword("correct horse battery staple");
  const secondHash = await hashPassword("correct horse battery staple");
  assert.notEqual(firstHash, secondHash);
  assert.equal(await verifyPassword("correct horse battery staple", firstHash), true);
  assert.equal(await verifyPassword("wrong password", firstHash), false);
  assert.equal(await verifyPassword("anything", "invalid-hash"), false);
});

test("refresh tokens are stored as one-way hashes", () => {
  const token = "random-refresh-token";
  const hash = hashRefreshToken(token);
  assert.notEqual(hash, token);
  assert.equal(hashRefreshToken(token), hash);
  assert.notEqual(hashRefreshToken(token), hashRefreshToken("another-token"));
});

test("admin access requires a normalized email in the admin allowlist", async () => {
  const queries = [];
  const db = {
    admin: {
      findUnique: async (query) => {
        queries.push(query);
        return query.where.email === "admin@example.com" ? { email: "admin@example.com" } : null;
      },
    },
  };

  assert.equal(await isAdminAllowlisted(" Admin@Example.com ", db), true);
  assert.equal(await isAdminAllowlisted("user@example.com", db), false);
  assert.equal(await isAdminAllowlisted(null, db), false);
  assert.equal(queries[0].where.email, "admin@example.com");
});

test("Google sign-in links an existing allowlisted admin without changing its role", async () => {
  const linkedAccounts = [];
  const tx = {
    admin: {
      findUnique: async () => ({ email: "admin@example.com" }),
    },
    oAuthAccount: {
      create: async ({ data }) => linkedAccounts.push(data),
    },
    refreshToken: {
      create: async () => {},
    },
  };
  const user = {
    id: "admin-1",
    email: "admin@example.com",
    name: "Admin",
    role: "ADMIN",
    passwordHash: "private-hash",
    isBlocked: false,
    tokenVersion: 4,
  };

  const session = await linkGoogleAccountToExistingAdmin(tx, user, "google-subject-1");

  assert.deepEqual(linkedAccounts, [{
    provider: "GOOGLE",
    providerUserId: "google-subject-1",
    userId: "admin-1",
  }]);
  assert.equal(session.user.role, "ADMIN");
  assert.equal(session.user.passwordHash, undefined);
  assert.equal(session.accessToken && verifyAccessToken(session.accessToken).tokenVersion, 4);
});

test("Google sign-in does not link an admin account outside the allowlist", async () => {
  let linked = false;
  const tx = {
    admin: {
      findUnique: async () => null,
    },
    oAuthAccount: {
      create: async () => { linked = true; },
    },
  };

  await assert.rejects(
    linkGoogleAccountToExistingAdmin(tx, {
      id: "admin-1",
      email: "admin@example.com",
      role: "ADMIN",
      isBlocked: false,
    }, "google-subject-1"),
    { code: "ADMIN_NOT_ALLOWLISTED" },
  );
  assert.equal(linked, false);
});

test("Google sign-in does not automatically link an existing non-admin account", async () => {
  let linked = false;
  const tx = {
    oAuthAccount: {
      create: async () => { linked = true; },
    },
  };

  await assert.rejects(
    linkGoogleAccountToExistingAdmin(tx, {
      id: "user-1",
      email: "user@example.com",
      role: "FREELANCER",
      isBlocked: false,
    }, "google-subject-1"),
    { code: "ACCOUNT_LINK_REQUIRED" },
  );
  assert.equal(linked, false);
});

test("refresh cookie is HttpOnly, SameSite, path-scoped, and readable by the refresh handler", () => {
  let cookie;
  const response = { append: (name, value) => {
    assert.equal(name, "Set-Cookie");
    cookie = value;
  } };
  const refreshToken = "random-refresh-token";
  setRefreshCookie(response, refreshToken);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Path=\/api\/auth/);
  assert.match(cookie, new RegExp(`Max-Age=${REFRESH_COOKIE_MAX_AGE_SECONDS}`));
  assert.equal(getRefreshToken({ headers: { cookie } }), refreshToken);

  clearRefreshCookie(response);
  assert.match(cookie, /Max-Age=0/);
});

test("role middleware denies missing or mismatched roles", () => {
  const invoke = (user, roles) => {
    let status;
    let payload;
    let advanced = false;
    const response = {
      status(value) {
        status = value;
        return this;
      },
      json(value) {
        payload = value;
        return this;
      },
    };
    requireRole(...roles)({ user }, response, () => { advanced = true; });
    return { status, payload, advanced };
  };

  assert.equal(invoke(null, ["CLIENT"]).status, 401);
  assert.equal(invoke({ role: "FREELANCER" }, ["CLIENT"]).status, 403);
  assert.equal(invoke({ role: "CLIENT" }, ["ADMIN"]).status, 403);
  assert.equal(invoke({ role: "ADMIN" }, ["CLIENT"]).status, 403);
  assert.deepEqual(invoke({ role: "CLIENT" }, ["CLIENT"]), {
    status: undefined,
    payload: undefined,
    advanced: true,
  });
});
