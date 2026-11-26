const { randomBytes, randomUUID } = require("node:crypto");
const prisma = require("../config/prisma");
const { signAccessToken } = require("../utils/jwt");
const { hashPassword, verifyPassword, hashRefreshToken } = require("../utils/hash");
const { isAdminAllowlisted } = require("../utils/adminAccess");
const { AppError } = require("../utils/errors");
const { writeAuditLog } = require("../utils/auditLog");
const accountSecurity = require("./account-security.service");

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  avatarUrl: true,
  dashboardBackgroundUrl: true,
};
const providerConfig = {
  google: {
    prismaProvider: "GOOGLE",
    clientIdEnv: "GOOGLE_CLIENT_ID",
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    jwksUrl: "https://www.googleapis.com/oauth2/v3/certs",
  },
};
const remoteKeys = new Map();

function createRefreshToken() {
  return randomBytes(48).toString("base64url");
}

function toSessionUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
    dashboardBackgroundUrl: user.dashboardBackgroundUrl,
    hasPassword: Boolean(user.passwordHash),
  };
}

function validateCredentials({ name, email, password, role }, registering) {
  if (registering && (typeof name !== "string" || !name.trim() || name.trim().length > 80)) {
    throw new AppError(400, "VALIDATION_ERROR", "Numele este obligatoriu (maximum 80 de caractere).");
  }
  if (
    typeof email !== "string" ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    throw new AppError(400, "VALIDATION_ERROR", "Adresa de email nu este validă.");
  }
  if (
    typeof password !== "string" ||
    (registering && (password.length < 12 || Buffer.byteLength(password) > 256)) ||
    (!registering && (password.length === 0 || Buffer.byteLength(password) > 256))
  ) {
    throw new AppError(400, "VALIDATION_ERROR", "Parola trebuie să aibă cel puțin 12 caractere.");
  }
  if (registering && !["CLIENT", "FREELANCER"].includes(role)) {
    throw new AppError(400, "VALIDATION_ERROR", "Rolul trebuie să fie CLIENT sau FREELANCER.");
  }
}

function getProvider(provider) {
  const config = providerConfig[provider];
  if (!config) {
    throw new AppError(400, "UNSUPPORTED_PROVIDER", "Furnizorul de autentificare nu este acceptat.");
  }
  const clientId = process.env[config.clientIdEnv];
  if (!clientId) {
    throw new AppError(503, "PROVIDER_NOT_CONFIGURED", "Autentificarea prin acest furnizor nu este configurată.");
  }
  return { ...config, clientId };
}

async function createSession(user, tx = prisma, tokenVersion = 0) {
  const refreshToken = createRefreshToken();
  await tx.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });
  return {
    user,
    accessToken: signAccessToken(user, tokenVersion),
    refreshToken,
  };
}

async function register(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new AppError(400, "VALIDATION_ERROR", "Date de înregistrare invalide.");
  }
  validateCredentials(input, true);

  const passwordHash = await hashPassword(input.password);
  const email = input.email.trim().toLowerCase();
  try {
    await accountSecurity.createPendingRegistration({
      name: input.name.trim(),
      email,
      passwordHash,
      role: input.role,
    });
    return { emailVerificationRequired: true, email };
  } catch (error) {
    if (error instanceof AppError && error.code !== "EMAIL_IN_USE") throw error;
    if (error instanceof AppError || error?.code === "P2002") return { emailVerificationRequired: true, email };
    throw error;
  }
}

