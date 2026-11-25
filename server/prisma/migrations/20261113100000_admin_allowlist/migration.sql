CREATE TABLE "Admin" (
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Admin_pkey" PRIMARY KEY ("email")
);

INSERT INTO "Admin" ("email")
SELECT LOWER(BTRIM("email"))
FROM "User"
WHERE "role" = 'ADMIN'
ON CONFLICT ("email") DO NOTHING;

ALTER TABLE "Admin"
    ADD CONSTRAINT "Admin_email_fkey"
    FOREIGN KEY ("email") REFERENCES "User"("email")
    ON DELETE CASCADE ON UPDATE CASCADE;
