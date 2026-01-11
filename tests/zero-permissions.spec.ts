import { expect, test } from "@playwright/test"

type SeedAllowlistResponse = {
  ok: boolean
  kind: "client" | "team_member"
  id: number | null
  email: string
}

type ZeroTransformOk = [
  "transformed",
  Array<
    | { id: string; name: string; ast: unknown }
    | { error: "app" | "parse"; id: string; name: string; message?: string }
  >,
]

type ZeroAst = {
  table: string
  where?: unknown
}

function uniqueEmail(prefix: string) {
  const rand = Math.random().toString(16).slice(2)
  return `${prefix}-${Date.now()}-${rand}@example.com`
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function assertZeroAst(value: unknown): asserts value is ZeroAst {
  if (!isObject(value) || typeof value.table !== "string") {
    throw new Error("Expected Zero AST")
  }
}

function hasSimpleColumnEquals(where: unknown, column: string, value: number): boolean {
  if (!isObject(where)) return false
  const type = where.type
  if (type === "simple") {
    if (where.op !== "=") return false
    const left = where.left
    const right = where.right
    if (!isObject(left) || left.type !== "column" || left.name !== column) return false
    if (!isObject(right) || right.type !== "literal" || right.value !== value) return false
    return true
  }

  if (type === "and" || type === "or") {
    const conditions = where.conditions
    if (!Array.isArray(conditions)) return false
    return conditions.some((cond) => hasSimpleColumnEquals(cond, column, value))
  }

  if (type === "correlatedSubquery") {
    const related = where.related
    if (!isObject(related)) return false
    const subquery = related.subquery
    if (!isObject(subquery)) return false
    return hasSimpleColumnEquals(subquery.where, column, value)
  }

  return false
}

function hasCorrelatedSubquery(
  where: unknown,
  table: string,
  column: string,
  value: number,
): boolean {
  if (!isObject(where)) return false
  const type = where.type
  if (type === "correlatedSubquery") {
    const related = where.related
    if (!isObject(related)) return false
    const subquery = related.subquery
    if (!isObject(subquery) || subquery.table !== table) return false
    return hasSimpleColumnEquals(subquery.where, column, value)
  }

  if (type === "and" || type === "or") {
    const conditions = where.conditions
    if (!Array.isArray(conditions)) return false
    return conditions.some((cond) => hasCorrelatedSubquery(cond, table, column, value))
  }

  return false
}

async function seedAllowlist(
  page: import("@playwright/test").Page,
  kind: SeedAllowlistResponse["kind"],
) {
  const email = uniqueEmail(`e2e-zero-${kind}`)
  const res = await page.request.post("/api/test/seed-allowlist", {
    data: { kind, email },
  })
  expect(res.ok()).toBeTruthy()
  const json = (await res.json()) as SeedAllowlistResponse
  expect(json.ok).toBeTruthy()
  expect(json.kind).toBe(kind)
  expect(json.email).toBe(email.toLowerCase())
  expect(typeof json.id).toBe("number")
  return { email: json.email, id: json.id as number }
}

async function pollForResetUrl(page: import("@playwright/test").Page, email: string) {
  const deadline = Date.now() + 10_000
  const endpoint = `/api/auth/dev-reset-link?email=${encodeURIComponent(email)}`

  while (Date.now() < deadline) {
    const res = await page.request.get(endpoint)
    if (res.ok()) {
      const json = (await res.json()) as { ok: boolean; token: string | null }
      if (json.ok && json.token) return json.token
    }
    await page.waitForTimeout(200)
  }

  throw new Error("Timed out waiting for dev reset token")
}

async function setupPassword(
  page: import("@playwright/test").Page,
  email: string,
  newPassword: string,
) {
  const setupRes = await page.request.post("/api/auth/setup-link", {
    data: { email },
  })
  expect(setupRes.ok()).toBeTruthy()

  const token = await pollForResetUrl(page, email)

  const resetRes = await page.request.post("/api/auth/reset-password", {
    data: { newPassword, token },
  })
  expect(resetRes.ok()).toBeTruthy()
}

async function signIn(page: import("@playwright/test").Page, email: string, password: string) {
  const res = await page.request.post("/api/auth/sign-in/email", {
    data: { email, password, callbackURL: "/" },
  })
  expect(res.ok()).toBeTruthy()

  await expect
    .poll(async () => {
      const res = await page.request.get("/api/auth/debug-session")
      if (!res.ok()) return false
      const json = (await res.json()) as { ok: boolean; user: { email?: string } | null }
      return json.ok && json.user?.email === email
    })
    .toBe(true)
}

async function fetchQueryAst(
  page: import("@playwright/test").Page,
  name: string,
  args: Record<string, unknown>,
): Promise<ZeroAst> {
  const res = await page.request.post("/api/zero/query", {
    data: [
      "transform",
      [
        {
          id: "q1",
          name,
          args: [args],
        },
      ],
    ],
  })
  expect(res.ok()).toBeTruthy()

  const json = (await res.json()) as unknown
  if (!Array.isArray(json) || json[0] !== "transformed") {
    throw new Error("Unexpected Zero transform response")
  }

  const ok = json as ZeroTransformOk
  const first = ok[1][0]

  if (isObject(first) && "error" in first) {
    throw new Error(
      `Zero query error for ${name}: ${String(first.error)} ${String(first.message ?? "")}`,
    )
  }

  if (!isObject(first) || !("ast" in first)) {
    throw new Error("Missing AST in transform response")
  }

  const ast = first.ast
  assertZeroAst(ast)
  return ast
}

test("zero queries: anonymous users get empty queries", async ({ page }) => {
  const ast = await fetchQueryAst(page, "tickets.recent", { limit: 1 })
  expect(ast.table).toBe("tickets")
  expect(hasSimpleColumnEquals(ast.where, "id", -1)).toBe(true)
})

test("zero queries: client users are restricted to their clientId", async ({ page }) => {
  const { email, id: clientId } = await seedAllowlist(page, "client")
  const password = "password1234!"

  await setupPassword(page, email, password)
  await signIn(page, email, password)

  const ticketsAst = await fetchQueryAst(page, "tickets.recent", { limit: 1 })
  expect(ticketsAst.table).toBe("tickets")
  expect(hasSimpleColumnEquals(ticketsAst.where, "client_id", clientId)).toBe(true)

  const clientsOwnAst = await fetchQueryAst(page, "clients.byId", { id: clientId })
  expect(clientsOwnAst.table).toBe("clients")
  expect(hasSimpleColumnEquals(clientsOwnAst.where, "id", clientId)).toBe(true)

  const clientsOtherAst = await fetchQueryAst(page, "clients.byId", {
    id: clientId + 1,
  })
  expect(clientsOtherAst.table).toBe("clients")
  expect(hasSimpleColumnEquals(clientsOtherAst.where, "id", -1)).toBe(true)
})

test("zero queries: client users can only access ticket messages for their tickets", async ({
  page,
}) => {
  const { email, id: clientId } = await seedAllowlist(page, "client")
  const password = "password1234!"

  await setupPassword(page, email, password)
  await signIn(page, email, password)

  const ast = await fetchQueryAst(page, "ticketMessages.byTicket", {
    ticketId: 123,
    limit: 50,
  })
  expect(ast.table).toBe("ticket_messages")
  expect(hasSimpleColumnEquals(ast.where, "ticket_id", 123)).toBe(true)
  expect(hasCorrelatedSubquery(ast.where, "tickets", "client_id", clientId)).toBe(true)
})

test("zero queries: client users can only access ticket feedback for their tickets", async ({
  page,
}) => {
  const { email, id: clientId } = await seedAllowlist(page, "client")
  const password = "password1234!"

  await setupPassword(page, email, password)
  await signIn(page, email, password)

  const ast = await fetchQueryAst(page, "ticketFeedback.byTicket", {
    ticketId: 456,
  })
  expect(ast.table).toBe("ticket_feedback")
  expect(hasSimpleColumnEquals(ast.where, "ticket_id", 456)).toBe(true)
  expect(hasCorrelatedSubquery(ast.where, "tickets", "client_id", clientId)).toBe(true)
})

test("zero queries: internal users can list all clients", async ({ page }) => {
  const { email } = await seedAllowlist(page, "team_member")
  const password = "password1234!"

  await setupPassword(page, email, password)
  await signIn(page, email, password)

  const ast = await fetchQueryAst(page, "clients.list", { limit: 10 })
  expect(ast.table).toBe("clients")
  expect(ast.where).toBeUndefined()
})
