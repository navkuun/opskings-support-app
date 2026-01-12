import { sql } from "drizzle-orm"
import { z } from "zod"

import { getAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { clients } from "@/lib/db/schema/clients"
import { teamMembers } from "@/lib/db/schema/team-members"
import { authUsers } from "@/lib/db/schema/better-auth"

const bodySchema = z.object({
  email: z.string().email(),
})

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? null
  return request.headers.get("x-real-ip")?.trim() ?? null
}

type RateEntry = {
  count: number
  resetAtMs: number
}

const globalForRateLimit = globalThis as typeof globalThis & {
  __riSetupLinkRate?: Map<string, RateEntry>
}

function takeRateLimit(key: string) {
  const windowMs = 60_000
  const max = 5
  const now = Date.now()

  const store = globalForRateLimit.__riSetupLinkRate ?? new Map<string, RateEntry>()
  globalForRateLimit.__riSetupLinkRate = store

  const existing = store.get(key)
  if (!existing || existing.resetAtMs <= now) {
    store.set(key, { count: 1, resetAtMs: now + windowMs })
    return true
  }

  if (existing.count >= max) return false
  existing.count += 1
  store.set(key, existing)
  return true
}

function generateRandomPassword() {
  const alphabet =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{};:,.?"
  const bytes = new Uint32Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("")
}

export const runtime = "nodejs"

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ ok: true })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ ok: true })
  }

  const email = normalizeEmail(parsed.data.email)

  const ip = getClientIp(request) ?? "unknown"
  const rateKey = `${ip}:${email}`
  if (!takeRateLimit(rateKey)) {
    return Response.json({ ok: true })
  }

  // Prefer the configured Better Auth base URL so callback URLs match what Better Auth accepts
  // (and so we don't depend on proxy header configuration).
  const origin = (() => {
    const configured = process.env.BETTER_AUTH_URL?.trim()
    if (configured) {
      try {
        return new URL(configured).origin
      } catch {
        // Fall back to request URL.
      }
    }
    return new URL(request.url).origin
  })()
  const redirectTo = `${origin}/reset-password?email=${encodeURIComponent(email)}`

  const allowlistedTeam = await db
    .select({ username: teamMembers.username })
    .from(teamMembers)
    .where(sql`lower(${teamMembers.email}) = ${email}`)
    .limit(1)

  const allowlistedClient = allowlistedTeam.length
    ? []
    : await db
        .select({ clientName: clients.clientName })
        .from(clients)
        .where(sql`lower(${clients.email}) = ${email}`)
        .limit(1)

  const isAllowlisted = allowlistedTeam.length > 0 || allowlistedClient.length > 0

  if (!isAllowlisted) {
    return Response.json(
      { ok: false, error: "NOT_ALLOWLISTED" },
      { status: 403 },
    )
  }

  const existingUser = await db
    .select({ id: authUsers.id })
    .from(authUsers)
    .where(sql`lower(${authUsers.email}) = ${email}`)
    .limit(1)

  const auth = getAuth()

  try {
    if (!existingUser.length) {
      const displayName =
        allowlistedTeam[0]?.username ??
        allowlistedClient[0]?.clientName ??
        email.split("@")[0] ??
        "User"

      await auth.api.signUpEmail({
        body: {
          name: displayName,
          email,
          password: generateRandomPassword(),
          callbackURL: `${origin}/dashboard`,
        },
      })
    }

    await auth.api.requestPasswordReset({
      body: {
        email,
        redirectTo,
      },
    })
  } catch (error) {
    console.error("[setup-link] Failed", error)
  }

  return Response.json({ ok: true })
}
