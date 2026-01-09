import "server-only"

import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import * as schema from "./schema/better-auth"

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set")
  }
  return databaseUrl
}

const globalForRi = globalThis as typeof globalThis & {
  __riAuthPool?: Pool
  __riAuthDb?: ReturnType<typeof drizzle<typeof schema>>
}

const pool =
  globalForRi.__riAuthPool ??
  new Pool({
    connectionString: getDatabaseUrl(),
  })

export const authDb =
  globalForRi.__riAuthDb ??
  drizzle(pool, {
    schema,
  })

if (process.env.NODE_ENV !== "production") {
  globalForRi.__riAuthPool = pool
  globalForRi.__riAuthDb = authDb
}

