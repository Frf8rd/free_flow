CREATE TYPE "Level" AS ENUM ('BEGINNER', 'JUNIOR', 'MID', 'SENIOR');
CREATE TYPE "Availability" AS ENUM ('AVAILABLE', 'LIMITED', 'UNAVAILABLE');
CREATE TYPE "Tier" AS ENUM ('START', 'VERIFIED', 'PROVEN', 'EXPERT');
CREATE TYPE "MatchStatus" AS ENUM ('SUGGESTED', 'FREELANCER_INTERESTED', 'CLIENT_INVITED', 'ACCEPTED', 'DISMISSED');
CREATE TYPE "MatchingStatus" AS ENUM ('PENDING', 'RUNNING', 'DONE', 'FAILED');
CREATE TYPE "RecommendationSide" AS ENUM ('CLIENT', 'FREELANCER');
CREATE TYPE "MatchingJobType" AS ENUM ('PROJECT', 'FREELANCER');

-- Profile tables were accidentally removed by the historical auth migration;
-- recreate the README profile model before adding matching fields.
CREATE TABLE "FreelancerProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL DEFAULT '',
  "bio" TEXT NOT NULL DEFAULT '',
  "level" "Level" NOT NULL DEFAULT 'BEGINNER',
  "hourlyRate" INTEGER,
  "availability" "Availability" NOT NULL DEFAULT 'AVAILABLE',
  "languages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "onboarded" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FreelancerProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClientProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'PERSON',
  "onboarded" BOOLEAN NOT NULL DEFAULT false,
  "companyName" TEXT,
  "description" TEXT,
  "industry" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClientProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FreelancerProfile_userId_key" ON "FreelancerProfile"("userId");
CREATE UNIQUE INDEX "ClientProfile_userId_key" ON "ClientProfile"("userId");
ALTER TABLE "FreelancerProfile" ADD CONSTRAINT "FreelancerProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientProfile" ADD CONSTRAINT "ClientProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FreelancerProfile"
  ADD COLUMN "tier" "Tier" NOT NULL DEFAULT 'START',
  ADD COLUMN "completedCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "matchedAt" TIMESTAMP(3);

ALTER TABLE "Project"
  ADD COLUMN "isStarter" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "matchingStatus" "MatchingStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "matchingError" TEXT,
  ADD COLUMN "matchedAt" TIMESTAMP(3),
  ADD COLUMN "extracted" JSONB,
  ADD COLUMN "embedding" DOUBLE PRECISION[] NOT NULL DEFAULT ARRAY[]::DOUBLE PRECISION[],
  ADD COLUMN "embeddingModel" TEXT,
  ADD COLUMN "embeddingHash" TEXT;

ALTER TABLE "ProjectSkill"
  ADD COLUMN "source" TEXT NOT NULL DEFAULT 'USER';

CREATE TABLE "FreelancerSkill" (
  "freelancerId" TEXT NOT NULL,
  "skillId" TEXT NOT NULL,
  "level" "Level" NOT NULL DEFAULT 'BEGINNER',
  "verified" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "FreelancerSkill_pkey" PRIMARY KEY ("freelancerId", "skillId")
);

