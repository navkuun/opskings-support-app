import { mustGetQuery } from "@rocicorp/zero"
import { handleQueryRequest } from "@rocicorp/zero/server"
import { eq } from "drizzle-orm"

import { getAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { appUsers } from "@/lib/db/schema/app-users"
import type { ZeroContext } from "@/zero/context"
import { queries } from "@/zero/queries"
import { schema } from "@/zero/schema"

export const runtime = "nodejs"

export async function POST(request: Request) {
  let ctx: ZeroContext = { userID: "anon", userType: "anon" }
  try {
    const session = await getAuth().api.getSession({
      headers: request.headers,
    })
    if (session?.user?.id) {
      const appUserRows = await db
        .select({
          accountStatus: appUsers.accountStatus,
          userType: appUsers.userType,
          internalRole: appUsers.internalRole,
          clientId: appUsers.clientId,
          teamMemberId: appUsers.teamMemberId,
        })
        .from(appUsers)
        .where(eq(appUsers.authUserId, session.user.id))
        .limit(1)

      const appUser = appUserRows[0] ?? null
      if (!appUser || appUser.accountStatus !== "active") {
        return Response.json({ error: "Forbidden" }, { status: 403 })
      }

      ctx = {
        userID: session.user.id,
        userType: appUser.userType,
        internalRole: appUser.internalRole ?? null,
        clientId: appUser.clientId ?? null,
        teamMemberId: appUser.teamMemberId ?? null,
      }
    }
  } catch {
    // Treat as anonymous for now.
  }

  const result = await handleQueryRequest(
    (name, args) => {
      const query = mustGetQuery(queries, name)
      return query.fn({ args, ctx })
    },
    schema,
    request,
  )

  return Response.json(result)
}
