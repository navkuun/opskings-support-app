import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const videoRoot = path.resolve(__dirname, "..")

async function rmSafe(target) {
  await fs.rm(target, { recursive: true, force: true })
}

async function main() {
  await rmSafe(path.join(videoRoot, "public", "captures"))
  await rmSafe(path.join(videoRoot, "out"))
  await rmSafe(path.join(videoRoot, ".cache"))
  console.log("[video] Cleaned captures, out, and cache.")
}

main().catch((error) => {
  console.error("[video] Clean failed", error)
  process.exit(1)
})
