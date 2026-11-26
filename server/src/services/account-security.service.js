const { randomBytes } = require("node:crypto");
const prisma = require("../config/prisma");
const { hashPassword, hashRefreshToken } = require("../utils/hash");
const { AppError } = require("../utils/errors");
const { writeAuditLog } = require("../utils/auditLog");
const emailService = require("./email.service");

const EMAIL_VERIFICATION_TTL_MS = 30 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 20 * 60 * 1000;
const genericRequestMessage = "Dacă există un cont eligibil, vei primi un email cu instrucțiunile.";

function getFrontendUrl() {
  const configuredUrl = process.env.FRONTEND_URL;
  if (!configuredUrl) {
    throw new AppError(503, "EMAIL_NOT_CONFIGURED", "Linkurile pentru email nu sunt configurate.");
  }
  try {
    const url = new URL(configuredUrl);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Unsupported protocol.");
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
      throw new Error("Production email links must use HTTPS.");
    }
    return url;
  } catch {
    throw new AppError(503, "EMAIL_NOT_CONFIGURED", "Linkurile pentru email nu sunt configurate corect.");
  }
}

function assertEmailReady() {
  emailService.getEmailConfig();
  getFrontendUrl();
}

function buildActionUrl(parameter, token) {
  const url = getFrontendUrl();
  url.pathname = parameter === "verifyEmailToken" ? "/verify-email" : "/reset-password";
  url.searchParams.set("token", token);
  url.hash = "";
  return url.toString();
}

function tokenExpiry(purpose, now) {
  return new Date(now.getTime() + (
    purpose === "EMAIL_VERIFICATION" ? EMAIL_VERIFICATION_TTL_MS : PASSWORD_RESET_TTL_MS
  ));
}

async function createAccountToken(userId, purpose, db = prisma) {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  await db.$transaction(async (tx) => {
    await tx.accountToken.updateMany({
      where: { userId, purpose, consumedAt: null },
      data: { consumedAt: now },
    });
    await tx.accountToken.create({
      data: {
        userId,
        purpose,
        tokenHash: hashRefreshToken(token),
        expiresAt: tokenExpiry(purpose, now),
      },
    });
  });
  return token;
}

async function sendVerificationEmail(user, db = prisma) {
  assertEmailReady();
  const token = await createAccountToken(user.id, "EMAIL_VERIFICATION", db);
  await emailService.sendEmail({
    to: user.email,
    subject: "Verifică adresa de email FairMatch",
    text: `Salut ${user.name},\n\nVerifică adresa de email deschizând linkul de mai jos. Linkul expiră în 30 de minute.\n\n${buildActionUrl("verifyEmailToken", token)}\n\nDacă nu ai creat acest cont, ignoră acest email.`,
  });
}

async function sendPendingRegistrationEmail(registration, token) {
  await emailService.sendEmail({
    to: registration.email,
    subject: "Verifică adresa de email FairMatch",
    text: `Salut ${registration.name},\n\nVerifică adresa de email deschizând linkul de mai jos. Linkul expiră în 30 de minute.\n\n${buildActionUrl("verifyEmailToken", token)}\n\nDacă nu ai solicitat crearea acestui cont, ignoră acest email.`,
  });
}

async function createPendingRegistration(registration) {
  assertEmailReady();
  const existingUser = await prisma.user.findUnique({
    where: { email: registration.email },
    select: { id: true },
  });
  if (existingUser) {
    throw new AppError(409, "EMAIL_IN_USE", "Această adresă de email este deja înregistrată.");
  }

  const token = randomBytes(32).toString("base64url");
  const pending = await prisma.pendingRegistration.upsert({
    where: { email: registration.email },
    create: {
      ...registration,
      tokenHash: hashRefreshToken(token),
      expiresAt: tokenExpiry("EMAIL_VERIFICATION", new Date()),
    },
    update: {
      ...registration,
      tokenHash: hashRefreshToken(token),
      expiresAt: tokenExpiry("EMAIL_VERIFICATION", new Date()),
    },
  });
  await sendPendingRegistrationEmail(pending, token);
}

async function requestEmailVerification(email) {
  assertEmailReady();
  const normalizedEmail = email.trim().toLowerCase();
  const pending = await prisma.pendingRegistration.findUnique({
    where: { email: normalizedEmail },
  });
  if (pending) {
    const token = randomBytes(32).toString("base64url");
    const updated = await prisma.pendingRegistration.update({
      where: { id: pending.id },
      data: {
        tokenHash: hashRefreshToken(token),
        expiresAt: tokenExpiry("EMAIL_VERIFICATION", new Date()),
      },
    });
    await sendPendingRegistrationEmail(updated, token);
    return { message: genericRequestMessage };
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true, name: true, emailVerifiedAt: true },
  });
  if (user && !user.emailVerifiedAt) await sendVerificationEmail(user);
  return { message: genericRequestMessage };
}

