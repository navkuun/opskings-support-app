"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

import { SegmentedButtons } from "@/components/dashboard/segmented-buttons"
import { Card, CardContent, CardGroup, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatHours, formatRating, formatTeamMemberLabel } from "@/lib/dashboard/utils"
import type { TeamPerformanceRow } from "@/lib/team-performance/types"

type Metric = "rating" | "resolved" | "fastest"

const chartConfig = {
  value: {
    label: "Value",
    color: "var(--chart-2)",
  },
  label: {
    color: "var(--background)",
  },
} satisfies ChartConfig

function formatMetricValue(metric: Metric, value: number) {
  if (metric === "resolved") return value.toLocaleString()
  if (metric === "rating") return formatRating(value)
  return formatHours(value)
}

function getMetricValue(row: TeamPerformanceRow, metric: Metric) {
  if (metric === "resolved") return row.ticketsResolved
  if (metric === "rating") return row.avgRating
  return row.avgResolutionHours
}

export function TopPerformersChart({
  rows,
  isLoading,
}: {
  rows: readonly TeamPerformanceRow[]
  isLoading?: boolean
}) {
  const [metric, setMetric] = React.useState<Metric>("rating")
  const [topN, setTopN] = React.useState<"5" | "10">("5")

  const ranked = React.useMemo(() => {
    const desired = topN === "10" ? 10 : 5

    const candidates = rows
      .map((row) => ({
        id: row.teamMemberId,
        name: formatTeamMemberLabel(row.username),
        value: getMetricValue(row, metric),
      }))
      .filter((row): row is { id: number; name: string; value: number } => typeof row.value === "number")

    candidates.sort((a, b) => {
      if (metric === "fastest") return a.value - b.value
      return b.value - a.value
    })

    return candidates.slice(0, desired)
  }, [metric, rows, topN])

  const chartData = React.useMemo(
    () =>
      ranked.map((row) => ({
        name: row.name,
        value: row.value,
        fill: "var(--color-value)",
      })),
    [ranked],
  )

  const title =
    metric === "rating"
      ? "Top performers by rating"
      : metric === "resolved"
        ? "Top performers by resolved tickets"
        : "Top performers by resolution time"

  return (
    <CardGroup>
      <Card variant="group" className="gap-4">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-0.5">
              <CardTitle>{title}</CardTitle>
              <div className="text-xs text-muted-foreground">
                Tickets scoped to the current created date range.
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {isLoading ? <div className="text-xs text-muted-foreground">Loading…</div> : null}
              <div className="flex flex-wrap items-center justify-end gap-2">
                <SegmentedButtons
                  ariaLabel="Top performers metric"
                  value={metric}
                  onValueChange={setMetric}
                  items={[
                    { value: "rating", label: "Rating" },
                    { value: "resolved", label: "Resolved" },
                    { value: "fastest", label: "Fastest" },
                  ]}
                />
                <SegmentedButtons
                  ariaLabel="Top performers count"
                  value={topN}
                  onValueChange={setTopN}
                  items={[
                    { value: "5", label: "Top 5" },
                    { value: "10", label: "Top 10" },
                  ]}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="aspect-auto h-60 w-full">
            <BarChart
              accessibilityLayer
              data={chartData}
              layout="vertical"
              margin={{ right: 56 }}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                hide
              />
              <XAxis
                dataKey="value"
                type="number"
                hide
                domain={[
                  0,
                  (dataMax: number) => Math.max(1, Math.ceil(dataMax * 1.15)),
                ]}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    formatter={(value) => {
                      const numeric = typeof value === "number" ? value : Number(value)
                      return Number.isFinite(numeric) ? formatMetricValue(metric, numeric) : "—"
                    }}
                  />
                }
              />
              <Bar dataKey="value" layout="vertical" fill="var(--color-value)" radius={4}>
                <LabelList
                  dataKey="name"
                  position="insideLeft"
                  offset={8}
                  className="fill-(--color-label)"
                  fontSize={12}
                />
                <LabelList
                  dataKey="value"
                  position="right"
                  offset={12}
                  className="fill-foreground"
                  fontSize={12}
                  formatter={(value: unknown) => {
                    const numeric = typeof value === "number" ? value : Number(value)
                    return Number.isFinite(numeric) ? formatMetricValue(metric, numeric) : "—"
                  }}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </CardGroup>
  )
}
