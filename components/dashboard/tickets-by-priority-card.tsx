"use client"

import * as React from "react"

import { SegmentedButtons } from "@/components/dashboard/segmented-buttons"
import { Card, CardContent, CardGroup, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCompactNumber } from "@/lib/dashboard/utils"
import { cn } from "@/lib/utils"

type PriorityRow = { label: string; count: number; pct: number }

type StatusRow = { priority: string; status: "open" | "resolved"; count: number }

export function TicketsByPriorityCard({
  total,
  rows,
  statusRows,
  isLoading,
}: {
  total: number
  rows: PriorityRow[]
  statusRows: StatusRow[]
  isLoading?: boolean
}) {
  const [statusFilter, setStatusFilter] = React.useState<"all" | "open" | "resolved">("all")

  const selected = React.useMemo(() => {
    if (statusFilter === "all") {
      return {
        total,
        rows,
      }
    }

    const filtered = statusRows
      .filter((row) => row.status === statusFilter)
      .map((row) => ({
        label: row.priority,
        count: row.count,
        pct: 0,
      }))
      .sort((a, b) => b.count - a.count)

    const selectedTotal = filtered.reduce((sum, row) => sum + row.count, 0)

    return {
      total: selectedTotal,
      rows: filtered.map((row) => ({
        ...row,
        pct: selectedTotal ? (row.count / selectedTotal) * 100 : 0,
      })),
    }
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
                <div className="text-2xl font-semibold">{formatCompactNumber(selected.total)}</div>
                {isLoading ? <span className="text-xs text-muted-foreground">Loading…</span> : null}
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
                    <div className="text-[13px]/3 text-muted-foreground/60">{segment.label}</div>
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
                  <span className={cn("size-2 shrink-0 rounded-full", segment.swatch)} aria-hidden="true" />
                  <span className="grow text-muted-foreground">
                    {segment.label} priority {statusFilter === "all" ? "tickets" : `${statusFilter} tickets`}
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
