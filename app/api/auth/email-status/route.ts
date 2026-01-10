import { sql } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/lib/db"
import { authUsers } from "@/lib/db/schema/better-auth"
import { clients } from "@/lib/db/schema/clients"
import { teamMembers } from "@/lib/db/schema/team-members"

const bodySchema = z.object({
  email: z.string().email(),
})

export const runtime = "nodejs"

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json(
      {
        ok: false,
        allowlisted: false,
        allowlistType: null,
        hasAuthUser: false,
      },
      { status: 400 },
    )
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      {
        ok: false,
        allowlisted: false,
        allowlistType: null,
        hasAuthUser: false,
      },
      { status: 400 },
    )
  }

  const email = parsed.data.email.trim().toLowerCase()
  if (!email) {
    return Response.json(
      {
        ok: false,
        allowlisted: false,
        allowlistType: null,
        hasAuthUser: false,
      },
      { status: 400 },
    )
  }

  const [teamRows, clientRows, authRows] = await Promise.all([
    db
      .select({ id: teamMembers.id })
      .from(teamMembers)
      .where(sql`lower(${teamMembers.email}) = ${email}`)
      .limit(1),
    db
      .select({ id: clients.id })
      .from(clients)
      .where(sql`lower(${clients.email}) = ${email}`)
      .limit(1),
    db
      .select({ id: authUsers.id })
      .from(authUsers)
      .where(sql`lower(${authUsers.email}) = ${email}`)
      .limit(1),
  ])

  const allowlistType = teamRows.length
    ? "team_member"
    : clientRows.length
      ? "client"
      : null

  return Response.json({
    ok: true,
    allowlisted: allowlistType !== null,
    allowlistType,
    hasAuthUser: authRows.length > 0,
  })
}

