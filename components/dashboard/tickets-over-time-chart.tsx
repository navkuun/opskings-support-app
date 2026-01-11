"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { SegmentedButtons } from "@/components/dashboard/segmented-buttons"
import { Card, CardContent, CardGroup, CardHeader, CardTitle } from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { formatCompactNumber, getMonthLabelShort } from "@/lib/dashboard/utils"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { isNumber, isRecord, isString } from "@/lib/type-guards"

export function TicketsOverTimeChart({
  data,
  isLoading,
}: {
  data: Array<{ monthKey: string; monthLabel: string; created: number; resolved: number }>
  isLoading?: boolean
}) {
  const id = React.useId()
  const [series, setSeries] = React.useState<"both" | "created" | "resolved">("both")

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

  const forecastMonthKey = React.useMemo(() => {
    const lastMonthKey = filteredData[filteredData.length - 1]?.monthKey
    if (!lastMonthKey) return null
    return addMonthsToMonthKey(lastMonthKey, 1)
  }, [filteredData])

  const chartData = React.useMemo(() => {
    if (!forecastMonthKey || filteredData.length === 0) return filteredData

    const recent = filteredData.slice(-11)
    const createdForecast = forecastNextMonth(recent.map((row) => row.created))
    const resolvedForecast = forecastNextMonth(recent.map((row) => row.resolved))
    if (createdForecast == null || resolvedForecast == null) return filteredData

    return [
      ...filteredData,
      {
        monthKey: forecastMonthKey,
        monthLabel: forecastMonthKey,
        created: createdForecast,
        resolved: resolvedForecast,
        isForecast: true,
      },
    ]
  }, [filteredData, forecastMonthKey])

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
    <CardGroup className="lg:rounded-r-none lg:[&_[data-corner=tr]]:hidden lg:[&_[data-corner=br]]:hidden">
      <Card variant="group" className="gap-4">
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-0.5">
                <CardTitle>Tickets over time</CardTitle>
                <div className="text-xs text-muted-foreground">Created vs resolved by month.</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {isLoading ? <div className="text-xs text-muted-foreground">Loading…</div> : null}
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
                    <Select value={year} onValueChange={(next) => setYear(next ?? defaultYear)}>
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
                      background: "linear-gradient(180deg, var(--chart-1), var(--chart-2))",
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
              data={chartData}
              maxBarSize={20}
              margin={{ left: -12, right: 12, top: 12 }}
            >
              <defs>
                <linearGradient id={`${id}-gradient`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" />
                  <stop offset="100%" stopColor="var(--chart-2)" />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="2 2" stroke="var(--border)" />
              <XAxis
                dataKey="monthKey"
                tickLine={false}
                tickMargin={12}
                interval={0}
                stroke="var(--border)"
                tickFormatter={(value) => getMonthLabelShort(String(value))}
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
                    labelFormatter={(value, payload) => {
                      const monthKey = String(value)
                      const isForecast =
                        Array.isArray(payload) &&
                        payload.length > 0 &&
                        isRecord(payload[0]?.payload) &&
                        payload[0].payload.isForecast === true

                      return `${getMonthLabelShort(monthKey)}${isForecast ? " (Forecast)" : ""}`
                    }}
                    formatter={(value, name) => {
                      const meta =
                        name === "created"
                          ? { label: "Created", color: "var(--chart-1)" }
                          : name === "resolved"
                            ? { label: "Resolved", color: "var(--chart-4)" }
                            : { label: name, color: "var(--muted-foreground)" }

                      const numericValue = typeof value === "number" ? value : Number(value)

                      return (
                        <div className="flex w-full items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-[2px]"
                              style={{ backgroundColor: meta.color }}
                            />
                            <span className="text-muted-foreground">{meta.label}</span>
                          </div>
                          <span className="font-mono font-medium tabular-nums">
                            {Number.isFinite(numericValue) ? numericValue.toLocaleString() : "—"}
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
                  shape={forecastBarShape}
                />
              ) : null}
              {showResolved ? (
                <Bar
                  dataKey="resolved"
                  fill="var(--color-resolved)"
                  stackId={stackId}
                  shape={forecastBarShape}
                />
              ) : null}
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </CardGroup>
  )
}

function addMonthsToMonthKey(monthKey: string, months: number) {
  const [yearStr, monthStr] = monthKey.split("-")
  const year = Number(yearStr)
  const monthIndex = Number(monthStr) - 1
  if (!Number.isInteger(year) || !Number.isInteger(monthIndex)) return null

  const total = year * 12 + monthIndex + months
  const nextYear = Math.floor(total / 12)
  const nextMonthIndex = total % 12
  if (!Number.isInteger(nextYear) || !Number.isInteger(nextMonthIndex)) return null

  return `${nextYear}-${String(nextMonthIndex + 1).padStart(2, "0")}`
}

function forecastNextMonth(values: number[]) {
  const cleaned = values.filter((value) => Number.isFinite(value))
  if (cleaned.length === 0) return null
  if (cleaned.length === 1) return Math.max(0, Math.round(cleaned[0]!))
  if (cleaned.length === 2) return Math.max(0, Math.round(cleaned[1]!))

  const alphaCandidates = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]
  const betaCandidates = [0.1, 0.2, 0.3, 0.4, 0.5]

  let bestSse = Number.POSITIVE_INFINITY
  let bestForecast = cleaned[cleaned.length - 1]!

  for (const alpha of alphaCandidates) {
    for (const beta of betaCandidates) {
      const result = holtLinearOneStep(cleaned, alpha, beta)
      if (!result) continue
      if (result.sse < bestSse) {
        bestSse = result.sse
        bestForecast = result.forecast
      }
    }
  }

  if (!Number.isFinite(bestForecast)) return null
  return Math.max(0, Math.round(bestForecast))
}

function holtLinearOneStep(values: number[], alpha: number, beta: number) {
  const n = values.length
  if (n < 2) return null

  let level = values[0]!
  let trend = values[1]! - values[0]!
  if (!Number.isFinite(level) || !Number.isFinite(trend)) return null

  let sse = 0

  for (let idx = 1; idx < n; idx += 1) {
    const actual = values[idx]!
    const predicted = level + trend
    if (!Number.isFinite(actual) || !Number.isFinite(predicted)) return null

    const error = actual - predicted
    sse += error * error

    const prevLevel = level
    level = alpha * actual + (1 - alpha) * (level + trend)
    trend = beta * (level - prevLevel) + (1 - beta) * trend

    if (!Number.isFinite(level) || !Number.isFinite(trend)) return null
  }

  const forecast = level + trend
  if (!Number.isFinite(forecast)) return null
  return { forecast, sse }
}

function forecastBarShape(props: unknown): React.JSX.Element {
  if (!isRecord(props)) return <></>

  const x = isNumber(props.x) ? props.x : null
  const y = isNumber(props.y) ? props.y : null
  const width = isNumber(props.width) ? props.width : null
  const height = isNumber(props.height) ? props.height : null
  const fill = isString(props.fill) ? props.fill : "currentColor"
  const payload = isRecord(props.payload) ? props.payload : null

  if (x == null || y == null || width == null || height == null) return <></>

  const isForecast = payload?.isForecast === true

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      fillOpacity={isForecast ? 0.35 : 1}
      stroke={isForecast ? "var(--border)" : "none"}
      strokeWidth={isForecast ? 1 : 0}
      strokeDasharray={isForecast ? "4 3" : undefined}
      rx={2}
      ry={2}
    />
  )
}
