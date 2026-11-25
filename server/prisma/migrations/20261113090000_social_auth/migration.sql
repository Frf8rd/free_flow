CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE', 'APPLE');

ALTER TABLE "User"
    ALTER COLUMN "passwordHash" DROP NOT NULL,
    ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;

UPDATE "RefreshToken"
SET "token" = encode(digest(convert_to("token", 'UTF8'), 'sha256'), 'hex');

DROP INDEX IF EXISTS "RefreshToken_token_key";
ALTER TABLE "RefreshToken" RENAME COLUMN "token" TO "tokenHash";
ALTER TABLE "RefreshToken" ADD COLUMN "revokedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "RefreshToken_userId_expiresAt_idx"
    ON "RefreshToken"("userId", "expiresAt");

CREATE TABLE "OAuthAccount" (
    "id" TEXT NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OAuthAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OAuthChallenge" (
    "id" TEXT NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "nonceHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OAuthChallenge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OAuthAccount_provider_providerUserId_key"
    ON "OAuthAccount"("provider", "providerUserId");
CREATE UNIQUE INDEX "OAuthAccount_userId_provider_key"
    ON "OAuthAccount"("userId", "provider");
CREATE UNIQUE INDEX "OAuthChallenge_nonceHash_key" ON "OAuthChallenge"("nonceHash");
CREATE INDEX "OAuthChallenge_provider_expiresAt_idx" ON "OAuthChallenge"("provider", "expiresAt");

ALTER TABLE "OAuthAccount"
    ADD CONSTRAINT "OAuthAccount_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
