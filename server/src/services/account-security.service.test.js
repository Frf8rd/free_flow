const test = require("node:test");
const assert = require("node:assert/strict");
const prisma = require("../config/prisma");
const accountSecurity = require("./account-security.service");
const emailService = require("./email.service");
const { hashRefreshToken } = require("../utils/hash");

test("SMTP configuration rejects invalid port and secure values", (t) => {
  const keys = ["SMTP_HOST", "SMTP_PORT", "SMTP_SECURE", "SMTP_USER", "SMTP_PASSWORD", "EMAIL_FROM"];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  t.after(() => {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  });

  Object.assign(process.env, {
    SMTP_HOST: "smtp.example.com",
    SMTP_PORT: "not-a-port",
    SMTP_SECURE: "false",
    EMAIL_FROM: "FairMatch <no-reply@example.com>",
  });
  assert.throws(() => emailService.getSmtpConfig(), { code: "EMAIL_NOT_CONFIGURED" });

  process.env.SMTP_PORT = "587";
  process.env.SMTP_SECURE = "sometimes";
  assert.throws(() => emailService.getSmtpConfig(), { code: "EMAIL_NOT_CONFIGURED" });
});

test("email verification rejects malformed tokens before querying storage", async () => {
  await assert.rejects(accountSecurity.consumeEmailVerification({}, "invalid"), {
    code: "INVALID_EMAIL_TOKEN",
  });
});

test("email verification rejects a token consumed by a concurrent request", async () => {
  const tokenHash = hashRefreshToken("A".repeat(43));
  let userUpdated = false;
  const tx = {
    pendingRegistration: {
      findUnique: async () => null,
    },
    accountToken: {
      findUnique: async () => ({
        id: "token-1",
        userId: "user-1",
        purpose: "EMAIL_VERIFICATION",
        consumedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      }),
      updateMany: async () => ({ count: 0 }),
    },
    user: {
      update: async () => { userUpdated = true; },
    },
  };

  await assert.rejects(accountSecurity.consumeEmailVerification(tx, "A".repeat(43)), {
    code: "INVALID_EMAIL_TOKEN",
  });
  assert.equal(userUpdated, false);
});

test("pending verification token is consumed only once", async () => {
  const token = "B".repeat(43);
  const registration = {
    id: "pending-1",
    email: "pending@example.com",
    name: "Pending User",
    passwordHash: "hashed-password",
    role: "CLIENT",
    expiresAt: new Date(Date.now() + 60_000),
  };
  let deleted = false;
  const tx = {
    pendingRegistration: {
      findUnique: async () => deleted ? null : registration,
      deleteMany: async ({ where }) => {
        assert.equal(where.id, registration.id);
        assert.equal(where.tokenHash, hashRefreshToken(token));
        deleted = true;
        return { count: 1 };
      },
    },
    accountToken: {
      findUnique: async () => null,
    },
  };

  const result = await accountSecurity.consumeEmailVerification(tx, token);
  assert.equal(result.registration.email, registration.email);
  await assert.rejects(accountSecurity.consumeEmailVerification(tx, token), {
    code: "INVALID_EMAIL_TOKEN",
  });
});

test("pending registration stores no User and emails a one-time verification link", async (t) => {
  const keys = ["NODE_ENV", "FRONTEND_URL", "SMTP_HOST", "SMTP_PORT", "SMTP_SECURE", "EMAIL_FROM"];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  const originalFindUnique = prisma.user.findUnique;
  const originalUpsert = prisma.pendingRegistration.upsert;
  const originalSendEmail = emailService.sendEmail;
  let pendingData;
  let sentEmail;
  process.env.NODE_ENV = "development";
  process.env.FRONTEND_URL = "http://localhost:5173";
  process.env.SMTP_HOST = "smtp.example.com";
  process.env.SMTP_PORT = "587";
  process.env.SMTP_SECURE = "false";
  process.env.EMAIL_FROM = "FairMatch <test@example.com>";
  prisma.user.findUnique = async () => null;
  prisma.pendingRegistration.upsert = async ({ create }) => {
    pendingData = create;
    return create;
  };
  emailService.sendEmail = async (email) => { sentEmail = email; };
  t.after(() => {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
    prisma.user.findUnique = originalFindUnique;
    prisma.pendingRegistration.upsert = originalUpsert;
    emailService.sendEmail = originalSendEmail;
  });

  await accountSecurity.createPendingRegistration({
    email: "new@example.com",
    name: "New User",
    passwordHash: "hashed-password",
    role: "CLIENT",
  });

  assert.equal(pendingData.email, "new@example.com");
  assert.equal(pendingData.passwordHash, "hashed-password");
  assert.match(pendingData.tokenHash, /^[a-f0-9]{64}$/);
  assert.match(sentEmail.text, /verifyEmailToken/);
});

test("password reset validates password strength before token lookup", async () => {
  await assert.rejects(accountSecurity.resetPassword("A".repeat(43), "short"), {
    code: "VALIDATION_ERROR",
  });
});
