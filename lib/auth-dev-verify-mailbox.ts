import "server-only"

import fs from "node:fs"
import path from "node:path"

type EmailVerificationEntry = {
  url: string
  token: string
  createdAt: number
}

const mailboxPath = path.join(process.cwd(), ".auth-dev-verify-mailbox.json")

const globalForRi = globalThis as typeof globalThis & {
  __riEmailVerificationMailbox?: Map<string, EmailVerificationEntry>
}

function readFromDisk(): Map<string, EmailVerificationEntry> {
  try {
    const raw = fs.readFileSync(mailboxPath, "utf8")
    const parsed = JSON.parse(raw) as Record<string, EmailVerificationEntry>
    return new Map(Object.entries(parsed))
  } catch {
    return new Map()
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

