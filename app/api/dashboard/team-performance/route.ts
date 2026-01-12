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

  const joinClauses: Array<ReturnType<typeof sql>> = [sql`t.assigned_to = tm.id`]
  if (createdFrom) joinClauses.push(sql`t.created_at >= ${createdFrom}`)
  if (createdTo) joinClauses.push(sql`t.created_at <= ${createdTo}`)
  const ticketsJoin = sql.join(joinClauses, sql` and `)

  const rows = await db.execute<{
    teamMemberId: number
    username: string
    status: string | null
    ticketsAssigned: number
    ticketsResolved: number
    avgResolutionHours: number | null
    avgRating: number | null
  }>(
    sql`
      select
        tm.id::int as "teamMemberId",
        tm.username as username,
        tm.status as status,
        count(t.id)::int as "ticketsAssigned",
        sum(case when t.resolved_at is not null then 1 else 0 end)::int as "ticketsResolved",
        avg(
          case
            when t.resolved_at is null then null
            else (extract(epoch from (t.resolved_at - t.created_at))::float8) / 3600
          end
        )::float8 as "avgResolutionHours",
        avg(tf.rating)::float8 as "avgRating"
      from team_members tm
      left join tickets t on ${ticketsJoin}
      left join ticket_feedback tf on tf.ticket_id = t.id and tf.rating is not null
      group by tm.id, tm.username, tm.status
      order by tm.username asc
    `,
  )

  return NextResponse.json({ rows: rows.rows })
}

