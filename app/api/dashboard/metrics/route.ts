import { eq, sql } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { getAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { appUsers } from "@/lib/db/schema/app-users"

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

function buildTicketWhere({
  alias,
  createdFrom,
  createdTo,
  assignedTo,
  ticketTypeId,
  priority,
}: {
  alias?: string
  createdFrom: Date | null
  createdTo: Date | null
  assignedTo: number | null | undefined
  ticketTypeId: number | undefined
  priority: string | undefined
}) {
  const clauses: Array<ReturnType<typeof sql>> = []
  const col = (name: string) => (alias ? sql.raw(`${alias}.${name}`) : sql.raw(name))

  if (createdFrom) clauses.push(sql`${col("created_at")} >= ${createdFrom}`)
  if (createdTo) clauses.push(sql`${col("created_at")} <= ${createdTo}`)

  if (assignedTo !== undefined) {
    clauses.push(
      assignedTo === null
        ? sql`${col("assigned_to")} is null`
        : sql`${col("assigned_to")} = ${assignedTo}`,
    )
  }

  if (ticketTypeId !== undefined) {
    clauses.push(sql`${col("ticket_type_id")} = ${ticketTypeId}`)
  }

  if (priority !== undefined) {
    clauses.push(sql`${col("priority")} = ${priority}`)
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

  const assignedToRaw = url.searchParams.get("assignedTo")
  const assignedTo =
    assignedToRaw === "any" || assignedToRaw == null
      ? undefined
      : assignedToRaw === "none"
        ? null
        : (parseOptionalInt(assignedToRaw) ?? undefined)

  const ticketTypeRaw = url.searchParams.get("ticketTypeId")
  const ticketTypeId =
    ticketTypeRaw === "any" || ticketTypeRaw == null
      ? undefined
      : (parseOptionalInt(ticketTypeRaw) ?? undefined)

  const priorityRaw = url.searchParams.get("priority")
  const priority =
    priorityRaw === "any" || priorityRaw == null ? undefined : priorityRaw.trim()

  const ticketWhere = buildTicketWhere({
    createdFrom,
    createdTo,
    assignedTo,
    ticketTypeId,
    priority,
  })

  const totalRows = await db.execute<{ total: number }>(
    sql`
      select count(*)::int as total
      from tickets
      where ${ticketWhere}
    `,
  )

  const openRows = await db.execute<{ open: number }>(
    sql`
      select count(*)::int as open
      from tickets
      where ${ticketWhere}
        and coalesce(status, 'open') <> 'resolved'
    `,
  )

  const resolutionRows = await db.execute<{ avgResolutionHours: number | null }>(
    sql`
      select
        avg((extract(epoch from (resolved_at - created_at))::float8) / 3600) as "avgResolutionHours"
      from tickets
      where ${ticketWhere}
        and resolved_at is not null
    `,
  )

  const avgResolutionByMonthRows = await db.execute<{
    month: string
    avgResolutionHours: number | null
  }>(
    sql`
      select
        to_char(date_trunc('month', resolved_at), 'YYYY-MM') as month,
        avg((extract(epoch from (resolved_at - created_at))::float8) / 3600) as "avgResolutionHours"
      from tickets
      where ${ticketWhere}
        and resolved_at is not null
      group by 1
      order by 1 asc
    `,
  )

  const ratingRows = await db.execute<{ avgRating: number | null }>(
    sql`
      select avg(tf.rating)::float as "avgRating"
      from ticket_feedback tf
      join tickets t on t.id = tf.ticket_id
      where ${buildTicketWhere({
        alias: "t",
        createdFrom,
        createdTo,
        assignedTo,
        ticketTypeId,
        priority,
      })}
        and tf.rating is not null
    `,
  )

  const createdByMonthRows = await db.execute<{ month: string; count: number }>(
    sql`
      select
        to_char(date_trunc('month', created_at), 'YYYY-MM') as month,
        count(*)::int as count
      from tickets
      where ${ticketWhere}
      group by 1
      order by 1 asc
    `,
  )

  const resolvedByMonthRows = await db.execute<{ month: string; count: number }>(
    sql`
      select
        to_char(date_trunc('month', resolved_at), 'YYYY-MM') as month,
        count(*)::int as count
      from tickets
      where ${ticketWhere}
        and resolved_at is not null
      group by 1
      order by 1 asc
    `,
  )

  const openByMonthRows = await db.execute<{ month: string; count: number }>(
    sql`
      select
        to_char(date_trunc('month', created_at), 'YYYY-MM') as month,
        count(*)::int as count
      from tickets
      where ${ticketWhere}
        and coalesce(status, 'open') <> 'resolved'
      group by 1
      order by 1 asc
    `,
  )

  const byTypeRows = await db.execute<{ ticketTypeId: number; count: number }>(
    sql`
      select ticket_type_id as "ticketTypeId", count(*)::int as count
      from tickets
      where ${ticketWhere}
      group by ticket_type_id
      order by count desc
    `,
  )

  const byPriorityRows = await db.execute<{ priority: string; count: number }>(
    sql`
      select coalesce(priority, 'unknown') as priority, count(*)::int as count
      from tickets
      where ${ticketWhere}
      group by 1
      order by count desc
    `,
  )

  const byPriorityStatusRows = await db.execute<{
    priority: string
    status: "open" | "resolved"
    count: number
  }>(
    sql`
      select
        coalesce(priority, 'unknown') as priority,
        case
          when coalesce(status, 'open') <> 'resolved' then 'open'
          else 'resolved'
        end as status,
        count(*)::int as count
      from tickets
      where ${ticketWhere}
      group by 1, 2
      order by 1 asc, 2 asc
    `,
  )

  const createdByMonth = Object.fromEntries(
    createdByMonthRows.rows.map((r) => [r.month, r.count]),
  )
  const resolvedByMonth = Object.fromEntries(
    resolvedByMonthRows.rows.map((r) => [r.month, r.count]),
  )
  const openByMonth = Object.fromEntries(
    openByMonthRows.rows.map((r) => [r.month, r.count]),
  )
  const avgResolutionHoursByMonth = Object.fromEntries(
    avgResolutionByMonthRows.rows.map((r) => [r.month, r.avgResolutionHours]),
  )

  return NextResponse.json({
    total: totalRows.rows[0]?.total ?? 0,
    open: openRows.rows[0]?.open ?? 0,
    avgResolutionHours: resolutionRows.rows[0]?.avgResolutionHours ?? null,
    avgRating: ratingRows.rows[0]?.avgRating ?? null,
    createdByMonth,
    resolvedByMonth,
    openByMonth,
    avgResolutionHoursByMonth,
    ticketsByType: byTypeRows.rows,
    ticketsByPriority: byPriorityRows.rows,
    ticketsByPriorityStatus: byPriorityStatusRows.rows,
  })
}
