const test = require("node:test");
const assert = require("node:assert/strict");
const prisma = require("../config/prisma");
const { hashPassword } = require("../utils/hash");
const accountSecurity = require("./account-security.service");
const authService = require("./auth.service");

process.env.JWT_SECRET = "test-only-secret-that-is-at-least-32-bytes-long";

test("registration creates a pending registration but no User", async (t) => {
  const originalCreatePending = accountSecurity.createPendingRegistration;
  const originalCreateUser = prisma.user.create;
  let pendingData;
  accountSecurity.createPendingRegistration = async (data) => { pendingData = data; };
  prisma.user.create = async () => {
    throw new Error("User must not be created before email verification.");
  };
  t.after(() => {
    accountSecurity.createPendingRegistration = originalCreatePending;
    prisma.user.create = originalCreateUser;
  });

  const result = await authService.register({
    name: "Pending User",
    email: "pending@example.com",
    password: "a-secure-test-password",
    role: "CLIENT",
  });

  assert.deepEqual(result, {
    emailVerificationRequired: true,
    email: "pending@example.com",
  });
  assert.equal(pendingData.email, "pending@example.com");
  assert.equal(pendingData.role, "CLIENT");
  assert.equal(typeof pendingData.passwordHash, "string");
});

test("verifying a pending registration creates the account without logging in", async (t) => {
  const originalTransaction = prisma.$transaction;
  const originalConsume = accountSecurity.consumeEmailVerification;
  let refreshTokenCreated = false;
  let createdUser;
  accountSecurity.consumeEmailVerification = async () => ({
    registration: {
      id: "pending-1",
      email: "verified@example.com",
      name: "Verified User",
      passwordHash: "hashed-password",
      role: "CLIENT",
    },
  });
  prisma.$transaction = (callback) => callback({
    user: {
      create: async ({ data }) => {
        createdUser = data;
        return { ...data, id: "user-1", tokenVersion: 0, avatarUrl: null };
      },
    },
    refreshToken: { create: async () => { refreshTokenCreated = true; } },
  });
  t.after(() => {
    prisma.$transaction = originalTransaction;
    accountSecurity.consumeEmailVerification = originalConsume;
  });

  const result = await authService.verifyEmail("A".repeat(43));

  assert.equal(createdUser.email, "verified@example.com");
  assert.equal(createdUser.emailVerifiedAt instanceof Date, true);
  assert.deepEqual(result, { email: "verified@example.com" });
  assert.equal(refreshTokenCreated, false);
});

test("password accounts require their current password for sensitive actions", async (t) => {
  const originalFindUnique = prisma.user.findUnique;
  const passwordHash = await hashPassword("correct-current-password");
  prisma.user.findUnique = async () => ({ passwordHash });
  t.after(() => { prisma.user.findUnique = originalFindUnique; });

  await assert.rejects(authService.assertReauthentication("user-1"), {
    code: "REAUTHENTICATION_FAILED",
  });
  await assert.rejects(
    authService.assertReauthentication("user-1", { password: "wrong-password" }),
    { code: "REAUTHENTICATION_FAILED" },
  );
  await assert.rejects(
    authService.assertReauthentication("user-1", { password: 42 }),
    { code: "VALIDATION_ERROR" },
  );
  await assert.doesNotReject(
    authService.assertReauthentication("user-1", { password: "correct-current-password" }),
  );
});

test("Google-only accounts require a fresh Google proof for sensitive actions", async (t) => {
  const originalFindUnique = prisma.user.findUnique;
  prisma.user.findUnique = async () => ({ passwordHash: null });
  t.after(() => { prisma.user.findUnique = originalFindUnique; });

  await assert.rejects(authService.assertReauthentication("user-1"), {
    code: "REAUTHENTICATION_REQUIRED",
  });
});
