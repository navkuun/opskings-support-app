import { config as loadEnv } from "dotenv"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

import { Client } from "pg"

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getEnvFile() {
  if (existsSync(".env.local")) return ".env.local"
  if (existsSync(".env")) return ".env"
  return null
}

function loadDotenv() {
  const envFile = getEnvFile()
  if (!envFile) return
  loadEnv({ path: envFile })
}

function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value || !value.trim()) {
    throw new Error(`${name} is not set`)
  }
  return value.trim()
}

function parseArgs(argv: string[]) {
  const reset = argv.includes("--reset") || argv.includes("-r")
  const fileFlagIdx = argv.findIndex((arg) => arg === "--file" || arg === "-f")
  const fileFromFlag =
    fileFlagIdx === -1 ? null : (argv[fileFlagIdx + 1] ?? null)

  const positional = argv.find((arg) => !arg.startsWith("-")) ?? null
  const file = fileFromFlag ?? positional ?? "seed/seed.sql"

  return {
    file,
    reset,
  }
}

async function main() {
  loadDotenv()

  const { file, reset } = parseArgs(process.argv.slice(2))
  const databaseUrl = requiredEnv("DATABASE_URL")
  const sqlPath = resolve(process.cwd(), file)

  console.info(`[db-seed] Using DATABASE_URL from env`)
  console.info(`[db-seed] Seeding from ${sqlPath}`)

  const sql = readFileSync(sqlPath, "utf8")

  const client = new Client({
    connectionString: databaseUrl,
  })

  await client.connect()
  try {
    if (reset) {
      console.warn("")
      console.warn("[db-seed] ⚠️  DESTRUCTIVE: --reset will TRUNCATE ALL tables in schemas: public, auth")
      console.warn("[db-seed] Press Ctrl+C to abort. Continuing in 5 seconds…")
      console.warn("")

      await sleep(5_000)

      const tables = await client.query<{
        schemaname: string
        tablename: string
      }>(
        `
          select schemaname, tablename
          from pg_tables
          where schemaname in ('public', 'auth')
            and tablename <> '__drizzle_migrations'
          order by schemaname, tablename
        `,
      )

      if (tables.rows.length) {
        const quoteIdent = (value: string) => `"${value.replaceAll('"', '""')}"`
        const targets = tables.rows
          .map(({ schemaname, tablename }) => `${quoteIdent(schemaname)}.${quoteIdent(tablename)}`)
          .join(", ")

        console.info(`[db-seed] Truncating ${tables.rows.length} tables…`)
        await client.query(`truncate table ${targets} restart identity cascade;`)
        console.info("[db-seed] Truncate complete")
      } else {
        console.info("[db-seed] No tables found to truncate")
      }
    }

    await client.query(sql)
    console.info("[db-seed] Done")
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error("[db-seed] Failed")
  console.error(error)
  process.exitCode = 1
})