async function verifyEmail(token) {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{40,64}$/.test(token)) {
    throw new AppError(400, "INVALID_EMAIL_TOKEN", "Linkul de verificare este invalid sau a expirat.");
  }
  const verifiedUser = await prisma.$transaction(async (tx) => {
    const verification = await accountSecurity.consumeEmailVerification(tx, token);
    return verification.registration
      ? await tx.user.create({
        data: {
          name: verification.registration.name,
          email: verification.registration.email,
          passwordHash: verification.registration.passwordHash,
          role: verification.registration.role,
          emailVerifiedAt: new Date(),
          ...(verification.registration.role === "CLIENT" ? { clientProfile: { create: {} } } : { freelancerProfile: { create: {} } }),
        },
      })
      : verification.user;
  });
  writeAuditLog("account.email_verified", {
    actorId: verifiedUser.id,
    resourceId: verifiedUser.id,
  });
  return { email: verifiedUser.email };
}

async function login(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new AppError(400, "VALIDATION_ERROR", "Date de autentificare invalide.");
  }
  validateCredentials(input, false);

  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  const passwordMatches = await verifyPassword(input.password, user?.passwordHash || "");
  if (!user || user.isBlocked || !passwordMatches) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Email sau parolă incorectă.");
  }
  if (!user.emailVerifiedAt) {
    throw new AppError(403, "EMAIL_NOT_VERIFIED", "Verifică adresa de email înainte de autentificare.");
  }
  if (user.role === "ADMIN" && !(await isAdminAllowlisted(user.email))) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Email sau parolă incorectă.");
  }

  const safeUser = toSessionUser(user);
  return createSession(safeUser, prisma, user.tokenVersion);
}

async function createOAuthChallenge(provider) {
  const config = getProvider(provider);
  const nonce = randomBytes(32).toString("base64url");
  await prisma.oAuthChallenge.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  await prisma.oAuthChallenge.create({
    data: {
      provider: config.prismaProvider,
      nonceHash: hashRefreshToken(nonce),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });
  return { nonce };
}

async function verifyProviderCredential(provider, credential, nonce) {
  const config = getProvider(provider);
  if (typeof credential !== "string" || credential.length > 12_000) {
    throw new AppError(400, "INVALID_PROVIDER_CREDENTIAL", "Tokenul furnizorului este invalid.");
  }
  if (typeof nonce !== "string" || !/^[A-Za-z0-9_-]{40,64}$/.test(nonce)) {
    throw new AppError(400, "INVALID_OAUTH_CHALLENGE", "Cererea de autentificare a expirat sau nu este validă.");
  }

  const { createRemoteJWKSet, jwtVerify } = await import("jose");
  let jwks = remoteKeys.get(provider);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(config.jwksUrl));
    remoteKeys.set(provider, jwks);
  }

  let claims;
  try {
    const result = await jwtVerify(credential, jwks, {
      issuer: config.issuer,
      audience: config.clientId,
    });
    claims = result.payload;
  } catch {
    throw new AppError(401, "INVALID_PROVIDER_CREDENTIAL", "Tokenul furnizorului este invalid sau expirat.");
  }

  if (
    typeof claims.sub !== "string" ||
    !claims.sub ||
    claims.nonce !== nonce ||
    typeof claims.email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(claims.email) ||
    !(claims.email_verified === true || claims.email_verified === "true")
  ) {
    throw new AppError(401, "INVALID_PROVIDER_CREDENTIAL", "Identitatea furnizorului nu a putut fi verificată.");
  }

  return claims;
}

async function linkGoogleAccountToExistingAdmin(tx, user, providerUserId) {
  if (user.isBlocked) {
    throw new AppError(403, "ACCOUNT_BLOCKED", "Contul este dezactivat.");
  }
  if (user.role !== "ADMIN") {
    throw new AppError(409, "ACCOUNT_LINK_REQUIRED", "Autentifică-te mai întâi cu metoda existentă a contului.");
  }
  if (!(await isAdminAllowlisted(user.email, tx))) {
    throw new AppError(403, "ADMIN_NOT_ALLOWLISTED", "Contul nu este autorizat ca administrator.");
  }

  await tx.oAuthAccount.create({
    data: {
      provider: "GOOGLE",
      providerUserId,
      userId: user.id,
    },
  });
  const verifiedUser = user.emailVerifiedAt !== null
    ? user
    : await tx.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    });
  const safeUser = toSessionUser(verifiedUser);
  return createSession(safeUser, tx, user.tokenVersion);
}