async function consumeEmailVerification(tx, token) {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{40,64}$/.test(token)) {
    throw new AppError(400, "INVALID_EMAIL_TOKEN", "Linkul de verificare este invalid sau a expirat.");
  }

  const now = new Date();
  const tokenHash = hashRefreshToken(token);
  const pending = await tx.pendingRegistration.findUnique({ where: { tokenHash } });
  if (pending) {
    if (pending.expiresAt <= now) {
      throw new AppError(400, "INVALID_EMAIL_TOKEN", "Linkul de verificare este invalid sau a expirat.");
    }

    const deleted = await tx.pendingRegistration.deleteMany({
      where: {
        id: pending.id,
        tokenHash,
        expiresAt: { gt: now },
      },
    });
    if (deleted.count !== 1) {
      throw new AppError(400, "INVALID_EMAIL_TOKEN", "Linkul de verificare este invalid sau a expirat.");
    }
    return { registration: pending };
  }

  const record = await tx.accountToken.findUnique({ where: { tokenHash } });
  if (
    !record ||
    record.purpose !== "EMAIL_VERIFICATION" ||
    record.consumedAt ||
    record.expiresAt <= now
  ) {
    throw new AppError(400, "INVALID_EMAIL_TOKEN", "Linkul de verificare este invalid sau a expirat.");
  }

  const consumed = await tx.accountToken.updateMany({
    where: {
      id: record.id,
      consumedAt: null,
      expiresAt: { gt: now },
    },
    data: { consumedAt: now },
  });
  if (consumed.count !== 1) {
    throw new AppError(400, "INVALID_EMAIL_TOKEN", "Linkul de verificare este invalid sau a expirat.");
  }

  const user = await tx.user.update({
    where: { id: record.userId },
    data: { emailVerifiedAt: now },
  });
  return { user };
}

async function requestPasswordReset(email) {
  assertEmailReady();
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, email: true, emailVerifiedAt: true },
  });
  if (!user || !user.emailVerifiedAt) return { message: genericRequestMessage };

  const token = await createAccountToken(user.id, "PASSWORD_RESET");
  await emailService.sendEmail({
    to: user.email,
    subject: "Resetează parola FairMatch",
    text: `A fost solicitată resetarea parolei contului tău FairMatch. Linkul expiră în 20 de minute:\n\n${buildActionUrl("resetPasswordToken", token)}\n\nDacă nu ai solicitat resetarea, ignoră acest email.`,
  });
  return { message: genericRequestMessage };
}

function validateNewPassword(password) {
  if (
    typeof password !== "string" ||
    password.length < 12 ||
    Buffer.byteLength(password) > 256
  ) {
    throw new AppError(400, "VALIDATION_ERROR", "Parola trebuie să aibă cel puțin 12 caractere.");
  }
}

async function resetPassword(token, newPassword) {
  validateNewPassword(newPassword);
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{40,64}$/.test(token)) {
    throw new AppError(400, "INVALID_PASSWORD_RESET_TOKEN", "Linkul de resetare este invalid sau a expirat.");
  }

  const now = new Date();
  const tokenHash = hashRefreshToken(token);
  const record = await prisma.accountToken.findUnique({ where: { tokenHash } });
  if (
    !record ||
    record.purpose !== "PASSWORD_RESET" ||
    record.consumedAt ||
    record.expiresAt <= now
  ) {
    throw new AppError(400, "INVALID_PASSWORD_RESET_TOKEN", "Linkul de resetare este invalid sau a expirat.");
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction(async (tx) => {
    const consumed = await tx.accountToken.updateMany({
      where: {
        id: record.id,
        consumedAt: null,
        expiresAt: { gt: now },
      },
      data: { consumedAt: now },
    });
    if (consumed.count !== 1) {
      throw new AppError(400, "INVALID_PASSWORD_RESET_TOKEN", "Linkul de resetare este invalid sau a expirat.");
    }

    await tx.user.update({
      where: { id: record.userId },
      data: { passwordHash, tokenVersion: { increment: 1 } },
    });
    await tx.refreshToken.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: now },
    });
    await tx.accountToken.updateMany({
      where: {
        userId: record.userId,
        purpose: "PASSWORD_RESET",
        consumedAt: null,
      },
      data: { consumedAt: now },
    });
  });
  writeAuditLog("account.password_reset", { actorId: record.userId, resourceId: record.userId });
}

module.exports = {
  assertEmailReady,
  createPendingRegistration,
  sendVerificationEmail,
  requestEmailVerification,
  consumeEmailVerification,
  requestPasswordReset,
  resetPassword,
  validateNewPassword,
};
