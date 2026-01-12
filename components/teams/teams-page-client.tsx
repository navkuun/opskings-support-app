"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { TeamsFilterRow, type TeamsFilterState } from "@/components/teams/teams-filter-row"
import { TeamsTable } from "@/components/teams/teams-table"
import { isRecord, isString } from "@/lib/type-guards"
import {
  defaultTeamPerformanceFilters,
  filterTeamPerformanceRows,
} from "@/lib/team-performance/filters"
import {
  parseTeamPerformanceResponse,
  type TeamPerformanceRow,
} from "@/lib/team-performance/types"

const DEFAULT_FROM = "2025-01-01"
const DEFAULT_TO = "2025-11-30"

function parseNumericOp(value: string | null) {
  if (!value) return "any"
  if (
    value === "any" ||
    value === "eq" ||
    value === "gt" ||
    value === "gte" ||
    value === "lt" ||
    value === "lte" ||
    value === "between" ||
    value === "is_empty" ||
    value === "is_not_empty"
  ) {
    return value
  }
  return "any"
}

function updateSearchParams(
  router: ReturnType<typeof useRouter>,
  searchParams: ReturnType<typeof useSearchParams>,
  patch: Record<string, string | null>,
) {
  const next = new URLSearchParams(searchParams.toString())
  for (const [key, value] of Object.entries(patch)) {
    if (!value) next.delete(key)
    else next.set(key, value)
  }
  router.replace(`?${next.toString()}`)
}

function uniqueStatusOptions(rows: readonly TeamPerformanceRow[]) {
  const set = new Set<string>()
  for (const row of rows) {
    const status = (row.status ?? "").trim()
    if (!status) continue
    set.add(status)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}

export function TeamsPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const from = searchParams.get("from") ?? DEFAULT_FROM
  const to = searchParams.get("to") ?? DEFAULT_TO

  const filters = React.useMemo<TeamsFilterState>(
    () => ({
      from,
      to,
      teamMember: searchParams.get("teamMember") ?? defaultTeamPerformanceFilters.teamMember,
      ticketsAssigned: {
        op: parseNumericOp(searchParams.get("ticketsAssignedOp")),
        a: searchParams.get("ticketsAssignedA") ?? "",
        b: searchParams.get("ticketsAssignedB") ?? "",
      },
      ticketsResolved: {
        op: parseNumericOp(searchParams.get("ticketsResolvedOp")),
        a: searchParams.get("ticketsResolvedA") ?? "",
        b: searchParams.get("ticketsResolvedB") ?? "",
      },
      avgResolutionHours: {
        op: parseNumericOp(searchParams.get("avgResolutionHoursOp")),
        a: searchParams.get("avgResolutionHoursA") ?? "",
        b: searchParams.get("avgResolutionHoursB") ?? "",
      },
      avgRating: {
        op: parseNumericOp(searchParams.get("avgRatingOp")),
        a: searchParams.get("avgRatingA") ?? "",
        b: searchParams.get("avgRatingB") ?? "",
      },
      status: searchParams.get("status") ?? defaultTeamPerformanceFilters.status,
    }),
    [from, searchParams, to],
  )

  const [rows, setRows] = React.useState<readonly TeamPerformanceRow[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const controller = new AbortController()

    async function run() {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({ from, to })

      try {
        const res = await fetch(`/api/dashboard/team-performance?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!res.ok) {
          const body: unknown = await res.json().catch(() => null)
          const message =
            isRecord(body) && isString(body.error) && body.error.trim() ? body.error : null
          setRows([])
          setError(message ?? `Request failed (${res.status})`)
          setLoading(false)
          return
        }

        const json: unknown = await res.json()
        const parsed = parseTeamPerformanceResponse(json)
        if (!parsed) {
          setRows([])
          setError("Unexpected response from team performance.")
          setLoading(false)
          return
        }

        setRows(parsed.rows)
        setLoading(false)
      } catch (err) {
        if (controller.signal.aborted) return
        console.error("[teams] Failed to load team performance", err)
        setRows([])
        setError("Failed to load team performance.")
        setLoading(false)
      }
    }

    void run()
    return () => controller.abort()
  }, [from, to])

  const filteredRows = React.useMemo(
    () =>
      filterTeamPerformanceRows(rows, {
        teamMember: filters.teamMember,
        ticketsAssigned: filters.ticketsAssigned,
        ticketsResolved: filters.ticketsResolved,
        avgResolutionHours: filters.avgResolutionHours,
        avgRating: filters.avgRating,
        status: filters.status,
      }),
    [filters, rows],
  )

  const statusOptions = React.useMemo(() => uniqueStatusOptions(rows), [rows])

  const handleFiltersChange = React.useCallback(
    (patch: Partial<TeamsFilterState>) => {
      updateSearchParams(router, searchParams, {
        from: patch.from ?? filters.from,
        to: patch.to ?? filters.to,
        teamMember: patch.teamMember ?? filters.teamMember ?? null,
        ticketsAssignedOp: patch.ticketsAssigned?.op ?? filters.ticketsAssigned.op ?? null,
        ticketsAssignedA: patch.ticketsAssigned?.a ?? filters.ticketsAssigned.a ?? null,
        ticketsAssignedB: patch.ticketsAssigned?.b ?? filters.ticketsAssigned.b ?? null,
        ticketsResolvedOp: patch.ticketsResolved?.op ?? filters.ticketsResolved.op ?? null,
        ticketsResolvedA: patch.ticketsResolved?.a ?? filters.ticketsResolved.a ?? null,
        ticketsResolvedB: patch.ticketsResolved?.b ?? filters.ticketsResolved.b ?? null,
        avgResolutionHoursOp: patch.avgResolutionHours?.op ?? filters.avgResolutionHours.op ?? null,
        avgResolutionHoursA: patch.avgResolutionHours?.a ?? filters.avgResolutionHours.a ?? null,
        avgResolutionHoursB: patch.avgResolutionHours?.b ?? filters.avgResolutionHours.b ?? null,
        avgRatingOp: patch.avgRating?.op ?? filters.avgRating.op ?? null,
        avgRatingA: patch.avgRating?.a ?? filters.avgRating.a ?? null,
        avgRatingB: patch.avgRating?.b ?? filters.avgRating.b ?? null,
        status: patch.status ?? filters.status ?? null,
      })
    },
    [filters, router, searchParams],
  )

  const handleReset = React.useCallback(() => {
    updateSearchParams(router, searchParams, {
      from: DEFAULT_FROM,
      to: DEFAULT_TO,
      teamMember: null,
      ticketsAssignedOp: null,
      ticketsAssignedA: null,
      ticketsAssignedB: null,
      ticketsResolvedOp: null,
      ticketsResolvedA: null,
      ticketsResolvedB: null,
      avgResolutionHoursOp: null,
      avgResolutionHoursA: null,
      avgResolutionHoursB: null,
      avgRatingOp: null,
      avgRatingA: null,
      avgRatingB: null,
      status: null,
    })
  }, [router, searchParams])

  return (
    <div className="w-full pb-8">
      <TeamsFilterRow
        value={filters}
        statusOptions={statusOptions}
        onValueChange={handleFiltersChange}
        onReset={handleReset}
      />
      <div className="space-y-6 px-6 pt-6">
        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        ) : null}

        <TeamsTable rows={filteredRows} isLoading={loading} />
      </div>
    </div>
  )
}
