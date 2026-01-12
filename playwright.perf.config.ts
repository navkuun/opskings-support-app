import fs from "node:fs"
import { defineConfig, devices } from "@playwright/test"

const systemChromiumExecutable =
  process.env.PLAYWRIGHT_EXECUTABLE_PATH ??
  (fs.existsSync("/run/current-system/sw/bin/google-chrome-stable")
    ? "/run/current-system/sw/bin/google-chrome-stable"
    : undefined)

export default defineConfig({
  testDir: "./tests/e2e/perf",
  fullyParallel: false,
  timeout: 120_000,
  retries: 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html"]] : [["list"], ["html"]],
  globalSetup: "./tests/global-setup.ts",
  use: {
    baseURL: "http://localhost:3000",
    navigationTimeout: 60_000,
    actionTimeout: 30_000,
    trace: "on-first-retry",
  },
  webServer: {
    command:
      "bash -lc 'set -euo pipefail; export E2E_TEST_MODE=true; export BETTER_AUTH_URL=http://localhost:3000; export NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000; export NEXT_PUBLIC_ZERO_CACHE_URL=http://localhost:4848; export NEXT_PUBLIC_ZERO_APP_ID=opskings_support_app_perf; unset BETTER_AUTH_COOKIE_DOMAIN; set -a; source .env.local 2>/dev/null || source .env; set +a; export ZERO_APP_ID=opskings_support_app_perf; export ZERO_QUERY_URL=http://localhost:3000/api/zero/query; export ZERO_MUTATE_URL=http://localhost:3000/api/zero/mutate; export ZERO_QUERY_FORWARD_COOKIES=true; export ZERO_MUTATE_FORWARD_COOKIES=true; mkdir -p .playwright; rm -f .playwright/zero-perf.db*; export ZERO_REPLICA_FILE=.playwright/zero-perf.db; for port in 4848 4849; do pids=$(ss -ltnp \"( sport = :$port )\" | sed -n \"s/.*pid=\\([0-9]\\+\\).*/\\1/p\" | sort -u); for pid in $pids; do echo \"killing leftover pid=$pid on port=$port\"; kill $pid 2>/dev/null || true; done; done; pnpm -s exec zero-cache-dev > .playwright/zero-cache.log 2>&1 & zero_pid=$!; trap \"kill $zero_pid 2>/dev/null || true\" EXIT INT TERM; for i in {1..120}; do ss -ltn \"( sport = :4848 )\" | rg -q LISTEN && ss -ltn \"( sport = :4849 )\" | rg -q LISTEN && break; sleep 0.25; done; (ss -ltn \"( sport = :4848 )\" | rg -q LISTEN && ss -ltn \"( sport = :4849 )\" | rg -q LISTEN) || (echo \"zero-cache-dev failed to start\"; tail -n 120 .playwright/zero-cache.log; exit 1); kill -0 $zero_pid || (echo \"zero-cache-dev exited early\"; tail -n 120 .playwright/zero-cache.log; exit 1); pnpm -s build; pnpm -s start'",
    url: "http://localhost:3000",
    reuseExistingServer: false,
    timeout: 240_000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: systemChromiumExecutable
          ? { executablePath: systemChromiumExecutable }
          : undefined,
      },
    },
  ],
})
