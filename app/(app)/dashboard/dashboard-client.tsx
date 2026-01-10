"use client"

import * as React from "react"
import { useQuery } from "@rocicorp/zero/react"
import { Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis, YAxis } from "recharts"
import type { PieLabelRenderProps } from "recharts"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  const sign = value > 0 ? "+" : ""
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(Math.abs(value))
  return `${sign}${value < 0 ? "-" : ""}${formatted}%`
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
    <Card size="sm">
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
        <Badge variant="outline" className="h-6 px-2">
          …
        </Badge>
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
    )
  }

  if (value == null) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Badge variant="outline" className="h-6 px-2">
          —
        </Badge>
        <span className="text-[10px] text-muted-foreground">{label}</span>
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
  const arrow = direction === "up" ? "▲" : direction === "down" ? "▼" : "•"

  return (
    <div className="flex flex-col items-end gap-1">
      <Badge className={cn("h-6 border-none px-2 font-medium", classes)}>
        <span className="mr-1 text-[10px]">{arrow}</span>
        {formatPercent(value)}
      </Badge>
      <span className="text-[10px] text-muted-foreground">{label}</span>
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
      month: getMonthLabelLong(monthKey),
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
      totalMoM,
      openMoM,
      avgResolutionMoM,
    }
  }, [metrics, months, ticketTypeNameById])

  const isLoading =
    metricsLoading ||
    ticketTypesResult.type !== "complete" ||
    teamMembersResult.type !== "complete"

  return (
    <div className="w-full space-y-6 px-6 py-8">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Ticket analytics with server-side aggregation.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 md:grid-cols-5">
              <Field>
                <FieldLabel htmlFor="dash-from">From</FieldLabel>
                <Input
                  id="dash-from"
                  type="date"
                  value={from}
                  onChange={(e) =>
                    updateSearchParams(router, searchParams, {
                      from: e.target.value || null,
                    })
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="dash-to">To</FieldLabel>
                <Input
                  id="dash-to"
                  type="date"
                  value={to}
                  onChange={(e) =>
                    updateSearchParams(router, searchParams, {
                      to: e.target.value || null,
                    })
                  }
                />
              </Field>

              <Field>
                <FieldLabel>Team member</FieldLabel>
                <Select
                  items={teamMemberItems}
                  value={assignedToParam}
                  onValueChange={(v) =>
                    updateSearchParams(router, searchParams, {
                      assignedTo: v === "any" ? null : v,
                    })
                  }
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
                  value={ticketTypeParam}
                  onValueChange={(v) =>
                    updateSearchParams(router, searchParams, {
                      ticketTypeId: v === "any" ? null : v,
                    })
                  }
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
                  value={priorityParam}
                  onValueChange={(v) =>
                    updateSearchParams(router, searchParams, {
                      priority: v === "any" ? null : v,
                    })
                  }
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

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-xs text-muted-foreground">
                  Showing {formatCompactNumber(computed.total)} tickets.
                  {isLoading ? " Loading…" : ""}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                onClick={() =>
                  updateSearchParams(router, searchParams, {
                    from: DEFAULT_FROM,
                    to: DEFAULT_TO,
                    assignedTo: null,
                    ticketTypeId: null,
                    priority: null,
                  })
                }
              >
                Reset
              </Button>
            </div>
          </FieldGroup>
          {metricsError ? (
            <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {metricsError}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-4">
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
      </div>

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
        isLoading={isLoading}
      />
    </div>
  )
}

function TicketsOverTimeChart({
  data,
  isLoading,
}: {
  data: Array<{ month: string; created: number; resolved: number }>
  isLoading?: boolean
}) {
  const id = React.useId()

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
    <Card className="gap-4">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0.5">
            <CardTitle>Tickets over time</CardTitle>
            <div className="text-xs text-muted-foreground">
              Created vs resolved by month.
            </div>
          </div>
          {isLoading ? (
            <div className="text-xs text-muted-foreground">Loading…</div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-4 pt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-[2px]"
              style={{
                background: "linear-gradient(180deg, var(--chart-1), var(--chart-2))",
              }}
            />
            Created
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-[2px]"
              style={{ backgroundColor: "var(--chart-4)" }}
            />
            Resolved
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
            data={data}
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
              dataKey="month"
              tickLine={false}
              tickMargin={12}
              interval={0}
              stroke="var(--border)"
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
            <Bar dataKey="created" fill={`url(#${id}-gradient)`} stackId="a" />
            <Bar dataKey="resolved" fill="var(--color-resolved)" stackId="a" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function TicketsByTypeChart({
  rows,
  isLoading,
}: {
  rows: Array<{ label: string; count: number; pct: number }>
  isLoading?: boolean
}) {
  const slices = React.useMemo(() => {
    const top = rows.slice(0, 5)
    const rest = rows.slice(5)
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
  }, [rows])

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
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-start justify-between">
        <div className="space-y-0.5">
          <CardTitle>Tickets by type</CardTitle>
          <div className="text-xs text-muted-foreground">
            Top ticket types by volume.
          </div>
        </div>
        {isLoading ? (
          <div className="text-xs text-muted-foreground">Loading…</div>
        ) : null}
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
                const tickets = typeof rawTickets === "number" ? rawTickets : Number(rawTickets)
                if (!Number.isFinite(tickets) || tickets <= 0) return null

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
                    {formatCompactNumber(tickets)}
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
  )
}

function TicketsByPriorityCard({
  total,
  rows,
  isLoading,
}: {
  total: number
  rows: Array<{ label: string; count: number; pct: number }>
  isLoading?: boolean
}) {
  const counts = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const row of rows) {
      map.set(row.label.toLowerCase(), row.count)
    }
    return {
      urgent: map.get("urgent") ?? 0,
      high: map.get("high") ?? 0,
      medium: map.get("medium") ?? 0,
      low: map.get("low") ?? 0,
      unknown: map.get("unknown") ?? 0,
    }
  }, [rows])

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

  const top = segments[0]
  const topPct = top && total ? Math.round((top.count / total) * 100) : 0

  return (
    <Card className="gap-5">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <CardTitle>Tickets by priority</CardTitle>
            <div className="flex items-start gap-2">
              <div className="text-2xl font-semibold">{formatCompactNumber(total)}</div>
              {isLoading ? (
                <Badge variant="outline" className="mt-1.5">
                  Loading…
                </Badge>
              ) : (
                <Badge className="mt-1.5 bg-muted text-muted-foreground border-none">
                  {top ? `${top.label}: ${topPct}%` : "No data"}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
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
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex h-5 gap-1 overflow-hidden rounded-md bg-muted/30">
          {segments.map((segment) => (
            <div
              key={segment.key}
              className={cn("h-full", segment.swatch)}
              style={{
                width: `${total ? (segment.count / total) * 100 : 0}%`,
              }}
            />
          ))}
        </div>

        <div>
          <div className="mb-3 text-[13px]/3 text-muted-foreground/60">
            Priority breakdown
          </div>
          <ul className="divide-y divide-border text-sm">
            {segments.map((segment) => (
              <li key={segment.key} className="flex items-center gap-2 py-2">
                <span
                  className={cn("size-2 shrink-0 rounded-full", segment.swatch)}
                  aria-hidden="true"
                />
                <span className="grow text-muted-foreground">
                  {segment.label} priority tickets
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
  )
}
