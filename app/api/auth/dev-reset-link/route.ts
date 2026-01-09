import { NextResponse } from "next/server"

import { getPasswordResetLink } from "@/lib/auth-dev-mailbox"

export const runtime = "nodejs"

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 })
  }

  const url = new URL(request.url)
  const email = url.searchParams.get("email")?.trim() ?? ""
  if (!email) {
    return NextResponse.json(
      { error: "Missing email" },
      { status: 400 },
    )
  }

  const entry = getPasswordResetLink(email)
  return NextResponse.json({
    ok: !!entry,
    url: entry?.url ?? null,
    createdAt: entry?.createdAt ?? null,
  })
}

