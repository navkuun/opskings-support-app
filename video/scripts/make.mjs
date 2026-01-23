import path from "node:path"
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
  const nodeCommand = process.execPath
  await run(nodeCommand, [path.join(videoRoot, "scripts", "capture.mjs")])
  await run(nodeCommand, [path.join(videoRoot, "scripts", "render.mjs")])
}

main().catch((error) => {
  console.error("[video] Full pipeline failed", error)
  process.exit(1)
})
