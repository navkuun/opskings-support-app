import { eq, sql } from "drizzle-orm"
import { z } from "zod"

import { getAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { appUsers } from "@/lib/db/schema/app-users"
import { isNumber, isRecord, isString } from "@/lib/type-guards"

export const runtime = "nodejs"

const requestSchema = z
  .object({
    tickets: z.number().int().min(0).max(50).default(0),
    ticketMessages: z.number().int().min(0).max(50).default(0),
    ticketFeedback: z.number().int().min(0).max(50).default(0),
  })
  .strict()

type SequenceKey = keyof z.infer<typeof requestSchema>

const sequences: Record<SequenceKey, string> = {
  tickets: "public.tickets_id_seq",
  ticketMessages: "public.ticket_messages_id_seq",
  ticketFeedback: "public.ticket_feedback_id_seq",
}

function parseNextvalRows(value: unknown): number[] {
  if (!isRecord(value)) return []
  const rows = value.rows
  if (!Array.isArray(rows)) return []

  const ids: number[] = []
  for (const row of rows) {
    if (!isRecord(row)) continue
    const raw = row.id
    if (isNumber(raw) && Number.isInteger(raw) && raw > 0) {
      ids.push(raw)
      continue
    }
    if (isString(raw)) {
      const parsed = Number(raw)
      if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) continue
      ids.push(parsed)
    }
  }

  return ids
}

async function nextIds(sequence: string, count: number) {
  if (count <= 0) return []

  const result = await db.execute(
    sql`select nextval(${sql.raw(`'${sequence}'`)}) as id from generate_series(1, ${count})`,
  )
  return parseNextvalRows(result)
}

export async function POST(request: Request) {
  const session = await getAuth().api.getSession({
    headers: request.headers,
  })

  const userId = session?.user?.id
  if (!userId) {
    return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 })
  }

  const appUserRows = await db
    .select({ accountStatus: appUsers.accountStatus })
    .from(appUsers)
    .where(eq(appUsers.authUserId, userId))
    .limit(1)

  const appUser = appUserRows[0] ?? null
  if (!appUser || appUser.accountStatus !== "active") {
    return Response.json({ ok: false, error: "FORBIDDEN" }, { status: 403 })
  }

  let json: unknown = null
  try {
    json = await request.json()
  } catch {
    return Response.json({ ok: false, error: "INVALID_JSON" }, { status: 400 })
  }

  const parsed = requestSchema.safeParse(json)
  if (!parsed.success) {
    return Response.json({ ok: false, error: "INVALID_INPUT" }, { status: 400 })
  }

  const counts = parsed.data
  const totalRequested = counts.tickets + counts.ticketMessages + counts.ticketFeedback
  if (totalRequested <= 0) {
    return Response.json(
      { ok: false, error: "NO_IDS_REQUESTED" },
      { status: 400 },
    )
  }

  const keys = Object.keys(sequences) as SequenceKey[]
  const ids: Record<SequenceKey, number[]> = {
    tickets: [],
    ticketMessages: [],
    ticketFeedback: [],
  }

  for (const key of keys) {
    const count = counts[key]
    const sequence = sequences[key]
    ids[key] = await nextIds(sequence, count)

    if (count > 0 && ids[key].length !== count) {
      return Response.json({ ok: false, error: "ID_ALLOCATION_FAILED" }, { status: 500 })
    }
  }

  return Response.json({ ok: true, ids })
}
