"use client"

import * as React from "react"
import { useQuery } from "@rocicorp/zero/react"
import { useRouter, useSearchParams } from "next/navigation"

import { KpiCard } from "@/components/dashboard/kpi"
import { OverdueTicketsTable } from "@/components/response-time/overdue-tickets-table"
import { ResponseTimeFilterRow } from "@/components/response-time/response-time-filter-row"
import { ResponseTimeHistogramChart } from "@/components/response-time/response-time-histogram-chart"
import { ResponseTimePriorityStatsCard } from "@/components/response-time/response-time-priority-stats-card"
import { CardGroup } from "@/components/ui/card"
import { formatCompactNumber, formatHours } from "@/lib/dashboard/utils"
import {
  defaultListFilterOperator,
  normalizeListFilterValues,
  type ListFilterState,
  parseListFilterOperator,
} from "@/lib/filters/list-filter"
import {
  type ResponseTimeMetricsResponse,
  parseResponseTimeHistogramResponse,
  parseResponseTimeMetricsResponse,
  parseResponseTimeOverdueResponse,
  type ResponseTimeOverdueTicketRow,
} from "@/lib/response-time/metrics"
import { isRecord, isString } from "@/lib/type-guards"
import { queries } from "@/zero/queries"

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

function formatDeltaHours(value: number | null) {
  if (value == null || !Number.isFinite(value)) return "—"
  const sign = value > 0 ? "+" : value < 0 ? "-" : ""
  return `${sign}${Math.abs(value).toFixed(1)} hrs`
}

function formatRate(numerator: number, denominator: number) {
  if (!denominator) return "—"
  return `${Math.round((numerator / denominator) * 100)}%`
}

