import { expect, test } from "@playwright/test"

import { seedAllowlist, setupPassword, signInWithPassword } from "../../helpers/auth"
import { isNumber, isRecord } from "../../helpers/test-guards"

test("analytics APIs: internal users can load metrics endpoints", async ({ page }) => {
  const { email } = await seedAllowlist(page, "team_member", "e2e-analytics-internal")
  const password = "password1234!"

  await setupPassword(page, email, password)
  await signInWithPassword(page, email, password)

  const dashRes = await page.request.get("/api/dashboard/metrics?from=2025-01-01&to=2025-11-30")
  expect(dashRes.ok()).toBeTruthy()
  const dashJson: unknown = await dashRes.json()
  expect(isRecord(dashJson)).toBe(true)
  if (!isRecord(dashJson)) throw new Error("Unexpected dashboard metrics response")
  expect(isNumber(dashJson.total)).toBe(true)
  expect(isNumber(dashJson.open)).toBe(true)

  const rtRes = await page.request.get("/api/response-time/metrics?from=2025-01-01&to=2025-11-30")
  expect(rtRes.ok()).toBeTruthy()
  const rtJson: unknown = await rtRes.json()
  expect(isRecord(rtJson)).toBe(true)
  if (!isRecord(rtJson)) throw new Error("Unexpected response time metrics response")
  expect(isNumber(rtJson.resolvedTotal)).toBe(true)
  expect(Array.isArray(rtJson.histogram)).toBe(true)
})

test("analytics APIs: client users are forbidden from internal metrics endpoints", async ({ page }) => {
  const { email } = await seedAllowlist(page, "client", "e2e-analytics-client")
  const password = "password1234!"

  await setupPassword(page, email, password)
  await signInWithPassword(page, email, password)

  const dashRes = await page.request.get("/api/dashboard/metrics?from=2025-01-01&to=2025-11-30")
  expect(dashRes.status()).toBe(403)

  const rtRes = await page.request.get("/api/response-time/metrics?from=2025-01-01&to=2025-11-30")
  expect(rtRes.status()).toBe(403)
})

