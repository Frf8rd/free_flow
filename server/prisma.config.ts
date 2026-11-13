import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    // pentru migrări se folosește adresa directă (fără -pooler), dacă există
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
  },
});