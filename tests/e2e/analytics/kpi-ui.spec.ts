import { expect, test, type Page } from "@playwright/test"

import { seedAllowlist, setupPassword, signInWithPassword } from "../../helpers/auth"

function cardByTitle(page: Page, title: string) {
  return page.locator('[data-slot="card"]', {
    has: page.locator('[data-slot="card-title"]', { hasText: title }),
  })
}

test("analytics UI: dashboard KPI cards stop showing loading state after metrics resolve", async ({
  page,
}) => {
  const { email } = await seedAllowlist(page, "team_member", "e2e-analytics-kpi-dashboard")
  const password = "password1234!"

  await setupPassword(page, email, password)
  await signInWithPassword(page, email, password)

  await page.goto("/dashboard")
  await page.waitForResponse((res) => res.ok() && res.url().includes("/api/dashboard/metrics?"))

  const totalTicketsCard = cardByTitle(page, "Total tickets")
  await expect(totalTicketsCard).toBeVisible()
  await expect(totalTicketsCard.locator("div.text-2xl")).not.toHaveClass(/text-muted-foreground/)
})

test("analytics UI: response-time KPI cards stop showing loading state after metrics resolve", async ({
  page,
}) => {
  const { email } = await seedAllowlist(page, "team_member", "e2e-analytics-kpi-response-time")
  const password = "password1234!"

  await setupPassword(page, email, password)
  await signInWithPassword(page, email, password)

  await page.goto("/response-time")
  await page.waitForResponse(
    (res) =>
      res.ok() &&
      res.url().includes("/api/response-time/metrics?") &&
      !res.url().includes("only=histogram"),
  )

  const resolvedCard = cardByTitle(page, "Resolved tickets")
  await expect(resolvedCard).toBeVisible()
  await expect(resolvedCard.locator("div.text-2xl")).not.toHaveClass(/text-muted-foreground/)
})
