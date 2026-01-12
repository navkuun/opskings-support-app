"use client"

import * as React from "react"

import { Card, CardContent, CardGroup, CardHeader, CardTitle } from "@/components/ui/card"
import { formatHours } from "@/lib/dashboard/utils"
import type { ResponseTimePriorityStatsRow } from "@/lib/response-time/metrics"

function formatDeltaHours(value: number | null) {
  if (value == null || !Number.isFinite(value)) return "—"
  const sign = value > 0 ? "+" : value < 0 ? "-" : ""
  return `${sign}${Math.abs(value).toFixed(1)} hrs`
}

function formatRate(numerator: number, denominator: number) {
  if (!denominator) return "—"
  return `${Math.round((numerator / denominator) * 100)}%`
}

export function ResponseTimePriorityStatsCard({
  rows,
  isLoading,
}: {
  rows: readonly ResponseTimePriorityStatsRow[]
  isLoading?: boolean
}) {
  return (
    <CardGroup className="lg:rounded-l-none lg:border-l-0 lg:[&_[data-corner=tl]]:hidden lg:[&_[data-corner=bl]]:hidden">
      <Card variant="group" className="flex flex-col">
        <CardHeader className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-0.5">
            <CardTitle>Summary by priority</CardTitle>
            <div className="text-xs text-muted-foreground">Min / median / avg / max (hours).</div>
          </div>
          {isLoading ? <div className="text-xs text-muted-foreground">Loading…</div> : null}
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 pr-4 text-left font-medium">Priority</th>
                  <th className="py-2 pr-4 text-right font-medium">Resolved</th>
                  <th className="py-2 pr-4 text-right font-medium">Overdue</th>
                  <th className="py-2 pr-4 text-right font-medium">Min</th>
                  <th className="py-2 pr-4 text-right font-medium">Median</th>
                  <th className="py-2 pr-4 text-right font-medium">Avg</th>
                  <th className="py-2 pr-4 text-right font-medium">Max</th>
                  <th className="py-2 text-right font-medium">Δ vs expected</th>
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.map((row) => (
                    <tr key={row.priority} className="border-b last:border-b-0">
                      <td className="py-2 pr-4 font-medium">{row.priority}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{row.resolvedTotal}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {row.overdueTotal}
                        <span className="ml-2 text-muted-foreground">
                          {formatRate(row.overdueTotal, row.expectedTotal)}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {row.minHours == null ? "—" : formatHours(row.minHours)}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {row.medianHours == null ? "—" : formatHours(row.medianHours)}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {row.avgHours == null ? "—" : formatHours(row.avgHours)}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {row.maxHours == null ? "—" : formatHours(row.maxHours)}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {formatDeltaHours(row.avgDeltaHours)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-8 text-center text-muted-foreground" colSpan={8}>
                      No data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </CardGroup>
  )
}
