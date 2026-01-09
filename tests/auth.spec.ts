import { expect, test } from "@playwright/test"

function uniqueEmail() {
  const rand = Math.random().toString(16).slice(2)
  return `e2e-${Date.now()}-${rand}@example.com`
}

async function debugSessionOk(page: import("@playwright/test").Page) {
  const res = await page.request.get("/api/auth/debug-session")
  expect(res.ok()).toBeTruthy()
  return (await res.json()) as { ok: boolean; user: { email?: string } | null }
}

test("redirects anonymous user from /protected", async ({ page }) => {
  await page.goto("/protected")
  await expect(page).toHaveURL(/\/login$/)
})

test("can sign up, access protected, sign out, and sign back in", async ({
  page,
}) => {
  const email = uniqueEmail()
  const password = "password1234!"

  await page.goto("/login")
  await page.getByRole("button", { name: "Need an account?" }).click()

  await page.getByPlaceholder("Name").fill("E2E User")
  await page.getByPlaceholder("Email").fill(email)
  await page.getByPlaceholder("Password").fill(password)

  const signUpResponse = page.waitForResponse(
    (r) =>
      r.request().method() === "POST" &&
      r.url().includes("/api/auth/sign-up/email"),
  )
  await page.getByRole("button", { name: "Sign up" }).click()
  expect((await signUpResponse).ok()).toBeTruthy()

  await expect
    .poll(async () => {
      const { ok, user } = await debugSessionOk(page)
      return ok && user?.email === email
    })
    .toBe(true)

  await page.goto("/protected")
  await expect(page.getByRole("heading", { name: "Protected" })).toBeVisible()
  await expect(page.getByText("Email:").locator("..")).toContainText(email)

  await page.goto("/")
  await page.getByRole("button", { name: "Sign out" }).click()

  await expect
    .poll(async () => {
      const { ok } = await debugSessionOk(page)
      return ok
    })
    .toBe(false)

  await page.goto("/protected")
  await expect(page).toHaveURL(/\/login$/)

  await page.getByPlaceholder("Email").fill(email)
  await page.getByPlaceholder("Password").fill(password)

  const signInResponse = page.waitForResponse(
    (r) =>
      r.request().method() === "POST" &&
      r.url().includes("/api/auth/sign-in/email"),
  )
  await page.getByRole("button", { name: "Sign in" }).click()
  expect((await signInResponse).ok()).toBeTruthy()

  await expect
    .poll(async () => {
      const { ok, user } = await debugSessionOk(page)
      return ok && user?.email === email
    })
    .toBe(true)
})
