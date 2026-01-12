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

function isExcludeOperator(op: ListFilterOperator) {
  return op === "is_not" || op === "is_none_of"
}

function buildTicketWhere({
  alias,
  createdFrom,
  createdTo,
  assignedTo,
}: {
  alias?: string
  createdFrom: Date | null
  createdTo: Date | null
  assignedTo: AssignedToFilter | undefined
}) {
  const clauses: Array<ReturnType<typeof sql>> = []
  const col = (name: string) => (alias ? sql.raw(`${alias}.${name}`) : sql.raw(name))

  if (createdFrom) clauses.push(sql`${col("created_at")} >= ${createdFrom}`)
  if (createdTo) clauses.push(sql`${col("created_at")} <= ${createdTo}`)

  if (assignedTo) {
    const isExclude = isExcludeOperator(assignedTo.op)

    if (!isExclude) {
      const parts: Array<ReturnType<typeof sql>> = []
      if (assignedTo.includeUnassigned) {
        parts.push(sql`${col("assigned_to")} is null`)
      }
      if (assignedTo.ids.length) {
        parts.push(
          sql`${col("assigned_to")} in (${sql.join(
            assignedTo.ids.map((id) => sql`${id}`),
            sql`, `,
          )})`,
        )
      }
      if (parts.length === 1) clauses.push(parts[0] ?? sql`false`)
      else if (parts.length > 1) clauses.push(sql`(${sql.join(parts, sql` or `)})`)
    } else if (assignedTo.includeUnassigned && assignedTo.ids.length) {
      clauses.push(
        sql`(${col("assigned_to")} is not null and ${col("assigned_to")} not in (${sql.join(
          assignedTo.ids.map((id) => sql`${id}`),
          sql`, `,
        )}))`,
      )
    } else if (assignedTo.includeUnassigned) {
      clauses.push(sql`${col("assigned_to")} is not null`)
    } else if (assignedTo.ids.length) {
      clauses.push(
        sql`(${col("assigned_to")} is null or ${col("assigned_to")} not in (${sql.join(
          assignedTo.ids.map((id) => sql`${id}`),
          sql`, `,
        )}))`,
      )
    }
  }

  if (!clauses.length) return sql`true`
  return sql.join(clauses, sql` and `)
}

const priorityKeys = ["urgent", "high", "medium", "low", "unknown"] as const
type PriorityKey = (typeof priorityKeys)[number]

const bins = [
  { key: "0-1", order: 0 },
  { key: "1-2", order: 1 },
  { key: "2-4", order: 2 },
  { key: "4-8", order: 3 },
  { key: "8-16", order: 4 },
  { key: "16+", order: 5 },
] as const

