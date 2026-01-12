import { performance } from "node:perf_hooks"
import fs from "node:fs/promises"
import { expect, test, type ConsoleMessage, type Page, type TestInfo } from "@playwright/test"

import { seedAllowlist, setupPassword, signInWithPassword } from "../../helpers/auth"
import { seedTickets } from "../../helpers/tickets"

type PerfResult = {
  name: string
  ms: number
  budgetMs: number | null
  ok: boolean | null
}

type PerfRun = {
  ranAt: string
  baseURL: string | null
  results: PerfResult[]
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

const perfRun: PerfRun = {
  ranAt: new Date().toISOString(),
  baseURL: process.env.PLAYWRIGHT_BASE_URL ?? null,
  results: [],
}

test.afterAll(async () => {
  await fs.mkdir(".playwright", { recursive: true })
  await fs.writeFile(".playwright/perf-latest.json", JSON.stringify(perfRun, null, 2))
})

function cardByTitle(page: Page, title: string) {
  return page.locator('[data-slot="card"]', {
    has: page.locator('[data-slot="card-title"]', { hasText: title }),
  })
}

function startBrowserErrorCapture(page: Page, testInfo: TestInfo) {
  const consoleErrors: Array<{ type: string; text: string }> = []
  const pageErrors: string[] = []

  const onConsole = (msg: ConsoleMessage) => {
    if (msg.type() !== "error") return
    consoleErrors.push({ type: msg.type(), text: msg.text() })
  }
  const onPageError = (error: Error) => {
    pageErrors.push(error.stack ?? error.message)
  }

  page.on("console", onConsole as never)
  page.on("pageerror", onPageError)

  return async function flush() {
    page.off("console", onConsole as never)
    page.off("pageerror", onPageError)

    if (!consoleErrors.length && !pageErrors.length) return

    await fs.mkdir(".playwright", { recursive: true })
    await fs.writeFile(
      ".playwright/browser-errors-latest.json",
      JSON.stringify({ test: testInfo.title, consoleErrors, pageErrors }, null, 2),
    )

    await testInfo.attach("browser-errors.json", {
      body: JSON.stringify({ consoleErrors, pageErrors }, null, 2),
      contentType: "application/json",
    })
  }
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

  // Best-effort: include the websocket connection attempt in "cold-ish" timing without
  // flaking the run if the socket errors before frames are exchanged.
  await wsPromise.catch(() => null)
}

async function record(
  testInfo: TestInfo,
  name: string,
  run: () => Promise<number>,
  budgetEnvVar: string,
) {
  const budgetMs = envBudget(budgetEnvVar)
  const ms = await run()
  await recordMeasured(testInfo, { name, ms, budgetMs })
}

async function recordMeasured(
  testInfo: TestInfo,
  {
    name,
    ms,
    budgetMs,
  }: {
    name: string
    ms: number
    budgetMs: number | null
  },
) {
  const result: PerfResult = {
    name,
    ms,
    budgetMs,
    ok: budgetMs == null ? null : ms <= budgetMs,
  }

  perfRun.results.push(result)

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

  {
    const start = performance.now()
    const wsTraffic = waitForZeroTraffic(page)
    const metricsReady = page.waitForResponse(
      (res) => res.ok() && res.url().includes("/api/dashboard/metrics?"),
      { timeout: 30_000 },
    )

    await page.goto("/dashboard")
    await Promise.all([wsTraffic, metricsReady])

    const totalTicketsCard = cardByTitle(page, "Total tickets")
    await expect(totalTicketsCard).toBeVisible()
    await expect(totalTicketsCard.locator("div.text-2xl")).not.toHaveClass(/text-muted-foreground/)

    await recordMeasured(testInfo, {
      name: "dashboard_overview_kpis_cold",
      ms: performance.now() - start,
      budgetMs: envBudget("PERF_BUDGET_DASHBOARD_KPIS_MS"),
    })

    const overTimeCard = cardByTitle(page, "Tickets over time")
    const byTypeCard = cardByTitle(page, "Tickets by type")
    await expect(overTimeCard.locator("svg.recharts-surface")).toBeVisible()
    await expect(byTypeCard.locator("svg.recharts-surface")).toBeVisible()

    await recordMeasured(testInfo, {
      name: "dashboard_charts_rendered_cold",
      ms: performance.now() - start,
      budgetMs: envBudget("PERF_BUDGET_DASHBOARD_CHARTS_MS"),
    })
  }

  await page.getByRole("link", { name: "Tickets", exact: true }).click()
  await page.waitForURL("**/tickets")

  {
    const start = performance.now()
    const metricsReady = page.waitForResponse(
      (res) => res.ok() && res.url().includes("/api/dashboard/metrics?"),
      { timeout: 30_000 },
    )

    await page.getByRole("link", { name: "Dashboard", exact: true }).click()
    await page.waitForURL("**/dashboard")
    await metricsReady

    const totalTicketsCard = cardByTitle(page, "Total tickets")
    await expect(totalTicketsCard).toBeVisible()
    await expect(totalTicketsCard.locator("div.text-2xl")).not.toHaveClass(/text-muted-foreground/)

    await recordMeasured(testInfo, {
      name: "dashboard_overview_kpis_warm",
      ms: performance.now() - start,
      budgetMs: envBudget("PERF_BUDGET_DASHBOARD_KPIS_MS"),
    })

    const overTimeCard = cardByTitle(page, "Tickets over time")
    const byTypeCard = cardByTitle(page, "Tickets by type")
    await expect(overTimeCard.locator("svg.recharts-surface")).toBeVisible()
    await expect(byTypeCard.locator("svg.recharts-surface")).toBeVisible()

    await recordMeasured(testInfo, {
      name: "dashboard_charts_rendered_warm",
      ms: performance.now() - start,
      budgetMs: envBudget("PERF_BUDGET_DASHBOARD_CHARTS_MS"),
    })
  }
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
      const metricsReady = page.waitForResponse(
        (res) =>
          res.ok() &&
          res.url().includes("/api/response-time/metrics?") &&
          !res.url().includes("only=histogram"),
        { timeout: 30_000 },
      )
      const start = performance.now()
      await page.goto("/response-time")
      await metricsReady
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
      const metricsReady = page.waitForResponse(
        (res) =>
          res.ok() &&
          res.url().includes("/api/response-time/metrics?") &&
          !res.url().includes("only=histogram"),
        { timeout: 30_000 },
      )
      const start = performance.now()
      await page.goto("/response-time")
      await metricsReady
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
  const flushErrors = startBrowserErrorCapture(page, testInfo)
  const { email, id: teamMemberId } = await seedAllowlist(page, "team_member", "e2e-perf-tickets")
  const password = "password1234!"
  await setupPassword(page, email, password)
  await signInWithPassword(page, email, password)

  try {
    const { id: clientId } = await seedAllowlist(page, "client", "e2e-perf-tickets-client")
    await seedTickets(page, {
      count: 45,
      clientId,
      assignedTo: teamMemberId,
      ticketTypeDepartment: "support",
      ticketTypeName: "General",
      titlePrefix: "E2E Perf Ticket",
    })

    await record(
      testInfo,
      "tickets_initial_table_ready",
      async () => {
        const start = performance.now()
        await page.goto("/tickets")
        await expect(page.getByText("Loading tickets…")).toBeHidden({ timeout: 30_000 })
        const tableReady = page.locator("[data-ticket-row-id]").first()
        await expect(tableReady).toBeVisible({ timeout: 30_000 })
        return performance.now() - start
      },
      "PERF_BUDGET_TICKETS_INITIAL_MS",
    )

    await record(
      testInfo,
      "tickets_pagination_next",
      async () => {
        await page.goto("/tickets")
        const firstRow = page.locator("[data-ticket-row-id]").first()
        await expect(firstRow).toBeVisible()
        const before = await firstRow.getAttribute("data-ticket-row-id")

        const nextButton = page.getByLabel("Go to next page")
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

    await record(
      testInfo,
      "tickets_filter_status_blocked",
      async () => {
        await page.goto("/tickets")
        const firstRow = page.locator("[data-ticket-row-id]").first()
        await expect(firstRow).toBeVisible()
        const before = await firstRow.getAttribute("data-ticket-row-id")

        const start = performance.now()

        const statusInput = page.getByLabel("Filter by status")
        await statusInput.click()
        await page.getByRole("option", { name: "Blocked" }).click()

        await page.waitForURL((url) => url.searchParams.get("status") === "blocked", {
          timeout: 30_000,
        })

        await expect
          .poll(
            async () => {
              const first = await firstRow.getAttribute("data-ticket-row-id")
              return Boolean(first && before && first !== before)
            },
            { timeout: 30_000 },
          )
          .toBe(true)

        return performance.now() - start
      },
      "PERF_BUDGET_TICKETS_FILTERED_MS",
    )
  } finally {
    await flushErrors()
  }
})
