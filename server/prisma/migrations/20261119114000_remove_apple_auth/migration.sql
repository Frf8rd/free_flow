BEGIN;

DELETE FROM "OAuthAccount" WHERE "provider"::TEXT = 'APPLE';
DELETE FROM "OAuthChallenge" WHERE "provider"::TEXT = 'APPLE';

CREATE TYPE "AuthProvider_new" AS ENUM ('GOOGLE');

ALTER TABLE "OAuthAccount"
    ALTER COLUMN "provider" TYPE "AuthProvider_new"
    USING ("provider"::TEXT::"AuthProvider_new");

ALTER TABLE "OAuthChallenge"
    ALTER COLUMN "provider" TYPE "AuthProvider_new"
    USING ("provider"::TEXT::"AuthProvider_new");

ALTER TYPE "AuthProvider" RENAME TO "AuthProvider_old";
ALTER TYPE "AuthProvider_new" RENAME TO "AuthProvider";
DROP TYPE "AuthProvider_old";

COMMIT;
