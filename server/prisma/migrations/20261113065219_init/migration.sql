/*
  Warnings:

  - You are about to drop the column `revokedAt` on the `RefreshToken` table. All the data in the column will be lost.
  - You are about to drop the column `tokenHash` on the `RefreshToken` table. All the data in the column will be lost.
  - You are about to drop the column `tokenVersion` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `ClientProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FreelancerProfile` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[token]` on the table `RefreshToken` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `token` to the `RefreshToken` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ClientProfile" DROP CONSTRAINT "ClientProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "FreelancerProfile" DROP CONSTRAINT "FreelancerProfile_userId_fkey";

-- DropIndex
DROP INDEX "RefreshToken_tokenHash_key";

-- DropIndex
DROP INDEX "RefreshToken_userId_expiresAt_idx";

-- AlterTable
ALTER TABLE "RefreshToken" DROP COLUMN "revokedAt",
DROP COLUMN "tokenHash",
ADD COLUMN     "token" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "tokenVersion";

-- DropTable
DROP TABLE "ClientProfile";

-- DropTable
DROP TABLE "FreelancerProfile";

-- DropEnum
DROP TYPE "Availability";

-- DropEnum
DROP TYPE "Level";

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");
