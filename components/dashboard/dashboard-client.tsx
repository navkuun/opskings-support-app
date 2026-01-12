"use client"

import * as React from "react"
import { useQuery } from "@rocicorp/zero/react"
import { useRouter, useSearchParams } from "next/navigation"

import { DashboardFilterRow } from "@/components/dashboard/dashboard-filter-row"
import { KpiCard, KpiDelta } from "@/components/dashboard/kpi"
import { TicketsByPriorityCard } from "@/components/dashboard/tickets-by-priority-card"
import { TicketsByTypeChart } from "@/components/dashboard/tickets-by-type-chart"
import { TicketsOverTimeChart } from "@/components/dashboard/tickets-over-time-chart"
import { CardGroup } from "@/components/ui/card"
import {
  type DashboardMetricsResponse,
  parseDashboardMetricsResponse,
} from "@/lib/dashboard/metrics"
import {
  buildMonthRange,
  formatCompactNumber,
  formatHours,
  formatRating,
  getMonthLabelLong,
  parseDateToUtcMs,
  percentChange,
} from "@/lib/dashboard/utils"
import {
  defaultListFilterOperator,
  normalizeListFilterValues,
  type ListFilterState,
  parseListFilterOperator,
} from "@/lib/filters/list-filter"
import { isRecord, isString } from "@/lib/type-guards"
import { queries } from "@/zero/queries"

const DEFAULT_FROM = "2025-01-01"
const DEFAULT_TO = "2025-11-30"

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

function parseMultiParam(value: string | null) {
  if (!value) return []
  const tokens = value
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => token !== "any")

  const unique: string[] = []
  const seen = new Set<string>()
  for (const token of tokens) {
    if (seen.has(token)) continue
    seen.add(token)
    unique.push(token)
  }

  return unique
}

