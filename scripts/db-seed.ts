import { config as loadEnv } from "dotenv"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

import { hashPassword } from "better-auth/crypto"
import { Client } from "pg"

const DEMO_PASSWORD = "password123"
const DEMO_CLIENT_EMAIL = "admin@techstart.com"
const DEMO_TEAM_MEMBER_EMAIL = "john.smith@company.com"

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

function formatDisplayName(input: string) {
  const normalized = input.trim()
  if (!normalized) return "User"

  return normalized
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0]!.toUpperCase() + word.slice(1))
    .join(" ")
}

type ClientSeedRow = {
  id: number
  clientName: string
  email: string
}

type TeamMemberSeedRow = {
  id: number
  username: string
  email: string
}

async function findClient(client: Client, email: string): Promise<ClientSeedRow | null> {
  const exact = await client.query<ClientSeedRow>(
    `select id, client_name as "clientName", email
     from clients
     where lower(email) = lower($1)
     limit 1`,
    [email],
  )
  if (exact.rows[0]) return exact.rows[0]

  const fallback = await client.query<ClientSeedRow>(
    `select id, client_name as "clientName", email
     from clients
     order by id asc
     limit 1`,
  )
  return fallback.rows[0] ?? null
}

async function findTeamMember(client: Client, email: string): Promise<TeamMemberSeedRow | null> {
  const exact = await client.query<TeamMemberSeedRow>(
    `select id, username, email
     from team_members
     where lower(email) = lower($1)
     limit 1`,
    [email],
  )
  if (exact.rows[0]) return exact.rows[0]

  const fallback = await client.query<TeamMemberSeedRow>(
    `select id, username, email
     from team_members
     order by id asc
     limit 1`,
  )
  return fallback.rows[0] ?? null
}

async function upsertAuthUser(
  client: Client,
  {
    id,
    name,
    email,
  }: {
    id: string
    name: string
    email: string
  },
) {
  const result = await client.query<{ id: string }>(
    `insert into auth."user" ("id", "name", "email", "emailVerified", "image", "createdAt", "updatedAt")
     values ($1, $2, $3, true, null, now(), now())
     on conflict ("email") do update
       set "name" = excluded."name",
           "updatedAt" = now()
     returning "id"`,
    [id, name, email],
  )

  return result.rows[0]?.id ?? null
}

async function seedCredentialAccount(client: Client, { userId }: { userId: string }) {
  const passwordHash = await hashPassword(DEMO_PASSWORD)

  await client.query(
    `delete from auth."account"
     where "userId" = $1 and "providerId" = 'credential'`,
    [userId],
  )

  await client.query(
    `insert into auth."account" (
       "id",
       "accountId",
       "providerId",
       "userId",
       "password",
       "createdAt",
       "updatedAt"
     ) values ($1, $2, 'credential', $3, $4, now(), now())`,
    [`seed-credential-${userId}`, userId, userId, passwordHash],
  )
}

async function seedAppUserRow(
  client: Client,
  {
    authUserId,
    userType,
    internalRole,
    clientId,
    teamMemberId,
  }: {
    authUserId: string
    userType: "internal" | "client"
    internalRole: "support_agent" | "manager" | "admin" | null
    clientId: number | null
    teamMemberId: number | null
  },
) {
  await client.query(
    `insert into auth.app_users (
       auth_user_id,
       account_status,
       user_type,
       internal_role,
       client_id,
       team_member_id
     ) values ($1, 'active', $2, $3, $4, $5)
     on conflict (auth_user_id) do update
       set account_status = excluded.account_status,
           user_type = excluded.user_type,
           internal_role = excluded.internal_role,
           client_id = excluded.client_id,
           team_member_id = excluded.team_member_id`,
    [authUserId, userType, internalRole, clientId, teamMemberId],
  )
}

async function seedDemoAuth(client: Client) {
  const clientRow = await findClient(client, DEMO_CLIENT_EMAIL)
  const teamMemberRow = await findTeamMember(client, DEMO_TEAM_MEMBER_EMAIL)

  if (!clientRow) {
    console.warn("[db-seed] Skipping demo auth: no clients found")
    return null
  }

  if (!teamMemberRow) {
    console.warn("[db-seed] Skipping demo auth: no team members found")
    return null
  }

  const internalAuthUserId =
    (await upsertAuthUser(client, {
      id: "seed-internal-user",
      name: formatDisplayName(teamMemberRow.username),
      email: teamMemberRow.email.trim().toLowerCase(),
    })) ?? null

  const clientAuthUserId =
    (await upsertAuthUser(client, {
      id: "seed-client-user",
      name: clientRow.clientName.trim() || "Client",
      email: clientRow.email.trim().toLowerCase(),
    })) ?? null

  if (!internalAuthUserId || !clientAuthUserId) {
    console.warn("[db-seed] Skipping demo auth: failed to upsert auth users")
    return null
  }

  await seedCredentialAccount(client, { userId: internalAuthUserId })
  await seedCredentialAccount(client, { userId: clientAuthUserId })

  await seedAppUserRow(client, {
    authUserId: internalAuthUserId,
    userType: "internal",
    internalRole: "support_agent",
    clientId: null,
    teamMemberId: teamMemberRow.id,
  })

  await seedAppUserRow(client, {
    authUserId: clientAuthUserId,
    userType: "client",
    internalRole: null,
    clientId: clientRow.id,
    teamMemberId: null,
  })

  return {
    internal: {
      email: teamMemberRow.email.trim().toLowerCase(),
      password: DEMO_PASSWORD,
    },
    client: {
      email: clientRow.email.trim().toLowerCase(),
      password: DEMO_PASSWORD,
    },
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

    const demoAuth = await seedDemoAuth(client).catch((error) => {
      console.warn("[db-seed] Demo auth seeding failed (continuing)")
      console.warn(error)
      return null
    })

    if (demoAuth) {
      console.info("")
      console.info("[db-seed] Demo users (email/password):")
      console.info(`[db-seed] Internal: ${demoAuth.internal.email} / ${demoAuth.internal.password}`)
      console.info(`[db-seed] Client:   ${demoAuth.client.email} / ${demoAuth.client.password}`)
    }

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
