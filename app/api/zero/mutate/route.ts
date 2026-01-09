import { mustGetMutator } from "@rocicorp/zero"
import { handleMutateRequest } from "@rocicorp/zero/server"

import { getDbProvider } from "./db-provider"
import { getAuth } from "@/lib/auth"
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

  const result = await handleMutateRequest(
    getDbProvider(),
    (transact) =>
      transact((tx, name, args) => {
        const mutator = mustGetMutator(mutators, name)
        return mutator.fn({ args, tx, ctx: { userID } })
      }),
    request,
  )

  return Response.json(result)
}
