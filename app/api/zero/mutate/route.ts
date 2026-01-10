import { mustGetMutator } from "@rocicorp/zero"
import { handleMutateRequest } from "@rocicorp/zero/server"
import { eq } from "drizzle-orm"

import { getDbProvider } from "./db-provider"
import { getAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { appUsers } from "@/lib/db/schema/app-users"
import type { ZeroContext } from "@/zero/context"
import { mutators } from "@/zero/mutators"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const session = await getAuth().api.getSession({
    headers: request.headers,
  })

  const userID = session?.user?.id
  if (!userID) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const appUserRows = await db
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

  const appUser = appUserRows[0] ?? null
  if (!appUser || appUser.accountStatus !== "active") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const ctx: ZeroContext = {
    userID,
    userType: appUser.userType,
    internalRole: appUser.internalRole ?? null,
    clientId: appUser.clientId ?? null,
    teamMemberId: appUser.teamMemberId ?? null,
  }

  const result = await handleMutateRequest(
    getDbProvider(),
    (transact) =>
      transact(async (tx, name, args) => {
        const mutator = mustGetMutator(mutators, name)
        return mutator.fn({ args, tx, ctx })
      }),
    request,
  )

  return Response.json(result)
}
