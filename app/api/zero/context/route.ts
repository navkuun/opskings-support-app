import { eq } from "drizzle-orm"
import { headers } from "next/headers"

import { getAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { appUsers } from "@/lib/db/schema/app-users"
import type { ZeroContext } from "@/zero/context"

export const runtime = "nodejs"

export async function GET() {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  })

  const userID = session?.user?.id
  if (!userID) {
    return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 })
  }

  const rows = await db
    .select({
      accountStatus: appUsers.accountStatus,
      userType: appUsers.userType,
      internalRole: appUsers.internalRole,
      clientId: appUsers.clientId,
      teamMemberId: appUsers.teamMemberId,
    })
    .from(appUsers)
    .where(eq(appUsers.authUserId, userID))
    .limit(1)

  const appUser = rows[0] ?? null
  if (!appUser || appUser.accountStatus !== "active") {
    return Response.json({ ok: false, error: "FORBIDDEN" }, { status: 403 })
  }

  const ctx: ZeroContext = {
    userID,
    userType: appUser.userType,
    internalRole: appUser.internalRole ?? null,
    clientId: appUser.clientId ?? null,
    teamMemberId: appUser.teamMemberId ?? null,
  }

  return Response.json({ ok: true, ctx })
}

