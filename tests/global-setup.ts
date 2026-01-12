async function waitForOk(url: string, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs
  let lastError: unknown = null

  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { cache: "no-store" })
      if (res.ok) return
      lastError = new Error(`Non-2xx: ${res.status}`)
    } catch (error) {
      lastError = error
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }

  throw lastError instanceof Error ? lastError : new Error("Timed out waiting for server")
}

async function warm(url: string) {
  try {
    await fetch(url, { cache: "no-store" })
  } catch {
    // Ignore; warmup is best-effort.
  }
}

export default async function globalSetup() {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000"

  await waitForOk(`${baseURL}/api/auth/debug-session`, 120_000)

  // Warm up common routes and API handlers to avoid first-hit Next.js dev compilation
  // causing flaky 30s timeouts when tests run in parallel.
  await Promise.all([
    warm(`${baseURL}/`),
    warm(`${baseURL}/protected`),
    warm(`${baseURL}/tickets`),
    warm(`${baseURL}/dashboard`),
    warm(`${baseURL}/teams`),
    warm(`${baseURL}/clients`),
    warm(`${baseURL}/response-time`),
    warm(`${baseURL}/api/auth/debug-session`),
    warm(`${baseURL}/api/zero/query`),
    warm(`${baseURL}/api/dashboard/metrics`),
    warm(`${baseURL}/api/response-time/metrics`),
  ])
}
