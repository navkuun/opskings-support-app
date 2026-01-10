import { eq } from "drizzle-orm"
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

  const rows = await db
    .select({
      userType: appUsers.userType,
      internalRole: appUsers.internalRole,
    })
    .from(appUsers)
    .where(eq(appUsers.authUserId, session.user.id))
    .limit(1)

  const appUser = rows[0] ?? null
  if (!appUser) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({
    userType: appUser.userType,
    internalRole: appUser.internalRole,
  })
}