CREATE TABLE "PortfolioItem" (
  "id" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "imageUrl" TEXT,
  "link" TEXT,
  "embedding" DOUBLE PRECISION[] NOT NULL DEFAULT ARRAY[]::DOUBLE PRECISION[],
  "embeddingModel" TEXT,
  "embeddingHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Match" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "freelancerId" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "reasons" JSONB NOT NULL,
  "status" "MatchStatus" NOT NULL DEFAULT 'SUGGESTED',
  "dismissReason" TEXT,
  "projectRank" INTEGER,
  "freelancerRank" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecommendationImpression" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "freelancerId" TEXT NOT NULL,
  "viewerUserId" TEXT NOT NULL,
  "side" "RecommendationSide" NOT NULL,
  "rank" INTEGER NOT NULL,
  "slotType" TEXT NOT NULL DEFAULT 'STANDARD',
  "day" DATE NOT NULL,
  "shownAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecommendationImpression_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MatchingJob" (
  "id" TEXT NOT NULL,
  "type" "MatchingJobType" NOT NULL,
  "targetId" TEXT NOT NULL,
  "revision" INTEGER NOT NULL DEFAULT 0,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextRunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lockedAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MatchingJob_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Engagement"
  ADD COLUMN "matchId" TEXT,
  ADD COLUMN "agreedPrice" INTEGER,
  ADD COLUMN "deadline" TIMESTAMP(3),
  ADD COLUMN "usedAi" BOOLEAN;

ALTER TABLE "Conversation"
  ADD COLUMN "projectId" TEXT,
  ADD COLUMN "matchId" TEXT;

UPDATE "Conversation" AS c
SET "projectId" = e."projectId"
FROM "Engagement" AS e
WHERE c."engagementId" = e."id";

ALTER TABLE "Conversation"
  ALTER COLUMN "engagementId" DROP NOT NULL,
  ALTER COLUMN "projectId" SET NOT NULL;

CREATE UNIQUE INDEX "Engagement_matchId_key" ON "Engagement"("matchId");
CREATE INDEX "FreelancerProfile_availability_hourlyRate_idx" ON "FreelancerProfile"("availability", "hourlyRate");
CREATE INDEX "Project_status_matchingStatus_idx" ON "Project"("status", "matchingStatus");
CREATE INDEX "FreelancerSkill_skillId_idx" ON "FreelancerSkill"("skillId");
CREATE INDEX "PortfolioItem_profileId_createdAt_idx" ON "PortfolioItem"("profileId", "createdAt");
CREATE UNIQUE INDEX "Match_projectId_freelancerId_key" ON "Match"("projectId", "freelancerId");
CREATE INDEX "Match_freelancerId_status_idx" ON "Match"("freelancerId", "status");
CREATE INDEX "Match_projectId_score_idx" ON "Match"("projectId", "score");
CREATE INDEX "Match_projectId_projectRank_idx" ON "Match"("projectId", "projectRank");
CREATE INDEX "Match_freelancerId_freelancerRank_idx" ON "Match"("freelancerId", "freelancerRank");
CREATE UNIQUE INDEX "Conversation_matchId_key" ON "Conversation"("matchId");
CREATE INDEX "RecommendationImpression_freelancerId_side_shownAt_idx" ON "RecommendationImpression"("freelancerId", "side", "shownAt");
CREATE INDEX "RecommendationImpression_projectId_side_shownAt_idx" ON "RecommendationImpression"("projectId", "side", "shownAt");
CREATE UNIQUE INDEX "RecommendationImpression_projectId_freelancerId_viewerUserId_side_day_key"
  ON "RecommendationImpression"("projectId", "freelancerId", "viewerUserId", "side", "day");
CREATE UNIQUE INDEX "MatchingJob_type_targetId_key" ON "MatchingJob"("type", "targetId");
CREATE INDEX "MatchingJob_nextRunAt_lockedAt_idx" ON "MatchingJob"("nextRunAt", "lockedAt");

ALTER TABLE "FreelancerSkill" ADD CONSTRAINT "FreelancerSkill_freelancerId_fkey"
  FOREIGN KEY ("freelancerId") REFERENCES "FreelancerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FreelancerSkill" ADD CONSTRAINT "FreelancerSkill_skillId_fkey"
  FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_profileId_fkey"
  FOREIGN KEY ("profileId") REFERENCES "FreelancerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Match" ADD CONSTRAINT "Match_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Match" ADD CONSTRAINT "Match_freelancerId_fkey"
  FOREIGN KEY ("freelancerId") REFERENCES "FreelancerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecommendationImpression" ADD CONSTRAINT "RecommendationImpression_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecommendationImpression" ADD CONSTRAINT "RecommendationImpression_freelancerId_fkey"
  FOREIGN KEY ("freelancerId") REFERENCES "FreelancerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecommendationImpression" ADD CONSTRAINT "RecommendationImpression_viewerUserId_fkey"
  FOREIGN KEY ("viewerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_matchId_fkey"
  FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_matchId_fkey"
  FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
