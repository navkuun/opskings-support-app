import { sql } from "drizzle-orm"
import { NextResponse } from "next/server"
import { z } from "zod"

import { db } from "@/lib/db"
import { clients } from "@/lib/db/schema/clients"
import { teamMembers } from "@/lib/db/schema/team-members"
import { tickets } from "@/lib/db/schema/tickets"
import { ticketTypes } from "@/lib/db/schema/ticket-types"
import { isE2eTestModeEnabled } from "@/lib/e2e"

export const runtime = "nodejs"

const bodySchema = z.object({
  count: z.number().int().min(1).max(200).default(40),
  clientId: z.number().int().positive().optional(),
  clientEmail: z.string().email().optional(),
  ticketTypeId: z.number().int().positive().optional(),
  ticketTypeDepartment: z.string().min(1).max(50).default("support"),
  ticketTypeName: z.string().min(1).max(100).default("General"),
  assignedTo: z.number().int().positive().optional(),
  assignedToEmail: z.string().email().optional(),
  titlePrefix: z.string().min(1).max(80).default("E2E Ticket"),
})

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

async function resolveClientId(input: {
  clientId?: number
  clientEmail?: string
}): Promise<number> {
  if (typeof input.clientId === "number") return input.clientId
  if (!input.clientEmail) throw new Error("clientId or clientEmail is required")

  const email = normalizeEmail(input.clientEmail)

  const existing = await db
    .select({ id: clients.id })
    .from(clients)
    .where(sql`lower(${clients.email}) = ${email}`)
    .limit(1)

  if (existing[0]?.id) return existing[0].id

  const inserted = await db
    .insert(clients)
    .values({
      clientName: `${email.split("@")[0] ?? "Client"} (E2E)`,
      email,
      status: "active",
      planType: "starter",
      monthlyBudget: 0,
    })
    .returning({ id: clients.id })

  const id = inserted[0]?.id
  if (!id) throw new Error("Failed to create client")
  return id
}

async function resolveAssigneeId(input: {
  assignedTo?: number
  assignedToEmail?: string
}): Promise<number | null> {
  if (typeof input.assignedTo === "number") return input.assignedTo
  if (!input.assignedToEmail) return null

  const email = normalizeEmail(input.assignedToEmail)
  const existing = await db
    .select({ id: teamMembers.id })
    .from(teamMembers)
    .where(sql`lower(${teamMembers.email}) = ${email}`)
    .limit(1)

  return existing[0]?.id ?? null
}

async function resolveTicketTypeId(input: {
  ticketTypeId?: number
  ticketTypeDepartment: string
  ticketTypeName: string
}): Promise<number> {
  if (typeof input.ticketTypeId === "number") return input.ticketTypeId

  const existing = await db
    .select({ id: ticketTypes.id })
    .from(ticketTypes)
    .where(
      sql`${ticketTypes.department} = ${input.ticketTypeDepartment} and ${ticketTypes.typeName} = ${input.ticketTypeName}`,
    )
    .limit(1)

  if (existing[0]?.id) return existing[0].id

  const inserted = await db
    .insert(ticketTypes)
    .values({
      typeName: input.ticketTypeName,
      department: input.ticketTypeDepartment,
      priority: "medium",
      avgResolutionHours: 24,
    })
    .returning({ id: ticketTypes.id })

  const id = inserted[0]?.id
  if (!id) throw new Error("Failed to create ticket type")
  return id
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" && !isE2eTestModeEnabled()) {
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

  try {
    const clientId = await resolveClientId(parsed.data)
    const ticketTypeId = await resolveTicketTypeId(parsed.data)
    const assigneeId = await resolveAssigneeId(parsed.data)

    const statuses = ["open", "in_progress", "blocked", "resolved"] as const
    const priorities = ["low", "medium", "high"] as const
    const now = Date.now()

    const rows = Array.from({ length: parsed.data.count }, (_, i) => {
      const createdAt = new Date(now - i * 1000)
      const status = statuses[i % statuses.length]
      const priority = priorities[i % priorities.length]

      return {
        clientId,
        ticketTypeId,
        assignedTo: assigneeId,
        status,
        priority,
        title: `${parsed.data.titlePrefix} #${i + 1}`,
        createdAt,
      }
    })

    const inserted = await db.insert(tickets).values(rows).returning({ id: tickets.id })

    return NextResponse.json({
      ok: true,
      inserted: inserted.map((row) => row.id),
      clientId,
      ticketTypeId,
      assignedTo: assigneeId,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to seed tickets" },
      { status: 500 },
    )
  }
}

