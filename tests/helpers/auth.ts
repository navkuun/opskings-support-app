import { expect, type Page } from "@playwright/test"

import { isBoolean, isNumber, isRecord, isString } from "./test-guards"

export type AllowlistKind = "client" | "team_member"

type SeedAllowlistResponse = {
  ok: boolean
  kind: AllowlistKind
  id: number | null
  email: string
}

type DebugSessionResponse = {
  ok: boolean
  user: { email?: string } | null
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

export function uniqueEmail(prefix: string) {
  const rand = Math.random().toString(16).slice(2)
  return `${prefix}-${Date.now()}-${rand}@example.com`
}

export async function seedAllowlist(page: Page, kind: AllowlistKind, prefix = "e2e") {
  const email = uniqueEmail(`${prefix}-${kind}`)
  let res: import("@playwright/test").APIResponse | null = null
  let lastError: unknown = null

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      res = await page.request.post("/api/test/seed-allowlist", {
        data: { kind, email },
      })
      if (res.ok()) break
      lastError = new Error(`Non-2xx response: ${res.status()}`)
    } catch (error) {
      lastError = error
    }
    await page.waitForTimeout(250 * attempt)
  }

  if (!res || !res.ok()) {
    throw lastError instanceof Error ? lastError : new Error("Failed to seed allowlist")
  }

  const json: unknown = await res.json()
  const parsed = parseSeedAllowlistResponse(json)
  if (!parsed) throw new Error("Unexpected seed-allowlist response")

  expect(parsed.ok).toBeTruthy()
  expect(parsed.email).toBe(email.toLowerCase())
  expect(parsed.kind).toBe(kind)
  expect(typeof parsed.id).toBe("number")

  if (parsed.id == null) throw new Error("Expected allowlist id")
  return { email: parsed.email, id: parsed.id }
}

export async function debugSession(page: Page) {
  const res = await page.request.get("/api/auth/debug-session")
  expect(res.ok()).toBeTruthy()
  const json: unknown = await res.json()
  const parsed = parseDebugSessionResponse(json)
  if (!parsed) throw new Error("Unexpected debug-session response")
  return parsed
}

export async function pollForDevResetToken(page: Page, email: string, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs
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

export async function setupPassword(page: Page, email: string, newPassword: string) {
  const setupRes = await page.request.post("/api/auth/setup-link", {
    data: { email },
  })
  expect(setupRes.ok()).toBeTruthy()

  const token = await pollForDevResetToken(page, email)
  const resetRes = await page.request.post("/api/auth/reset-password", {
    data: { newPassword, token },
  })
  expect(resetRes.ok()).toBeTruthy()
}

export async function signInWithPassword(page: Page, email: string, password: string) {
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
