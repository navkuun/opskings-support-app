import path from "node:path"
import fs from "node:fs/promises"
import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const videoRoot = path.resolve(__dirname, "..")

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
  await run(command, ["remotion", "render", "src/Root.tsx", "FullVideo", "out/video.mp4"])
}

main().catch((error) => {
  console.error("[video] Render failed", error)
  process.exit(1)
})
