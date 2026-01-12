import { expect, test } from "@playwright/test"

import { seedAllowlist, setupPassword, signInWithPassword } from "../../helpers/auth"

test("internal users can access internal analytics routes", async ({ page }) => {
  const { email } = await seedAllowlist(page, "team_member", "e2e-access-internal")
  const password = "password1234!"

  await setupPassword(page, email, password)
  await signInWithPassword(page, email, password)

  await page.goto("/dashboard")
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByText("Total tickets")).toBeVisible()

  await page.goto("/response-time")
  await expect(page).toHaveURL(/\/response-time/)
  await expect(page.getByText("Resolved tickets", { exact: true }).first()).toBeVisible()

  await page.goto("/teams")
  await expect(page).toHaveURL(/\/teams/)
  await expect(page.getByLabel("Search team members")).toBeVisible()

  await page.goto("/clients")
  await expect(page).toHaveURL(/\/clients/)
  await expect(page.getByLabel("Search clients")).toBeVisible()
})
