import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { z } from "zod"

import { getAuth } from "@/lib/auth"
import { sendHelpRequestEmail } from "@/lib/email/resend"

export const runtime = "nodejs"

const bodySchema = z.object({
  message: z.string().trim().min(1).max(2000),
  page: z.string().trim().max(200).optional(),
})

export async function POST(req: Request) {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const ok = await sendHelpRequestEmail({
    fromEmail: session.user.email,
    page: parsed.data.page ?? "",
    message: parsed.data.message,
  })

  if (!ok) {
    return NextResponse.json(
      { error: "Failed to send help request" },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}

