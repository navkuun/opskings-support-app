import { isNumber, isRecord, isString } from "@/lib/type-guards"

export type ResponseTimePriorityStatsRow = {
  priority: string
  resolvedTotal: number
  expectedTotal: number
  overdueTotal: number
  minHours: number | null
  maxHours: number | null
  avgHours: number | null
  medianHours: number | null
  avgExpectedHours: number | null
  avgDeltaHours: number | null
}

export type ResponseTimeHistogramRow = {
  bin: string
  total: number
  urgent: number
  high: number
  medium: number
  low: number
  unknown: number
}

export type ResponseTimeOverdueTicketRow = {
  id: number
  title: string
  clientName: string | null
  ticketType: string
  status: string | null
  priority: string | null
  createdAt: string | null
  resolvedAt: string | null
  expectedHours: number
  actualHours: number
  deltaHours: number
}

export type ResponseTimeMetricsResponse = {
  resolvedTotal: number
  expectedTotal: number
  overdueTotal: number
  minHours: number | null
  maxHours: number | null
  avgHours: number | null
  medianHours: number | null
  avgExpectedHours: number | null
  avgDeltaHours: number | null
  byPriority: ResponseTimePriorityStatsRow[]
  histogram: ResponseTimeHistogramRow[]
  overdueTickets: ResponseTimeOverdueTicketRow[]
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || isNumber(value)
}

function parsePriorityStatsRow(value: unknown): ResponseTimePriorityStatsRow | null {
  if (!isRecord(value)) return null

  const priority = value.priority
  const resolvedTotal = value.resolvedTotal
  const expectedTotal = value.expectedTotal
  const overdueTotal = value.overdueTotal
  const minHours = value.minHours
  const maxHours = value.maxHours
  const avgHours = value.avgHours
  const medianHours = value.medianHours
  const avgExpectedHours = value.avgExpectedHours
  const avgDeltaHours = value.avgDeltaHours

  if (!isString(priority)) return null
  if (!isNumber(resolvedTotal)) return null
  if (!isNumber(expectedTotal)) return null
  if (!isNumber(overdueTotal)) return null
  if (!isNullableNumber(minHours)) return null
  if (!isNullableNumber(maxHours)) return null
  if (!isNullableNumber(avgHours)) return null
  if (!isNullableNumber(medianHours)) return null
  if (!isNullableNumber(avgExpectedHours)) return null
  if (!isNullableNumber(avgDeltaHours)) return null

  return {
    priority,
    resolvedTotal,
    expectedTotal,
    overdueTotal,
    minHours,
    maxHours,
    avgHours,
    medianHours,
    avgExpectedHours,
    avgDeltaHours,
  }
}

function parseHistogramRow(value: unknown): ResponseTimeHistogramRow | null {
  if (!isRecord(value)) return null

  const bin = value.bin
  const total = value.total
  const urgent = value.urgent
  const high = value.high
  const medium = value.medium
  const low = value.low
  const unknown = value.unknown

  if (!isString(bin)) return null
  if (!isNumber(total)) return null
  if (!isNumber(urgent)) return null
  if (!isNumber(high)) return null
  if (!isNumber(medium)) return null
  if (!isNumber(low)) return null
  if (!isNumber(unknown)) return null

  return { bin, total, urgent, high, medium, low, unknown }
}

function parseOptionalString(value: unknown): string | null {
  if (value === null) return null
  return isString(value) ? value : null
}

function parseOverdueTicketRow(value: unknown): ResponseTimeOverdueTicketRow | null {
  if (!isRecord(value)) return null

  const id = value.id
  const title = value.title
  const clientName = value.clientName
  const ticketType = value.ticketType
  const status = value.status
  const priority = value.priority
  const createdAt = value.createdAt
  const resolvedAt = value.resolvedAt
  const expectedHours = value.expectedHours
  const actualHours = value.actualHours
  const deltaHours = value.deltaHours

  if (!isNumber(id)) return null
  if (!isString(title)) return null
  if (clientName !== null && clientName !== undefined && !isString(clientName)) return null
  if (!isString(ticketType)) return null
  if (status !== null && status !== undefined && !isString(status)) return null
  if (priority !== null && priority !== undefined && !isString(priority)) return null
  if (createdAt !== null && createdAt !== undefined && !isString(createdAt)) return null
  if (resolvedAt !== null && resolvedAt !== undefined && !isString(resolvedAt)) return null
  if (!isNumber(expectedHours)) return null
  if (!isNumber(actualHours)) return null
  if (!isNumber(deltaHours)) return null

  return {
    id,
    title,
    clientName: clientName ?? null,
    ticketType,
    status: status ?? null,
    priority: priority ?? null,
    createdAt: createdAt ?? null,
    resolvedAt: resolvedAt ?? null,
    expectedHours,
    actualHours,
    deltaHours,
  }
}

export function parseResponseTimeMetricsResponse(
  value: unknown,
): ResponseTimeMetricsResponse | null {
  if (!isRecord(value)) return null

  const resolvedTotal = value.resolvedTotal
  const expectedTotal = value.expectedTotal
  const overdueTotal = value.overdueTotal
  const minHours = value.minHours
  const maxHours = value.maxHours
  const avgHours = value.avgHours
  const medianHours = value.medianHours
  const avgExpectedHours = value.avgExpectedHours
  const avgDeltaHours = value.avgDeltaHours
  const byPriority = value.byPriority
  const histogram = value.histogram
  const overdueTickets = value.overdueTickets

  if (!isNumber(resolvedTotal)) return null
  if (!isNumber(expectedTotal)) return null
  if (!isNumber(overdueTotal)) return null
  if (!isNullableNumber(minHours)) return null
  if (!isNullableNumber(maxHours)) return null
  if (!isNullableNumber(avgHours)) return null
  if (!isNullableNumber(medianHours)) return null
  if (!isNullableNumber(avgExpectedHours)) return null
  if (!isNullableNumber(avgDeltaHours)) return null

  if (!isUnknownArray(byPriority)) return null
  const parsedByPriority: ResponseTimePriorityStatsRow[] = []
  for (const row of byPriority) {
    const parsed = parsePriorityStatsRow(row)
    if (!parsed) return null
    parsedByPriority.push(parsed)
  }

  if (!isUnknownArray(histogram)) return null
  const parsedHistogram: ResponseTimeHistogramRow[] = []
  for (const row of histogram) {
    const parsed = parseHistogramRow(row)
    if (!parsed) return null
    parsedHistogram.push(parsed)
  }

  if (!isUnknownArray(overdueTickets)) return null
  const parsedOverdue: ResponseTimeOverdueTicketRow[] = []
  for (const row of overdueTickets) {
    const parsed = parseOverdueTicketRow(row)
    if (!parsed) return null
    parsedOverdue.push(parsed)
  }

  return {
    resolvedTotal,
    expectedTotal,
    overdueTotal,
    minHours,
    maxHours,
    avgHours,
    medianHours,
    avgExpectedHours,
    avgDeltaHours,
    byPriority: parsedByPriority,
    histogram: parsedHistogram,
    overdueTickets: parsedOverdue,
  }
}

