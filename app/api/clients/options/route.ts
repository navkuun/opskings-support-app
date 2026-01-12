import { eq, sql } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { getAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { appUsers } from "@/lib/db/schema/app-users"

export const runtime = "nodejs"

export async function GET() {
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

  const planTypeRows = await db.execute<{ planType: string | null }>(
    sql`
      select distinct c.plan_type as "planType"
      from clients c
      order by c.plan_type asc nulls last
    `,
  )

  const planTypes: string[] = []
  for (const row of planTypeRows.rows) {
    const planType = (row.planType ?? "").trim()
    if (!planType) continue
    planTypes.push(planType)
  }

  return NextResponse.json({ planTypes })
}

