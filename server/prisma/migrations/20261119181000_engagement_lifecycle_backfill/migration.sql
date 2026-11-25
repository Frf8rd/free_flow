ALTER TABLE "Engagement"
    ADD COLUMN "deliveredAt" TIMESTAMP(3),
    ADD COLUMN "completedAt" TIMESTAMP(3),
    ADD COLUMN "rejectedAt" TIMESTAMP(3),
    ADD COLUMN "cancelledAt" TIMESTAMP(3);

UPDATE "Engagement"
SET "status" = 'IN_PROGRESS', "updatedAt" = CURRENT_TIMESTAMP
WHERE "status" = 'ACCEPTED';
