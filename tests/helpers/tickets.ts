import { expect, type Page } from "@playwright/test"

import { isBoolean, isNumber, isRecord } from "./test-guards"

type SeedTicketsResponse = {
  ok: boolean
  inserted: number[]
  clientId: number
  ticketTypeId: number
  assignedTo: number | null
}

function parseSeedTicketsResponse(value: unknown): SeedTicketsResponse | null {
  if (!isRecord(value)) return null

  const ok = value.ok
  const inserted = value.inserted
  const clientId = value.clientId
  const ticketTypeId = value.ticketTypeId
  const assignedTo = value.assignedTo

  if (!isBoolean(ok)) return null
  if (!Array.isArray(inserted) || !inserted.every((id) => isNumber(id))) return null
  if (!isNumber(clientId)) return null
  if (!isNumber(ticketTypeId)) return null
  if (assignedTo !== null && !isNumber(assignedTo)) return null

  return { ok, inserted, clientId, ticketTypeId, assignedTo }
}

export async function seedTickets(
  page: Page,
  {
    count,
    clientId,
    clientEmail,
    ticketTypeDepartment,
    ticketTypeName,
    assignedTo,
    assignedToEmail,
    titlePrefix,
  }: {
    count: number
    clientId?: number
    clientEmail?: string
    ticketTypeDepartment?: string
    ticketTypeName?: string
    assignedTo?: number
    assignedToEmail?: string
    titlePrefix?: string
  },
) {
  const res = await page.request.post("/api/test/seed-tickets", {
    data: {
      count,
      clientId,
      clientEmail,
      ticketTypeDepartment,
      ticketTypeName,
      assignedTo,
      assignedToEmail,
      titlePrefix,
    },
  })

  expect(res.ok()).toBeTruthy()
  const json: unknown = await res.json()
  const parsed = parseSeedTicketsResponse(json)
  if (!parsed) throw new Error("Unexpected seed-tickets response")

  expect(parsed.ok).toBeTruthy()
  expect(parsed.inserted.length).toBeGreaterThan(0)
  return parsed
}

