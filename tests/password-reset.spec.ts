import { expect, test } from "@playwright/test"

function uniqueEmail() {
  const rand = Math.random().toString(16).slice(2)
  return `e2e-reset-${Date.now()}-${rand}@example.com`
}

async function waitForSessionEmail(page: import("@playwright/test").Page, email: string) {
  await expect
    .poll(async () => {
      const res = await page.request.get("/api/auth/debug-session")
      if (!res.ok()) return null
      return (await res.json()) as { ok: boolean; user: { email?: string } | null }
    })
    .toMatchObject({ ok: true, user: { email } })
}

async function pollForResetUrl(page: import("@playwright/test").Page, email: string) {
  const deadline = Date.now() + 10_000
  const endpoint = `/api/auth/dev-reset-link?email=${encodeURIComponent(email)}`

  while (Date.now() < deadline) {
    const res = await page.request.get(endpoint)
    if (res.ok()) {
      const json = (await res.json()) as { ok: boolean; url: string | null }
      if (json.ok && json.url) return json.url
    }
    await page.waitForTimeout(200)
  }

  throw new Error("Timed out waiting for dev reset link")
}

test("forgot password flow resets password (dev mailbox)", async ({ page }) => {
  const email = uniqueEmail()
  const password = "password1234!"
  const newPassword = "password1234!new"

  // Create an account
  await page.goto("/login")
  await page.getByRole("button", { name: "Need an account?" }).click()
  await page.getByPlaceholder("Name").fill("Reset User")
  await page.getByPlaceholder("Email").fill(email)
  await page.getByPlaceholder("Password").fill(password)
  await page.getByRole("button", { name: "Sign up" }).click()

  await waitForSessionEmail(page, email)

  // Sign out via header on /
  await page.goto("/")
  await page.getByRole("button", { name: "Sign out" }).click({ timeout: 15_000 })
  await expect(page).toHaveURL(/\/login/)

  // Request reset
  await page.goto("/login")
  await page.getByRole("button", { name: "Forgot password?" }).click()
  await page.getByPlaceholder("Email").fill(email)
  page.waitForResponse((r) =>
    r.request().method() === "POST" &&
    r.url().includes("/api/auth/request-password-reset"),
  )
  await page.getByRole("button", { name: "Send reset link" }).click()
  await expect(page.getByText("If an account exists")).toBeVisible()

  // Fetch reset url from dev mailbox endpoint
  const resetUrl = await pollForResetUrl(page, email)

  await page.goto(resetUrl)

  await page.getByLabel("New password").fill(newPassword)
  await page.getByLabel("Confirm password").fill(newPassword)

  const resetResponse = page.waitForResponse((r) =>
    r.url().includes("/api/auth/reset-password"),
  )
  await page.getByRole("button", { name: "Reset password" }).click()
  expect((await resetResponse).ok()).toBeTruthy()

  // Sign in with new password
  await page.goto("/login")
  await page.getByPlaceholder("Email").fill(email)
  await page.getByPlaceholder("Password").fill(newPassword)
  await page.getByRole("button", { name: "Sign in" }).click()
  await waitForSessionEmail(page, email)
  await page.goto("/protected")
  await expect(page.getByRole("heading", { name: "Protected" })).toBeVisible()
})
