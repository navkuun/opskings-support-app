import { eq, sql } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { getAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { appUsers } from "@/lib/db/schema/app-users"
import {
  normalizeListFilterValues,
  parseListFilterOperator,
  type ListFilterOperator,
} from "@/lib/filters/list-filter"

export const runtime = "nodejs"

function parseOptionalInt(value: string | null) {
  if (!value) return null
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

function parseOptionalMs(value: string | null) {
  if (!value) return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

function parseCsvTokens(value: string | null) {
  if (!value) return []
  return value
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean)
}

type AssignedToFilter = {
  op: ListFilterOperator
  includeUnassigned: boolean
  ids: number[]
}

type IdListFilter = {
  op: ListFilterOperator
  ids: number[]
}

type StringListFilter = {
  op: ListFilterOperator
  values: string[]
}

function isExcludeOperator(op: ListFilterOperator) {
  return op === "is_not" || op === "is_none_of"
}

function buildTicketWhere({
  createdFrom,
  createdTo,
  clientId,
  department,
  assignedTo,
  client,
  ticketType,
  status,
  priority,
}: {
  createdFrom: Date | null
  createdTo: Date | null
  clientId: number | null
  department: string | null
  assignedTo: AssignedToFilter | undefined
  client: IdListFilter | undefined
  ticketType: IdListFilter | undefined
  status: StringListFilter | undefined
  priority: StringListFilter | undefined
}) {
  const clauses: Array<ReturnType<typeof sql>> = []

  if (createdFrom) clauses.push(sql`t.created_at >= ${createdFrom}`)
  if (createdTo) clauses.push(sql`t.created_at <= ${createdTo}`)

  if (clientId) clauses.push(sql`t.client_id = ${clientId}`)

  if (department) clauses.push(sql`tt.department = ${department}`)

  if (assignedTo) {
    const isExclude = isExcludeOperator(assignedTo.op)

    if (!isExclude) {
      const parts: Array<ReturnType<typeof sql>> = []
      if (assignedTo.includeUnassigned) {
        parts.push(sql`t.assigned_to is null`)
      }
      if (assignedTo.ids.length) {
        parts.push(
          sql`t.assigned_to in (${sql.join(
            assignedTo.ids.map((id) => sql`${id}`),
            sql`, `,
          )})`,
        )
      }
      if (parts.length === 1) clauses.push(parts[0] ?? sql`false`)
      else if (parts.length > 1) clauses.push(sql`(${sql.join(parts, sql` or `)})`)
    } else if (assignedTo.includeUnassigned && assignedTo.ids.length) {
      clauses.push(
        sql`(t.assigned_to is not null and t.assigned_to not in (${sql.join(
          assignedTo.ids.map((id) => sql`${id}`),
          sql`, `,
        )}))`,
      )
    } else if (assignedTo.includeUnassigned) {
      clauses.push(sql`t.assigned_to is not null`)
    } else if (assignedTo.ids.length) {
      clauses.push(
        sql`(t.assigned_to is null or t.assigned_to not in (${sql.join(
          assignedTo.ids.map((id) => sql`${id}`),
          sql`, `,
        )}))`,
      )
    }
  }

  if (client && client.ids.length) {
    if (isExcludeOperator(client.op)) {
      clauses.push(
        sql`(t.client_id is null or t.client_id not in (${sql.join(
          client.ids.map((id) => sql`${id}`),
          sql`, `,
        )}))`,
      )
    } else {
      clauses.push(
        sql`t.client_id in (${sql.join(
          client.ids.map((id) => sql`${id}`),
          sql`, `,
        )})`,
      )
    }
  }

  if (ticketType && ticketType.ids.length) {
    if (isExcludeOperator(ticketType.op)) {
      clauses.push(
        sql`(t.ticket_type_id is null or t.ticket_type_id not in (${sql.join(
          ticketType.ids.map((id) => sql`${id}`),
          sql`, `,
        )}))`,
      )
    } else {
      clauses.push(
        sql`t.ticket_type_id in (${sql.join(
          ticketType.ids.map((id) => sql`${id}`),
          sql`, `,
        )})`,
      )
    }
  }

  if (status && status.values.length) {
    if (isExcludeOperator(status.op)) {
      clauses.push(
        sql`(t.status is null or t.status not in (${sql.join(
          status.values.map((value) => sql`${value}`),
          sql`, `,
        )}))`,
      )
    } else {
      clauses.push(
        sql`t.status in (${sql.join(
          status.values.map((value) => sql`${value}`),
          sql`, `,
        )})`,
      )
    }
  }

  if (priority && priority.values.length) {
    if (isExcludeOperator(priority.op)) {
      clauses.push(
        sql`(t.priority is null or t.priority not in (${sql.join(
          priority.values.map((value) => sql`${value}`),
          sql`, `,
        )}))`,
      )
    } else {
      clauses.push(
        sql`t.priority in (${sql.join(
          priority.values.map((value) => sql`${value}`),
          sql`, `,
        )})`,
      )
    }
  }

  if (!clauses.length) return sql`true`
  return sql.join(clauses, sql` and `)
}

export async function GET(req: Request) {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const appUserRows = await db
    .select({
      accountStatus: appUsers.accountStatus,
      userType: appUsers.userType,
      clientId: appUsers.clientId,
    })
    .from(appUsers)
    .where(eq(appUsers.authUserId, session.user.id))
    .limit(1)

  const appUser = appUserRows[0] ?? null
  if (!appUser || appUser.accountStatus !== "active") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const url = new URL(req.url)
  const fromMs = parseOptionalMs(url.searchParams.get("from"))
  const toMs = parseOptionalMs(url.searchParams.get("to"))

  const createdFrom = fromMs ? new Date(fromMs) : null
  const createdTo = toMs ? new Date(toMs) : null

  const department = (() => {
    const value = url.searchParams.get("department")
    if (!value) return null
    const trimmed = value.trim()
    return trimmed && trimmed !== "all" ? trimmed : null
  })()

  const assignedToOp = parseListFilterOperator(url.searchParams.get("assignedToOp"))
  const includeUnassigned = url.searchParams.get("includeUnassigned") === "1"
  const assignedToTokens = normalizeListFilterValues(
    assignedToOp,
    parseCsvTokens(url.searchParams.get("assignedTo")),
  )
  const assignedTo: AssignedToFilter | undefined =
    !includeUnassigned && (!assignedToTokens.length || assignedToTokens.includes("any"))
      ? undefined
      : (() => {
          const ids = Array.from(
            new Set(
              assignedToTokens
                .filter((token) => token !== "none" && token !== "any")
                .map((token) => parseOptionalInt(token))
                .filter((value): value is number => value != null),
            ),
          )

          if (!includeUnassigned && !ids.length) return undefined
          return { op: assignedToOp, includeUnassigned, ids }
        })()

  const clientOp = parseListFilterOperator(url.searchParams.get("clientIdOp"))
  const clientTokens = normalizeListFilterValues(
    clientOp,
    parseCsvTokens(url.searchParams.get("clientId")),
  )
  const client: IdListFilter | undefined = (() => {
    if (!clientTokens.length || clientTokens.includes("any")) return undefined
    const ids = Array.from(
      new Set(
        clientTokens
          .map((token) => parseOptionalInt(token))
          .filter((value): value is number => value != null),
      ),
    )
    if (!ids.length) return undefined
    return { op: clientOp, ids }
  })()

  const ticketTypeOp = parseListFilterOperator(url.searchParams.get("ticketTypeIdOp"))
  const ticketTypeTokens = normalizeListFilterValues(
    ticketTypeOp,
    parseCsvTokens(url.searchParams.get("ticketTypeId")),
  )
  const ticketType: IdListFilter | undefined = (() => {
    if (!ticketTypeTokens.length || ticketTypeTokens.includes("any")) return undefined
    const ids = Array.from(
      new Set(
        ticketTypeTokens
          .map((token) => parseOptionalInt(token))
          .filter((value): value is number => value != null),
      ),
    )
    if (!ids.length) return undefined
    return { op: ticketTypeOp, ids }
  })()

  const statusOp = parseListFilterOperator(url.searchParams.get("statusOp"))
  const statusTokens = normalizeListFilterValues(
    statusOp,
    parseCsvTokens(url.searchParams.get("status")),
  )
  const status: StringListFilter | undefined = (() => {
    if (!statusTokens.length || statusTokens.includes("any")) return undefined
    const values = Array.from(new Set(statusTokens.map((token) => token.trim()).filter(Boolean)))
    if (!values.length) return undefined
    return { op: statusOp, values }
  })()

  const priorityOp = parseListFilterOperator(url.searchParams.get("priorityOp"))
  const priorityTokens = normalizeListFilterValues(
    priorityOp,
    parseCsvTokens(url.searchParams.get("priority")),
  )
  const priority: StringListFilter | undefined = (() => {
    if (!priorityTokens.length || priorityTokens.includes("any")) return undefined
    const values = Array.from(new Set(priorityTokens.map((token) => token.trim()).filter(Boolean)))
    if (!values.length) return undefined
    return { op: priorityOp, values }
  })()

  const enforcedClientId =
    appUser.userType === "client"
      ? typeof appUser.clientId === "number" && appUser.clientId > 0
        ? appUser.clientId
        : null
      : null

  if (appUser.userType === "client" && !enforcedClientId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const where = buildTicketWhere({
    createdFrom,
    createdTo,
    clientId: enforcedClientId,
    department,
    assignedTo,
    client: appUser.userType === "internal" ? client : undefined,
    ticketType,
    status,
    priority,
  })

  const needsTicketTypeJoin = Boolean(department)
  const countRows = await db.execute<{ total: number }>(
    needsTicketTypeJoin
      ? sql`
          select count(*)::int as total
          from tickets t
          join ticket_types tt on tt.id = t.ticket_type_id
          where ${where}
        `
      : sql`
          select count(*)::int as total
          from tickets t
          where ${where}
        `,
  )

  return NextResponse.json({ total: countRows.rows[0]?.total ?? 0 })
}

