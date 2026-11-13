const { randomBytes } = require("node:crypto");
const prisma = require("../config/prisma");
const { signAccessToken } = require("../utils/jwt");
const { hashPassword, verifyPassword, hashRefreshToken } = require("../utils/hash");
const { isAdminAllowlisted } = require("../utils/adminAccess");
const { AppError } = require("../utils/errors");

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  avatarUrl: true,
};
const providerConfig = {
  google: {
    prismaProvider: "GOOGLE",
    clientIdEnv: "GOOGLE_CLIENT_ID",
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    jwksUrl: "https://www.googleapis.com/oauth2/v3/certs",
  },
  apple: {
    prismaProvider: "APPLE",
    clientIdEnv: "APPLE_CLIENT_ID",
    issuer: "https://appleid.apple.com",
    jwksUrl: "https://appleid.apple.com/auth/keys",
  },
};
const remoteKeys = new Map();

function createRefreshToken() {
  return randomBytes(48).toString("base64url");
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
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: input.name.trim(),
          email,
          passwordHash,
          role: input.role,
        },
        select: publicUserSelect,
      });
      return createSession(user, tx);
    });
  } catch (error) {
    if (error && error.code === "P2002") {
      throw new AppError(409, "EMAIL_IN_USE", "Nu s-a putut crea contul cu datele furnizate.");
    }
    throw error;
  }
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
  if (user.role === "ADMIN" && !(await isAdminAllowlisted(user.email))) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Email sau parolă incorectă.");
  }

  const { passwordHash, isBlocked, ...safeUser } = user;
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

async function loginWithProvider(provider, input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new AppError(400, "VALIDATION_ERROR", "Datele de autentificare sunt invalide.");
  }
  if (!["CLIENT", "FREELANCER"].includes(input.role)) {
    throw new AppError(400, "VALIDATION_ERROR", "Rolul trebuie să fie CLIENT sau FREELANCER.");
  }

  const config = getProvider(provider);
  const claims = await verifyProviderCredential(provider, input.credential, input.nonce);
  const nonceHash = hashRefreshToken(input.nonce);
  const email = claims.email.trim().toLowerCase();
  const displayName =
    (provider === "google" && typeof claims.name === "string" && claims.name) ||
    (provider === "apple" && typeof input.name === "string" && input.name) ||
    (provider === "apple" &&
      input.name &&
      [input.name.firstName, input.name.lastName].filter((part) => typeof part === "string").join(" ")) ||
    email.split("@")[0];
  const name = displayName.trim().slice(0, 80) || email.split("@")[0];

  const consumed = await prisma.oAuthChallenge.updateMany({
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

  try {
    return await prisma.$transaction(async (tx) => {
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
        const { passwordHash, isBlocked, ...safeUser } = linkedAccount.user;
        return createSession(safeUser, tx, linkedAccount.user.tokenVersion);
      }

      const existingUser = await tx.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new AppError(
          409,
          "ACCOUNT_LINK_REQUIRED",
          "Există deja un cont cu acest email. Autentifică-te cu metoda existentă; asocierea automată a conturilor este dezactivată.",
        );
      }

      const user = await tx.user.create({
        data: {
          email,
          name,
          role: input.role,
          passwordHash: null,
          oauthAccounts: {
            create: {
              provider: config.prismaProvider,
              providerUserId: claims.sub,
            },
          },
        },
        select: publicUserSelect,
      });
      return createSession(user, tx);
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
        const { passwordHash, isBlocked, ...safeUser } = linkedAccount.user;
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

    const { passwordHash, isBlocked, ...safeUser } = stored.user;
    return createSession(safeUser, tx, stored.user.tokenVersion);
  });
}

async function logout(userId) {
  await prisma.$transaction([
    prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    }),
  ]);
}

module.exports = {
  register,
  login,
  loginWithProvider,
  createOAuthChallenge,
  refresh,
  logout,
  publicUserSelect,
};