import { expect, test } from "@playwright/test"

import { isBoolean, isNumber, isRecord, isString } from "./test-guards"

type SeedAllowlistResponse = {
  ok: boolean
  kind: "client" | "team_member"
  id: number | null
  email: string
}

type DebugSessionResponse = {
  ok: boolean
  user: { email?: string } | null
}

function uniqueEmail(prefix: string) {
  const rand = Math.random().toString(16).slice(2)
  return `${prefix}-${Date.now()}-${rand}@example.com`
}

function parseSeedAllowlistResponse(value: unknown): SeedAllowlistResponse | null {
  if (!isRecord(value)) return null

  const ok = value.ok
  const kind = value.kind
  const id = value.id
  const email = value.email

  if (!isBoolean(ok)) return null
  if (kind !== "client" && kind !== "team_member") return null
  if (id !== null && !isNumber(id)) return null
  if (!isString(email)) return null

  return { ok, kind, id, email }
}

function parseDebugSessionResponse(value: unknown): DebugSessionResponse | null {
  if (!isRecord(value)) return null

  const ok = value.ok
  const user = value.user
  if (!isBoolean(ok)) return null

  if (user === null) return { ok, user: null }
  if (!isRecord(user)) return null

  const email = user.email
  if (email !== undefined && !isString(email)) return null
  return { ok, user: { email } }
}

function parseTokenResponse(value: unknown): { ok: boolean; token: string | null } | null {
  if (!isRecord(value)) return null
  const ok = value.ok
  const token = value.token

  if (!isBoolean(ok)) return null
  if (token !== null && !isString(token)) return null

  return { ok, token }
}

async function debugSession(page: import("@playwright/test").Page) {
  const res = await page.request.get("/api/auth/debug-session")
  expect(res.ok()).toBeTruthy()
  const json: unknown = await res.json()
  const parsed = parseDebugSessionResponse(json)
  if (!parsed) throw new Error("Unexpected debug-session response")
  return parsed
}

async function seedAllowlist(
  page: import("@playwright/test").Page,
  kind: SeedAllowlistResponse["kind"],
) {
  const email = uniqueEmail(`e2e-${kind}`)
  const res = await page.request.post("/api/test/seed-allowlist", {
    data: { kind, email },
  })
  expect(res.ok()).toBeTruthy()
  const json: unknown = await res.json()
  const parsed = parseSeedAllowlistResponse(json)
  if (!parsed) throw new Error("Unexpected seed-allowlist response")
  const allowlist = parsed
  expect(allowlist.ok).toBeTruthy()
  expect(allowlist.email).toBe(email.toLowerCase())
  expect(allowlist.kind).toBe(kind)
  expect(typeof allowlist.id).toBe("number")
  if (allowlist.id == null) throw new Error("Expected allowlist id")
  return { email: allowlist.email, id: allowlist.id }
}

async function pollForResetUrl(page: import("@playwright/test").Page, email: string) {
  const deadline = Date.now() + 10_000
  const endpoint = `/api/auth/dev-reset-link?email=${encodeURIComponent(email)}`

  while (Date.now() < deadline) {
    const res = await page.request.get(endpoint)
    if (res.ok()) {
      const json: unknown = await res.json()
      const parsed = parseTokenResponse(json)
      if (parsed?.ok && parsed.token) return parsed.token
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

async function signInWithPassword(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
) {
  const res = await page.request.post("/api/auth/sign-in/email", {
    data: { email, password, callbackURL: "/" },
  })
  expect(res.ok()).toBeTruthy()

  await expect
    .poll(async () => {
      const { ok, user } = await debugSession(page)
      return ok && user?.email === email
    })
    .toBe(true)
}

test("redirects anonymous user from /protected", async ({ page }) => {
  await page.goto("/protected")
  await expect(page.getByPlaceholder("Email")).toBeVisible()
  await expect(page.getByRole("heading", { name: "Protected" })).toHaveCount(0)
})

test("internal user can set password, access protected, sign out, and sign back in", async ({
  page,
}) => {
  const { email } = await seedAllowlist(page, "team_member")
  const password = "password1234!"

  await setupPassword(page, email, password)
  await signInWithPassword(page, email, password)

  await page.goto("/protected")
  await expect(page.getByRole("heading", { name: "Protected" })).toBeVisible()
  await expect(page.getByText("Email:").locator("..")).toContainText(email)

  await page.context().clearCookies()
  await expect
    .poll(async () => (await debugSession(page)).ok)
    .toBe(false)

  await page.goto("/protected")
  await expect(page.getByPlaceholder("Email")).toBeVisible()
  await expect(page.getByRole("heading", { name: "Protected" })).toHaveCount(0)

  await signInWithPassword(page, email, password)
  await page.goto("/protected")
  await expect(page.getByRole("heading", { name: "Protected" })).toBeVisible()
})