async function loginWithProvider(provider, input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new AppError(400, "VALIDATION_ERROR", "Datele de autentificare sunt invalide.");
  }
  if (!["CLIENT", "FREELANCER"].includes(input.role)) {
    throw new AppError(400, "VALIDATION_ERROR", "Rolul trebuie să fie CLIENT sau FREELANCER.");
  }
  const intent = input.intent ?? "login";
  if (!["login", "register"].includes(intent)) {
    throw new AppError(400, "VALIDATION_ERROR", "Tipul autentificării este invalid.");
  }

  const config = getProvider(provider);
  const claims = await verifyProviderCredential(provider, input.credential, input.nonce);
  const nonceHash = hashRefreshToken(input.nonce);
  const email = claims.email.trim().toLowerCase();
  const displayName = (typeof claims.name === "string" && claims.name) || email.split("@")[0];
  const name = displayName.trim().slice(0, 80) || email.split("@")[0];

  try {
    return await prisma.$transaction(async (tx) => {
      const consumed = await tx.oAuthChallenge.updateMany({
        where: {
          provider: config.prismaProvider,
          nonceHash,
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { consumedAt: new Date() },
      });
      if (consumed.count !== 1) {
        throw new AppError(401, "INVALID_OAUTH_CHALLENGE", "Cererea de autentificare a expirat sau a fost deja folosită.");
      }

      const linkedAccount = await tx.oAuthAccount.findUnique({
        where: {
          provider_providerUserId: {
            provider: config.prismaProvider,
            providerUserId: claims.sub,
          },
        },
        include: { user: true },
      });

      if (linkedAccount) {
        if (linkedAccount.user.isBlocked) {
          throw new AppError(403, "ACCOUNT_BLOCKED", "Contul este dezactivat.");
        }
        if (
          linkedAccount.user.role === "ADMIN" &&
          !(await isAdminAllowlisted(linkedAccount.user.email, tx))
        ) {
          throw new AppError(403, "ADMIN_NOT_ALLOWLISTED", "Contul nu este autorizat ca administrator.");
        }
        const linkedUser = linkedAccount.user.emailVerifiedAt !== null
          ? linkedAccount.user
          : await tx.user.update({
            where: { id: linkedAccount.user.id },
            data: { emailVerifiedAt: new Date() },
          });
        const safeUser = toSessionUser(linkedUser);
        return createSession(safeUser, tx, linkedAccount.user.tokenVersion);
      }

      const existingUser = await tx.user.findUnique({ where: { email } });
      if (existingUser) {
        if (intent === "register") {
          throw new AppError(409, "ACCOUNT_ALREADY_EXISTS", "Există deja un cont cu acest email. Autentifică-te în schimb.");
        }
        if (provider === "google") {
          return linkGoogleAccountToExistingAdmin(tx, existingUser, claims.sub);
        }
        throw new AppError(409, "ACCOUNT_LINK_REQUIRED", "Există deja un cont cu acest email.");
      }

      if (intent === "login") {
        throw new AppError(404, "ACCOUNT_NOT_FOUND", "Nu există încă un cont cu acest Google. Înregistrează-te mai întâi.");
      }

      const user = await tx.user.create({
        data: {
          email,
          name,
          role: input.role,
          passwordHash: null,
          emailVerifiedAt: new Date(),
          ...(input.role === "CLIENT" ? { clientProfile: { create: {} } } : { freelancerProfile: { create: {} } }),
          oauthAccounts: {
            create: {
              provider: config.prismaProvider,
              providerUserId: claims.sub,
            },
          },
        },
        select: publicUserSelect,
      });
      return createSession(toSessionUser(user), tx);
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error && error.code === "P2002") {
      const linkedAccount = await prisma.oAuthAccount.findUnique({
        where: {
          provider_providerUserId: {
            provider: config.prismaProvider,
            providerUserId: claims.sub,
          },
        },
        include: { user: true },
      });
      if (linkedAccount && !linkedAccount.user.isBlocked) {
        if (
          linkedAccount.user.role === "ADMIN" &&
          !(await isAdminAllowlisted(linkedAccount.user.email))
        ) {
          throw new AppError(403, "ADMIN_NOT_ALLOWLISTED", "Contul nu este autorizat ca administrator.");
        }
        const safeUser = toSessionUser(linkedAccount.user);
        return createSession(safeUser, prisma, linkedAccount.user.tokenVersion);
      }
      throw new AppError(409, "ACCOUNT_LINK_REQUIRED", "Nu s-a putut asocia acest cont.");
    }
    throw error;
  }
}

async function refresh(refreshToken) {
  if (typeof refreshToken !== "string" || refreshToken.length < 32 || refreshToken.length > 256) {
    throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token invalid sau expirat.");
  }
  const tokenHash = hashRefreshToken(refreshToken);

  return prisma.$transaction(async (tx) => {
    const stored = await tx.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (
      !stored ||
      stored.revokedAt ||
      stored.expiresAt <= new Date() ||
      stored.user.isBlocked ||
      (stored.user.role === "ADMIN" && !(await isAdminAllowlisted(stored.user.email, tx)))
    ) {
      throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token invalid sau expirat.");
    }

    const revoked = await tx.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (revoked.count !== 1) {
      throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token invalid sau expirat.");
    }

    const safeUser = toSessionUser(stored.user);
    return createSession(safeUser, tx, stored.user.tokenVersion);
  });
}

async function verifyGoogleReauthentication(userId, proof) {
  if (!proof || typeof proof.credential !== "string" || typeof proof.nonce !== "string") {
    throw new AppError(401, "REAUTHENTICATION_REQUIRED", "Reautentifică-te înainte de această operație.");
  }
  const config = getProvider("google");
  const claims = await verifyProviderCredential("google", proof.credential, proof.nonce);
  const consumed = await prisma.oAuthChallenge.updateMany({
    where: {
      provider: config.prismaProvider,
      nonceHash: hashRefreshToken(proof.nonce),
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: { consumedAt: new Date() },
  });
  if (consumed.count !== 1) {
    throw new AppError(401, "REAUTHENTICATION_REQUIRED", "Reautentifică-te înainte de această operație.");
  }

  const linkedAccount = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerUserId: {
        provider: config.prismaProvider,
        providerUserId: claims.sub,
      },
    },
    select: { userId: true },
  });
  if (!linkedAccount || linkedAccount.userId !== userId) {
    throw new AppError(401, "REAUTHENTICATION_FAILED", "Contul Google nu corespunde utilizatorului autentificat.");
  }
}

