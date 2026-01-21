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

function parseDateToUtc(date: string, which: "start" | "end") {
  const [yearStr, monthStr, dayStr] = date.split("-")
  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null
  }
  if (which === "start") {
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
  }
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))
}

function parseOptionalInt(value: string | null) {
  if (!value) return null
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

function parseOptionalNonNegativeInt(value: string | null) {
  if (!value) return null
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0) return null
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
  assignedTo,
  ticketType,
  priority,
  client,
}: {
  createdFrom: Date | null
  createdTo: Date | null
  assignedTo: AssignedToFilter | undefined
  ticketType: IdListFilter | undefined
  priority: StringListFilter | undefined
  client: IdListFilter | undefined
}) {
  const clauses: Array<ReturnType<typeof sql>> = []

  if (createdFrom) clauses.push(sql`t.created_at >= ${createdFrom}`)
  if (createdTo) clauses.push(sql`t.created_at <= ${createdTo}`)

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

function toIsoString(value: unknown): string | null {
  if (!value) return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString()
  }
  if (typeof value === "string") {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
  }
  return null
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
    })
    .from(appUsers)
    .where(eq(appUsers.authUserId, session.user.id))
    .limit(1)

  const appUser = appUserRows[0] ?? null
  if (!appUser || appUser.accountStatus !== "active" || appUser.userType !== "internal") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const url = new URL(req.url)

  const fromParam = url.searchParams.get("from")
  const toParam = url.searchParams.get("to")
  const createdFrom = fromParam ? parseDateToUtc(fromParam, "start") : null
  const createdTo = toParam ? parseDateToUtc(toParam, "end") : null

  const assignedToOp = parseListFilterOperator(url.searchParams.get("assignedToOp"))
  const assignedToTokens = normalizeListFilterValues(
    assignedToOp,
    parseCsvTokens(url.searchParams.get("assignedTo")),
  )
  const assignedTo: AssignedToFilter | undefined =
    !assignedToTokens.length || assignedToTokens.includes("any")
      ? undefined
      : (() => {
          const includeUnassigned = assignedToTokens.includes("none")
          const ids = Array.from(
            new Set(
              assignedToTokens
                .filter((token) => token !== "none")
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

  const offset = parseOptionalNonNegativeInt(url.searchParams.get("offset")) ?? 0
  const rawLimit = parseOptionalNonNegativeInt(url.searchParams.get("limit")) ?? 20
  const limit = Math.min(Math.max(rawLimit, 1), 200)

  const ticketWhere = buildTicketWhere({
    createdFrom,
    createdTo,
    assignedTo,
    client,
    ticketType,
    priority,
  })

  const rows = await db.execute<{
    id: number | null
    title: string
    clientName: string | null
    ticketType: string
    status: string | null
    priority: string | null
    createdAt: unknown
    resolvedAt: unknown
    expectedHours: number
    actualHours: number
    deltaHours: number
    total: number
  }>(
    sql`
      with overdue as materialized (
        select
          t.id::int as id,
          t.title as title,
          c.client_name as "clientName",
          tt.type_name as "ticketType",
          t.status as status,
          t.priority as priority,
          t.created_at as "createdAt",
          t.resolved_at as "resolvedAt",
          tt.avg_resolution_hours::int as "expectedHours",
          ((extract(epoch from (t.resolved_at - t.created_at))::float8) / 3600) as "actualHours",
          (((extract(epoch from (t.resolved_at - t.created_at))::float8) / 3600) - tt.avg_resolution_hours)::float8 as "deltaHours"
        from tickets t
        join ticket_types tt on tt.id = t.ticket_type_id
        join clients c on c.id = t.client_id
        where ${ticketWhere}
          and t.resolved_at is not null
          and tt.avg_resolution_hours is not null
          and ((extract(epoch from (t.resolved_at - t.created_at))::float8) / 3600) > tt.avg_resolution_hours
      ),
      total as (
        select count(*)::int as total
        from overdue
      ),
      paged as (
        select *
        from overdue
        order by "deltaHours" desc, id desc
        limit ${limit} offset ${offset}
      )
      select
        paged.*,
        total.total
      from total
      left join paged on true
    `,
  )

  const total = rows.rows[0]?.total ?? 0
  type OverdueRow = (typeof rows.rows)[number]
  const pagedRows = rows.rows.filter(
    (row): row is OverdueRow & { id: number } =>
      typeof row.id === "number" && Number.isInteger(row.id),
  )

  return NextResponse.json({
    total,
    rows: pagedRows.map((row) => ({
      id: row.id,
      title: row.title,
      clientName: row.clientName,
      ticketType: row.ticketType,
      status: row.status,
      priority: row.priority,
      createdAt: toIsoString(row.createdAt),
      resolvedAt: toIsoString(row.resolvedAt),
      expectedHours: row.expectedHours,
      actualHours: row.actualHours,
      deltaHours: row.deltaHours,
    })),
  })
}
