// essentially a 'push' command to easily generate and apply a new migration then generates zero schema
import { spawnSync } from "node:child_process"

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}

function run(command: string, args: string[]) {
  const result = spawnSync(command, args, { stdio: "inherit" })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function parseName(argv: string[]) {
  const dashDashIndex = argv.indexOf("--")
  const args = dashDashIndex === -1 ? argv : argv.slice(0, dashDashIndex)

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--name" || args[i] === "-n") {
      return args[i + 1]
    }
  }

  const positional = args.find((a) => !a.startsWith("-"))
  return positional
}

const name = parseName(process.argv.slice(2))
if (!name) {
  fail('Usage: `pnpm db:update --name <migration_name>`')
}

run("pnpm", ["db:generate", "--name", name])
run("pnpm", ["db:migrate"])
run("pnpm", ["generate"])

