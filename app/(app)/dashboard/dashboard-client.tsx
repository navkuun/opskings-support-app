"use client"

import * as React from "react"
import { useQuery } from "@rocicorp/zero/react"
import { Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis, YAxis } from "recharts"
import type { PieLabelRenderProps } from "recharts"
import { useRouter, useSearchParams } from "next/navigation"
import { FunnelIcon, MinusIcon, TrendDownIcon, TrendUpIcon, XIcon } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardGroup, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { queries } from "@/zero/queries"

const DEFAULT_FROM = "2025-01-01"
const DEFAULT_TO = "2025-11-30"

function parseDateToUtcMs(date: string, which: "start" | "end") {
  const [yearStr, monthStr, dayStr] = date.split("-")
  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null
  }
  if (which === "start") {
    return Date.UTC(year, month - 1, day, 0, 0, 0, 0)
  }
  return Date.UTC(year, month - 1, day, 23, 59, 59, 999)
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

function formatHours(value: number) {
  if (!Number.isFinite(value)) return "—"
  return `${value.toFixed(1)} hrs`
}

function formatRating(value: number) {
  if (!Number.isFinite(value)) return "—"
  return value.toFixed(2)
}

function formatPercent(value: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(Math.abs(value))
  if (value > 0) return `+ ${formatted}%`
  if (value < 0) return `- ${formatted}%`
  return `${formatted}%`
}

function percentChange(current: number | null | undefined, previous: number | null | undefined) {
  if (current == null || previous == null) return null
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null
  if (previous === 0) return current === 0 ? 0 : null
  return ((current - previous) / previous) * 100
}

function getMonthLabelLong(monthKey: string) {
  const [y, m] = monthKey.split("-")
  const year = Number(y)
  const monthIdx = Number(m) - 1
  if (!Number.isFinite(year) || !Number.isFinite(monthIdx)) return monthKey

  return new Date(Date.UTC(year, monthIdx, 1)).toLocaleString("en-US", {
    month: "short",
    year: "numeric",
  })
}

function getMonthLabelShort(monthKey: string) {
  const [y, m] = monthKey.split("-")
  const year = Number(y)
  const monthIdx = Number(m) - 1
  if (!Number.isFinite(year) || !Number.isFinite(monthIdx)) return monthKey

  return new Date(Date.UTC(year, monthIdx, 1)).toLocaleString("en-US", {
    month: "short",
  })
}

function buildMonthRange(fromMs: number, toMs: number) {
  const start = new Date(fromMs)
  const end = new Date(toMs)

  const startYear = start.getUTCFullYear()
  const startMonth = start.getUTCMonth()
  const endYear = end.getUTCFullYear()
  const endMonth = end.getUTCMonth()

  const months: string[] = []
  let year = startYear
  let month = startMonth
  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push(`${year}-${String(month + 1).padStart(2, "0")}`)
    month += 1
    if (month > 11) {
      month = 0
      year += 1
    }
  }
  return months
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

function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false)

  React.useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setMatches(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [query])

  return matches
}

function SegmentedButtons<T extends string>({
  value,
  onValueChange,
  items,
  ariaLabel,
}: {
  value: T
  onValueChange: (next: T) => void
  items: Array<{ value: T; label: string }>
  ariaLabel: string
}) {
  return (
    <div
      className="inline-flex rounded-lg border bg-muted/40 p-0.5"
      role="group"
      aria-label={ariaLabel}
    >
      {items.map((item) => (
        <Button
          key={item.value}
          size="xs"
          variant={item.value === value ? "secondary" : "ghost"}
          className="h-6 px-2 text-xs"
          onClick={() => onValueChange(item.value)}
        >
          {item.label}
        </Button>
      ))}
    </div>
  )
}

