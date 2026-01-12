import { expect, test } from "@playwright/test"

import { debugSession, seedAllowlist, setupPassword, signInWithPassword } from "../../helpers/auth"

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

