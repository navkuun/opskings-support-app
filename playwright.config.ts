import fs from "node:fs"
import { defineConfig, devices } from "@playwright/test"

const systemChromiumExecutable =
  process.env.PLAYWRIGHT_EXECUTABLE_PATH ??
  (fs.existsSync("/run/current-system/sw/bin/google-chrome-stable")
    ? "/run/current-system/sw/bin/google-chrome-stable"
    : undefined)

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html"]] : [["list"], ["html"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
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
