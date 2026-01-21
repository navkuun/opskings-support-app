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
}: {
  alias?: string
  createdFrom: Date | null
  createdTo: Date | null
  assignedTo: AssignedToFilter | undefined
  ticketType: IdListFilter | undefined
  priority: StringListFilter | undefined
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
    createdFrom,
    createdTo,
    assignedTo,
    ticketType,
    priority,
  })

  const metricsRows = await db.execute<{
    total: number
    open: number
    avgResolutionHours: number | null
    avgRating: number | null
    createdByMonth: Record<string, number>
    resolvedByMonth: Record<string, number>
    openByMonth: Record<string, number>
    avgResolutionHoursByMonth: Record<string, number | null>
    ticketsByType: Array<{ ticketTypeId: number; count: number }>
    ticketsByPriority: Array<{ priority: string; count: number }>
    ticketsByPriorityStatus: Array<{ priority: string; status: "open" | "resolved"; count: number }>
  }>(
    sql`
      with filtered as materialized (
        select
          t.id,
          t.created_at,
          t.resolved_at,
          t.status,
          t.priority,
          t.ticket_type_id
        from tickets t
        where ${ticketWhere}
      ),
      created_by_month as (
        select
          to_char(date_trunc('month', created_at), 'YYYY-MM') as month,
          count(*)::int as count
        from filtered
        group by 1
      ),
      resolved_by_month as (
        select
          to_char(date_trunc('month', resolved_at), 'YYYY-MM') as month,
          count(*)::int as count
        from filtered
        where resolved_at is not null
        group by 1
      ),
      open_by_month as (
        select
          to_char(date_trunc('month', created_at), 'YYYY-MM') as month,
          count(*)::int as count
        from filtered
        where coalesce(status, 'open') <> 'resolved'
        group by 1
      ),
      avg_resolution_by_month as (
        select
          to_char(date_trunc('month', resolved_at), 'YYYY-MM') as month,
          avg((extract(epoch from (resolved_at - created_at))::float8) / 3600)::float8 as avg_resolution_hours
        from filtered
        where resolved_at is not null
        group by 1
      ),
      tickets_by_type as (
        select
          ticket_type_id as ticket_type_id,
          count(*)::int as count
        from filtered
        group by 1
      ),
      tickets_by_priority as (
        select
          coalesce(priority, 'unknown') as priority,
          count(*)::int as count
        from filtered
        group by 1
      ),
      tickets_by_priority_status as (
        select
          coalesce(priority, 'unknown') as priority,
          case
            when coalesce(status, 'open') <> 'resolved' then 'open'
            else 'resolved'
          end as status,
          count(*)::int as count
        from filtered
        group by 1, 2
      ),
      ratings as (
        select avg(tf.rating)::float8 as avg_rating
        from ticket_feedback tf
        join filtered f on f.id = tf.ticket_id
        where tf.rating is not null
      )
      select
        (select count(*)::int from filtered) as total,
        (select count(*)::int from filtered where coalesce(status, 'open') <> 'resolved') as open,
        (
          select avg((extract(epoch from (resolved_at - created_at))::float8) / 3600)::float8
          from filtered
          where resolved_at is not null
        ) as "avgResolutionHours",
        (select avg_rating from ratings) as "avgRating",
        coalesce(
          (select jsonb_object_agg(month, count) from created_by_month),
          '{}'::jsonb
        ) as "createdByMonth",
        coalesce(
          (select jsonb_object_agg(month, count) from resolved_by_month),
          '{}'::jsonb
        ) as "resolvedByMonth",
        coalesce(
          (select jsonb_object_agg(month, count) from open_by_month),
          '{}'::jsonb
        ) as "openByMonth",
        coalesce(
          (select jsonb_object_agg(month, avg_resolution_hours) from avg_resolution_by_month),
          '{}'::jsonb
        ) as "avgResolutionHoursByMonth",
        coalesce(
          (
            select jsonb_agg(
              jsonb_build_object('ticketTypeId', ticket_type_id, 'count', count)
              order by count desc
            )
            from tickets_by_type
          ),
          '[]'::jsonb
        ) as "ticketsByType",
        coalesce(
          (
            select jsonb_agg(
              jsonb_build_object('priority', priority, 'count', count)
              order by count desc
            )
            from tickets_by_priority
          ),
          '[]'::jsonb
        ) as "ticketsByPriority",
        coalesce(
          (
            select jsonb_agg(
              jsonb_build_object('priority', priority, 'status', status, 'count', count)
              order by priority asc, status asc
            )
            from tickets_by_priority_status
          ),
          '[]'::jsonb
        ) as "ticketsByPriorityStatus"
    `,
  )

  const row = metricsRows.rows[0]

  return NextResponse.json({
    total: row?.total ?? 0,
    open: row?.open ?? 0,
    avgResolutionHours: row?.avgResolutionHours ?? null,
    avgRating: row?.avgRating ?? null,
    createdByMonth: row?.createdByMonth ?? {},
    resolvedByMonth: row?.resolvedByMonth ?? {},
    openByMonth: row?.openByMonth ?? {},
    avgResolutionHoursByMonth: row?.avgResolutionHoursByMonth ?? {},
    ticketsByType: row?.ticketsByType ?? [],
    ticketsByPriority: row?.ticketsByPriority ?? [],
    ticketsByPriorityStatus: row?.ticketsByPriorityStatus ?? [],
  })
}
