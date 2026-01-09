import { toNextJsHandler } from "better-auth/next-js"

import { getAuth } from "@/lib/auth"

export const runtime = "nodejs"

const handler = () => toNextJsHandler(getAuth())

export async function GET(request: Request) {
  return handler().GET(request)
}

export async function POST(request: Request) {
  return handler().POST(request)
}