function KpiCard({
  title,
  value,
  description,
  right,
  isLoading,
}: {
  title: string
  value: React.ReactNode
  description: string
  right?: React.ReactNode
  isLoading?: boolean
}) {
  return (
    <Card size="sm" variant="group">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              "text-2xl font-semibold tracking-tight",
              isLoading ? "text-muted-foreground" : "",
            )}
          >
            {value}
          </div>
          {right ? <div>{right}</div> : null}
        </div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </CardContent>
    </Card>
  )
}

function KpiDelta({
  value,
  isLoading,
}: {
  value: number | null
  isLoading?: boolean
}) {
  const label = "vs last month"

  if (isLoading) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Badge variant="outline" className="h-7 px-2.5 text-xs">
          …
        </Badge>
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
    )
  }

  if (value == null) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Badge variant="outline" className="h-7 px-2.5 text-xs">
          —
        </Badge>
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
    )
  }

  const direction = value > 0 ? "up" : value < 0 ? "down" : "flat"
  const classes =
    direction === "up"
      ? "bg-emerald-500/24 text-emerald-500"
      : direction === "down"
        ? "bg-rose-500/24 text-rose-500"
        : "bg-muted text-muted-foreground"
  const icon =
    direction === "up"
      ? TrendUpIcon
      : direction === "down"
        ? TrendDownIcon
        : MinusIcon
  const Icon = icon

  return (
    <div className="flex flex-col items-end gap-1">
      <Badge className={cn("h-7 border-none px-2.5 text-xs font-semibold", classes)}>
        <Icon aria-hidden="true" />
        {formatPercent(value)}
      </Badge>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  )
}