export function DashboardClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const from = searchParams.get("from") ?? DEFAULT_FROM
  const to = searchParams.get("to") ?? DEFAULT_TO
  const assignedToParam = searchParams.get("assignedTo")
  const assignedToOpParam = searchParams.get("assignedToOp")
  const ticketTypeParam = searchParams.get("ticketTypeId")
  const ticketTypeOpParam = searchParams.get("ticketTypeIdOp")
  const priorityParam = searchParams.get("priority")
  const priorityOpParam = searchParams.get("priorityOp")

  const createdFrom = React.useMemo(() => parseDateToUtcMs(from, "start"), [from])
  const createdTo = React.useMemo(() => parseDateToUtcMs(to, "end"), [to])

  const assignedToOp = React.useMemo(
    () => parseListFilterOperator(assignedToOpParam),
    [assignedToOpParam],
  )
  const ticketTypeOp = React.useMemo(
    () => parseListFilterOperator(ticketTypeOpParam),
    [ticketTypeOpParam],
  )
  const priorityOp = React.useMemo(() => parseListFilterOperator(priorityOpParam), [priorityOpParam])

  const assignedToValues = React.useMemo(
    () => normalizeListFilterValues(assignedToOp, parseMultiParam(assignedToParam)),
    [assignedToOp, assignedToParam],
  )
  const ticketTypeValues = React.useMemo(
    () => normalizeListFilterValues(ticketTypeOp, parseMultiParam(ticketTypeParam)),
    [ticketTypeOp, ticketTypeParam],
  )
  const priorityValues = React.useMemo(
    () => normalizeListFilterValues(priorityOp, parseMultiParam(priorityParam)),
    [priorityOp, priorityParam],
  )

  const [ticketTypes, ticketTypesResult] = useQuery(queries.ticketTypes.list({ limit: 200 }))
  const [teamMembers, teamMembersResult] = useQuery(queries.teamMembers.list({ limit: 200 }))

  const ticketTypeNameById = React.useMemo(() => {
    const map = new Map<number, string>()
    for (const row of ticketTypes) {
      map.set(row.id, row.typeName)
    }
    return map
  }, [ticketTypes])

  const [metrics, setMetrics] = React.useState<DashboardMetricsResponse | null>(null)
  const [metricsError, setMetricsError] = React.useState<string | null>(null)
  const [metricsLoading, setMetricsLoading] = React.useState(true)

  React.useEffect(() => {
    const controller = new AbortController()

    async function run() {
      setMetricsLoading(true)
      setMetricsError(null)

      const params = new URLSearchParams({ from, to })
      if (assignedToParam && assignedToParam !== "any") {
        params.set("assignedTo", assignedToParam)
      }
      if (assignedToOpParam) {
        params.set("assignedToOp", assignedToOpParam)
      }
      if (ticketTypeParam && ticketTypeParam !== "any") {
        params.set("ticketTypeId", ticketTypeParam)
      }
      if (ticketTypeOpParam) {
        params.set("ticketTypeIdOp", ticketTypeOpParam)
      }
      if (priorityParam && priorityParam !== "any") {
        params.set("priority", priorityParam)
      }
      if (priorityOpParam) {
        params.set("priorityOp", priorityOpParam)
      }

      try {
        const res = await fetch(`/api/dashboard/metrics?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!res.ok) {
          const body: unknown = await res.json().catch(() => null)
          const message =
            isRecord(body) && isString(body.error) && body.error.trim() ? body.error : null
          setMetrics(null)
          setMetricsError(message ?? `Request failed (${res.status})`)
          setMetricsLoading(false)
          return
        }

        const json: unknown = await res.json()
        const parsed = parseDashboardMetricsResponse(json)
        if (!parsed) {
          setMetrics(null)
          setMetricsError("Unexpected response from dashboard metrics.")
          setMetricsLoading(false)
          return
        }

        setMetrics(parsed)
        setMetricsLoading(false)
      } catch (error) {
        if (controller.signal.aborted) return
        console.error("[dashboard] Failed to load metrics", error)
        setMetrics(null)
        setMetricsError("Failed to load dashboard metrics.")
        setMetricsLoading(false)
      }
    }

    void run()
    return () => controller.abort()
  }, [
    assignedToOpParam,
    assignedToParam,
    from,
    priorityOpParam,
    priorityParam,
    ticketTypeOpParam,
    ticketTypeParam,
    to,
  ])

  const months = React.useMemo(() => {
    const fallbackFrom = parseDateToUtcMs(DEFAULT_FROM, "start") ?? Date.UTC(2025, 0, 1)
    const fallbackTo =
      parseDateToUtcMs(DEFAULT_TO, "end") ?? Date.UTC(2025, 10, 30, 23, 59, 59, 999)

    return buildMonthRange(createdFrom ?? fallbackFrom, createdTo ?? fallbackTo)
  }, [createdFrom, createdTo])

  const computed = React.useMemo(() => {
    const total = metrics?.total ?? 0

    const createdSeries = months.map((m) => metrics?.createdByMonth[m] ?? 0)
    const resolvedSeries = months.map((m) => metrics?.resolvedByMonth[m] ?? 0)

    const ticketsOverTime = months.map((monthKey, idx) => ({
      monthKey,
      monthLabel: getMonthLabelLong(monthKey),
      created: createdSeries[idx] ?? 0,
      resolved: resolvedSeries[idx] ?? 0,
    }))

    const currentMonthKey = months[months.length - 1] ?? null
    const lastMonthKey = months[months.length - 2] ?? null

    const totalMoM =
      currentMonthKey && lastMonthKey
        ? percentChange(
            metrics?.createdByMonth[currentMonthKey] ?? 0,
            metrics?.createdByMonth[lastMonthKey] ?? 0,
          )
        : null

    const openMoM =
      currentMonthKey && lastMonthKey
        ? percentChange(
            metrics?.openByMonth[currentMonthKey] ?? 0,
            metrics?.openByMonth[lastMonthKey] ?? 0,
          )
        : null

    const avgResolutionMoM =
      currentMonthKey && lastMonthKey
        ? percentChange(
            metrics?.avgResolutionHoursByMonth[currentMonthKey] ?? null,
            metrics?.avgResolutionHoursByMonth[lastMonthKey] ?? null,
          )
        : null

    const typeRows = (metrics?.ticketsByType ?? [])
      .slice()
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map(({ ticketTypeId, count }) => ({
        label: ticketTypeNameById.get(ticketTypeId) ?? `Type ${ticketTypeId}`,
        count,
        pct: total ? (count / total) * 100 : 0,
      }))

    const priorityRows = (metrics?.ticketsByPriority ?? [])
      .slice()
      .sort((a, b) => b.count - a.count)
      .map(({ priority, count }) => ({
        label: priority,
        count,
        pct: total ? (count / total) * 100 : 0,
      }))

    return {
      total,
      open: metrics?.open ?? 0,
      avgResolutionHours: metrics?.avgResolutionHours ?? null,
      avgRating: metrics?.avgRating ?? null,
      ticketsOverTime,
      typeRows,
      priorityRows,
      priorityStatusRows: metrics?.ticketsByPriorityStatus ?? [],
      totalMoM,
      openMoM,
      avgResolutionMoM,
    }
  }, [metrics, months, ticketTypeNameById])

  const isLoading =
    metricsLoading ||
    ticketTypesResult.type !== "complete" ||
    teamMembersResult.type !== "complete"

  const handleFromChange = React.useCallback(
    (next: string) => updateSearchParams(router, searchParams, { from: next }),
    [router, searchParams],
  )

  const handleToChange = React.useCallback(
    (next: string) => updateSearchParams(router, searchParams, { to: next }),
    [router, searchParams],
  )

  const handleAssignedToChange = React.useCallback(
    (next: ListFilterState) => {
      const values = normalizeListFilterValues(next.op, next.values).filter((value) => value !== "any")
      updateSearchParams(router, searchParams, {
        assignedTo: values.length ? values.join(",") : null,
        assignedToOp: next.op === defaultListFilterOperator ? null : next.op,
      })
    },
    [router, searchParams],
  )

  const handleTicketTypeChange = React.useCallback(
    (next: ListFilterState) => {
      const values = normalizeListFilterValues(next.op, next.values).filter((value) => value !== "any")
      updateSearchParams(router, searchParams, {
        ticketTypeId: values.length ? values.join(",") : null,
        ticketTypeIdOp: next.op === defaultListFilterOperator ? null : next.op,
      })
    },
    [router, searchParams],
  )

  const handlePriorityChange = React.useCallback(
    (next: ListFilterState) => {
      const values = normalizeListFilterValues(next.op, next.values).filter((value) => value !== "any")
      updateSearchParams(router, searchParams, {
        priority: values.length ? values.join(",") : null,
        priorityOp: next.op === defaultListFilterOperator ? null : next.op,
      })
    },
    [router, searchParams],
  )

  const resetFilters = React.useCallback(() => {
    updateSearchParams(router, searchParams, {
      from: DEFAULT_FROM,
      to: DEFAULT_TO,
      assignedTo: null,
      assignedToOp: null,
      ticketTypeId: null,
      ticketTypeIdOp: null,
      priority: null,
      priorityOp: null,
    })
  }, [router, searchParams])

  return (
    <div className="w-full pb-8">
      <DashboardFilterRow
        from={from}
        to={to}
        assignedToFilter={{ op: assignedToOp, values: assignedToValues }}
        ticketTypeFilter={{ op: ticketTypeOp, values: ticketTypeValues }}
        priorityFilter={{ op: priorityOp, values: priorityValues }}
        teamMembers={teamMembers}
        ticketTypes={ticketTypes}
        onFromChange={handleFromChange}
        onToChange={handleToChange}
        onAssignedToChange={handleAssignedToChange}
        onTicketTypeChange={handleTicketTypeChange}
        onPriorityChange={handlePriorityChange}
        onReset={resetFilters}
      />

      <div className="space-y-6 px-6 pt-6">
        {metricsError ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {metricsError}
          </div>
        ) : null}

        <CardGroup className="grid grid-cols-1 divide-y divide-border md:grid-cols-4 md:divide-x md:divide-y-0">
          <KpiCard
            title="Total tickets"
            value={formatCompactNumber(computed.total)}
            description="Tickets created in the selected range."
            right={<KpiDelta value={computed.totalMoM} isLoading={isLoading} />}
            isLoading={isLoading}
          />
          <KpiCard
            title="Open tickets"
            value={formatCompactNumber(computed.open)}
            description="In progress tickets"
            right={<KpiDelta value={computed.openMoM} isLoading={isLoading} />}
            isLoading={isLoading}
          />
          <KpiCard
            title="Avg resolution time"
            value={
              computed.avgResolutionHours == null ? "—" : formatHours(computed.avgResolutionHours)
            }
            description="Resolved tickets only."
            right={<KpiDelta value={computed.avgResolutionMoM} isLoading={isLoading} />}
            isLoading={isLoading}
          />
          <KpiCard
            title="Customer satisfaction"
            value={computed.avgRating == null ? "—" : formatRating(computed.avgRating)}
            description="Avg rating from feedback."
            right={<div className="text-2xl font-semibold text-muted-foreground/70">/5</div>}
            isLoading={isLoading}
          />
        </CardGroup>

        <div className="grid gap-4 lg:grid-cols-2 lg:gap-x-0">
          <TicketsOverTimeChart data={computed.ticketsOverTime} isLoading={isLoading} />
          <TicketsByTypeChart rows={computed.typeRows} isLoading={isLoading} />
        </div>

        <TicketsByPriorityCard
          total={computed.total}
          rows={computed.priorityRows}
          statusRows={computed.priorityStatusRows}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
