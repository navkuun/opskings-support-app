"use client"

import * as React from "react"
import { Pie, PieChart } from "recharts"
import type { PieLabelRenderProps } from "recharts"

import { SegmentedButtons } from "@/components/dashboard/segmented-buttons"
import { Card, CardContent, CardGroup, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { formatCompactNumber } from "@/lib/dashboard/utils"

export function TicketsByTypeChart({
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
    <CardGroup className="lg:rounded-l-none lg:border-l-0 lg:[&_[data-corner=tl]]:hidden lg:[&_[data-corner=bl]]:hidden">
      <Card variant="group" className="flex flex-col">
        <CardHeader className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-0.5">
            <CardTitle>Tickets by type</CardTitle>
            <div className="text-xs text-muted-foreground">Top ticket types by volume.</div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            {isLoading ? <div className="text-xs text-muted-foreground">Loading…</div> : null}
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
          <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px] px-0">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="type" hideLabel />} />
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
