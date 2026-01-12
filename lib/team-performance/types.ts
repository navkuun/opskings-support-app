import { isNumber, isRecord, isString } from "@/lib/type-guards"

export type TeamPerformanceRow = {
  teamMemberId: number
  username: string
  status: string | null
  ticketsAssigned: number
  ticketsResolved: number
  avgResolutionHours: number | null
  avgRating: number | null
}

export type TeamPerformanceResponse = {
  rows: TeamPerformanceRow[]
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || isNumber(value)
}

function parseRow(value: unknown): TeamPerformanceRow | null {
  if (!isRecord(value)) return null

  const teamMemberId = value.teamMemberId
  const username = value.username
  const status = value.status
  const ticketsAssigned = value.ticketsAssigned
  const ticketsResolved = value.ticketsResolved
  const avgResolutionHours = value.avgResolutionHours
  const avgRating = value.avgRating

  if (!isNumber(teamMemberId) || !Number.isInteger(teamMemberId) || teamMemberId <= 0) return null
  if (!isString(username)) return null
  if (status !== null && status !== undefined && !isString(status)) return null
  if (!isNumber(ticketsAssigned) || !Number.isInteger(ticketsAssigned) || ticketsAssigned < 0) return null
  if (!isNumber(ticketsResolved) || !Number.isInteger(ticketsResolved) || ticketsResolved < 0) return null
  if (!isNullableNumber(avgResolutionHours)) return null
  if (!isNullableNumber(avgRating)) return null

  return {
    teamMemberId,
    username,
    status: status ?? null,
    ticketsAssigned,
    ticketsResolved,
    avgResolutionHours,
    avgRating,
  }
}

export function parseTeamPerformanceResponse(value: unknown): TeamPerformanceResponse | null {
  if (!isRecord(value)) return null
  const rows = value.rows
  if (!isUnknownArray(rows)) return null

  const parsedRows: TeamPerformanceRow[] = []
  for (const row of rows) {
    const parsed = parseRow(row)
    if (!parsed) return null
    parsedRows.push(parsed)
  }

  return { rows: parsedRows }
}

