import { Resend } from "resend"

function getFlag(name: string) {
  return process.argv.includes(name)
}

function getEnv(name: string) {
  const value = process.env[name]
  return value && value.trim() ? value.trim() : null
}

function required(name: string) {
  const value = getEnv(name)
  if (!value) throw new Error(`${name} is required`)
  return value
}

async function main() {
  const dryRun = getFlag("--dry-run")

  const from = dryRun
    ? getEnv("RESEND_FROM") ?? "OpsKings Support <auth@example.com>"
    : required("RESEND_FROM")
  const to = dryRun
    ? getEnv("RESEND_TEST_TO") ?? "test@example.com"
    : required("RESEND_TEST_TO")
  const replyTo = getEnv("RESEND_REPLY_TO") ?? undefined

  const subject = "Resend smoke test"
  const text = [
    "This is a smoke test email.",
    "",
    `Sent at: ${new Date().toISOString()}`,
  ].join("\n")

  const payload = {
    from,
    to,
    subject,
    text,
    ...(replyTo ? { replyTo } : {}),
  }

  if (dryRun) {
    console.log("[resend-test] DRY RUN payload:")
    console.log(JSON.stringify(payload, null, 2))
    return
  }

  const apiKey = required("RESEND_API_KEY")
  const resend = new Resend(apiKey)
  const result = await resend.emails.send(payload)

  if ("error" in result && result.error) {
    console.error("[resend-test] FAILED")
    console.error(result.error)
    process.exitCode = 1
    return
  }

  console.log("[resend-test] OK")
  console.log(JSON.stringify(result, null, 2))
}

main().catch((e) => {
  console.error("[resend-test] FAILED")
  console.error(e)
  process.exitCode = 1
})