function validateReauthenticationProof(proof) {
  if (proof === undefined || proof === null) return;
  if (typeof proof !== "object" || Array.isArray(proof)) {
    throw new AppError(400, "VALIDATION_ERROR", "Date de reautentificare invalide.");
  }

  const allowedFields = new Set(["password", "credential", "nonce"]);
  if (Object.keys(proof).some((field) => !allowedFields.has(field))) {
    throw new AppError(400, "VALIDATION_ERROR", "Date de reautentificare invalide.");
  }
  if (
    (proof.password !== undefined &&
      (typeof proof.password !== "string" || Buffer.byteLength(proof.password) > 256)) ||
    (proof.credential !== undefined &&
      (typeof proof.credential !== "string" || proof.credential.length > 12_000)) ||
    (proof.nonce !== undefined &&
      (typeof proof.nonce !== "string" || !/^[A-Za-z0-9_-]{40,64}$/.test(proof.nonce))) ||
    ((proof.credential === undefined) !== (proof.nonce === undefined)) ||
    (proof.password !== undefined && proof.credential !== undefined)
  ) {
    throw new AppError(400, "VALIDATION_ERROR", "Date de reautentificare invalide.");
  }
}

async function assertReauthentication(userId, proof) {
  validateReauthenticationProof(proof);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user) throw new AppError(401, "INVALID_TOKEN", "Sesiune invalidă sau expirată.");

  if (user.passwordHash) {
    if (
      !proof ||
      typeof proof.password !== "string" ||
      !(await verifyPassword(proof.password, user.passwordHash))
    ) {
      throw new AppError(401, "REAUTHENTICATION_FAILED", "Parola curentă este incorectă.");
    }
    return;
  }
  await verifyGoogleReauthentication(userId, proof);
}

