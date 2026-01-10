import { expect, test } from "@playwright/test"

type SeedAllowlistResponse = {
  ok: boolean
  kind: "client" | "team_member"
  id: number | null
  email: string
}

function uniqueEmail(prefix: string) {
  const rand = Math.random().toString(16).slice(2)
  return `${prefix}-${Date.now()}-${rand}@example.com`
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
  const json = (await res.json()) as SeedAllowlistResponse
  expect(json.ok).toBeTruthy()
  expect(json.email).toBe(email.toLowerCase())
  expect(typeof json.id).toBe("number")
  return json.email
}

async function waitForSessionEmail(
  page: import("@playwright/test").Page,
  email: string,
) {
  await expect
    .poll(async () => {
      const res = await page.request.get("/api/auth/debug-session")
      if (!res.ok()) return null
      return (await res.json()) as { ok: boolean; user: { email?: string } | null }
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
      const json = (await res.json()) as { ok: boolean; token: string | null }
      if (json.ok && json.token) return json.token
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
    .poll(async () => (await (await page.request.get("/api/auth/debug-session")).json() as { ok: boolean }).ok)
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
