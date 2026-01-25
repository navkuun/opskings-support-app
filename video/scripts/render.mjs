import path from "node:path"
import fs from "node:fs/promises"
import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const videoRoot = path.resolve(__dirname, "..")

async function fileExists(target) {
  try {
    await fs.access(target)
    return true
  } catch {
    return false
  }
}

async function resolveBrowserExecutable() {
  const envPath =
    process.env.VIDEO_BROWSER_EXECUTABLE ??
    process.env.REMOTION_BROWSER_EXECUTABLE ??
    process.env.PLAYWRIGHT_EXECUTABLE_PATH ??
    null
  if (envPath && (await fileExists(envPath))) return envPath

  const candidates = [
    "/run/current-system/sw/bin/google-chrome-stable",
    "/run/current-system/sw/bin/chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ]

  for (const candidate of candidates) {
    if (await fileExists(candidate)) return candidate
  }

  return null
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: videoRoot, stdio: "inherit" })
    child.on("exit", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} exited with code ${code}`))
    })
  })
}

async function main() {
  const command = process.platform === "win32" ? "npx.cmd" : "npx"
  await fs.mkdir(path.join(videoRoot, "out"), { recursive: true })
  const browserExecutable = await resolveBrowserExecutable()
  const chromeMode = process.env.VIDEO_CHROME_MODE ?? "chrome-for-testing"
  const args = ["remotion", "render", "src/index.tsx", "FullVideo", "out/video.mp4", `--chrome-mode=${chromeMode}`]
  if (browserExecutable) {
    args.push(`--browser-executable=${browserExecutable}`)
  }
  await run(command, args)
}

main().catch((error) => {
  console.error("[video] Render failed", error)
  process.exit(1)
})
