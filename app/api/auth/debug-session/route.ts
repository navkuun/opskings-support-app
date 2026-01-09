import { headers } from "next/headers"

import { getAuth } from "@/lib/auth"

export const runtime = "nodejs"

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 })
  }

  const session = await getAuth().api.getSession({
    headers: await headers(),
  })

  return Response.json({
    ok: !!session?.user?.id,
    user: session?.user ?? null,
  })
}
