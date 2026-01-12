import { expect, test } from "@playwright/test"

import { seedAllowlist, setupPassword, signInWithPassword } from "../../helpers/auth"

test("client users are redirected away from internal routes", async ({ page }) => {
  const { email } = await seedAllowlist(page, "client", "e2e-access-client")
  const password = "password1234!"

  await setupPassword(page, email, password)
  await signInWithPassword(page, email, password)

  // Allowed route.
  await page.goto("/tickets")
  await expect(page).toHaveURL(/\/tickets/)
  await expect(page.getByRole("button", { name: "Create new ticket" })).toBeVisible()

  // Internal-only routes redirect clients back to tickets.
  const internalOnly = ["/dashboard", "/teams", "/clients", "/response-time"]
  for (const path of internalOnly) {
    await page.goto(path)
    await expect(page).toHaveURL(/\/tickets/)
  }
})

