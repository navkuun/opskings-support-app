import { isNumber, isRecord, isString } from "@/lib/type-guards"

export type ClientAnalysisRow = {
  id: number
  clientName: string
  planType: string | null
  totalTickets: number
  openTickets: number
  totalSpentUsd: number
  lastTicketAt: string | null
}

export type ClientAnalysisResponse = {
  total: number
  rows: ClientAnalysisRow[]
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

function parseClientAnalysisRow(value: unknown): ClientAnalysisRow | null {
  if (!isRecord(value)) return null

  const id = value.id
  const clientName = value.clientName
  const planType = value.planType
  const totalTickets = value.totalTickets
  const openTickets = value.openTickets
  const totalSpentUsd = value.totalSpentUsd
  const lastTicketAt = value.lastTicketAt

  if (!isNumber(id) || !Number.isInteger(id) || id <= 0) return null
  if (!isString(clientName) || !clientName.trim()) return null
  if (planType !== null && planType !== undefined && !isString(planType)) return null
  if (!isNumber(totalTickets) || !Number.isInteger(totalTickets) || totalTickets < 0) return null
  if (!isNumber(openTickets) || !Number.isInteger(openTickets) || openTickets < 0) return null
  if (!isNumber(totalSpentUsd) || !Number.isFinite(totalSpentUsd) || totalSpentUsd < 0) return null
  if (lastTicketAt !== null && lastTicketAt !== undefined && !isString(lastTicketAt)) return null

  return {
    id,
    clientName,
    planType: planType ?? null,
    totalTickets,
    openTickets,
    totalSpentUsd,
    lastTicketAt: lastTicketAt ?? null,
  }
}

export function parseClientAnalysisResponse(value: unknown): ClientAnalysisResponse | null {
  if (!isRecord(value)) return null
  const total = value.total
  const rows = value.rows

  if (!isNumber(total) || !Number.isInteger(total) || total < 0) return null
  if (!isUnknownArray(rows)) return null

  const parsedRows: ClientAnalysisRow[] = []
  for (const row of rows) {
    const parsed = parseClientAnalysisRow(row)
    if (!parsed) return null
    parsedRows.push(parsed)
  }

  return { total, rows: parsedRows }
}

