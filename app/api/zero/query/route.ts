import { mustGetQuery } from "@rocicorp/zero"
import { handleQueryRequest } from "@rocicorp/zero/server"

import { getAuth } from "@/lib/auth"
import { queries } from "@/zero/queries"
import { schema } from "@/zero/schema"

export const runtime = "nodejs"

export async function POST(request: Request) {
  let userID = "anon"
  try {
    const session = await getAuth().api.getSession({
      headers: request.headers,
    })
    if (session?.user?.id) userID = session.user.id
  } catch {
    // Treat as anonymous for now.
  }

  const result = await handleQueryRequest(
    (name, args) => {
      const query = mustGetQuery(queries, name)
      return query.fn({ args, ctx: { userID } })
    },
    schema,
    request,
  )

  return Response.json(result)
}
