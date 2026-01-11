import { MinusIcon, TrendDownIcon, TrendUpIcon } from "@phosphor-icons/react"
import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPercent } from "@/lib/dashboard/utils"
import { cn } from "@/lib/utils"

export function KpiCard({
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
      <CardContent className="flex flex-1 flex-col gap-1">
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
        <div className="mt-auto text-xs text-muted-foreground">{description}</div>
      </CardContent>
    </Card>
  )
}

export function KpiDelta({
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
  const icon = direction === "up" ? TrendUpIcon : direction === "down" ? TrendDownIcon : MinusIcon
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