export function ResponseTimePageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const from = searchParams.get("from") ?? ""
  const to = searchParams.get("to") ?? ""
  const assignedToParam = searchParams.get("assignedTo")
  const assignedToOpParam = searchParams.get("assignedToOp")
  const clientParam = searchParams.get("clientId")
  const clientOpParam = searchParams.get("clientIdOp")
  const ticketTypeParam = searchParams.get("ticketTypeId")
  const ticketTypeOpParam = searchParams.get("ticketTypeIdOp")
  const priorityParam = searchParams.get("priority")
  const priorityOpParam = searchParams.get("priorityOp")
  const binsParam = searchParams.get("bins")
  const histogramBins = binsParam === "fine" || binsParam === "coarse" ? binsParam : "default"

  const assignedToOp = React.useMemo(
    () => parseListFilterOperator(assignedToOpParam),
    [assignedToOpParam],
  )
  const clientOp = React.useMemo(() => parseListFilterOperator(clientOpParam), [clientOpParam])
  const ticketTypeOp = React.useMemo(
    () => parseListFilterOperator(ticketTypeOpParam),
    [ticketTypeOpParam],
  )
  const priorityOp = React.useMemo(() => parseListFilterOperator(priorityOpParam), [priorityOpParam])

  const assignedToValues = React.useMemo(
    () => normalizeListFilterValues(assignedToOp, parseMultiParam(assignedToParam)),
    [assignedToOp, assignedToParam],
  )
  const clientValues = React.useMemo(
    () => normalizeListFilterValues(clientOp, parseMultiParam(clientParam)),
    [clientOp, clientParam],
  )
  const ticketTypeValues = React.useMemo(
    () => normalizeListFilterValues(ticketTypeOp, parseMultiParam(ticketTypeParam)),
    [ticketTypeOp, ticketTypeParam],
  )
  const priorityValues = React.useMemo(
    () => normalizeListFilterValues(priorityOp, parseMultiParam(priorityParam)),
    [priorityOp, priorityParam],
  )

  const [teamMembers] = useQuery(queries.teamMembers.internalList({ limit: 200 }))
  const [clients] = useQuery(queries.clients.list({ limit: 200 }))
  const [ticketTypes] = useQuery(queries.ticketTypes.list({ limit: 200 }))

  const [metrics, setMetrics] = React.useState<ResponseTimeMetricsResponse | null>(null)
  const [metricsError, setMetricsError] = React.useState<string | null>(null)
  const [metricsLoading, setMetricsLoading] = React.useState(true)

  const [histogram, setHistogram] = React.useState<ResponseTimeMetricsResponse["histogram"] | null>(
    null,
  )
  const [histogramLoading, setHistogramLoading] = React.useState(false)

  const [overdueTickets, setOverdueTickets] = React.useState<
    readonly ResponseTimeOverdueTicketRow[]
  >([])
  const [overdueTotal, setOverdueTotal] = React.useState(0)
  const [overduePageIndex, setOverduePageIndex] = React.useState(0)
  const overduePageSize = 20
  const [overdueLoading, setOverdueLoading] = React.useState(false)

  React.useEffect(() => {
    const controller = new AbortController()

    async function run() {
      setMetricsLoading(true)
      setMetricsError(null)

      const params = new URLSearchParams()
      if (from.trim()) params.set("from", from)
      if (to.trim()) params.set("to", to)
      if (assignedToParam && assignedToParam !== "any") {
        params.set("assignedTo", assignedToParam)
      }
      if (assignedToOpParam) {
        params.set("assignedToOp", assignedToOpParam)
      }
      if (clientParam && clientParam !== "any") {
        params.set("clientId", clientParam)
      }
      if (clientOpParam) {
        params.set("clientIdOp", clientOpParam)
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
        const res = await fetch(`/api/response-time/metrics?${params.toString()}`, {
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
        const parsed = parseResponseTimeMetricsResponse(json)
        if (!parsed) {
          setMetrics(null)
          setMetricsError("Unexpected response from response time metrics.")
          setMetricsLoading(false)
          return
        }

        setMetrics(parsed)
        setMetricsLoading(false)
      } catch (error) {
        if (controller.signal.aborted) return
        console.error("[response-time] Failed to load metrics", error)
        setMetrics(null)
        setMetricsError("Failed to load response time metrics.")
        setMetricsLoading(false)
      }
    }

    void run()
    return () => controller.abort()
  }, [
    assignedToOpParam,
    assignedToParam,
    clientOpParam,
    clientParam,
    from,
    priorityOpParam,
    priorityParam,
    ticketTypeOpParam,
    ticketTypeParam,
    to,
  ])

  React.useEffect(() => {
    if (histogramBins === "default") {
      setHistogram(null)
      setHistogramLoading(false)
      return
    }

    const controller = new AbortController()

    async function run() {
      setHistogramLoading(true)
      setHistogram(null)

      const params = new URLSearchParams()
      params.set("only", "histogram")
      if (from.trim()) params.set("from", from)
      if (to.trim()) params.set("to", to)
      if (assignedToParam && assignedToParam !== "any") {
        params.set("assignedTo", assignedToParam)
      }
      if (assignedToOpParam) {
        params.set("assignedToOp", assignedToOpParam)
      }
      if (clientParam && clientParam !== "any") {
        params.set("clientId", clientParam)
      }
      if (clientOpParam) {
        params.set("clientIdOp", clientOpParam)
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
      params.set("bins", histogramBins)

      try {
        const res = await fetch(`/api/response-time/metrics?${params.toString()}`, {
          signal: controller.signal,
        })
        if (!res.ok) {
          setHistogramLoading(false)
          return
        }
        const json: unknown = await res.json()
        const parsed = parseResponseTimeHistogramResponse(json)
        if (!parsed) {
          setHistogramLoading(false)
          return
        }
        setHistogram(parsed.histogram)
        setHistogramLoading(false)
      } catch (error) {
        if (controller.signal.aborted) return
        console.error("[response-time] Failed to load histogram", error)
        setHistogramLoading(false)
      }
    }

    void run()
    return () => controller.abort()
  }, [
    assignedToOpParam,
    assignedToParam,
    clientOpParam,
    clientParam,
    from,
    histogramBins,
    priorityOpParam,
    priorityParam,
    ticketTypeOpParam,
    ticketTypeParam,
    to,
  ])

  React.useEffect(() => {
    setOverduePageIndex(0)
  }, [
    assignedToOpParam,
    assignedToParam,
    clientOpParam,
    clientParam,
    from,
    priorityOpParam,
    priorityParam,
    ticketTypeOpParam,
    ticketTypeParam,
    to,
  ])

  React.useEffect(() => {
    const controller = new AbortController()

    async function run() {
      setOverdueLoading(true)

      const params = new URLSearchParams()
      if (from.trim()) params.set("from", from)
      if (to.trim()) params.set("to", to)
      if (assignedToParam && assignedToParam !== "any") {
        params.set("assignedTo", assignedToParam)
      }
      if (assignedToOpParam) {
        params.set("assignedToOp", assignedToOpParam)
      }
      if (clientParam && clientParam !== "any") {
        params.set("clientId", clientParam)
      }
      if (clientOpParam) {
        params.set("clientIdOp", clientOpParam)
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
      params.set("limit", String(overduePageSize))
      params.set("offset", String(overduePageIndex * overduePageSize))

      try {
        const res = await fetch(`/api/response-time/overdue?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!res.ok) {
          setOverdueTickets([])
          setOverdueTotal(0)
          setOverdueLoading(false)
          return
        }

        const json: unknown = await res.json()
        const parsed = parseResponseTimeOverdueResponse(json)
        if (!parsed) {
          setOverdueTickets([])
          setOverdueTotal(0)
          setOverdueLoading(false)
          return
        }

        setOverdueTickets(parsed.rows)
        setOverdueTotal(parsed.total)
        setOverdueLoading(false)
      } catch (error) {
        if (controller.signal.aborted) return
        console.error("[response-time] Failed to load overdue tickets", error)
        setOverdueTickets([])
        setOverdueTotal(0)
        setOverdueLoading(false)
      }
    }

    void run()
    return () => controller.abort()
  }, [
    assignedToOpParam,
    assignedToParam,
    clientOpParam,
    clientParam,
    from,
    overduePageIndex,
    overduePageSize,
    priorityOpParam,
    priorityParam,
    ticketTypeOpParam,
    ticketTypeParam,
    to,
  ])

  const isLoading = metricsLoading

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

  const handleClientChange = React.useCallback(
    (next: ListFilterState) => {
      const values = normalizeListFilterValues(next.op, next.values).filter((value) => value !== "any")
      updateSearchParams(router, searchParams, {
        clientId: values.length ? values.join(",") : null,
        clientIdOp: next.op === defaultListFilterOperator ? null : next.op,
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
      from: null,
      to: null,
      assignedTo: null,
      assignedToOp: null,
      clientId: null,
      clientIdOp: null,
      ticketTypeId: null,
      ticketTypeIdOp: null,
      priority: null,
      priorityOp: null,
      bins: null,
    })
  }, [router, searchParams])

  const handleHistogramBinsChange = React.useCallback(
    (next: "fine" | "default" | "coarse") =>
      updateSearchParams(router, searchParams, {
        bins: next === "default" ? null : next,
      }),
    [router, searchParams],
  )

  const resolvedTotal = metrics?.resolvedTotal ?? 0
  const expectedTotal = metrics?.expectedTotal ?? 0
  const overdueStatTotal = metrics?.overdueTotal ?? 0
  const histogramRows =
    histogramBins === "default" ? metrics?.histogram ?? [] : histogram ?? []

  return (
    <div className="w-full pb-8">
      <ResponseTimeFilterRow
        from={from}
        to={to}
        assignedToFilter={{ op: assignedToOp, values: assignedToValues }}
        teamMembers={teamMembers}
        clientFilter={{ op: clientOp, values: clientValues }}
        ticketTypeFilter={{ op: ticketTypeOp, values: ticketTypeValues }}
        priorityFilter={{ op: priorityOp, values: priorityValues }}
        clients={clients}
        ticketTypes={ticketTypes}
        onFromChange={handleFromChange}
        onToChange={handleToChange}
        onAssignedToChange={handleAssignedToChange}
        onClientChange={handleClientChange}
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
            title="Resolved tickets"
            value={formatCompactNumber(resolvedTotal)}
            description="Resolved in selected filters."
            isLoading={isLoading}
          />
          <KpiCard
            title="Median resolution time"
            value={metrics?.medianHours == null ? "—" : formatHours(metrics.medianHours)}
            description="Resolved tickets only."
            isLoading={isLoading}
          />
          <KpiCard
            title="Avg resolution time"
            value={metrics?.avgHours == null ? "—" : formatHours(metrics.avgHours)}
            description="Resolved tickets only."
            isLoading={isLoading}
          />
          <KpiCard
            title="Overdue"
            value={`${formatCompactNumber(overdueStatTotal)} (${formatRate(overdueStatTotal, expectedTotal)})`}
            description="Compared to ticket type expected hours."
            isLoading={isLoading}
          />
        </CardGroup>

        <div className="grid gap-4 lg:grid-cols-2 lg:gap-x-0">
          <ResponseTimeHistogramChart
            rows={histogramRows}
            isFetching={histogramLoading}
            bins={histogramBins}
            onBinsChange={handleHistogramBinsChange}
          />
          <ResponseTimePriorityStatsCard rows={metrics?.byPriority ?? []} isLoading={isLoading} />
        </div>

        <OverdueTicketsTable
          tickets={overdueTickets}
          totalCount={overdueTotal}
          pageIndex={overduePageIndex}
          pageSize={overduePageSize}
          onPageIndexChange={setOverduePageIndex}
          isLoading={overdueLoading}
        />

        <div className="text-xs text-muted-foreground">
          Avg expected:{" "}
          <span className="font-mono tabular-nums">
            {metrics?.avgExpectedHours == null ? "—" : `${metrics.avgExpectedHours.toFixed(1)} hrs`}
          </span>{" "}
          • Avg Δ vs expected:{" "}
          <span className="font-mono tabular-nums">{formatDeltaHours(metrics?.avgDeltaHours ?? null)}</span>
        </div>
      </div>
    </div>
  )
}
