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

async function debugSession(page: import("@playwright/test").Page) {
  const res = await page.request.get("/api/auth/debug-session")
  expect(res.ok()).toBeTruthy()
  return (await res.json()) as { ok: boolean; user: { email?: string } | null }
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
  const json = (await res.json()) as SeedAllowlistResponse
  expect(json.ok).toBeTruthy()
  expect(json.email).toBe(email.toLowerCase())
  expect(json.kind).toBe(kind)
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
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByPlaceholder("Email")).toBeVisible()
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
  await expect(page).toHaveURL(/\/$/)

  await signInWithPassword(page, email, password)
  await page.goto("/protected")
  await expect(page.getByRole("heading", { name: "Protected" })).toBeVisible()
})
