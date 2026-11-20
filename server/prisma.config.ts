import "dotenv/config";
import { defineConfig } from "prisma/config";

// Adresa directă (fără -pooler) pentru migrări, cu rezervă pe DATABASE_URL.
// Fără env("..."): `prisma generate` nu pică dacă variabilele lipsesc (ex. în CI).
const migrationUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
const isDatabaseChangeCommand = process.argv.some((argument) => ["migrate", "db"].includes(argument));
if (isDatabaseChangeCommand && !process.env.DIRECT_URL && /-pooler\./i.test(migrationUrl)) {
  throw new Error("Prisma migrations need a direct database connection. Set DIRECT_URL in server/.env to Neon's direct (non-pooler) connection string.");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: migrationUrl,
  },
});