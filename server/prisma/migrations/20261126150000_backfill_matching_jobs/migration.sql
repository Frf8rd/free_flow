-- Projects and complete freelancer profiles that existed before the durable
-- matching queue was introduced had no MatchingJob row and stayed PENDING.
INSERT INTO "MatchingJob" (
  "id", "type", "targetId", "revision", "attempts", "nextRunAt", "createdAt", "updatedAt"
)
SELECT
  md5(random()::text || clock_timestamp()::text || p."id"),
  'PROJECT',
  p."id",
  0,
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Project" p
WHERE p."status" = 'OPEN'
ON CONFLICT ("type", "targetId") DO NOTHING;

INSERT INTO "MatchingJob" (
  "id", "type", "targetId", "revision", "attempts", "nextRunAt", "createdAt", "updatedAt"
)
SELECT
  md5(random()::text || clock_timestamp()::text || fp."userId"),
  'FREELANCER',
  fp."userId",
  0,
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "FreelancerProfile" fp
JOIN "User" u ON u."id" = fp."userId"
WHERE fp."onboarded" = true
  AND u."role" = 'FREELANCER'
  AND u."isBlocked" = false
ON CONFLICT ("type", "targetId") DO NOTHING;
