import "server-only"

import { zeroDrizzle } from "@rocicorp/zero/server/adapters/drizzle"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import * as drizzleSchema from "@/lib/db/schema"
import { schema } from "@/zero/schema"

function getUpstreamDatabaseUrl() {
  const databaseUrl =
    process.env.ZERO_UPSTREAM_DB ?? process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error(
      "ZERO_UPSTREAM_DB (or DATABASE_URL) is not set",
    )
  }
  return databaseUrl
}

function createDrizzleClient() {
  const pool = new Pool({
    connectionString: getUpstreamDatabaseUrl(),
  })

  return drizzle(pool, {
    schema: drizzleSchema,
  })
}

type DrizzleClient = ReturnType<typeof createDrizzleClient>

let cached:
  | ReturnType<typeof zeroDrizzle<
      typeof schema,
      DrizzleClient
    >>
  | undefined

export function getDbProvider() {
  if (cached) return cached

  const drizzleClient = createDrizzleClient()

  cached = zeroDrizzle(schema, drizzleClient)
  return cached
}
