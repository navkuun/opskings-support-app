import { eq, sql } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { getAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { appUsers } from "@/lib/db/schema/app-users"

export const runtime = "nodejs"

type NumericFilterOp =
  | "any"
  | "eq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "between"
  | "is_empty"
  | "is_not_empty"

function parseOptionalInt(value: string | null) {
  if (!value) return null
  const parsed = Number(value)
  if (!Number.isInteger(parsed)) return null
  return parsed
}

function parseNumericFilterOp(value: string | null): NumericFilterOp {
  if (
    value === "any" ||
    value === "eq" ||
    value === "gt" ||
    value === "gte" ||
    value === "lt" ||
    value === "lte" ||
    value === "between" ||
    value === "is_empty" ||
    value === "is_not_empty"
  ) {
    return value
  }
  return "any"
}

function parseOptionalNumber(value: string | null) {
  const trimmed = (value ?? "").trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
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
  const q = (url.searchParams.get("q") ?? "").trim()
  const plan = (url.searchParams.get("plan") ?? "").trim()
  const spentOp = parseNumericFilterOp(url.searchParams.get("spentOp"))
  const spentA = parseOptionalNumber(url.searchParams.get("spentA"))
  const spentB = parseOptionalNumber(url.searchParams.get("spentB"))
  const pageParam = parseOptionalInt(url.searchParams.get("page"))
  const pageSizeParam = parseOptionalInt(url.searchParams.get("pageSize"))

  const page = pageParam && pageParam > 0 ? pageParam : 1
  const pageSize =
    pageSizeParam && pageSizeParam > 0 ? Math.min(100, pageSizeParam) : 20

  const offset = (page - 1) * pageSize

  const searchClause = q ? sql`and c.client_name ilike ${`%${q}%`}` : sql``
  const planClause =
    plan && plan !== "any"
      ? plan === "none"
        ? sql`and c.plan_type is null`
        : sql`and c.plan_type = ${plan}`
      : sql``

  const spentClause = (() => {
    if (spentOp === "any") return sql``
    if (spentOp === "is_empty") return sql`and ps.total_spent_usd is null`
    if (spentOp === "is_not_empty") return sql`and ps.total_spent_usd is not null`

    const candidate = sql`coalesce(ps.total_spent_usd, 0)`

    if (spentOp === "between") {
      if (spentA == null && spentB == null) return sql``
      const parts: Array<ReturnType<typeof sql>> = []
      if (spentA != null) parts.push(sql`${candidate} >= ${spentA}`)
      if (spentB != null) parts.push(sql`${candidate} <= ${spentB}`)
      return parts.length ? sql`and ${sql.join(parts, sql` and `)}` : sql``
    }

    if (spentA == null) return sql``
    if (spentOp === "eq") return sql`and ${candidate} = ${spentA}`
    if (spentOp === "gt") return sql`and ${candidate} > ${spentA}`
    if (spentOp === "gte") return sql`and ${candidate} >= ${spentA}`
    if (spentOp === "lt") return sql`and ${candidate} < ${spentA}`
    return sql`and ${candidate} <= ${spentA}`
  })()

  const totalRows = await db.execute<{ total: number }>(
    sql`
      select count(*)::int as total
      from clients c
      left join (
        select p.client_id as client_id, sum(p.amount_usd)::float8 as total_spent_usd
        from payments p
        group by p.client_id
      ) ps on ps.client_id = c.id
      where true
      ${searchClause}
      ${planClause}
      ${spentClause}
    `,
  )

  const total = totalRows.rows[0]?.total ?? 0

  const rows = await db.execute<{
    id: number
    clientName: string
    planType: string | null
    totalTickets: number
    openTickets: number
    totalSpentUsd: number
    lastTicketAt: unknown
  }>(
    sql`
      with ticket_counts as (
        select
          t.client_id as client_id,
          count(*)::int as total_tickets,
          sum(case when t.resolved_at is null then 1 else 0 end)::int as open_tickets,
          max(t.created_at) as last_ticket_at
        from tickets t
        group by t.client_id
      ),
      payment_sums as (
        select
          p.client_id as client_id,
          sum(p.amount_usd)::float8 as total_spent_usd
        from payments p
        group by p.client_id
      )
      select
        c.id::int as id,
        c.client_name as "clientName",
        c.plan_type as "planType",
        coalesce(tc.total_tickets, 0)::int as "totalTickets",
        coalesce(tc.open_tickets, 0)::int as "openTickets",
        coalesce(ps.total_spent_usd, 0)::float8 as "totalSpentUsd",
        tc.last_ticket_at as "lastTicketAt"
      from clients c
      left join ticket_counts tc on tc.client_id = c.id
      left join payment_sums ps on ps.client_id = c.id
      where true
      ${searchClause}
      ${planClause}
      ${spentClause}
      order by coalesce(tc.total_tickets, 0) desc, c.client_name asc
      limit ${pageSize} offset ${offset}
    `,
  )

  return NextResponse.json({
    total,
    rows: rows.rows.map((row) => ({
      id: row.id,
      clientName: row.clientName,
      planType: row.planType,
      totalTickets: row.totalTickets,
      openTickets: row.openTickets,
      totalSpentUsd: row.totalSpentUsd,
      lastTicketAt: toIsoString(row.lastTicketAt),
    })),
  })
}
