import "server-only"

import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import * as schema from "./schema"

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set")
  }
  return databaseUrl
}

const globalForRi = globalThis as typeof globalThis & {
  __riPool?: Pool
  __riDb?: ReturnType<typeof drizzle<typeof schema>>
}

const pool =
  globalForRi.__riPool ??
  new Pool({
    connectionString: getDatabaseUrl(),
  })

export const db =
  globalForRi.__riDb ??
  drizzle(pool, {
    schema,
  })

if (process.env.NODE_ENV !== "production") {
  globalForRi.__riPool = pool
  globalForRi.__riDb = db
}
