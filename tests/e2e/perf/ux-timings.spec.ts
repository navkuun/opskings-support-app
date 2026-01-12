import { performance } from "node:perf_hooks"
import { expect, test, type Page, type TestInfo } from "@playwright/test"

import { seedAllowlist, setupPassword, signInWithPassword } from "../../helpers/auth"

type PerfResult = {
  name: string
  ms: number
  budgetMs: number | null
  ok: boolean | null
}

function envBudget(name: string) {
  const raw = process.env[name]
  if (!raw) return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function maybeAssertWithinBudget(result: PerfResult) {
  if (result.budgetMs == null) return
  expect(result.ms).toBeLessThanOrEqual(result.budgetMs)
}

function cardByTitle(page: Page, title: string) {
  return page.locator('[data-slot="card"]', {
    has: page.locator('[data-slot="card-title"]', { hasText: title }),
  })
}

function getZeroWsPort() {
  const raw = process.env.NEXT_PUBLIC_ZERO_CACHE_URL
  if (!raw) return "4848"
  try {
    const url = new URL(raw)
    return url.port || (url.protocol === "https:" ? "443" : "80")
  } catch {
    return "4848"
  }
}

async function waitForZeroTraffic(page: Page) {
  const port = getZeroWsPort()
  const wsPromise = page.waitForEvent("websocket", {
    predicate: (ws) => ws.url().includes(`:${port}`),
    timeout: 30_000,
  })

  await page.waitForResponse((res) => res.ok() && res.url().includes("/api/zero/context"), {
    timeout: 30_000,
  })

  const ws = await wsPromise
  await Promise.race([
    ws.waitForEvent("framereceived", { timeout: 30_000 }),
    ws.waitForEvent("framesent", { timeout: 30_000 }),
  ])
}

async function record(
  testInfo: TestInfo,
  name: string,
  run: () => Promise<number>,
  budgetEnvVar: string,
) {
  const budgetMs = envBudget(budgetEnvVar)
  const ms = await run()
  const result: PerfResult = {
    name,
    ms,
    budgetMs,
    ok: budgetMs == null ? null : ms <= budgetMs,
  }

  testInfo.annotations.push({
    type: "perf",
    description: `${name}: ${ms.toFixed(0)}ms${budgetMs ? ` (budget ${budgetMs}ms)` : ""}`,
  })
  await testInfo.attach(`${name}.json`, {
    body: JSON.stringify(result, null, 2),
    contentType: "application/json",
  })

  maybeAssertWithinBudget(result)
}

test("UX timings: dashboard KPI + charts", async ({ page }, testInfo) => {
  const { email } = await seedAllowlist(page, "team_member", "e2e-perf-dashboard")
  const password = "password1234!"
  await setupPassword(page, email, password)
  await signInWithPassword(page, email, password)

  await record(
    testInfo,
    "dashboard_overview_kpis_cold",
    async () => {
      const wsTraffic = waitForZeroTraffic(page)
      const start = performance.now()
      await page.goto("/dashboard")
      await wsTraffic
      await page.waitForResponse((res) => res.ok() && res.url().includes("/api/dashboard/metrics?"))
      const totalTicketsCard = cardByTitle(page, "Total tickets")
      await expect(totalTicketsCard).toBeVisible()
      await expect(totalTicketsCard.locator("div.text-2xl")).not.toHaveClass(/text-muted-foreground/)
      return performance.now() - start
    },
    "PERF_BUDGET_DASHBOARD_KPIS_MS",
  )

  await record(
    testInfo,
    "dashboard_charts_rendered_cold",
    async () => {
      const start = performance.now()
      const overTimeCard = cardByTitle(page, "Tickets over time")
      const byTypeCard = cardByTitle(page, "Tickets by type")
      await expect(overTimeCard.locator("svg.recharts-surface")).toBeVisible()
      await expect(byTypeCard.locator("svg.recharts-surface")).toBeVisible()
      return performance.now() - start
    },
    "PERF_BUDGET_DASHBOARD_CHARTS_MS",
  )

  await page.getByRole("link", { name: "Tickets", exact: true }).click()
  await page.waitForURL("**/tickets")

  await record(
    testInfo,
    "dashboard_overview_kpis_warm",
    async () => {
      const start = performance.now()
      await page.getByRole("link", { name: "Dashboard", exact: true }).click()
      await page.waitForURL("**/dashboard")
      await page.waitForResponse((res) => res.ok() && res.url().includes("/api/dashboard/metrics?"))
      const totalTicketsCard = cardByTitle(page, "Total tickets")
      await expect(totalTicketsCard).toBeVisible()
      await expect(totalTicketsCard.locator("div.text-2xl")).not.toHaveClass(/text-muted-foreground/)
      return performance.now() - start
    },
    "PERF_BUDGET_DASHBOARD_KPIS_MS",
  )

  await record(
    testInfo,
    "dashboard_charts_rendered_warm",
    async () => {
      const start = performance.now()
      const overTimeCard = cardByTitle(page, "Tickets over time")
      const byTypeCard = cardByTitle(page, "Tickets by type")
      await expect(overTimeCard.locator("svg.recharts-surface")).toBeVisible()
      await expect(byTypeCard.locator("svg.recharts-surface")).toBeVisible()
      return performance.now() - start
    },
    "PERF_BUDGET_DASHBOARD_CHARTS_MS",
  )
})

test("UX timings: response-time KPI + charts", async ({ page }, testInfo) => {
  const { email } = await seedAllowlist(page, "team_member", "e2e-perf-response-time")
  const password = "password1234!"
  await setupPassword(page, email, password)
  await signInWithPassword(page, email, password)

  await record(
    testInfo,
    "response_time_overview_kpis",
    async () => {
      const start = performance.now()
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
      return performance.now() - start
    },
    "PERF_BUDGET_RESPONSE_TIME_KPIS_MS",
  )

  await record(
    testInfo,
    "response_time_charts_rendered",
    async () => {
      const start = performance.now()
      await page.goto("/response-time")
      await page.waitForResponse(
        (res) =>
          res.ok() &&
          res.url().includes("/api/response-time/metrics?") &&
          !res.url().includes("only=histogram"),
      )
      const histogramCard = cardByTitle(page, "Resolution time distribution")
      await expect(histogramCard.locator("svg.recharts-surface")).toBeVisible()
      const summaryCard = cardByTitle(page, "Summary by priority")
      await expect(summaryCard).toBeVisible()
      return performance.now() - start
    },
    "PERF_BUDGET_RESPONSE_TIME_CHARTS_MS",
  )
})

test("UX timings: tickets initial load + pagination", async ({ page }, testInfo) => {
  const { email } = await seedAllowlist(page, "client", "e2e-perf-tickets")
  const password = "password1234!"
  await setupPassword(page, email, password)
  await signInWithPassword(page, email, password)

  await record(
    testInfo,
    "tickets_initial_table_ready",
    async () => {
      const start = performance.now()
      await page.goto("/tickets")
      const tableReady = page
        .locator("[data-ticket-row-id]")
        .first()
        .or(page.getByText("No tickets found.").first())
      await expect(tableReady).toBeVisible({ timeout: 30_000 })
      return performance.now() - start
    },
    "PERF_BUDGET_TICKETS_INITIAL_MS",
  )

  const ticketRows = page.locator("[data-ticket-row-id]")
  if ((await ticketRows.count()) < 1) {
    testInfo.annotations.push({
      type: "perf",
      description:
        "tickets_pagination_next: skipped (no tickets in DB; create > 20 tickets to measure cursor pagination)",
    })
    return
  }

  const nextButton = page.getByRole("button", { name: /^next$/i })
  if (await nextButton.isDisabled()) {
    testInfo.annotations.push({
      type: "perf",
      description:
        "tickets_pagination_next: skipped (no next page; create > 20 tickets to measure cursor pagination)",
    })
    return
  }

  await record(
    testInfo,
    "tickets_pagination_next",
    async () => {
      await page.goto("/tickets")
      const firstRow = page.locator("[data-ticket-row-id]").first()
      await expect(firstRow).toBeVisible()
      const before = await firstRow.getAttribute("data-ticket-row-id")

      await expect(nextButton).toBeEnabled()

      const start = performance.now()
      await nextButton.click()
      await expect
        .poll(async () => firstRow.getAttribute("data-ticket-row-id"), { timeout: 30_000 })
        .not.toBe(before)
      return performance.now() - start
    },
    "PERF_BUDGET_TICKETS_PAGINATION_MS",
  )
})