export function DashboardClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const from = searchParams.get("from") ?? DEFAULT_FROM
  const to = searchParams.get("to") ?? DEFAULT_TO
  const assignedToParam = searchParams.get("assignedTo") ?? "any"
  const ticketTypeParam = searchParams.get("ticketTypeId") ?? "any"
  const priorityParam = searchParams.get("priority") ?? "any"

  const [filtersOpen, setFiltersOpen] = React.useState(false)
  const [draftFrom, setDraftFrom] = React.useState(from)
  const [draftTo, setDraftTo] = React.useState(to)
  const [draftAssignedTo, setDraftAssignedTo] = React.useState(assignedToParam)
  const [draftTicketTypeId, setDraftTicketTypeId] = React.useState(ticketTypeParam)
  const [draftPriority, setDraftPriority] = React.useState(priorityParam)

  React.useEffect(() => {
    if (!filtersOpen) return
    setDraftFrom(from)
    setDraftTo(to)
    setDraftAssignedTo(assignedToParam)
    setDraftTicketTypeId(ticketTypeParam)
    setDraftPriority(priorityParam)
  }, [assignedToParam, filtersOpen, from, priorityParam, ticketTypeParam, to])

  const createdFrom = React.useMemo(() => parseDateToUtcMs(from, "start"), [from])
  const createdTo = React.useMemo(() => parseDateToUtcMs(to, "end"), [to])

  const [ticketTypes, ticketTypesResult] = useQuery(
    queries.ticketTypes.list({ limit: 200 }),
  )
  const [teamMembers, teamMembersResult] = useQuery(
    queries.teamMembers.list({ limit: 200 }),
  )

  const teamMemberItems = React.useMemo(
    () => [
      { value: "any", label: "Any" },
      { value: "none", label: "Unassigned" },
      ...teamMembers.map((tm) => ({ value: String(tm.id), label: tm.username })),
    ],
    [teamMembers],
  )

  const ticketTypeItems = React.useMemo(
    () => [
      { value: "any", label: "Any" },
      ...ticketTypes.map((tt) => ({ value: String(tt.id), label: tt.typeName })),
    ],
    [ticketTypes],
  )

  const priorityItems = React.useMemo(
    () => [
      { value: "any", label: "Any" },
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" },
      { value: "urgent", label: "Urgent" },
    ],
    [],
  )

  const ticketTypeNameById = React.useMemo(() => {
    const map = new Map<number, string>()
    for (const row of ticketTypes) {
      map.set(row.id, row.typeName)
    }
    return map
  }, [ticketTypes])

  type DashboardMetricsResponse = {
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
    ticketsByPriorityStatus: Array<{ priority: string; status: "open" | "resolved"; count: number }>
  }

  const [metrics, setMetrics] = React.useState<DashboardMetricsResponse | null>(null)
  const [metricsError, setMetricsError] = React.useState<string | null>(null)
  const [metricsLoading, setMetricsLoading] = React.useState(true)

  React.useEffect(() => {
    const controller = new AbortController()

    async function run() {
      setMetricsLoading(true)
      setMetricsError(null)

      const params = new URLSearchParams()
      params.set("from", from)
      params.set("to", to)
      params.set("assignedTo", assignedToParam)
      params.set("ticketTypeId", ticketTypeParam)
      params.set("priority", priorityParam)

      try {
        const res = await fetch(`/api/dashboard/metrics?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as
            | { error?: string }
            | null
          setMetrics(null)
          setMetricsError(body?.error ?? `Request failed (${res.status})`)
          setMetricsLoading(false)
          return
        }

        const json = (await res.json()) as DashboardMetricsResponse
        setMetrics(json)
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
  }, [assignedToParam, from, priorityParam, ticketTypeParam, to])

  const months = React.useMemo(() => {
    const fromMs =
      createdFrom ?? parseDateToUtcMs(DEFAULT_FROM, "start") ?? Date.UTC(2025, 0, 1)
    const toMs =
      createdTo ?? parseDateToUtcMs(DEFAULT_TO, "end") ??
      Date.UTC(2025, 10, 30, 23, 59, 59, 999)

    return buildMonthRange(fromMs, toMs)
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
      months,
      createdSeries,
      resolvedSeries,
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

  const resetDraftFilters = React.useCallback(() => {
    setDraftFrom(DEFAULT_FROM)
    setDraftTo(DEFAULT_TO)
    setDraftAssignedTo("any")
    setDraftTicketTypeId("any")
    setDraftPriority("any")
  }, [])

  const applyDraftFilters = React.useCallback(() => {
    updateSearchParams(router, searchParams, {
      from: draftFrom.trim() ? draftFrom : null,
      to: draftTo.trim() ? draftTo : null,
      assignedTo: draftAssignedTo === "any" ? null : draftAssignedTo,
      ticketTypeId: draftTicketTypeId === "any" ? null : draftTicketTypeId,
      priority: draftPriority === "any" ? null : draftPriority,
    })
    setFiltersOpen(false)
  }, [draftAssignedTo, draftFrom, draftPriority, draftTicketTypeId, draftTo, router, searchParams])

  return (
    <div className="w-full space-y-6 px-6 py-8">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Ticket analytics with server-side aggregation.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          Showing {formatCompactNumber(computed.total)} tickets.
          {isLoading ? " Loading…" : ""}
        </div>

        <Popover
          open={filtersOpen}
          onOpenChange={(open) => setFiltersOpen(open)}
        >
          <PopoverTrigger render={<Button variant="outline" size="sm" />}>
            <FunnelIcon />
            Filters
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[92vw] max-w-sm p-0">
            <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
              <div className="text-sm font-semibold">Filters</div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setFiltersOpen(false)}
              >
                <XIcon />
                <span className="sr-only">Close</span>
              </Button>
            </div>

            <div className="px-4 py-3">
              <FieldGroup>
                <div className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="dash-from">From</FieldLabel>
                      <Input
                        id="dash-from"
                        type="date"
                        value={draftFrom}
                        onChange={(e) => setDraftFrom(e.target.value)}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="dash-to">To</FieldLabel>
                      <Input
                        id="dash-to"
                        type="date"
                        value={draftTo}
                        onChange={(e) => setDraftTo(e.target.value)}
                      />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel>Team member</FieldLabel>
                    <Select
                      items={teamMemberItems}
                      value={draftAssignedTo}
                      onValueChange={(v) => setDraftAssignedTo(v ?? "any")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="start">
                        <SelectGroup>
                          <SelectItem value="any">Any</SelectItem>
                          <SelectItem value="none">Unassigned</SelectItem>
                          {teamMembers.map((tm) => (
                            <SelectItem key={tm.id} value={String(tm.id)}>
                              {tm.username}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>Ticket type</FieldLabel>
                    <Select
                      items={ticketTypeItems}
                      value={draftTicketTypeId}
                      onValueChange={(v) => setDraftTicketTypeId(v ?? "any")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="start">
                        <SelectGroup>
                          <SelectItem value="any">Any</SelectItem>
                          {ticketTypes.map((tt) => (
                            <SelectItem key={tt.id} value={String(tt.id)}>
                              {tt.typeName}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>Priority</FieldLabel>
                    <Select
                      items={priorityItems}
                      value={draftPriority}
                      onValueChange={(v) => setDraftPriority(v ?? "any")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="start">
                        <SelectGroup>
                          <SelectItem value="any">Any</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </FieldGroup>
            </div>

            <div className="flex items-center justify-between gap-3 border-t px-4 py-3">
              <Button variant="outline" size="sm" onClick={resetDraftFilters}>
                Reset
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFiltersOpen(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={applyDraftFilters}>
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

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
          description="Open + in progress."
          right={<KpiDelta value={computed.openMoM} isLoading={isLoading} />}
          isLoading={isLoading}
        />
        <KpiCard
          title="Avg resolution time"
          value={
            computed.avgResolutionHours == null
              ? "—"
              : formatHours(computed.avgResolutionHours)
          }
          description="Resolved tickets only."
          right={<KpiDelta value={computed.avgResolutionMoM} isLoading={isLoading} />}
          isLoading={isLoading}
        />
        <KpiCard
          title="Customer satisfaction"
          value={computed.avgRating == null ? "—" : formatRating(computed.avgRating)}
          description="Avg rating from feedback."
          right={
            <div className="text-2xl font-semibold text-muted-foreground/70">
              /5
            </div>
          }
          isLoading={isLoading}
        />
      </CardGroup>

      <div className="grid gap-4 lg:grid-cols-2">
        <TicketsOverTimeChart
          data={computed.ticketsOverTime}
          isLoading={isLoading}
        />
        <TicketsByTypeChart
          rows={computed.typeRows}
          isLoading={isLoading}
        />
      </div>

      <TicketsByPriorityCard
        total={computed.total}
        rows={computed.priorityRows}
        statusRows={computed.priorityStatusRows}
        isLoading={isLoading}
      />
    </div>
  )
}

function TicketsOverTimeChart({
  data,
  isLoading,
}: {
  data: Array<{ monthKey: string; monthLabel: string; created: number; resolved: number }>
  isLoading?: boolean
}) {
  const id = React.useId()
  const [series, setSeries] = React.useState<"both" | "created" | "resolved">("both")
  const isSmallScreen = useMediaQuery("(max-width: 640px)")

  const years = React.useMemo(() => {
    const unique = new Set<string>()
    for (const row of data) {
      unique.add(row.monthKey.slice(0, 4))
    }
    return Array.from(unique).sort()
  }, [data])

  const defaultYear = years[years.length - 1] ?? "all"
  const [year, setYear] = React.useState<string>(defaultYear)

  React.useEffect(() => {
    if (!years.length) {
      if (year !== "all") setYear("all")
      return
    }

    if (!years.includes(year)) {
      setYear(defaultYear)
    }
  }, [defaultYear, year, years])

  const filteredData = React.useMemo(() => {
    if (year === "all") return data
    return data.filter((row) => row.monthKey.startsWith(`${year}-`))
  }, [data, year])

  const showCreated = series === "both" || series === "created"
  const showResolved = series === "both" || series === "resolved"
  const stackId = showCreated && showResolved ? "a" : undefined

  const chartConfig = {
    created: {
      label: "Created",
      color: "var(--chart-1)",
    },
    resolved: {
      label: "Resolved",
      color: "var(--chart-4)",
    },
  } satisfies ChartConfig

  return (
    <CardGroup>
      <Card variant="group" className="gap-4">
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-0.5">
                <CardTitle>Tickets over time</CardTitle>
                <div className="text-xs text-muted-foreground">
                  Created vs resolved by month.
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {isLoading ? (
                  <div className="text-xs text-muted-foreground">Loading…</div>
                ) : null}
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <SegmentedButtons
                    ariaLabel="Tickets over time series"
                    value={series}
                    onValueChange={setSeries}
                    items={[
                      { value: "both", label: "All" },
                      { value: "created", label: "Created" },
                      { value: "resolved", label: "Resolved" },
                    ]}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Year</span>
                    <Select
                      value={year}
                      onValueChange={(next) => setYear(next ?? defaultYear)}
                    >
                      <SelectTrigger size="sm" className="h-6">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="end">
                        <SelectGroup>
                          {years.map((y) => (
                            <SelectItem key={y} value={y}>
                              {y}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              {showCreated ? (
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-[2px]"
                    style={{
                      background:
                        "linear-gradient(180deg, var(--chart-1), var(--chart-2))",
                    }}
                  />
                  Created
                </div>
              ) : null}
              {showResolved ? (
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-[2px]"
                    style={{ backgroundColor: "var(--chart-4)" }}
                  />
                  Resolved
                </div>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-60 w-full [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-[var(--chart-1)]/15"
          >
            <BarChart
              accessibilityLayer
              data={filteredData}
              maxBarSize={20}
              margin={{ left: -12, right: 12, top: 12 }}
            >
              <defs>
                <linearGradient id={`${id}-gradient`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" />
                  <stop offset="100%" stopColor="var(--chart-2)" />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                strokeDasharray="2 2"
                stroke="var(--border)"
              />
              <XAxis
                dataKey="monthKey"
                tickLine={false}
                tickMargin={12}
                interval={0}
                stroke="var(--border)"
                tickFormatter={(value) =>
                  isSmallScreen
                    ? getMonthLabelShort(String(value))
                    : getMonthLabelLong(String(value))
                }
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCompactNumber(Number(value))}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    hideIndicator
                    labelFormatter={(value) => getMonthLabelLong(String(value))}
                    formatter={(value, name) => {
                      const meta =
                        name === "created"
                          ? { label: "Created", color: "var(--chart-1)" }
                          : name === "resolved"
                            ? { label: "Resolved", color: "var(--chart-4)" }
                            : { label: name, color: "var(--muted-foreground)" }

                      const numericValue =
                        typeof value === "number" ? value : Number(value)

                      return (
                        <div className="flex w-full items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-[2px]"
                              style={{ backgroundColor: meta.color }}
                            />
                            <span className="text-muted-foreground">
                              {meta.label}
                            </span>
                          </div>
                          <span className="font-mono font-medium tabular-nums">
                            {Number.isFinite(numericValue)
                              ? numericValue.toLocaleString()
                              : "—"}
                          </span>
                        </div>
                      )
                    }}
                  />
                }
              />
              {showCreated ? (
                <Bar
                  dataKey="created"
                  fill={`url(#${id}-gradient)`}
                  stackId={stackId}
                />
              ) : null}
              {showResolved ? (
                <Bar
                  dataKey="resolved"
                  fill="var(--color-resolved)"
                  stackId={stackId}
                />
              ) : null}
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </CardGroup>
  )
}

function TicketsByTypeChart({
  rows,
  isLoading,
}: {
  rows: Array<{ label: string; count: number; pct: number }>
  isLoading?: boolean
}) {
  const [topN, setTopN] = React.useState<"5" | "8" | "12">("5")
  const [labelMode, setLabelMode] = React.useState<"count" | "percent">("count")

  const topCount = topN === "5" ? 5 : topN === "8" ? 8 : 12

  const slices = React.useMemo(() => {
    const top = rows.slice(0, topCount)
    const rest = rows.slice(topCount)
    const otherCount = rest.reduce((sum, r) => sum + r.count, 0)

    const result = top.map((r, idx) => ({
      key: `type${idx}`,
      label: r.label,
      count: r.count,
      color: `var(--chart-${Math.min(idx + 1, 5)})`,
    }))

    if (otherCount > 0) {
      result.push({
        key: "other",
        label: "Other",
        count: otherCount,
        color: "var(--muted-foreground)",
      })
    }

    return result
  }, [rows, topCount])

  const totalTickets = React.useMemo(
    () => slices.reduce((sum, slice) => sum + slice.count, 0),
    [slices],
  )

  const chartData = slices.map((slice) => ({
    type: slice.key,
    tickets: slice.count,
    fill: `var(--color-${slice.key})`,
  }))

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      tickets: { label: "Tickets" },
    }

    for (const slice of slices) {
      config[slice.key] = {
        label: slice.label,
        color: slice.color,
      }
    }

    return config
  }, [slices])

  return (
    <CardGroup>
      <Card variant="group" className="flex flex-col">
        <CardHeader className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-0.5">
            <CardTitle>Tickets by type</CardTitle>
            <div className="text-xs text-muted-foreground">
              Top ticket types by volume.
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-2">
            {isLoading ? (
              <div className="text-xs text-muted-foreground">Loading…</div>
            ) : null}
            <div className="flex flex-wrap items-center justify-end gap-2">
              <SegmentedButtons
                ariaLabel="Tickets by type top N"
                value={topN}
                onValueChange={setTopN}
                items={[
                  { value: "5", label: "Top 5" },
                  { value: "8", label: "Top 8" },
                  { value: "12", label: "Top 12" },
                ]}
              />
              <SegmentedButtons
                ariaLabel="Tickets by type labels"
                value={labelMode}
                onValueChange={setLabelMode}
                items={[
                  { value: "count", label: "#" },
                  { value: "percent", label: "%" },
                ]}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[250px] px-0"
          >
            <PieChart>
              <ChartTooltip
                content={<ChartTooltipContent nameKey="type" hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="tickets"
                nameKey="type"
                labelLine={false}
                label={(props: PieLabelRenderProps) => {
                  const { cx, cy, midAngle, innerRadius, outerRadius, payload } = props

                  if (
                    typeof cx !== "number" ||
                    typeof cy !== "number" ||
                    typeof midAngle !== "number" ||
                    typeof innerRadius !== "number" ||
                    typeof outerRadius !== "number"
                  ) {
                    return null
                  }

                  const payloadObj =
                    typeof payload === "object" && payload !== null
                      ? (payload as Record<string, unknown>)
                      : null
                  const rawTickets = payloadObj?.tickets
                  const tickets =
                    typeof rawTickets === "number" ? rawTickets : Number(rawTickets)
                  if (!Number.isFinite(tickets) || tickets <= 0) return null
                  const pct = totalTickets ? (tickets / totalTickets) * 100 : 0

                  const RADIAN = Math.PI / 180
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.55
                  const x = cx + radius * Math.cos(-midAngle * RADIAN)
                  const y = cy + radius * Math.sin(-midAngle * RADIAN)

                  return (
                    <text
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="var(--foreground)"
                      className="text-[11px] font-medium"
                    >
                      {labelMode === "percent"
                        ? `${Math.round(pct)}%`
                        : formatCompactNumber(tickets)}
                    </text>
                  )
                }}
              />
            </PieChart>
          </ChartContainer>
        </CardContent>
        <div className="px-6 pb-4 pt-2 text-xs text-muted-foreground">
          {slices.length ? (
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {slices.map((slice) => (
                <div key={slice.key} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-[2px]"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="max-w-[14ch] truncate">{slice.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <div>No data.</div>
          )}
        </div>
      </Card>
    </CardGroup>
  )
}

function TicketsByPriorityCard({
  total,
  rows,
  statusRows,
  isLoading,
}: {
  total: number
  rows: Array<{ label: string; count: number; pct: number }>
  statusRows: Array<{ priority: string; status: "open" | "resolved"; count: number }>
  isLoading?: boolean
}) {
  const [statusFilter, setStatusFilter] = React.useState<"all" | "open" | "resolved">(
    "all",
  )

  const selected = React.useMemo(() => {
    if (statusFilter === "all" || statusRows.length === 0) {
      return { total, rows }
    }

    const map = new Map<string, number>()
    for (const row of statusRows) {
      if (row.status !== statusFilter) continue
      map.set(row.priority.toLowerCase(), row.count)
    }

    const selectedTotal = Array.from(map.values()).reduce((sum, v) => sum + v, 0)
    const selectedRows = Array.from(map.entries())
      .map(([priority, count]) => ({
        label: priority,
        count,
        pct: selectedTotal ? (count / selectedTotal) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)

    return { total: selectedTotal, rows: selectedRows }
  }, [rows, statusFilter, statusRows, total])

  const counts = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const row of selected.rows) {
      map.set(row.label.toLowerCase(), row.count)
    }
    return {
      urgent: map.get("urgent") ?? 0,
      high: map.get("high") ?? 0,
      medium: map.get("medium") ?? 0,
      low: map.get("low") ?? 0,
      unknown: map.get("unknown") ?? 0,
    }
  }, [selected.rows])

  const segments = React.useMemo(() => {
    const base = [
      { key: "urgent", label: "Urgent", count: counts.urgent, swatch: "bg-chart-1" },
      { key: "high", label: "High", count: counts.high, swatch: "bg-chart-2" },
      { key: "medium", label: "Medium", count: counts.medium, swatch: "bg-chart-3" },
      { key: "low", label: "Low", count: counts.low, swatch: "bg-chart-4" },
      { key: "unknown", label: "Unknown", count: counts.unknown, swatch: "bg-chart-5" },
    ]

    return base.filter((s) => s.count > 0)
  }, [counts])

  return (
    <CardGroup>
      <Card variant="group" className="gap-5">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <CardTitle>Tickets by priority</CardTitle>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-semibold">
                  {formatCompactNumber(selected.total)}
                </div>
                {isLoading ? (
                  <span className="text-xs text-muted-foreground">Loading…</span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <SegmentedButtons
                ariaLabel="Tickets by priority status"
                value={statusFilter}
                onValueChange={setStatusFilter}
                items={[
                  { value: "all", label: "All" },
                  { value: "open", label: "Open" },
                  { value: "resolved", label: "Resolved" },
                ]}
              />
              <div className="flex flex-wrap items-center justify-end gap-4">
                {segments.map((segment) => (
                  <div key={segment.key} className="flex items-center gap-2">
                    <div
                      aria-hidden="true"
                      className={cn("size-1.5 shrink-0 rounded-xs", segment.swatch)}
                    />
                    <div className="text-[13px]/3 text-muted-foreground/60">
                      {segment.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex h-5 gap-1 overflow-hidden rounded-md bg-muted/30">
            {segments.map((segment) => (
              <div
                key={segment.key}
                className={cn("h-full", segment.swatch)}
                style={{
                  width: `${selected.total ? (segment.count / selected.total) * 100 : 0}%`,
                }}
              />
            ))}
          </div>

          <div>
            <div className="mb-3 text-[13px]/3 text-muted-foreground/60">
              Priority breakdown{statusFilter === "all" ? "" : ` (${statusFilter})`}
            </div>
            <ul className="divide-y divide-border text-sm">
              {segments.map((segment) => (
                <li key={segment.key} className="flex items-center gap-2 py-2">
                  <span
                    className={cn("size-2 shrink-0 rounded-full", segment.swatch)}
                    aria-hidden="true"
                  />
                  <span className="grow text-muted-foreground">
                    {segment.label} priority{" "}
                    {statusFilter === "all" ? "tickets" : `${statusFilter} tickets`}
                  </span>
                  <span className="text-[13px]/3 font-medium text-foreground/70 tabular-nums">
                    {segment.count.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </CardGroup>
  )
}
