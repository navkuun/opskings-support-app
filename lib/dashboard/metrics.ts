import { isNumber, isRecord, isString } from "@/lib/type-guards"

export type DashboardMetricsResponse = {
  total: number
  open: number
  avgResolutionHours: number | null
  avgRating: number | null
  createdByMonth: Record<string, number>
  resolvedByMonth: Record<string, number>
  openByMonth: Record<string, number>
  avgResolutionHoursByMonth: Record<string, number | null>
  ticketsByType: Array<{ ticketTypeId: number; count: number }>
  ticketsByPriority: Array<{ priority: string; count: number }>
  ticketsByPriorityStatus: Array<{
    priority: string
    status: "open" | "resolved"
    count: number
  }>
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

function isNumberRecord(value: unknown): value is Record<string, number> {
  if (!isRecord(value)) return false
  return Object.values(value).every((entry) => isNumber(entry))
}

function isNullableNumberRecord(value: unknown): value is Record<string, number | null> {
  if (!isRecord(value)) return false
  return Object.values(value).every((entry) => entry === null || isNumber(entry))
}

function isTicketsByTypeRow(
  value: unknown,
): value is DashboardMetricsResponse["ticketsByType"][number] {
  if (!isRecord(value)) return false
  return isNumber(value.ticketTypeId) && isNumber(value.count)
}

function isTicketsByPriorityRow(
  value: unknown,
): value is DashboardMetricsResponse["ticketsByPriority"][number] {
  if (!isRecord(value)) return false
  return isString(value.priority) && isNumber(value.count)
}

function isTicketsByPriorityStatusRow(
  value: unknown,
): value is DashboardMetricsResponse["ticketsByPriorityStatus"][number] {
  if (!isRecord(value)) return false
  return (
    isString(value.priority) &&
    (value.status === "open" || value.status === "resolved") &&
    isNumber(value.count)
  )
}

export function parseDashboardMetricsResponse(value: unknown): DashboardMetricsResponse | null {
  if (!isRecord(value)) return null

  const total = value.total
  const open = value.open
  const avgResolutionHours = value.avgResolutionHours
  const avgRating = value.avgRating

  const createdByMonth = value.createdByMonth
  const resolvedByMonth = value.resolvedByMonth
  const openByMonth = value.openByMonth
  const avgResolutionHoursByMonth = value.avgResolutionHoursByMonth

  const ticketsByType = value.ticketsByType
  const ticketsByPriority = value.ticketsByPriority
  const ticketsByPriorityStatus = value.ticketsByPriorityStatus

  if (!isNumber(total)) return null
  if (!isNumber(open)) return null
  if (avgResolutionHours !== null && !isNumber(avgResolutionHours)) return null
  if (avgRating !== null && !isNumber(avgRating)) return null

  if (!isNumberRecord(createdByMonth)) return null
  if (!isNumberRecord(resolvedByMonth)) return null
  if (!isNumberRecord(openByMonth)) return null
  if (!isNullableNumberRecord(avgResolutionHoursByMonth)) return null

  if (!isUnknownArray(ticketsByType) || !ticketsByType.every(isTicketsByTypeRow)) return null
  if (!isUnknownArray(ticketsByPriority) || !ticketsByPriority.every(isTicketsByPriorityRow))
    return null
  if (
    !isUnknownArray(ticketsByPriorityStatus) ||
    !ticketsByPriorityStatus.every(isTicketsByPriorityStatusRow)
  ) {
    return null
  }

  return {
    total,
    open,
    avgResolutionHours,
    avgRating,
    createdByMonth,
    resolvedByMonth,
    openByMonth,
    avgResolutionHoursByMonth,
    ticketsByType,
    ticketsByPriority,
    ticketsByPriorityStatus,
  }
}

