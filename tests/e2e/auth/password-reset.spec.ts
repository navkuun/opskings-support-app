import { expect, test } from "@playwright/test"

import { debugSession, seedAllowlist, setupPassword, signInWithPassword } from "../../helpers/auth"

test("password reset flow sets a new password (dev mailbox)", async ({ page }) => {
  const { email } = await seedAllowlist(page, "team_member", "e2e-reset")
  const password = "password1234!"
  const newPassword = "password1234!new"

  await setupPassword(page, email, password)
  await signInWithPassword(page, email, password)

  await page.context().clearCookies()
  await expect
    .poll(async () => (await debugSession(page)).ok)
    .toBe(false)

  await setupPassword(page, email, newPassword)
  await signInWithPassword(page, email, newPassword)

  await page.goto("/protected")
  await expect(page.getByRole("heading", { name: "Protected" })).toBeVisible()
})

