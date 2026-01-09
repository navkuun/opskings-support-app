import { defineConfig } from "drizzle-kit"
import { config as loadEnv } from "dotenv"
import { existsSync } from "node:fs"

loadEnv({ path: existsSync(".env.local") ? ".env.local" : ".env" })

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/drizzle-schema.ts",
  out: "./drizzle",
  dbCredentials: {
    // Intentionally don't throw at import-time:
    // `drizzle-zero generate` reads `drizzle.config.ts` to find the schema file.
    url: process.env.DATABASE_URL!,
  },
})
