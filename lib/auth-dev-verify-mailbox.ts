import "server-only"

import fs from "node:fs"
import path from "node:path"
import { z } from "zod"

type EmailVerificationEntry = {
  url: string
  token: string
  createdAt: number
}

const mailboxPath = path.join(process.cwd(), ".auth-dev-verify-mailbox.json")

const globalForRi = globalThis as typeof globalThis & {
  __riEmailVerificationMailbox?: Map<string, EmailVerificationEntry>
}

const mailboxSchema = z.record(
  z.string(),
  z.object({
    url: z.string(),
    token: z.string(),
    createdAt: z.number(),
  }),
)

function readFromDisk(): Map<string, EmailVerificationEntry> {
  try {
    const raw = fs.readFileSync(mailboxPath, "utf8")
    const parsed: unknown = JSON.parse(raw)
    const result = mailboxSchema.safeParse(parsed)
    if (!result.success) return new Map<string, EmailVerificationEntry>()
    return new Map(Object.entries(result.data))
  } catch {
    return new Map<string, EmailVerificationEntry>()
  }
}

function writeToDisk(map: Map<string, EmailVerificationEntry>) {
  try {
    const tmpPath = `${mailboxPath}.tmp`
    fs.writeFileSync(
      tmpPath,
      JSON.stringify(Object.fromEntries(map.entries()), null, 2),
      "utf8",
    )
    fs.renameSync(tmpPath, mailboxPath)
  } catch {
    // best-effort in dev
  }
}

function mailbox() {
  globalForRi.__riEmailVerificationMailbox ??= readFromDisk()
  return globalForRi.__riEmailVerificationMailbox
}

export function setEmailVerificationLink(input: {
  email: string
  url: string
  token: string
}) {
  const map = mailbox()
  map.set(input.email.toLowerCase(), {
    url: input.url,
    token: input.token,
    createdAt: Date.now(),
  })
  writeToDisk(map)
}

export function getEmailVerificationLink(email: string) {
  const map = mailbox()
  const key = email.toLowerCase()

  const inMemory = map.get(key)
  if (inMemory) return inMemory

  const fromDisk = readFromDisk().get(key) ?? null
  if (fromDisk) map.set(key, fromDisk)
  return fromDisk
}

export function clearEmailVerificationLink(email: string) {
  const map = mailbox()
  map.delete(email.toLowerCase())
  writeToDisk(map)
}