async function deleteAccount(userId, proof) {
  await assertReauthentication(userId, proof);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, avatarUrl: true, dashboardBackgroundUrl: true },
  });
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "Contul nu a fost găsit.");
  if (user.role === "ADMIN") throw new AppError(403, "FORBIDDEN", "Conturile de administrator nu pot fi șterse din setările personale.");

  await prisma.$transaction(async (tx) => {
    await Promise.all([
      tx.refreshToken.deleteMany({ where: { userId } }),
      tx.oAuthAccount.deleteMany({ where: { userId } }),
      tx.accountToken.deleteMany({ where: { userId } }),
      tx.notification.deleteMany({ where: { userId } }),
      tx.freelancerProfile.deleteMany({ where: { userId } }),
      tx.clientProfile.deleteMany({ where: { userId } }),
      tx.pendingRegistration.deleteMany({ where: { email: user.email } }),
    ]);
    await tx.user.update({
      where: { id: userId },
      data: {
        email: `deleted-${randomUUID()}@deleted.invalid`,
        name: "Cont șters",
        passwordHash: null,
        avatarUrl: null,
        dashboardBackgroundUrl: null,
        emailVerifiedAt: null,
        isBlocked: true,
        tokenVersion: { increment: 1 },
      },
    });
  });

  const storage = require("../utils/publicImageStorage");
  const imageKeys = [...new Set([user.avatarUrl, user.dashboardBackgroundUrl]
    .map((url) => typeof url === "string" ? url.match(/([a-f0-9-]{36}\.webp)(?:$|[?#])/i)?.[1] : null)
    .filter(Boolean))];
  await Promise.all(imageKeys.map((key) => storage.remove(key).catch((error) => {
    console.error("Deleted account image cleanup failed.", { code: error?.code || "UNKNOWN" });
  })));
}

async function changePassword(userId, input) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).some((field) => !["oldPassword", "newPassword", "credential", "nonce"].includes(field)) ||
    typeof input.newPassword !== "string" ||
    input.newPassword.length < 12 ||
    Buffer.byteLength(input.newPassword) > 256 ||
    (input.oldPassword !== undefined && typeof input.oldPassword !== "string")
  ) {
    throw new AppError(400, "VALIDATION_ERROR", "Parola nouă trebuie să aibă cel puțin 12 caractere.");
  }

  await assertReauthentication(userId, {
    password: input.oldPassword,
    credential: input.credential,
    nonce: input.nonce,
  });
  const now = new Date();
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await hashPassword(input.newPassword),
        tokenVersion: { increment: 1 },
      },
    }),
    prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now },
    }),
  ]);
}

async function logout(userId, refreshToken) {
  if (typeof refreshToken !== "string" || refreshToken.length < 32 || refreshToken.length > 256) return;
  await prisma.refreshToken.updateMany({
    where: { userId, tokenHash: hashRefreshToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

module.exports = {
  register,
  verifyEmail,
  login,
  loginWithProvider,
  createOAuthChallenge,
  linkGoogleAccountToExistingAdmin,
  refresh,
  assertReauthentication,
  deleteAccount,
  changePassword,
  logout,
  publicUserSelect,
};
