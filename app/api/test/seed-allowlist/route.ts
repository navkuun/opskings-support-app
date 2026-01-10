import { sql } from "drizzle-orm"
import { NextResponse } from "next/server"
import { z } from "zod"

import { db } from "@/lib/db"
import { clients } from "@/lib/db/schema/clients"
import { teamMembers } from "@/lib/db/schema/team-members"

export const runtime = "nodejs"

const bodySchema = z.object({
  kind: z.enum(["client", "team_member"]),
  email: z.string().email(),
})

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function toTitleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

function nameFromEmail(email: string) {
  const localPart = email.split("@")[0] ?? "user"
  const cleaned = localPart.replace(/[^a-zA-Z0-9]+/g, " ").trim()
  return toTitleCase(cleaned || "User")
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const email = normalizeEmail(parsed.data.email)

  if (parsed.data.kind === "client") {
    const existing = await db
      .select({ id: clients.id })
      .from(clients)
      .where(sql`lower(${clients.email}) = ${email}`)
      .limit(1)

    if (existing.length) {
      return NextResponse.json({ ok: true, kind: "client", id: existing[0].id, email })
    }

    const inserted = await db
      .insert(clients)
      .values({
        clientName: `${nameFromEmail(email)} (E2E)`,
        email,
        status: "active",
        planType: "starter",
        monthlyBudget: 0,
      })
      .returning({ id: clients.id })

    return NextResponse.json({
      ok: true,
      kind: "client",
      id: inserted[0]?.id ?? null,
      email,
    })
  }

  const existing = await db
    .select({ id: teamMembers.id })
    .from(teamMembers)
    .where(sql`lower(${teamMembers.email}) = ${email}`)
    .limit(1)

  if (existing.length) {
    return NextResponse.json({ ok: true, kind: "team_member", id: existing[0].id, email })
  }

  const inserted = await db
    .insert(teamMembers)
    .values({
      username: nameFromEmail(email).toLowerCase().replace(/\s+/g, "_"),
      email,
      department: "support",
      status: "active",
    })
    .returning({ id: teamMembers.id })

  return NextResponse.json({
    ok: true,
    kind: "team_member",
    id: inserted[0]?.id ?? null,
    email,
  })
}

