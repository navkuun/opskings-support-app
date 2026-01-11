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

async function seedAllowlist(
  page: import("@playwright/test").Page,
  kind: SeedAllowlistResponse["kind"],
) {
  const email = uniqueEmail(`e2e-${kind}-reset`)
  const res = await page.request.post("/api/test/seed-allowlist", {
    data: { kind, email },
  })
  expect(res.ok()).toBeTruthy()
  const json: unknown = await res.json()
  const parsed = parseSeedAllowlistResponse(json)
  if (!parsed) throw new Error("Unexpected seed-allowlist response")
  expect(parsed.ok).toBeTruthy()
  expect(parsed.email).toBe(email.toLowerCase())
  expect(typeof parsed.id).toBe("number")
  return parsed.email
}

async function waitForSessionEmail(
  page: import("@playwright/test").Page,
  email: string,
) {
  await expect
    .poll(async () => {
      const res = await page.request.get("/api/auth/debug-session")
      if (!res.ok()) return null
      const json: unknown = await res.json()
      return parseDebugSessionResponse(json)
    })
    .toMatchObject({ ok: true, user: { email } })
}

async function pollForResetUrl(
  page: import("@playwright/test").Page,
  email: string,
) {
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

async function setPassword(page: import("@playwright/test").Page, email: string, password: string) {
  const setupRes = await page.request.post("/api/auth/setup-link", {
    data: { email },
  })
  expect(setupRes.ok()).toBeTruthy()

  const token = await pollForResetUrl(page, email)
  const resetRes = await page.request.post("/api/auth/reset-password", {
    data: { newPassword: password, token },
  })
  expect(resetRes.ok()).toBeTruthy()
}

async function signIn(page: import("@playwright/test").Page, email: string, password: string) {
  const res = await page.request.post("/api/auth/sign-in/email", {
    data: { email, password, callbackURL: "/" },
  })
  expect(res.ok()).toBeTruthy()
  await waitForSessionEmail(page, email)
}

test("password reset flow sets a new password (dev mailbox)", async ({ page }) => {
  const email = await seedAllowlist(page, "team_member")
  const password = "password1234!"
  const newPassword = "password1234!new"

  await setPassword(page, email, password)
  await signIn(page, email, password)

  await page.context().clearCookies()
  await expect
    .poll(async () => {
      const res = await page.request.get("/api/auth/debug-session")
      if (!res.ok()) return null
      const json: unknown = await res.json()
      const parsed = parseDebugSessionResponse(json)
      return parsed?.ok ?? null
    })
    .toBe(false)

  // Request a new reset token and reset password.
  const setupRes = await page.request.post("/api/auth/setup-link", {
    data: { email },
  })
  expect(setupRes.ok()).toBeTruthy()

  const token = await pollForResetUrl(page, email)
  const resetRes = await page.request.post("/api/auth/reset-password", {
    data: { newPassword, token },
  })
  expect(resetRes.ok()).toBeTruthy()

  await signIn(page, email, newPassword)
  await page.goto("/protected")
  await expect(page.getByRole("heading", { name: "Protected" })).toBeVisible()
})