type HistogramRow = {
  bin: string
  binOrder: number
  total: number
} & Record<PriorityKey, number>

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

  const ticketWhere = buildTicketWhere({
    alias: "t",
    createdFrom,
    createdTo,
    assignedTo,
  })

  const statsRows = await db.execute<{
    resolvedTotal: number
    expectedTotal: number
    overdueTotal: number
    minHours: number | null
    maxHours: number | null
    avgHours: number | null
    medianHours: number | null
    avgExpectedHours: number | null
    avgDeltaHours: number | null
  }>(
    sql`
      select
        count(*)::int as "resolvedTotal",
        count(*) filter (where tt.avg_resolution_hours is not null)::int as "expectedTotal",
        count(*) filter (
          where tt.avg_resolution_hours is not null
            and ((extract(epoch from (t.resolved_at - t.created_at))::float8) / 3600) > tt.avg_resolution_hours
        )::int as "overdueTotal",
        min((extract(epoch from (t.resolved_at - t.created_at))::float8) / 3600) as "minHours",
        max((extract(epoch from (t.resolved_at - t.created_at))::float8) / 3600) as "maxHours",
        avg((extract(epoch from (t.resolved_at - t.created_at))::float8) / 3600) as "avgHours",
        percentile_cont(0.5) within group (
          order by ((extract(epoch from (t.resolved_at - t.created_at))::float8) / 3600)
        ) as "medianHours",
        avg(tt.avg_resolution_hours)::float8 filter (where tt.avg_resolution_hours is not null) as "avgExpectedHours",
        avg((((extract(epoch from (t.resolved_at - t.created_at))::float8) / 3600) - tt.avg_resolution_hours)::float8)
          filter (where tt.avg_resolution_hours is not null) as "avgDeltaHours"
      from tickets t
      join ticket_types tt on tt.id = t.ticket_type_id
      where ${ticketWhere}
        and t.resolved_at is not null
    `,
  )

  const byPriorityRows = await db.execute<{
    priority: string
    resolvedTotal: number
    expectedTotal: number
    overdueTotal: number
    minHours: number | null
    maxHours: number | null
    avgHours: number | null
    medianHours: number | null
    avgExpectedHours: number | null
    avgDeltaHours: number | null
  }>(
    sql`
      select
        coalesce(t.priority, 'unknown') as priority,
        count(*)::int as "resolvedTotal",
        count(*) filter (where tt.avg_resolution_hours is not null)::int as "expectedTotal",
        count(*) filter (
          where tt.avg_resolution_hours is not null
            and ((extract(epoch from (t.resolved_at - t.created_at))::float8) / 3600) > tt.avg_resolution_hours
        )::int as "overdueTotal",
        min((extract(epoch from (t.resolved_at - t.created_at))::float8) / 3600) as "minHours",
        max((extract(epoch from (t.resolved_at - t.created_at))::float8) / 3600) as "maxHours",
        avg((extract(epoch from (t.resolved_at - t.created_at))::float8) / 3600) as "avgHours",
        percentile_cont(0.5) within group (
          order by ((extract(epoch from (t.resolved_at - t.created_at))::float8) / 3600)
        ) as "medianHours",
        avg(tt.avg_resolution_hours)::float8 filter (where tt.avg_resolution_hours is not null) as "avgExpectedHours",
        avg((((extract(epoch from (t.resolved_at - t.created_at))::float8) / 3600) - tt.avg_resolution_hours)::float8)
          filter (where tt.avg_resolution_hours is not null) as "avgDeltaHours"
      from tickets t
      join ticket_types tt on tt.id = t.ticket_type_id
      where ${ticketWhere}
        and t.resolved_at is not null
      group by 1
      order by 1 asc
    `,
  )

  const histogramRows = await db.execute<HistogramRow>(
    sql`
      with resolved as (
        select
          coalesce(t.priority, 'unknown') as priority,
          (extract(epoch from (t.resolved_at - t.created_at))::float8) / 3600 as hours
        from tickets t
        where ${ticketWhere}
          and t.resolved_at is not null
      )
      select
        bin,
        bin_order as "binOrder",
        count(*)::int as total,
        count(*) filter (where priority = 'urgent')::int as urgent,
        count(*) filter (where priority = 'high')::int as high,
        count(*) filter (where priority = 'medium')::int as medium,
        count(*) filter (where priority = 'low')::int as low,
        count(*) filter (where priority = 'unknown')::int as unknown
      from (
        select
          priority,
          case
            when hours < 1 then '0-1'
            when hours < 2 then '1-2'
            when hours < 4 then '2-4'
            when hours < 8 then '4-8'
            when hours < 16 then '8-16'
            else '16+'
          end as bin,
          case
            when hours < 1 then 0
            when hours < 2 then 1
            when hours < 4 then 2
            when hours < 8 then 3
            when hours < 16 then 4
            else 5
          end as bin_order
        from resolved
      ) b
      group by 1, 2
      order by 2 asc
    `,
  )

  const histogramByBin = new Map<string, Omit<HistogramRow, "bin" | "binOrder">>()
  for (const row of histogramRows) {
    histogramByBin.set(row.bin, {
      total: row.total,
      urgent: row.urgent,
      high: row.high,
      medium: row.medium,
      low: row.low,
      unknown: row.unknown,
    })
  }

  const normalizedHistogram = bins.map((bin) => {
    const row = histogramByBin.get(bin.key)
    return {
      bin: bin.key,
      total: row?.total ?? 0,
      urgent: row?.urgent ?? 0,
      high: row?.high ?? 0,
      medium: row?.medium ?? 0,
      low: row?.low ?? 0,
      unknown: row?.unknown ?? 0,
    }
  })

  const overdueRows = await db.execute<{
    id: number
    title: string
    clientName: string | null
    ticketType: string
    status: string | null
    priority: string | null
    createdAt: Date | null
    resolvedAt: Date | null
    expectedHours: number
    actualHours: number
    deltaHours: number
  }>(
    sql`
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
      order by "deltaHours" desc
      limit 200
    `,
  )

  const priorityOrder = new Map<string, number>(
    priorityKeys.map((key, idx) => [key, idx]),
  )

  const sortedByPriority = byPriorityRows
    .slice()
    .sort((a, b) => {
      const aKey = a.priority.toLowerCase()
      const bKey = b.priority.toLowerCase()
      const aRank = priorityOrder.get(aKey) ?? 999
      const bRank = priorityOrder.get(bKey) ?? 999
      if (aRank !== bRank) return aRank - bRank
      return aKey.localeCompare(bKey)
    })

  const overall = statsRows[0] ?? null

  return NextResponse.json({
    resolvedTotal: overall?.resolvedTotal ?? 0,
    expectedTotal: overall?.expectedTotal ?? 0,
    overdueTotal: overall?.overdueTotal ?? 0,
    minHours: overall?.minHours ?? null,
    maxHours: overall?.maxHours ?? null,
    avgHours: overall?.avgHours ?? null,
    medianHours: overall?.medianHours ?? null,
    avgExpectedHours: overall?.avgExpectedHours ?? null,
    avgDeltaHours: overall?.avgDeltaHours ?? null,
    byPriority: sortedByPriority,
    histogram: normalizedHistogram,
    overdueTickets: overdueRows.map((row) => ({
      id: row.id,
      title: row.title,
      clientName: row.clientName,
      ticketType: row.ticketType,
      status: row.status,
      priority: row.priority,
      createdAt: row.createdAt ? row.createdAt.toISOString() : null,
      resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString() : null,
      expectedHours: row.expectedHours,
      actualHours: row.actualHours,
      deltaHours: row.deltaHours,
    })),
  })
}

