import "server-only"

import { eq, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import { appUsers } from "@/lib/db/schema/app-users"
import { authUsers } from "@/lib/db/schema/better-auth"
import { clients } from "@/lib/db/schema/clients"
import { teamMembers } from "@/lib/db/schema/team-members"

type AllowlistMatch =
  | { kind: "team_member"; teamMemberId: number }
  | { kind: "client"; clientId: number }
  | null

export async function getAuthUserEmail(authUserId: string) {
  const authUserRows = await db
    .select({
      email: authUsers.email,
    })
    .from(authUsers)
    .where(eq(authUsers.id, authUserId))
    .limit(1)

  return authUserRows[0]?.email?.trim().toLowerCase() ?? null
}

export async function getAllowlistMatchByEmail(email: string): Promise<AllowlistMatch> {
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) return null

  const teamRows = await db
    .select({ id: teamMembers.id })
    .from(teamMembers)
    .where(sql`lower(${teamMembers.email}) = ${normalizedEmail}`)
    .limit(1)

  if (teamRows.length) {
    return { kind: "team_member", teamMemberId: teamRows[0].id }
  }

  const clientRows = await db
    .select({ id: clients.id })
    .from(clients)
    .where(sql`lower(${clients.email}) = ${normalizedEmail}`)
    .limit(1)

  if (clientRows.length) {
    return { kind: "client", clientId: clientRows[0].id }
  }

  return null
}

export async function isAuthUserAllowlisted(authUserId: string) {
  const email = await getAuthUserEmail(authUserId)
  if (!email) return false
  return (await getAllowlistMatchByEmail(email)) !== null
}

export async function syncAppUserFromAllowlist(authUserId: string) {
  const email = await getAuthUserEmail(authUserId)
  if (!email) return

  const existingRows = await db
    .select({
      accountStatus: appUsers.accountStatus,
      userType: appUsers.userType,
      internalRole: appUsers.internalRole,
    })
    .from(appUsers)
    .where(eq(appUsers.authUserId, authUserId))
    .limit(1)

  const existing = existingRows[0] ?? null
  const isDisabled = existing?.accountStatus === "disabled"

  const allowlist = await getAllowlistMatchByEmail(email)

  if (allowlist?.kind === "team_member") {
    const desiredStatus = isDisabled ? "disabled" : "active"
    const desiredRole =
      desiredStatus === "active"
        ? existing?.internalRole ?? "support_agent"
        : existing?.internalRole ?? null

    await db
      .insert(appUsers)
      .values({
        authUserId,
        userType: "internal",
        accountStatus: desiredStatus,
        internalRole: desiredRole,
        teamMemberId: allowlist.teamMemberId,
        clientId: null,
      })
      .onConflictDoUpdate({
        target: appUsers.authUserId,
        set: {
          userType: "internal",
          accountStatus: desiredStatus,
          internalRole: desiredRole,
          teamMemberId: allowlist.teamMemberId,
          clientId: null,
        },
      })

    return
  }

  if (allowlist?.kind === "client") {
    const desiredStatus = isDisabled ? "disabled" : "active"

    await db
      .insert(appUsers)
      .values({
        authUserId,
        userType: "client",
        accountStatus: desiredStatus,
        internalRole: null,
        teamMemberId: null,
        clientId: allowlist.clientId,
      })
      .onConflictDoUpdate({
        target: appUsers.authUserId,
        set: {
          userType: "client",
          accountStatus: desiredStatus,
          internalRole: null,
          teamMemberId: null,
          clientId: allowlist.clientId,
        },
      })

    return
  }

  const desiredStatus = isDisabled ? "disabled" : "pending"

  await db
    .insert(appUsers)
    .values({
      authUserId,
      userType: existing?.userType ?? "client",
      accountStatus: desiredStatus,
      internalRole: null,
      teamMemberId: null,
      clientId: null,
    })
    .onConflictDoUpdate({
      target: appUsers.authUserId,
      set: {
        accountStatus: desiredStatus,
      },
    })
}
