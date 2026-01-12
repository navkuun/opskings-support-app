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
  alias,
  createdFrom,
  createdTo,
  assignedTo,
  ticketType,
  priority,
  client,
}: {
  alias?: string
  createdFrom: Date | null
  createdTo: Date | null
  assignedTo: AssignedToFilter | undefined
  ticketType: IdListFilter | undefined
  priority: StringListFilter | undefined
  client: IdListFilter | undefined
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

  if (client && client.ids.length) {
    if (isExcludeOperator(client.op)) {
      clauses.push(
        sql`(${col("client_id")} is null or ${col("client_id")} not in (${sql.join(
          client.ids.map((id) => sql`${id}`),
          sql`, `,
        )}))`,
      )
    } else {
      clauses.push(
        sql`${col("client_id")} in (${sql.join(
          client.ids.map((id) => sql`${id}`),
          sql`, `,
        )})`,
      )
    }
  }

  if (ticketType && ticketType.ids.length) {
    if (isExcludeOperator(ticketType.op)) {
      clauses.push(
        sql`(${col("ticket_type_id")} is null or ${col("ticket_type_id")} not in (${sql.join(
          ticketType.ids.map((id) => sql`${id}`),
          sql`, `,
        )}))`,
      )
    } else {
      clauses.push(
        sql`${col("ticket_type_id")} in (${sql.join(
          ticketType.ids.map((id) => sql`${id}`),
          sql`, `,
        )})`,
      )
    }
  }

  if (priority && priority.values.length) {
    if (isExcludeOperator(priority.op)) {
      clauses.push(
        sql`(${col("priority")} is null or ${col("priority")} not in (${sql.join(
          priority.values.map((value) => sql`${value}`),
          sql`, `,
        )}))`,
      )
    } else {
      clauses.push(
        sql`${col("priority")} in (${sql.join(
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
  if (typeof value === "number") {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
  }
  return null
}

const priorityKeys = ["urgent", "high", "medium", "low", "unknown"] as const
type PriorityKey = (typeof priorityKeys)[number]

type HistogramBinMode = "fine" | "default" | "coarse"

const binsByMode: Record<HistogramBinMode, Array<{ key: string; order: number }>> = {
  fine: [
    { key: "0-0.5", order: 0 },
    { key: "0.5-1", order: 1 },
    { key: "1-2", order: 2 },
    { key: "2-4", order: 3 },
    { key: "4-8", order: 4 },
    { key: "8-16", order: 5 },
    { key: "16-24", order: 6 },
    { key: "24+", order: 7 },
  ],
  default: [
    { key: "0-1", order: 0 },
    { key: "1-2", order: 1 },
    { key: "2-4", order: 2 },
    { key: "4-8", order: 3 },
    { key: "8-16", order: 4 },
    { key: "16+", order: 5 },
  ],
  coarse: [
    { key: "0-2", order: 0 },
    { key: "2-8", order: 1 },
    { key: "8-16", order: 2 },
    { key: "16+", order: 3 },
  ],
}

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
  const binsParam = url.searchParams.get("bins")
  const onlyParam = url.searchParams.get("only")
  const histogramMode: HistogramBinMode =
    binsParam === "fine" || binsParam === "coarse" ? binsParam : "default"

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
    const values = Array.from(
      new Set(priorityTokens.map((token) => token.trim()).filter(Boolean)),
    )
    if (!values.length) return undefined
    return { op: priorityOp, values }
  })()

  const ticketWhere = buildTicketWhere({
    alias: "t",
    createdFrom,
    createdTo,
    assignedTo,
    client,
    ticketType,
    priority,
  })

  if (onlyParam === "histogram") {
    const histogramSql =
      histogramMode === "fine"
        ? sql`
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
              (count(*) filter (where priority = 'urgent'))::int as urgent,
              (count(*) filter (where priority = 'high'))::int as high,
              (count(*) filter (where priority = 'medium'))::int as medium,
              (count(*) filter (where priority = 'low'))::int as low,
              (count(*) filter (where priority = 'unknown'))::int as unknown
            from (
              select
                priority,
                case
                  when hours < 0.5 then '0-0.5'
                  when hours < 1 then '0.5-1'
                  when hours < 2 then '1-2'
                  when hours < 4 then '2-4'
                  when hours < 8 then '4-8'
                  when hours < 16 then '8-16'
                  when hours < 24 then '16-24'
                  else '24+'
                end as bin,
                case
                  when hours < 0.5 then 0
                  when hours < 1 then 1
                  when hours < 2 then 2
                  when hours < 4 then 3
                  when hours < 8 then 4
                  when hours < 16 then 5
                  when hours < 24 then 6
                  else 7
                end as bin_order
              from resolved
            ) b
            group by 1, 2
            order by 2 asc
          `
        : histogramMode === "coarse"
          ? sql`
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
                (count(*) filter (where priority = 'urgent'))::int as urgent,
                (count(*) filter (where priority = 'high'))::int as high,
                (count(*) filter (where priority = 'medium'))::int as medium,
                (count(*) filter (where priority = 'low'))::int as low,
                (count(*) filter (where priority = 'unknown'))::int as unknown
              from (
                select
                  priority,
                  case
                    when hours < 2 then '0-2'
                    when hours < 8 then '2-8'
                    when hours < 16 then '8-16'
                    else '16+'
                  end as bin,
                  case
                    when hours < 2 then 0
                    when hours < 8 then 1
                    when hours < 16 then 2
                    else 3
                  end as bin_order
                from resolved
              ) b
              group by 1, 2
              order by 2 asc
            `
          : sql`
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
                (count(*) filter (where priority = 'urgent'))::int as urgent,
                (count(*) filter (where priority = 'high'))::int as high,
                (count(*) filter (where priority = 'medium'))::int as medium,
                (count(*) filter (where priority = 'low'))::int as low,
                (count(*) filter (where priority = 'unknown'))::int as unknown
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
            `

    const histogramRows = await db.execute<HistogramRow>(histogramSql)

    const histogramByBin = new Map<string, Omit<HistogramRow, "bin" | "binOrder">>()
    for (const row of histogramRows.rows) {
      histogramByBin.set(row.bin, {
        total: row.total,
        urgent: row.urgent,
        high: row.high,
        medium: row.medium,
        low: row.low,
        unknown: row.unknown,
      })
    }

    const normalizedHistogram = (binsByMode[histogramMode] ?? binsByMode.default).map((bin) => {
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

    return NextResponse.json({ histogram: normalizedHistogram })
  }

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
        (count(*) filter (where tt.avg_resolution_hours is not null))::int as "expectedTotal",
        (count(*) filter (
          where tt.avg_resolution_hours is not null
            and ((extract(epoch from (t.resolved_at - t.created_at))::float8) / 3600) > tt.avg_resolution_hours
        ))::int as "overdueTotal",
        min((extract(epoch from (t.resolved_at - t.created_at))::float8) / 3600) as "minHours",
        max((extract(epoch from (t.resolved_at - t.created_at))::float8) / 3600) as "maxHours",
        avg((extract(epoch from (t.resolved_at - t.created_at))::float8) / 3600) as "avgHours",
        percentile_cont(0.5) within group (
          order by ((extract(epoch from (t.resolved_at - t.created_at))::float8) / 3600)
        ) as "medianHours",
        (avg(tt.avg_resolution_hours) filter (where tt.avg_resolution_hours is not null))::float8 as "avgExpectedHours",
        (
          avg(
            (((extract(epoch from (t.resolved_at - t.created_at))::float8) / 3600) - tt.avg_resolution_hours)::float8
          ) filter (where tt.avg_resolution_hours is not null)
        )::float8 as "avgDeltaHours"
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
        (count(*) filter (where tt.avg_resolution_hours is not null))::int as "expectedTotal",
        (count(*) filter (
          where tt.avg_resolution_hours is not null
            and ((extract(epoch from (t.resolved_at - t.created_at))::float8) / 3600) > tt.avg_resolution_hours
        ))::int as "overdueTotal",
        min((extract(epoch from (t.resolved_at - t.created_at))::float8) / 3600) as "minHours",
        max((extract(epoch from (t.resolved_at - t.created_at))::float8) / 3600) as "maxHours",
        avg((extract(epoch from (t.resolved_at - t.created_at))::float8) / 3600) as "avgHours",
        percentile_cont(0.5) within group (
          order by ((extract(epoch from (t.resolved_at - t.created_at))::float8) / 3600)
        ) as "medianHours",
        (avg(tt.avg_resolution_hours) filter (where tt.avg_resolution_hours is not null))::float8 as "avgExpectedHours",
        (
          avg(
            (((extract(epoch from (t.resolved_at - t.created_at))::float8) / 3600) - tt.avg_resolution_hours)::float8
          ) filter (where tt.avg_resolution_hours is not null)
        )::float8 as "avgDeltaHours"
      from tickets t
      join ticket_types tt on tt.id = t.ticket_type_id
      where ${ticketWhere}
        and t.resolved_at is not null
      group by 1
      order by 1 asc
    `,
  )

  const histogramSql =
    histogramMode === "fine"
      ? sql`
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
            (count(*) filter (where priority = 'urgent'))::int as urgent,
            (count(*) filter (where priority = 'high'))::int as high,
            (count(*) filter (where priority = 'medium'))::int as medium,
            (count(*) filter (where priority = 'low'))::int as low,
            (count(*) filter (where priority = 'unknown'))::int as unknown
          from (
            select
              priority,
              case
                when hours < 0.5 then '0-0.5'
                when hours < 1 then '0.5-1'
                when hours < 2 then '1-2'
                when hours < 4 then '2-4'
                when hours < 8 then '4-8'
                when hours < 16 then '8-16'
                when hours < 24 then '16-24'
                else '24+'
              end as bin,
              case
                when hours < 0.5 then 0
                when hours < 1 then 1
                when hours < 2 then 2
                when hours < 4 then 3
                when hours < 8 then 4
                when hours < 16 then 5
                when hours < 24 then 6
                else 7
              end as bin_order
            from resolved
          ) b
          group by 1, 2
          order by 2 asc
        `
      : histogramMode === "coarse"
        ? sql`
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
              (count(*) filter (where priority = 'urgent'))::int as urgent,
              (count(*) filter (where priority = 'high'))::int as high,
              (count(*) filter (where priority = 'medium'))::int as medium,
              (count(*) filter (where priority = 'low'))::int as low,
              (count(*) filter (where priority = 'unknown'))::int as unknown
            from (
              select
                priority,
                case
                  when hours < 2 then '0-2'
                  when hours < 8 then '2-8'
                  when hours < 16 then '8-16'
                  else '16+'
                end as bin,
                case
                  when hours < 2 then 0
                  when hours < 8 then 1
                  when hours < 16 then 2
                  else 3
                end as bin_order
              from resolved
            ) b
            group by 1, 2
            order by 2 asc
          `
        : sql`
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
              (count(*) filter (where priority = 'urgent'))::int as urgent,
              (count(*) filter (where priority = 'high'))::int as high,
              (count(*) filter (where priority = 'medium'))::int as medium,
              (count(*) filter (where priority = 'low'))::int as low,
              (count(*) filter (where priority = 'unknown'))::int as unknown
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
          `

  const histogramRows = await db.execute<HistogramRow>(histogramSql)

  const histogramByBin = new Map<string, Omit<HistogramRow, "bin" | "binOrder">>()
  for (const row of histogramRows.rows) {
    histogramByBin.set(row.bin, {
      total: row.total,
      urgent: row.urgent,
      high: row.high,
      medium: row.medium,
      low: row.low,
      unknown: row.unknown,
    })
  }

  const normalizedHistogram = (binsByMode[histogramMode] ?? binsByMode.default).map((bin) => {
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
    .rows.slice()
    .sort((a, b) => {
      const aKey = a.priority.toLowerCase()
      const bKey = b.priority.toLowerCase()
      const aRank = priorityOrder.get(aKey) ?? 999
      const bRank = priorityOrder.get(bKey) ?? 999
      if (aRank !== bRank) return aRank - bRank
      return aKey.localeCompare(bKey)
    })

  const overall = statsRows.rows[0] ?? null

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
    overdueTickets: overdueRows.rows.map((row) => ({
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
