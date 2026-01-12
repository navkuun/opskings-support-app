import type { TeamPerformanceRow } from "@/lib/team-performance/types"

export type NumericFilterOp =
  | "any"
  | "eq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "between"
  | "is_empty"
  | "is_not_empty"

export type NumericFilterState = {
  op: NumericFilterOp
  a: string
  b: string
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const numeric = Number(trimmed)
  return Number.isFinite(numeric) ? numeric : null
}

export function applyNumericFilter(
  candidate: number | null,
  filter: NumericFilterState,
) {
  if (filter.op === "any") return true
  if (filter.op === "is_empty") return candidate == null
  if (filter.op === "is_not_empty") return candidate != null

  const a = parseOptionalNumber(filter.a)
  const b = parseOptionalNumber(filter.b)

  if (filter.op === "between") {
    if (candidate == null || !Number.isFinite(candidate)) return false
    if (a == null && b == null) return true
    if (a != null && candidate < a) return false
    if (b != null && candidate > b) return false
    return true
  }

  if (a == null) return true
  if (candidate == null || !Number.isFinite(candidate)) return false

  if (filter.op === "eq") return candidate === a
  if (filter.op === "gt") return candidate > a
  if (filter.op === "gte") return candidate >= a
  if (filter.op === "lt") return candidate < a
  return candidate <= a
}

export type TeamPerformanceFilterState = {
  teamMember: string
  ticketsAssigned: NumericFilterState
  ticketsResolved: NumericFilterState
  avgResolutionHours: NumericFilterState
  avgRating: NumericFilterState
  status: string
}

export const defaultTeamPerformanceFilters: TeamPerformanceFilterState = {
  teamMember: "",
  ticketsAssigned: { op: "any", a: "", b: "" },
  ticketsResolved: { op: "any", a: "", b: "" },
  avgResolutionHours: { op: "any", a: "", b: "" },
  avgRating: { op: "any", a: "", b: "" },
  status: "all",
}

export function filterTeamPerformanceRows(
  rows: readonly TeamPerformanceRow[],
  filters: TeamPerformanceFilterState,
) {
  const nameNeedle = filters.teamMember.trim().toLowerCase()
  const statusNeedle = filters.status.trim().toLowerCase()

  return rows.filter((row) => {
    if (nameNeedle) {
      const name = row.username.toLowerCase()
      if (!name.includes(nameNeedle)) return false
    }

    if (statusNeedle && statusNeedle !== "all") {
      const status = (row.status ?? "").toLowerCase()
      if (status !== statusNeedle) return false
    }

    if (!applyNumericFilter(row.ticketsAssigned, filters.ticketsAssigned)) return false
    if (!applyNumericFilter(row.ticketsResolved, filters.ticketsResolved)) return false
    if (!applyNumericFilter(row.avgResolutionHours, filters.avgResolutionHours)) return false
    if (!applyNumericFilter(row.avgRating, filters.avgRating)) return false

    return true
  })
}
