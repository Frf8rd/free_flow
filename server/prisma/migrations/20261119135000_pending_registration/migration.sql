CREATE TABLE "PendingRegistration" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PendingRegistration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PendingRegistration_email_key" ON "PendingRegistration"("email");
CREATE UNIQUE INDEX "PendingRegistration_tokenHash_key" ON "PendingRegistration"("tokenHash");
CREATE INDEX "PendingRegistration_expiresAt_idx" ON "PendingRegistration"("expiresAt");
