const test = require("node:test");
const assert = require("node:assert/strict");
const { signAccessToken, verifyAccessToken } = require("./jwt");
const { hashPassword, verifyPassword, hashRefreshToken } = require("./hash");
const { requireRole } = require("../middlewares/requireRole");

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
  assert.deepEqual(invoke({ role: "CLIENT" }, ["CLIENT"]), {
    status: undefined,
    payload: undefined,
    advanced: true,
  });
});
