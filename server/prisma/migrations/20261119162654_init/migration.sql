/*
  Warnings:

  - The values [ACCEPTED] on the enum `EngagementStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EngagementStatus_new" AS ENUM ('PENDING', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED', 'REJECTED', 'CANCELLED');
ALTER TABLE "public"."Engagement" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Engagement" ALTER COLUMN "status" TYPE "EngagementStatus_new" USING ("status"::text::"EngagementStatus_new");
ALTER TYPE "EngagementStatus" RENAME TO "EngagementStatus_old";
ALTER TYPE "EngagementStatus_new" RENAME TO "EngagementStatus";
DROP TYPE "public"."EngagementStatus_old";
ALTER TABLE "Engagement" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
