import { expect, test } from "@playwright/test"

import { seedAllowlist, setupPassword, signInWithPassword } from "../../helpers/auth"

function uniqueText(prefix: string) {
  const rand = Math.random().toString(16).slice(2)
  return `${prefix}-${Date.now()}-${rand}`
}

test("client can create a ticket and reply from the details page", async ({ page }) => {
  const { email } = await seedAllowlist(page, "client", "e2e-tickets-client")
  const password = "password1234!"

  await setupPassword(page, email, password)
  await signInWithPassword(page, email, password)

  const title = uniqueText("E2E Ticket")
  const description = uniqueText("E2E Description")
  const reply = uniqueText("E2E Reply")

  await page.goto("/tickets")
  await expect(page.getByRole("button", { name: "Create new ticket" })).toBeVisible()
  await page.getByRole("button", { name: "Create new ticket" }).click()

  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()

  await expect(dialog.getByLabel("Ticket title")).toBeVisible()
  // The create dialog resets state when ticket-type data loads; ensure it has loaded
  // before filling fields so they don't get cleared.
  await dialog.getByRole("button", { name: "Ticket type" }).click()
  await expect(dialog.getByLabel("Search ticket types…")).toBeVisible()
  await expect(dialog.getByText("No ticket types found.")).toHaveCount(0)
  await page.keyboard.press("Escape")

  await dialog.getByLabel("Ticket title").fill(title)
  await dialog.getByLabel("Ticket description").fill(description)

  await dialog.getByRole("button", { name: /^Create ticket\b/ }).click()
  await expect(page).toHaveURL(/\/tickets\/\d+/, { timeout: 60_000 })

  await expect(page.getByRole("heading", { name: title })).toBeVisible()
  await expect(page.getByText(description)).toBeVisible()

  await page.getByPlaceholder("Write a reply…").fill(reply)
  await page.getByRole("button", { name: "Send" }).click()
  await expect(page.getByText(reply)).toBeVisible()

  await page.getByRole("link", { name: "Back to tickets" }).click()
  await expect(page).toHaveURL(/\/tickets/)
  await expect(page.getByText(title)).toBeVisible()
})
