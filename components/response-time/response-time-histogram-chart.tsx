"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { SegmentedButtons } from "@/components/dashboard/segmented-buttons"
import { Card, CardContent, CardGroup, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import type { ResponseTimeHistogramRow } from "@/lib/response-time/metrics"

const chartConfig = {
  urgent: { label: "Urgent", color: "var(--chart-1)" },
  high: { label: "High", color: "var(--chart-2)" },
  medium: { label: "Medium", color: "var(--chart-3)" },
  low: { label: "Low", color: "var(--chart-4)" },
  unknown: { label: "Unknown", color: "var(--muted-foreground)" },
} satisfies ChartConfig

function formatBinLabel(bin: string) {
  return `${bin}h`
}

export function ResponseTimeHistogramChart({
  rows,
  isFetching,
  bins,
  onBinsChange,
}: {
  rows: readonly ResponseTimeHistogramRow[]
  isFetching?: boolean
  bins: "fine" | "default" | "coarse"
  onBinsChange: (next: "fine" | "default" | "coarse") => void
}) {
  const data = React.useMemo(() => [...rows], [rows])
  const total = React.useMemo(
    () => rows.reduce((sum, row) => sum + (row.total ?? 0), 0),
    [rows],
  )

  return (
    <CardGroup className="lg:rounded-r-none lg:[&_[data-corner=tr]]:hidden lg:[&_[data-corner=br]]:hidden">
      <Card variant="group" className="flex flex-col">
        <CardHeader className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-0.5">
            <CardTitle>Resolution time distribution</CardTitle>
            <div className="text-xs text-muted-foreground">
              Resolved tickets only, binned into fixed hour ranges.
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <SegmentedButtons
              ariaLabel="Resolution histogram bins"
              value={bins}
              onValueChange={onBinsChange}
              items={[
                { value: "fine", label: "Fine" },
                { value: "default", label: "Standard" },
                { value: "coarse", label: "Coarse" },
              ]}
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-video max-h-[280px] w-full px-0"
          >
            <BarChart
              data={data}
              className={isFetching ? "opacity-70 transition-opacity" : undefined}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="bin"
                tickLine={false}
                axisLine={false}
                interval={0}
                tickFormatter={formatBinLabel}
              />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelKey="bin"
                    labelFormatter={(value) =>
                      typeof value === "string" ? `Bin ${formatBinLabel(value)}` : null
                    }
                  />
                }
              />
              <Bar dataKey="urgent" stackId="a" fill="var(--color-urgent)" />
              <Bar dataKey="high" stackId="a" fill="var(--color-high)" />
              <Bar dataKey="medium" stackId="a" fill="var(--color-medium)" />
              <Bar dataKey="low" stackId="a" fill="var(--color-low)" />
              <Bar dataKey="unknown" stackId="a" fill="var(--color-unknown)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
        <div className="px-6 pb-4 pt-2 text-xs text-muted-foreground">
          {total ? (
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {Object.entries(chartConfig).map(([key, item]) => (
                <div key={key} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-[2px]"
                    style={{ backgroundColor: item.color ?? "var(--muted-foreground)" }}
                  />
                  <span>{item.label}</span>
                </div>
              ))}
              <span className="ml-auto tabular-nums">{total.toLocaleString()} total</span>
            </div>
          ) : (
            <div>No data.</div>
          )}
        </div>
      </Card>
    </CardGroup>
  )
}
